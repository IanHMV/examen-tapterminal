import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  const resetUrl = `${environment.apiUrl}/auth/reset-password`;
  /** Enlace como el del correo: el "+" del correo va codificado y el token, después de "#". */
  const emailLink = '/restablecer-contrasena?email=ana%2Bpruebas%40example.com#3f9a0c';
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'restablecer-contrasena', component: ResetPasswordComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  function type(id: string, value: string): void {
    const input = screen().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  async function choosePassword(password: string, confirmation = password): Promise<void> {
    await harness.navigateByUrl(emailLink, ResetPasswordComponent);
    type('password', password);
    type('password_confirmation', confirmation);
    submit();
  }

  it('sin token en el enlace avisa y ofrece pedir otro, sin formulario', async () => {
    await harness.navigateByUrl('/restablecer-contrasena?email=ana%40example.com', ResetPasswordComponent);

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El enlace no es válido o ya venció.');
    expect(screen().querySelector('a[href="/recuperar-contrasena"]')).not.toBeNull();
    expect(screen().querySelector('form')).toBeNull();
  });

  it('muestra el correo del enlace (con "+") como usuario', async () => {
    await harness.navigateByUrl(emailLink, ResetPasswordComponent);

    expect((screen().querySelector('#email') as HTMLInputElement).value).toBe('ana+pruebas@example.com');
  });

  it('valida la contraseña sin llamar a la API', async () => {
    await choosePassword('solo-letras', 'otra-cosa');

    expect(screen().querySelector('#password-error')?.textContent?.trim()).toBe('Debe tener al menos un número.');
    expect(screen().querySelector('#password_confirmation-error')?.textContent?.trim()).toBe(
      'Las contraseñas no coinciden.',
    );
    httpTesting.expectNone(resetUrl);
  });

  it('exige al menos 8 caracteres', async () => {
    await choosePassword('abc1');

    expect(screen().querySelector('#password-error')?.textContent?.trim()).toBe('Debe tener al menos 8 caracteres.');
    httpTesting.expectNone(resetUrl);
  });

  it('envía el token y el correo del enlace, y lleva a iniciar sesión', async () => {
    await choosePassword('Puerto-2026');

    const request = httpTesting.expectOne(resetUrl);
    expect(request.request.body).toEqual({
      token: '3f9a0c',
      email: 'ana+pruebas@example.com',
      password: 'Puerto-2026',
      password_confirmation: 'Puerto-2026',
    });
    request.flush({ message: 'Tu contraseña se actualizó. Ya puedes iniciar sesión.' });

    expect(screen().querySelector('[role="status"]')?.textContent).toContain('Tu contraseña se actualizó.');
    expect(screen().querySelector('a[href="/login"]')).not.toBeNull();
    expect(screen().querySelector('form')).toBeNull();
  });

  it('si el enlace venció (422 en token), ofrece pedir otro', async () => {
    await choosePassword('Puerto-2026');
    httpTesting.expectOne(resetUrl).flush(
      { message: 'El enlace no es válido o ya venció.', errors: { token: ['El enlace no es válido o ya venció.'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El enlace no es válido o ya venció.');
    expect(screen().querySelector('a[href="/recuperar-contrasena"]')).not.toBeNull();
  });

  it('muestra en el campo el error 422 de la contraseña', async () => {
    await choosePassword('Puerto-2026');
    httpTesting.expectOne(resetUrl).flush(
      { message: 'Contraseña no válida.', errors: { password: ['El campo contraseña no es válido.'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(screen().querySelector('#password-error')?.textContent?.trim()).toBe('El campo contraseña no es válido.');
    expect(screen().querySelector('form')).not.toBeNull();
  });
});
