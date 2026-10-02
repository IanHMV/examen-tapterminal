import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from './core/services/auth.service';
import { buildAuthUser, createAuthServiceStub } from './testing/auth.fixtures';

describe('AppComponent', () => {
  const logout = jasmine.createSpy('logout').and.returnValue(of(undefined));
  let auth: ReturnType<typeof createAuthServiceStub>;

  beforeEach(async () => {
    auth = createAuthServiceStub();
    logout.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        // AppComponent consulta el healthcheck: se responde con el HttpClient simulado.
        provideHttpClient(),
        provideHttpClientTesting(),
        // AuthService simulado: la prueba decide si hay sesión.
        { provide: AuthService, useValue: { ...auth, logout } },
      ],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('informa el estado de la API en la consola (sin mostrarlo en pantalla)', () => {
    const info = spyOn(console, 'info');
    render();

    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/healthcheck'))
      .flush({ status: 'ok', service: 'Examen TAP Terminal', checks: { database: 'ok' }, timestamp: '' });

    expect(info).toHaveBeenCalledWith('API en línea · Examen TAP Terminal · base de datos: ok');
  });

  it('should render the system name', () => {
    expect(render().querySelector('h1')?.textContent).toContain('Examen TAP Terminal');
  });

  it('sin sesión no muestra el menú ni el usuario', () => {
    const page = render();

    expect(page.querySelector('.app-nav')).toBeNull();
    expect(page.querySelector('.app-session')).toBeNull();
  });

  it('con sesión muestra el menú y quién inició sesión', () => {
    auth.user.set(
      buildAuthUser({
        sections: [
          { key: 'products', name: 'Productos' },
          { key: 'users', name: 'Usuarios' },
          { key: 'profiles', name: 'Perfiles' },
        ],
      }),
    );

    const page = render();
    const links = Array.from(page.querySelectorAll('.app-nav a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/productos', '/usuarios', '/perfiles']);
    expect(page.querySelector('.app-session__user')?.textContent).toContain('admin@example.com');
  });

  it('el menú solo muestra las secciones de sus perfiles', () => {
    auth.user.set(buildAuthUser({ sections: [{ key: 'products', name: 'Productos' }] }));

    const links = Array.from(render().querySelectorAll('.app-nav a')).map((link) => link.textContent?.trim());

    expect(links).toEqual(['Productos']);
  });

  it('"Cerrar sesión" revoca la sesión y lleva al login', () => {
    auth.user.set(buildAuthUser());
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (render().querySelector('.app-session__logout') as HTMLButtonElement).click();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
