import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildUser } from '../../../testing/user.fixtures';
import { UserDetailComponent } from './user-detail.component';

describe('UserDetailComponent', () => {
  const usersUrl = `${environment.apiUrl}/users`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'usuarios/:code', component: UserDetailComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
    await harness.navigateByUrl('/usuarios/USR-0002', UserDetailComponent);
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  it('muestra usuario, nombre, teléfono, foto y perfiles (requisito del examen)', () => {
    httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser() });

    const details = screen().querySelector('.details')?.textContent ?? '';
    const photo = screen().querySelector('img') as HTMLImageElement;

    expect(details).toContain('ana.lopez@tapterminal.com');
    expect(details).toContain('Ana López');
    expect(details).toContain('+523141234567');
    expect(photo.getAttribute('src')).toBe(buildUser().photo_url);
    expect(photo.getAttribute('alt')).toBe('Foto de perfil de Ana López');
    expect(screen().querySelector('.user-detail__profiles')?.textContent).toContain('Capturista de productos');
  });

  it('indica cuando no hay teléfono', () => {
    httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser({ phone: null }) });

    expect(screen().querySelector('.details')?.textContent).toContain('Sin teléfono');
  });

  it('avisa que el usuario no existe cuando la API responde 404', () => {
    httpTesting
      .expectOne(`${usersUrl}/USR-0002`)
      .flush({ message: 'Recurso no encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El usuario no existe.');
  });

  it('elimina tras confirmar y avisa que se eliminó', () => {
    httpTesting.expectOne(`${usersUrl}/USR-0002`).flush({ data: buildUser() });

    (screen().querySelector('.user-detail__actions .button--danger') as HTMLButtonElement).click();
    (screen().querySelector('dialog .button--danger') as HTMLButtonElement).click();

    const request = httpTesting.expectOne(`${usersUrl}/USR-0002`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(screen().querySelector('[role="status"]')?.textContent).toContain('Se eliminó el usuario USR-0002.');
  });
});
