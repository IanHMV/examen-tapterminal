import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';

/** Pantalla a la que se va si no hay otra que recordar. */
const HOME = '/productos';

/**
 * Solo acepta rutas internas ("/productos/PRD-0001") como destino después del login.
 * Un enlace manipulado (?returnUrl=//otro-sitio.com) termina en el inicio.
 */
function safeReturnUrl(url: string | null): string {
  return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : HOME;
}

/**
 * Inicio de sesión con correo y contraseña.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: this.fb.control('', [Validators.required, Validators.email]),
    password: this.fb.control('', Validators.required),
  });

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.auth
      .login(email, password)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.router.navigateByUrl(safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')));
        },
        error: (error: HttpErrorResponse) => {
          // La contraseña se borra siempre que falla, como en cualquier login.
          this.form.controls.password.reset();
          this.errorMessage.set(this.messageFor(error));
        },
      });
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 422) {
      return 'El correo o la contraseña no son correctos.';
    }

    // 429: la API dice cuántos segundos esperar.
    if (error.status === 429) {
      return error.error?.message ?? 'Demasiados intentos. Espera un minuto e intenta de nuevo.';
    }

    return 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
}
