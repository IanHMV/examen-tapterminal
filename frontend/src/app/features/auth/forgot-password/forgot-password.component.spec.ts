import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  const forgotUrl = `${environment.apiUrl}/auth/forgot-password`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'recuperar-contrasena', component: ForgotPasswordComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
    await harness.navigateByUrl('/recuperar-contrasena', ForgotPasswordComponent);
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  function requestLink(email: string): void {
    const input = screen().querySelector('#email') as HTMLInputElement;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  it('exige un correo válido sin llamar a la API', () => {
    requestLink('no-es-correo');

    expect(screen().querySelector('#email-error')?.textContent?.trim()).toBe('Escribe un correo válido.');
    httpTesting.expectNone(forgotUrl);
  });

  it('envía el correo y muestra el mensaje de la API en lugar del formulario', () => {
    requestLink('ana@example.com');

    const request = httpTesting.expectOne(forgotUrl);
    expect(request.request.body).toEqual({ email: 'ana@example.com' });
    request.flush({ message: 'Te enviamos un enlace a tu correo para elegir una contraseña nueva.' });

    expect(screen().querySelector('[role="status"]')?.textContent).toContain('Te enviamos un enlace a tu correo');
    expect(screen().querySelector('form')).toBeNull();
  });

  it('si el correo no está registrado (422), lo dice en el campo y no muestra éxito', () => {
    const notFound = 'Usuario no encontrado, no es posible enviar el correo.';
    requestLink('nadie@example.com');
    httpTesting.expectOne(forgotUrl).flush(
      { message: notFound, errors: { email: [notFound] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(screen().querySelector('#email-error')?.textContent?.trim()).toBe(notFound);
    expect(screen().querySelector('[role="status"]')).toBeNull();
  });

  it('con 429 (enlace reciente o demasiadas solicitudes) muestra el mensaje de la API y conserva el formulario', () => {
    requestLink('ana@example.com');
    httpTesting.expectOne(forgotUrl).flush(
      { message: 'Demasiados intentos. Intenta de nuevo en 42 segundos.' },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('42 segundos');
    expect(screen().querySelector('form')).not.toBeNull();
  });
});
