import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { buildAuthUser, createAuthServiceStub } from '../../../testing/auth.fixtures';
import { AuthService } from '../../../core/services/auth.service';
import { NoAccessComponent } from './no-access.component';

describe('NoAccessComponent', () => {
  let auth: ReturnType<typeof createAuthServiceStub>;

  beforeEach(() => {
    auth = createAuthServiceStub();

    TestBed.configureTestingModule({
      imports: [NoAccessComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  function render(): HTMLElement {
    const fixture = TestBed.createComponent(NoAccessComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('ofrece enlaces solo a las secciones permitidas', () => {
    auth.user.set(
      buildAuthUser({
        sections: [
          { key: 'products', name: 'Productos' },
          { key: 'profiles', name: 'Perfiles' },
        ],
      }),
    );

    const links = Array.from(render().querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(links).toEqual(['/productos', '/perfiles']);
  });

  it('sin secciones, pide que un administrador le asigne un perfil', () => {
    auth.user.set(buildAuthUser({ sections: [] }));

    const page = render();

    expect(page.querySelectorAll('a').length).toBe(0);
    expect(page.textContent).toContain('Pide a un administrador');
  });
});
