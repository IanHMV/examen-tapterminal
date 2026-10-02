import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { PROFILE_OPTIONS, buildPhoto, buildUser } from '../../../testing/user.fixtures';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  const usersUrl = `${environment.apiUrl}/users`;
  const optionsUrl = `${environment.apiUrl}/profiles/options`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'usuarios/nuevo', component: UserFormComponent },
          { path: 'usuarios/:code/editar', component: UserFormComponent },
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

  function valueOf(id: string): string {
    return (screen().querySelector(`#${id}`) as HTMLInputElement).value;
  }

  function toggleProfile(code: string): void {
    (screen().querySelector(`input[type="checkbox"][value="${code}"]`) as HTMLInputElement).click();
  }

  /** Simula que el usuario elige un archivo en el selector de la foto. */
  function choosePhoto(file: File): void {
    const input = screen().querySelector('#photo') as HTMLInputElement;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event('change'));
  }

  function submit(): void {
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  function errorOf(id: string): string | undefined {
    return screen().querySelector(`#${id}-error`)?.textContent?.trim();
  }

  describe('alta (/usuarios/nuevo)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/usuarios/nuevo', UserFormComponent);
      httpTesting.expectOne(optionsUrl).flush({ data: PROFILE_OPTIONS });
    });

    function fillValidForm(): void {
      type('name', 'Ana López');
      type('email', 'ana.lopez@tapterminal.com');
      type('phone', '+52 314 123 4567');
      toggleProfile('PRF-0002');
      choosePhoto(buildPhoto());
    }

    it('muestra una casilla por cada perfil', () => {
      const labels = Array.from(screen().querySelectorAll('.checkbox')).map((label) => label.textContent?.trim());

      expect(labels).toEqual(['Administrador', 'Capturista de productos']);
    });

    it('exige nombre, correo, al menos un perfil y la foto, sin llamar a la API', () => {
      submit();

      expect(errorOf('name')).toBe('El nombre es obligatorio.');
      expect(errorOf('email')).toBe('El correo es obligatorio.');
      expect(errorOf('profile_codes')).toBe('Selecciona al menos un perfil.');
      expect(errorOf('photo')).toBe('La foto es obligatoria.');
      httpTesting.expectNone(usersUrl);
    });

    it('valida el formato del correo y que el teléfono lleve lada', () => {
      type('email', 'no-es-correo');
      type('phone', '314 123 4567');
      submit();

      expect(errorOf('email')).toBe('Escribe un correo válido.');
      expect(errorOf('phone')).toContain('debe empezar con + y la lada del país');
    });

    it('rechaza fotos que no son JPG/PNG/WebP o que pesan más de 2 MB, antes de subirlas', () => {
      choosePhoto(buildPhoto('dibujo.svg', 'image/svg+xml'));
      expect(errorOf('photo')).toBe('La foto debe ser JPG, PNG o WebP.');

      choosePhoto(buildPhoto('enorme.jpg', 'image/jpeg', 3 * 1024 * 1024));
      expect(errorOf('photo')).toBe('La foto no debe pesar más de 2 MB.');

      choosePhoto(buildPhoto());
      expect(errorOf('photo')).toBeUndefined();
      expect(screen().querySelector('.user-form__photo img')?.getAttribute('src')).toMatch(/^blob:/);
    });

    it('envía los datos y la foto, y limpia el formulario', () => {
      fillValidForm();
      submit();

      const request = httpTesting.expectOne(usersUrl);
      const body = request.request.body as FormData;
      expect(request.request.method).toBe('POST');
      expect(body.get('email')).toBe('ana.lopez@tapterminal.com');
      expect(body.get('phone')).toBe('+52 314 123 4567');
      expect(body.getAll('profile_codes[]')).toEqual(['PRF-0002']);
      expect((body.get('photo') as File).name).toBe('foto.png');
      request.flush({ data: buildUser() }, { status: 201, statusText: 'Created' });

      expect(screen().querySelector('.alert--success')?.textContent).toContain('Se creó el usuario');
      expect(screen().querySelector('.alert--success a')?.getAttribute('href')).toBe('/usuarios/USR-0002');
      expect(valueOf('name')).toBe('');
      expect(screen().querySelector('.user-form__photo img')).toBeNull();
    });

    it('muestra los errores 422 de la API en su campo, incluida la foto', () => {
      fillValidForm();
      submit();

      httpTesting.expectOne(usersUrl).flush(
        {
          message: 'El campo correo ya ha sido registrado. (y 2 errores más)',
          errors: {
            email: ['El campo correo ya ha sido registrado.'],
            'profile_codes.0': ['El perfil seleccionado no existe.'],
            photo: ['La foto debe ser JPG, PNG o WebP.'],
          },
        },
        { status: 422, statusText: 'Unprocessable Content' },
      );

      expect(errorOf('email')).toBe('El campo correo ya ha sido registrado.');
      expect(errorOf('profile_codes')).toBe('El perfil seleccionado no existe.');
      expect(errorOf('photo')).toBe('La foto debe ser JPG, PNG o WebP.');
    });
  });

  describe('edición (/usuarios/:code/editar)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/usuarios/USR-0002/editar', UserFormComponent);
      httpTesting.expectOne(optionsUrl).flush({ data: PROFILE_OPTIONS });
    });

    it('carga el usuario: datos, perfiles marcados y foto actual (la foto ya no es obligatoria)', () => {
      httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser() });

      expect(screen().querySelector('h2')?.textContent).toBe('Editar usuario');
      expect(valueOf('email')).toBe('ana.lopez@tapterminal.com');
      expect(valueOf('phone')).toBe('+523141234567');
      expect((screen().querySelector('input[value="PRF-0002"]') as HTMLInputElement).checked).toBeTrue();
      expect(screen().querySelector('.user-form__photo img')?.getAttribute('src')).toBe(buildUser().photo_url);
    });

    it('sin foto nueva, solo envía los datos con PUT (JSON)', () => {
      httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser() });

      type('phone', '');
      submit();

      const request = httpTesting.expectOne(`${usersUrl}/USR-0002`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({
        name: 'Ana López',
        email: 'ana.lopez@tapterminal.com',
        phone: null,
        profile_codes: ['PRF-0002'],
      });
      request.flush({ data: buildUser({ phone: null }) });

      expect(screen().querySelector('.alert--success')?.textContent).toContain('Se guardaron los cambios de');
    });

    it('con foto nueva, primero guarda los datos y después sube la foto', () => {
      httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser() });

      choosePhoto(buildPhoto('nueva.webp', 'image/webp'));
      submit();

      httpTesting.expectOne((req) => req.method === 'PUT').flush({ data: buildUser() });

      const upload = httpTesting.expectOne(`${usersUrl}/USR-0002/photo`);
      expect(upload.request.method).toBe('POST');
      expect(((upload.request.body as FormData).get('photo') as File).name).toBe('nueva.webp');
      upload.flush({ data: buildUser() });

      expect(screen().querySelector('.alert--success')).not.toBeNull();
    });
  });
});
