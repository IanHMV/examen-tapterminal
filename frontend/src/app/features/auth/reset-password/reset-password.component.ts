import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PASSWORD_RULES } from '../../../core/constants/password-rules';
import { ValidationErrorResponse } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';

/** Al menos una letra y un número, como pide la API. */
function passwordStrength(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';

  if (value === '') {
    return null;
  }

  if (!PASSWORD_RULES.letter.test(value)) {
    return { letter: true };
  }

  return PASSWORD_RULES.number.test(value) ? null : { number: true };
}

/** La confirmación debe ser igual a la contraseña. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const { password, password_confirmation } = group.value as { password: string; password_confirmation: string };

  return password_confirmation === '' || password === password_confirmation ? null : { mismatch: true };
}

type ScreenState = 'form' | 'invalid-link' | 'done';

/**
 * Pantalla del enlace que llega por correo: recuperación de contraseña y bienvenida.
 * El enlace trae el correo en la URL y el token después de "#" (el navegador no lo
 * envía al servidor, así no queda en los registros de Nginx ni de Cloudflare).
 */
@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly link = inject(ActivatedRoute).snapshot;

  protected readonly email = this.link.queryParamMap.get('email') ?? '';
  private readonly token = this.link.fragment ?? '';

  protected readonly state = signal<ScreenState>(this.email && this.token ? 'form' : 'invalid-link');
  protected readonly submitting = signal(false);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group(
    {
      password: this.fb.control('', [
        Validators.required,
        Validators.minLength(PASSWORD_RULES.minLength),
        Validators.maxLength(PASSWORD_RULES.maxLength),
        passwordStrength,
      ]),
      password_confirmation: this.fb.control('', Validators.required),
    },
    { validators: passwordsMatch },
  );

  /** Primer error de la contraseña, o null si cumple todas las reglas. */
  protected passwordError(): string | null {
    const password = this.form.controls.password;

    if (password.hasError('server')) {
      return password.getError('server');
    }

    if (password.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }

    if (password.hasError('minlength')) {
      return `Debe tener al menos ${PASSWORD_RULES.minLength} caracteres.`;
    }

    if (password.hasError('maxlength')) {
      return `No debe tener más de ${PASSWORD_RULES.maxLength} caracteres.`;
    }

    if (password.hasError('letter')) {
      return 'Debe tener al menos una letra.';
    }

    return password.hasError('number') ? 'Debe tener al menos un número.' : null;
  }

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth
      .resetPassword({ token: this.token, email: this.email, ...this.form.getRawValue() })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (message) => {
          this.successMessage.set(message);
          this.state.set('done');
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const { errors } = error.error as ValidationErrorResponse;

      // Enlace vencido, ya usado o alterado: hay que pedir otro.
      if (errors['token'] || errors['email']) {
        this.state.set('invalid-link');
        return;
      }

      this.form.controls.password.setErrors({ server: errors['password']?.[0] ?? 'Revisa la contraseña.' });
      return;
    }

    // 429: la API dice cuántos segundos esperar.
    if (error.status === 429) {
      this.errorMessage.set(error.error?.message ?? 'Demasiados intentos. Espera un minuto e intenta de nuevo.');
      return;
    }

    this.errorMessage.set('No se pudo guardar la contraseña. Intenta de nuevo.');
  }
}
