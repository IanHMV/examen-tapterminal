import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildPage } from '../../../testing/pagination.fixtures';
import { AuthService } from '../../../core/services/auth.service';
import { buildLoginResponse } from '../../../testing/auth.fixtures';
import { buildUser } from '../../../testing/user.fixtures';
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  const usersUrl = `${environment.apiUrl}/users`;
  const admin = buildUser({ id: '6abf3cf0e53d50b237060e20', code: 'USR-0001', name: 'Administrador', email: 'admin@example.com' });
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'usuarios', component: UserListComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);

    await harness.navigateByUrl('/usuarios', UserListComponent);
    httpTesting.expectOne((req) => req.url === usersUrl).flush(buildPage([admin, buildUser()]));
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  it('muestra las columnas del examen: código, usuario, nombre y fecha de creación', () => {
    const cells = Array.from(screen().querySelectorAll('tbody tr:first-child td')).map((td) => td.textContent?.trim());

    expect(cells[0]).toBe('USR-0001');
    expect(cells[1]).toBe('admin@example.com');
    expect(cells[2]).toBe('Administrador');
    expect(cells[3]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // DD/MM/YYYY HH:MM
  });

  it('enlaza a "Ver" (detalle) y "Editar"', () => {
    const links = Array.from(screen().querySelectorAll('tbody tr:first-child a')).map((a) => a.getAttribute('href'));

    expect(links).toEqual(['/usuarios/USR-0001', '/usuarios/USR-0001/editar']);
  });

  it('no ofrece "Eliminar" en el propio usuario', () => {
    // La sesión es del administrador (USR-0001), la primera fila.
    TestBed.inject(AuthService).login('admin@example.com', 'secreta').subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/auth/login`).flush(buildLoginResponse());

    const rows = Array.from(screen().querySelectorAll('tbody tr'));

    expect(rows[0].querySelector('.btn-outline-danger')).toBeNull();
    expect(rows[1].querySelector('.btn-outline-danger')).not.toBeNull();
  });

  it('muestra el motivo si la API no permite eliminar (409)', () => {
    (screen().querySelector('tbody tr:first-child .btn-outline-danger') as HTMLButtonElement).click();
    (screen().querySelector('dialog .btn-danger') as HTMLButtonElement).click();

    httpTesting
      .expectOne(`${usersUrl}/USR-0001`)
      .flush({ message: 'No puedes eliminar tu propio usuario.' }, { status: 409, statusText: 'Conflict' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No puedes eliminar tu propio usuario.');
  });

  it('elimina tras confirmar y recarga la página', () => {
    (screen().querySelector('tbody tr:first-child .btn-outline-danger') as HTMLButtonElement).click();

    const dialog = screen().querySelector('dialog') as HTMLDialogElement;
    expect(dialog.open).toBeTrue();
    expect(dialog.textContent).toContain('admin@example.com');
    (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();

    const request = httpTesting.expectOne(`${usersUrl}/USR-0001`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    httpTesting.expectOne((req) => req.url === usersUrl).flush(buildPage([buildUser()]));

    expect(screen().querySelector('[role="status"]')?.textContent).toContain('Se eliminó el usuario USR-0001.');
    expect(screen().querySelectorAll('tbody tr').length).toBe(1);
  });
});
