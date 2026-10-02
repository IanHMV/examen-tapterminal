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

    const request = httpTesting.expectOne(`${authUrl}/login`);
    expect(request.request.body).toEqual({ email: 'admin@example.com', password: 'secreta' });
    request.flush(response);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.currentUser()?.email).toBe('admin@example.com');
    expect(service.token()).toBe('1|token-de-prueba');
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) ?? '{}').token).toBe('1|token-de-prueba');
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
});
