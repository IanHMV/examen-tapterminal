import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthUser } from '../models/auth.model';
import { buildAuthUser } from '../../testing/auth.fixtures';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';

@Component({ template: 'pantalla' })
class ScreenComponent {}

describe('authGuard y guestGuard', () => {
  const user = signal<AuthUser | null>(null);
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    user.set(null);

    TestBed.configureTestingModule({
      providers: [
        // AuthService simulado: solo importa si hay usuario.
        { provide: AuthService, useValue: { isAuthenticated: computed(() => user() !== null) } },
        provideRouter([
          { path: 'login', canActivate: [guestGuard], component: ScreenComponent },
          { path: '', canActivateChild: [authGuard], children: [{ path: 'productos', component: ScreenComponent }] },
        ]),
      ],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('sin sesión, una pantalla protegida lleva al login con la URL de regreso', async () => {
    await harness.navigateByUrl('/productos?pagina=2');

    expect(router.url).toBe('/login?returnUrl=%2Fproductos%3Fpagina%3D2');
  });

  it('con sesión, deja entrar a la pantalla protegida', async () => {
    user.set(buildAuthUser());

    await harness.navigateByUrl('/productos');

    expect(router.url).toBe('/productos');
  });

  it('con sesión, el login lleva al inicio', async () => {
    user.set(buildAuthUser());

    await harness.navigateByUrl('/login');

    expect(router.url).toBe('/productos');
  });
});
