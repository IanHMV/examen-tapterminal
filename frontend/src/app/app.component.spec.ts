import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthUser } from './core/models/auth.model';
import { AuthService } from './core/services/auth.service';
import { buildAuthUser } from './testing/auth.fixtures';

describe('AppComponent', () => {
  const user = signal<AuthUser | null>(null);
  const logout = jasmine.createSpy('logout').and.returnValue(of(undefined));

  beforeEach(async () => {
    user.set(null);
    logout.calls.reset();

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        // ApiStatusComponent hace una petición: se responde con el HttpClient simulado.
        provideHttpClient(),
        provideHttpClientTesting(),
        // AuthService simulado: la prueba decide si hay sesión.
        {
          provide: AuthService,
          useValue: { currentUser: user.asReadonly(), isAuthenticated: computed(() => user() !== null), logout },
        },
      ],
    }).compileComponents();
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should render the system name', () => {
    expect(render().querySelector('h1')?.textContent).toContain('Examen TAP Terminal');
  });

  it('sin sesión no muestra el menú ni el usuario', () => {
    const page = render();

    expect(page.querySelector('.app-nav')).toBeNull();
    expect(page.querySelector('.app-session')).toBeNull();
  });

  it('con sesión muestra el menú y quién inició sesión', () => {
    user.set(buildAuthUser());

    const page = render();
    const links = Array.from(page.querySelectorAll('.app-nav a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/productos', '/usuarios', '/perfiles']);
    expect(page.querySelector('.app-session__user')?.textContent).toContain('admin@example.com');
  });

  it('"Cerrar sesión" revoca la sesión y lleva al login', () => {
    user.set(buildAuthUser());
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (render().querySelector('.app-session__logout') as HTMLButtonElement).click();

    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
