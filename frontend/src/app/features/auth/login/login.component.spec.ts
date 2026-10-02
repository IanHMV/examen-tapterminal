import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildLoginResponse } from '../../../testing/auth.fixtures';
import { LoginComponent } from './login.component';

@Component({ template: 'pantalla' })
class ScreenComponent {}

describe('LoginComponent', () => {
  const loginUrl = `${environment.apiUrl}/auth/login`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'login', component: LoginComponent },
          { path: '**', component: ScreenComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

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

  async function loginAt(url: string): Promise<void> {
    await harness.navigateByUrl(url, LoginComponent);
    type('email', 'admin@example.com');
    type('password', 'secreta');
    submit();
  }

  it('exige correo y contraseña sin llamar a la API', async () => {
    await harness.navigateByUrl('/login', LoginComponent);
    submit();

    expect(screen().querySelector('#email-error')?.textContent?.trim()).toBe('El correo es obligatorio.');
    expect(screen().querySelector('#password-error')?.textContent?.trim()).toBe('La contraseña es obligatoria.');
    httpTesting.expectNone(loginUrl);
  });

  it('al entrar, regresa a la pantalla que pedía (returnUrl)', async () => {
    await loginAt('/login?returnUrl=%2Fusuarios%2FUSR-0002');
    httpTesting.expectOne(loginUrl).flush(buildLoginResponse());
    await harness.fixture.whenStable();

    expect(router.url).toBe('/usuarios/USR-0002');
  });

  it('ignora un returnUrl externo y va al inicio', async () => {
    await loginAt('/login?returnUrl=%2F%2Fotro-sitio.example.com');
    httpTesting.expectOne(loginUrl).flush(buildLoginResponse());
    await harness.fixture.whenStable();

    expect(router.url).toBe('/productos');
  });

  it('con credenciales incorrectas avisa y borra la contraseña', async () => {
    await loginAt('/login');
    httpTesting.expectOne(loginUrl).flush(
      { message: 'El correo o la contraseña no son correctos.', errors: { email: ['…'] } },
      { status: 422, statusText: 'Unprocessable Content' },
    );

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El correo o la contraseña no son correctos.');
    expect((screen().querySelector('#password') as HTMLInputElement).value).toBe('');
    expect(router.url).toBe('/login');
  });

  it('con demasiados intentos (429) muestra cuánto esperar', async () => {
    await loginAt('/login');
    httpTesting.expectOne(loginUrl).flush(
      { message: 'Demasiados intentos. Intenta de nuevo en 42 segundos.' },
      { status: 429, statusText: 'Too Many Requests' },
    );

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('42 segundos');
  });
});
