import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';

import { PROFILE_RULES } from '../../../core/constants/profile-rules';
import { ValidationErrorResponse } from '../../../core/models/api.model';
import { Profile, ProfileInput, Section } from '../../../core/models/profile.model';
import { ProfileService } from '../../../core/services/profile.service';

/** Al menos un carácter que no sea espacio (la API recorta los espacios). */
const NOT_BLANK = /\S/;

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * Alta y edición de perfiles con el mismo formulario.
 * Con código en la URL (/perfiles/PRF-0001/editar) edita; sin código, crea.
 */
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-form.component.html',
})
export class ProfileFormComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly profileService = inject(ProfileService);

  /** Código del perfil en edición (null al crear). */
  protected readonly code = inject(ActivatedRoute).snapshot.paramMap.get('code');
  protected readonly isEdit = this.code !== null;

  protected readonly rules = PROFILE_RULES;
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly sectionCatalog = signal<Section[]>([]);
  protected readonly saving = signal(false);
  protected readonly savedProfile = signal<Profile | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.control('', [
      Validators.required,
      Validators.pattern(NOT_BLANK),
      Validators.maxLength(PROFILE_RULES.nameMaxLength),
    ]),
    // Claves de las secciones elegidas. "required" falla con la lista vacía.
    sections: this.fb.control<string[]>([], Validators.required),
  });

  constructor() {
    // El catálogo de secciones siempre hace falta; el perfil, solo al editar.
    forkJoin({
      sections: this.profileService.sections(),
      profile: this.code ? this.profileService.get(this.code) : of(null),
    }).subscribe({
      next: ({ sections, profile }) => {
        this.sectionCatalog.set(sections);

        if (profile) {
          this.form.setValue({
            name: profile.name,
            sections: profile.sections.map((section) => section.key),
          });
        }

        this.loadState.set('ready');
      },
      error: (error: HttpErrorResponse) => {
        this.loadState.set(error.status === 404 ? 'not-found' : 'error');
      },
    });
  }

  protected isSelected(key: string): boolean {
    return this.form.controls.sections.value.includes(key);
  }

  protected toggleSection(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const control = this.form.controls.sections;

    control.setValue(checked ? [...control.value, key] : control.value.filter((current) => current !== key));
    control.markAsTouched();
  }

  protected submit(): void {
    // Muestra los errores de todos los campos, aunque el usuario no los haya tocado.
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.savedProfile.set(null);

    const input: ProfileInput = this.form.getRawValue();
    const request = this.code
      ? this.profileService.update(this.code, input)
      : this.profileService.create(input);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (profile) => {
        this.savedProfile.set(profile);

        // Al crear se limpia para capturar otro; al editar se conservan los datos guardados.
        if (!this.isEdit) {
          this.form.reset();
        }
      },
      error: (error: HttpErrorResponse) => this.handleError(error),
    });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const { errors } = error.error as ValidationErrorResponse;

      for (const [field, messages] of Object.entries(errors)) {
        // "sections.1" (una sección inválida) se muestra en el grupo "sections".
        this.form.get(field.split('.')[0])?.setErrors({ server: messages[0] });
      }

      this.errorMessage.set('Revisa los campos marcados.');
      return;
    }

    // 409: otro perfil con el mismo nombre se guardó al mismo tiempo.
    if (error.status === 409) {
      this.form.controls.name.setErrors({ server: 'Ya existe un perfil con ese nombre.' });
      this.errorMessage.set('Revisa los campos marcados.');
      return;
    }

    if (error.status === 404) {
      this.errorMessage.set('El perfil ya no existe.');
      return;
    }

    this.errorMessage.set('No se pudo guardar el perfil. Intenta de nuevo.');
  }
}
