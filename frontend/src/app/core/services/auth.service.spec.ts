import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { SESSION_STORAGE_KEY, buildAuthUser, buildLoginResponse, storeSession } from '../../testing/auth.fixtures';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const authUrl = `${environment.apiUrl}/auth`;
  let httpTesting: HttpTestingController;

  // El servicio lee localStorage al crearse: cada prueba lo prepara antes de pedirlo.
  function createService(): AuthService {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);

    return TestBed.inject(AuthService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('login() guarda el token y el usuario', () => {
    const service = createService();
    const response = buildLoginResponse();

    service.login('admin@example.com', 'secreta').subscribe();

    // Encabezado Authorization: Basic base64("correo:contraseña") y ningún dato en el cuerpo.
    const request = httpTesting.expectOne(`${authUrl}/login`);
    expect(request.request.headers.get('Authorization')).toBe(`Basic ${btoa('admin@example.com:secreta')}`);
    expect(request.request.body).toBeNull();
    request.flush(response);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('admin@example.com');
    expect(service.token()).toBe('1|token-de-prueba');
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '{}').token).toBe('1|token-de-prueba');
  });

  it('login() codifica en UTF-8 una contraseña con acentos o "ñ"', () => {
    const service = createService();

    service.login('ana@example.com', 'Año-2026').subscribe();

    const request = httpTesting.expectOne(`${authUrl}/login`);
    const decoded = new TextDecoder().decode(
      Uint8Array.from(atob(request.request.headers.get('Authorization')!.slice(6)), (c) => c.charCodeAt(0)),
    );
    expect(decoded).toBe('ana@example.com:Año-2026');
    request.flush(buildLoginResponse());
  });

  it('restoreSession() recupera al usuario con el token guardado', () => {
    storeSession('1|guardado', new Date(Date.now() + 60_000));
    const service = createService();
    let completed = false;

    service.restoreSession().subscribe({ complete: () => (completed = true) });
    httpTesting.expectOne(`${authUrl}/me`).flush({ data: buildAuthUser() });

    expect(completed).toBeTrue();
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('restoreSession() ignora un token vencido sin llamar a la API', () => {
    storeSession('1|vencido', new Date(Date.now() - 60_000));
    const service = createService();

    service.restoreSession().subscribe();

    httpTesting.expectNone(`${authUrl}/me`);
    expect(service.token()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('restoreSession() olvida la sesión si la API rechaza el token (sin lanzar error)', () => {
    storeSession('1|revocado', new Date(Date.now() + 60_000));
    const service = createService();
    let failed = false;

    service.restoreSession().subscribe({ error: () => (failed = true) });
    httpTesting.expectOne(`${authUrl}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBeFalse();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('hasSection() y homeUrl() usan las secciones del usuario', () => {
    const service = createService();
    const response = buildLoginResponse();
    response.user.sections = [{ key: 'users', name: 'Usuarios' }];

    service.login('admin@example.com', 'secreta').subscribe();
    httpTesting.expectOne(`${authUrl}/login`).flush(response);

    expect(service.hasSection('users')).toBeTrue();
    expect(service.hasSection('products')).toBeFalse();
    expect(service.homeUrl()).toBe('/usuarios');
  });

  it('homeUrl() lleva a "Sin acceso" si no tiene ninguna sección', () => {
    const service = createService();
    const response = buildLoginResponse();
    response.user.sections = [];

    service.login('admin@example.com', 'secreta').subscribe();
    httpTesting.expectOne(`${authUrl}/login`).flush(response);

    expect(service.homeUrl()).toBe('/sin-acceso');
  });

  it('refreshUser() actualiza las secciones (por ejemplo, después de cambiar sus perfiles)', () => {
    const service = createService();
    service.login('admin@example.com', 'secreta').subscribe();
    httpTesting.expectOne(`${authUrl}/login`).flush(buildLoginResponse());

    service.refreshUser().subscribe();
    httpTesting.expectOne(`${authUrl}/me`).flush({ data: buildAuthUser({ sections: [] }) });

    expect(service.hasSection('products')).toBeFalse();
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('logout() revoca el token en la API y borra la sesión, aunque la API falle', () => {
    const service = createService();
    service.login('admin@example.com', 'secreta').subscribe();
    httpTesting.expectOne(`${authUrl}/login`).flush(buildLoginResponse());

    service.logout().subscribe();
    httpTesting.expectOne(`${authUrl}/logout`).flush(null, { status: 500, statusText: 'Server Error' });

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('forgotPassword() envía el correo y entrega el mensaje de la API', () => {
    const service = createService();
    let message = '';

    service.forgotPassword('ana@example.com').subscribe((value) => (message = value));

    const request = httpTesting.expectOne(`${authUrl}/forgot-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'ana@example.com' });
    request.flush({ message: 'Si el correo está registrado, te enviamos un enlace.' });

    expect(message).toBe('Si el correo está registrado, te enviamos un enlace.');
  });

  it('resetPassword() envía el token, el correo y la contraseña nueva', () => {
    const service = createService();
    const input = {
      token: 'abc123',
      email: 'ana@example.com',
      password: 'Puerto-2026',
      password_confirmation: 'Puerto-2026',
    };

    service.resetPassword(input).subscribe();

    const request = httpTesting.expectOne(`${authUrl}/reset-password`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ message: 'Tu contraseña se actualizó.' });
  });
});
