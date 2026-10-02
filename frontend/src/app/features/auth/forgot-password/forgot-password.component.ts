import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ValidationErrorResponse } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Pide por correo un enlace para elegir una contraseña nueva.
 * La API responde lo mismo exista o no el correo, así que la pantalla también.
 */
@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly submitting = signal(false);
  /** Mensaje de la API cuando la solicitud se recibió. */
  protected readonly sentMessage = signal<string | null>(null);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth
      .forgotPassword(this.form.getRawValue().email)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (message) => this.sentMessage.set(message),
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 422) {
      const { errors } = error.error as ValidationErrorResponse;
      this.form.controls.email.setErrors({ server: errors['email']?.[0] ?? 'Revisa el correo.' });
      return;
    }

    // 429: la API dice cuántos segundos esperar.
    if (error.status === 429) {
      this.errorMessage.set(error.error?.message ?? 'Demasiados intentos. Espera un minuto e intenta de nuevo.');
      return;
    }

    this.errorMessage.set('No se pudo enviar la solicitud. Intenta de nuevo.');
  }
}
