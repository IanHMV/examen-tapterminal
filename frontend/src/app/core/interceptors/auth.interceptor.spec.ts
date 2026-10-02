import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { buildAuthUser, storeSession } from '../../testing/auth.fixtures';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    storeSession('1|token-de-prueba', new Date(Date.now() + 60_000));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('agrega "Authorization: Bearer <token>" a las peticiones a la API', () => {
    http.get(`${environment.apiUrl}/products`).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/products`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer 1|token-de-prueba');
    request.flush({});
  });

  it('no envía el token a otros dominios', () => {
    http.get('https://otro-sitio.example.com/datos').subscribe();

    const request = httpTesting.expectOne('https://otro-sitio.example.com/datos');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('con 401, olvida la sesión y lleva al login recordando la pantalla actual', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const auth = TestBed.inject(AuthService);

    http.get(`${environment.apiUrl}/users`).subscribe({ error: () => undefined });
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(auth.token()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/' } });
  });

  it('con 403, actualiza el usuario (sus perfiles cambiaron) y lleva a "Sin acceso"', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    http.get(`${environment.apiUrl}/users`).subscribe({ error: () => undefined });
    httpTesting.expectOne(`${environment.apiUrl}/users`).flush({}, { status: 403, statusText: 'Forbidden' });
    httpTesting.expectOne(`${environment.apiUrl}/auth/me`).flush({ data: buildAuthUser({ sections: [] }) });

    expect(TestBed.inject(AuthService).hasSection('users')).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/sin-acceso']);
  });

  it('el 401 del propio login no redirige (lo muestra el formulario)', () => {
    const navigate = spyOn(router, 'navigate');

    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => undefined });
    httpTesting.expectOne(`${environment.apiUrl}/auth/login`).flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).not.toHaveBeenCalled();
  });
});
