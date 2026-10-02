import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildPage } from '../../../testing/pagination.fixtures';
import { buildProfile } from '../../../testing/profile.fixtures';
import { ProfileListComponent } from './profile-list.component';

describe('ProfileListComponent', () => {
  const profilesUrl = `${environment.apiUrl}/profiles`;
  const admin = buildProfile({
    id: '6abf324951cceeb26c0715fc',
    code: 'PRF-0001',
    name: 'Administrador',
    sections: [
      { key: 'products', name: 'Productos' },
      { key: 'users', name: 'Usuarios' },
    ],
  });
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'perfiles', component: ProfileListComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);

    await harness.navigateByUrl('/perfiles', ProfileListComponent);
    httpTesting.expectOne((req) => req.url === profilesUrl).flush(buildPage([admin, buildProfile()]));
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  /** Pulsa la acción con ese texto en la primera fila. */
  function clickOnFirstRow(label: string): void {
    const actions = Array.from(screen().querySelectorAll<HTMLElement>('tbody tr:first-child .table__actions > *'));
    actions.find((action) => action.textContent?.trim() === label)?.click();
  }

  it('muestra las columnas del examen: código, nombre y fecha de creación', () => {
    const cells = Array.from(screen().querySelectorAll('tbody tr:first-child td')).map((td) => td.textContent?.trim());

    expect(cells[0]).toBe('PRF-0001');
    expect(cells[1]).toBe('Administrador');
    expect(cells[2]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // DD/MM/YYYY HH:MM
    expect(screen().querySelector('tbody tr:first-child a')?.getAttribute('href')).toBe('/perfiles/PRF-0001/editar');
  });

  it('"Ver" abre el detalle en una ventana modal con sus secciones, sin pedir nada a la API', () => {
    clickOnFirstRow('Ver');

    const dialog = screen().querySelector('app-profile-detail-dialog dialog') as HTMLDialogElement;
    const items = Array.from(dialog.querySelectorAll('li')).map((li) => li.textContent?.trim());

    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('.details')?.textContent).toContain('PRF-0001');
    expect(dialog.querySelector('.details')?.textContent).toContain('Administrador');
    expect(items).toEqual(['Productos', 'Usuarios']);
    httpTesting.expectNone((req) => req.url.startsWith(profilesUrl));
  });

  it('elimina tras confirmar y recarga la página', () => {
    clickOnFirstRow('Eliminar');

    const dialog = screen().querySelector('app-confirm-dialog dialog') as HTMLDialogElement;
    expect(dialog.textContent).toContain('PRF-0001');
    (dialog.querySelector('.button--danger') as HTMLButtonElement).click();

    const request = httpTesting.expectOne(`${profilesUrl}/PRF-0001`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    httpTesting.expectOne((req) => req.url === profilesUrl).flush(buildPage([buildProfile()]));

    expect(screen().querySelector('[role="status"]')?.textContent).toContain('Se eliminó el perfil PRF-0001.');
    expect(screen().querySelectorAll('tbody tr').length).toBe(1);
  });

  it('si el perfil está asignado a usuarios (409), muestra el motivo y no lo quita de la tabla', () => {
    clickOnFirstRow('Eliminar');
    (screen().querySelector('app-confirm-dialog .button--danger') as HTMLButtonElement).click();

    httpTesting.expectOne(`${profilesUrl}/PRF-0001`).flush(
      { message: 'No se puede eliminar: el perfil está asignado a 2 usuario(s).' },
      { status: 409, statusText: 'Conflict' },
    );

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('asignado a 2 usuario(s)');
    expect(screen().querySelectorAll('tbody tr').length).toBe(2);
  });
});
