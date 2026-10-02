import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { buildAuthUser, createAuthServiceStub } from '../../testing/auth.fixtures';
import { AuthService } from '../services/auth.service';
import { authGuard, guestGuard } from './auth.guard';
import { sectionGuard } from './section.guard';

@Component({ template: 'pantalla' })
class ScreenComponent {}

describe('authGuard, guestGuard y sectionGuard', () => {
  let auth: ReturnType<typeof createAuthServiceStub>;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    auth = createAuthServiceStub();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        provideRouter([
          { path: 'login', canActivate: [guestGuard], component: ScreenComponent },
          {
            path: '',
            canActivateChild: [authGuard, sectionGuard],
            children: [
              { path: 'productos', data: { section: 'products' }, component: ScreenComponent },
              { path: 'usuarios', data: { section: 'users' }, component: ScreenComponent },
              { path: 'sin-acceso', component: ScreenComponent },
            ],
          },
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

  it('con la sección en sus perfiles, deja entrar', async () => {
    auth.user.set(buildAuthUser({ sections: [{ key: 'products', name: 'Productos' }] }));

    await harness.navigateByUrl('/productos');

    expect(router.url).toBe('/productos');
  });

  it('sin la sección, lleva a "Sin acceso"', async () => {
    auth.user.set(buildAuthUser({ sections: [{ key: 'products', name: 'Productos' }] }));

    await harness.navigateByUrl('/usuarios');

    expect(router.url).toBe('/sin-acceso');
  });

  it('las pantallas sin sección (como "Sin acceso") solo piden sesión', async () => {
    auth.user.set(buildAuthUser({ sections: [] }));

    await harness.navigateByUrl('/sin-acceso');

    expect(router.url).toBe('/sin-acceso');
  });

  it('con sesión, el login lleva a su primera pantalla permitida', async () => {
    auth.user.set(buildAuthUser({ sections: [{ key: 'users', name: 'Usuarios' }] }));

    await harness.navigateByUrl('/login');

    expect(router.url).toBe('/usuarios');
  });
});
