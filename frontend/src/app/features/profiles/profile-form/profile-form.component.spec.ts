import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { SECTION_CATALOG, buildProfile } from '../../../testing/profile.fixtures';
import { ProfileFormComponent } from './profile-form.component';

describe('ProfileFormComponent', () => {
  const profilesUrl = `${environment.apiUrl}/profiles`;
  const sectionsUrl = `${environment.apiUrl}/sections`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'perfiles/nuevo', component: ProfileFormComponent },
          { path: 'perfiles/:code/editar', component: ProfileFormComponent },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  function type(id: string, value: string): void {
    const input = screen().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  /** Casilla de la sección con esa clave. */
  function checkbox(key: string): HTMLInputElement {
    return screen().querySelector(`input[type="checkbox"][value="${key}"]`) as HTMLInputElement;
  }

  /** Marca o desmarca una casilla como lo haría el usuario. */
  function toggle(key: string): void {
    checkbox(key).click();
  }

  function submit(): void {
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  function errorOf(id: string): string | undefined {
    return screen().querySelector(`#${id}-error`)?.textContent?.trim();
  }

  describe('alta (/perfiles/nuevo)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/perfiles/nuevo', ProfileFormComponent);
      httpTesting.expectOne(sectionsUrl).flush({ data: SECTION_CATALOG });
    });

    it('muestra una casilla por cada sección del catálogo', () => {
      const labels = Array.from(screen().querySelectorAll('.checkbox')).map((label) => label.textContent?.trim());

      expect(labels).toEqual(['Productos', 'Usuarios', 'Perfiles', 'Bitácora']);
      expect(checkbox('products').checked).toBeFalse();
    });

    it('exige nombre y al menos una sección, sin llamar a la API', () => {
      submit();

      expect(errorOf('name')).toBe('El nombre es obligatorio.');
      expect(errorOf('sections')).toBe('Selecciona al menos una sección.');
      httpTesting.expectNone(profilesUrl);
    });

    it('envía las secciones marcadas (desmarcar quita la sección) y limpia el formulario', () => {
      type('name', 'Supervisor');
      toggle('products');
      toggle('users');
      toggle('profiles');
      toggle('profiles');
      submit();

      const request = httpTesting.expectOne(profilesUrl);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ name: 'Supervisor', sections: ['products', 'users'] });
      request.flush({ data: buildProfile({ code: 'PRF-0003', name: 'Supervisor' }) }, { status: 201, statusText: 'Created' });

      expect(screen().querySelector('.alert--success')?.textContent).toContain('Se creó el perfil PRF-0003');
      expect((screen().querySelector('#name') as HTMLInputElement).value).toBe('');
      expect(checkbox('products').checked).toBeFalse();
    });

    it('muestra los errores 422 de la API, incluida una sección inválida', () => {
      type('name', 'administrador');
      toggle('products');
      submit();

      httpTesting.expectOne(profilesUrl).flush(
        {
          message: 'El campo nombre ya ha sido registrado. (y 1 error más)',
          errors: {
            name: ['El campo nombre ya ha sido registrado.'],
            'sections.0': ['El valor de sección no es válido.'],
          },
        },
        { status: 422, statusText: 'Unprocessable Content' },
      );

      expect(errorOf('name')).toBe('El campo nombre ya ha sido registrado.');
      expect(errorOf('sections')).toBe('El valor de sección no es válido.');
    });

    it('con 409 (mismo nombre guardado al mismo tiempo) marca el nombre como repetido', () => {
      type('name', 'Supervisor');
      toggle('products');
      submit();

      httpTesting.expectOne(profilesUrl).flush(
        { message: 'El registro ya existe.' },
        { status: 409, statusText: 'Conflict' },
      );

      expect(errorOf('name')).toBe('Ya existe un perfil con ese nombre.');
    });
  });

  describe('edición (/perfiles/:code/editar)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/perfiles/PRF-0002/editar', ProfileFormComponent);
    });

    it('carga el catálogo y el perfil, y marca sus secciones', () => {
      httpTesting.expectOne(sectionsUrl).flush({ data: SECTION_CATALOG });
      httpTesting.expectOne(`${profilesUrl}/PRF-0002`).flush({ data: buildProfile() });

      expect(screen().querySelector('h2')?.textContent).toBe('Editar perfil');
      expect((screen().querySelector('#name') as HTMLInputElement).value).toBe('Capturista de productos');
      expect(checkbox('products').checked).toBeTrue();
      expect(checkbox('users').checked).toBeFalse();
    });

    it('envía los cambios con PUT', () => {
      httpTesting.expectOne(sectionsUrl).flush({ data: SECTION_CATALOG });
      httpTesting.expectOne(`${profilesUrl}/PRF-0002`).flush({ data: buildProfile() });

      toggle('audit_log');
      submit();

      const request = httpTesting.expectOne(`${profilesUrl}/PRF-0002`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({ name: 'Capturista de productos', sections: ['products', 'audit_log'] });
      request.flush({ data: buildProfile() });

      expect(screen().querySelector('.alert--success')?.textContent).toContain('Se guardaron los cambios de PRF-0002');
    });

    it('avisa que el perfil no existe y no muestra el formulario', () => {
      httpTesting.expectOne(sectionsUrl).flush({ data: SECTION_CATALOG });
      httpTesting
        .expectOne(`${profilesUrl}/PRF-0002`)
        .flush({ message: 'Recurso no encontrado.' }, { status: 404, statusText: 'Not Found' });

      expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El perfil no existe.');
      expect(screen().querySelector('form')).toBeNull();
    });
  });
});
