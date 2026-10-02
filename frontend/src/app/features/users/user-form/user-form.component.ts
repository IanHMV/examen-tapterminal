import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, of, switchMap } from 'rxjs';

import { USER_RULES } from '../../../core/constants/user-rules';
import { ValidationErrorResponse } from '../../../core/models/api.model';
import { ProfileOption } from '../../../core/models/profile.model';
import { UserDetail, UserInput } from '../../../core/models/user.model';
import { ProfileService } from '../../../core/services/profile.service';
import { UserService } from '../../../core/services/user.service';

/** Al menos un carácter que no sea espacio (la API recorta los espacios). */
const NOT_BLANK = /\S/;

/** Quita espacios, guiones y paréntesis, como hace la API antes de validar. */
function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, '');
}

/** Teléfono opcional con lada del país (formato E.164). */
function internationalPhone(control: AbstractControl<string>): ValidationErrors | null {
  const phone = normalizePhone(control.value ?? '');

  return phone === '' || USER_RULES.phoneFormat.test(phone) ? null : { phone: true };
}

/** Mensaje de error de la foto, o null si cumple las mismas reglas que la API. */
function photoProblem(file: File): string | null {
  if (!(USER_RULES.photoTypes as readonly string[]).includes(file.type)) {
    return 'La foto debe ser JPG, PNG o WebP.';
  }

  if (file.size > USER_RULES.photoMaxBytes) {
    return 'La foto no debe pesar más de 2 MB.';
  }

  return null;
}

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * Alta y edición de usuarios con el mismo formulario.
 * Con código en la URL (/usuarios/USR-0001/editar) edita; sin código, crea.
 *
 * La foto no es un control del formulario: un <input type="file"> entrega un
 * archivo, no texto. Se guarda en una señal y se valida aparte.
 */
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly userService = inject(UserService);
  private readonly profileService = inject(ProfileService);

  /** Código del usuario en edición (null al crear). */
  protected readonly code = inject(ActivatedRoute).snapshot.paramMap.get('code');
  protected readonly isEdit = this.code !== null;

  protected readonly rules = USER_RULES;
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly profileOptions = signal<ProfileOption[]>([]);
  protected readonly saving = signal(false);
  protected readonly savedUser = signal<UserDetail | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  /** Foto elegida en el equipo (aún no subida) y su vista previa. */
  protected readonly photo = signal<File | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly photoError = signal<string | null>(null);
  /** Foto actual del usuario (solo al editar). */
  protected readonly currentPhotoUrl = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      Validators.pattern(NOT_BLANK),
      Validators.maxLength(USER_RULES.nameMaxLength),
    ]),
    email: this.fb.control('', [Validators.required, Validators.email]),
    phone: this.fb.control('', internationalPhone),
    profile_codes: this.fb.control<string[]>([], Validators.required),
  });

  constructor() {
    // La vista previa es una URL temporal del navegador: hay que liberarla al salir.
    inject(DestroyRef).onDestroy(() => this.setPreview(null));

    // Las opciones de perfiles siempre hacen falta; el usuario, solo al editar.
    forkJoin({
      profiles: this.profileService.options(),
      user: this.code ? this.userService.get(this.code) : of(null),
    }).subscribe({
      next: ({ profiles, user }) => {
        this.profileOptions.set(profiles);

        if (user) {
          this.fillForm(user);
        }

        this.loadState.set('ready');
      },
      error: (error: HttpErrorResponse) => {
        this.loadState.set(error.status === 404 ? 'not-found' : 'error');
      },
    });
  }

  protected isSelected(code: string): boolean {
    return this.form.controls.profile_codes.value.includes(code);
  }

  protected toggleProfile(code: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const control = this.form.controls.profile_codes;

    control.setValue(checked ? [...control.value, code] : control.value.filter((current) => current !== code));
    control.markAsTouched();
  }

  protected selectPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    const problem = file ? photoProblem(file) : null;

    this.photoError.set(problem);
    this.photo.set(problem ? null : file);
    this.setPreview(problem || !file ? null : URL.createObjectURL(file));
  }

  protected submit(): void {
    // Muestra los errores de todos los campos, aunque el usuario no los haya tocado.
    this.form.markAllAsTouched();

    const photo = this.photo();

    // Al crear la foto es obligatoria; al editar, solo se envía si se eligió una nueva.
    if (!this.isEdit && !photo && !this.photoError()) {
      this.photoError.set('La foto es obligatoria.');
    }

    if (this.form.invalid || this.photoError()) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.savedUser.set(null);

    const raw = this.form.getRawValue();
    const input: UserInput = { ...raw, phone: raw.phone.trim() === '' ? null : raw.phone };

    const request = this.code
      ? this.userService
          .update(this.code, input)
          // Datos y foto van en peticiones distintas: primero los datos y, si hay foto nueva, la foto.
          .pipe(switchMap((user) => (photo ? this.userService.updatePhoto(user.code, photo) : of(user))))
      : this.userService.create(input, photo as File);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (user) => {
        this.savedUser.set(user);

        if (this.isEdit) {
          this.fillForm(user);
        } else {
          // Al crear se limpia para capturar otro.
          this.form.reset();
        }

        this.photo.set(null);
        this.setPreview(null);
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private fillForm(user: UserDetail): void {
    this.form.setValue({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      profile_codes: user.profiles.map((profile) => profile.code),
    });
    this.currentPhotoUrl.set(user.photo_url);
  }

  private setPreview(url: string | null): void {
    const previous = this.photoPreview();

    if (previous) {
      URL.revokeObjectURL(previous);
    }

    this.photoPreview.set(url);
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const { errors } = error.error as ValidationErrorResponse;

      for (const [field, messages] of Object.entries(errors)) {
        // "profile_codes.1" (un perfil inválido) se muestra en el grupo de perfiles.
        const name = field.split('.')[0];

        if (name === 'photo') {
          this.photoError.set(messages[0]);
        } else {
          this.form.get(name)?.setErrors({ server: messages[0] });
        }
      }

      this.errorMessage.set('Revisa los campos marcados.');
      return;
    }

    // 409: otro usuario con el mismo correo se guardó al mismo tiempo.
    if (error.status === 409) {
      this.form.controls.email.setErrors({ server: 'Ya existe un usuario con ese correo.' });
      this.errorMessage.set('Revisa los campos marcados.');
      return;
    }

    if (error.status === 404) {
      this.errorMessage.set('El usuario ya no existe.');
      return;
    }

    this.errorMessage.set('No se pudo guardar el usuario. Intenta de nuevo.');
  }
}
