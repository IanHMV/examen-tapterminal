import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildAuditLog } from '../../../testing/audit-log.fixtures';
import { buildPage } from '../../../testing/pagination.fixtures';
import { AuditLogListComponent } from './audit-log-list.component';

describe('AuditLogListComponent', () => {
  const auditLogsUrl = `${environment.apiUrl}/audit-logs`;
  const systemLog = buildAuditLog({
    id: '6ac01b31bb27fcfdba0e0c02',
    action: 'created',
    entity: 'users',
    entity_code: 'USR-0001',
    before: null,
    user: null,
  });
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'bitacora', component: AuditLogListComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    harness = await RouterTestingHarness.create();
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => httpTesting.verify());

  function screen(): HTMLElement {
    harness.detectChanges();
    return harness.routeNativeElement as HTMLElement;
  }

  function expectListRequest(): TestRequest {
    return httpTesting.expectOne((req) => req.url === auditLogsUrl);
  }

  async function open(url = '/bitacora'): Promise<void> {
    await harness.navigateByUrl(url, AuditLogListComponent);
  }

  it('muestra fecha, entidad, código, acción y usuario de cada cambio', async () => {
    await open();
    expectListRequest().flush(buildPage([buildAuditLog(), systemLog]));

    const cells = (row: number) =>
      Array.from(screen().querySelectorAll(`tbody tr:nth-child(${row}) td`)).map((td) => td.textContent?.trim());

    expect(cells(1)[0]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // DD/MM/YYYY HH:MM
    expect(cells(1).slice(1, 5)).toEqual(['Producto', 'PRD-0001', 'Edición', 'Administrador (USR-0001)']);
    expect(cells(2).slice(1, 5)).toEqual(['Usuario', 'USR-0001', 'Alta', 'Sistema']);
  });

  it('al filtrar lleva los filtros a la URL, vuelve a la página 1 y los envía a la API', async () => {
    await open('/bitacora?pagina=3');
    expectListRequest().flush(buildPage([buildAuditLog()]));

    const entity = screen().querySelector('#entity') as HTMLSelectElement;
    entity.value = 'products';
    entity.dispatchEvent(new Event('change'));
    const code = screen().querySelector('#code') as HTMLInputElement;
    code.value = ' PRD-0001 ';
    code.dispatchEvent(new Event('input'));
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
    await harness.fixture.whenStable();

    expect(router.url).toBe('/bitacora?entidad=products&codigo=PRD-0001');
    const request = expectListRequest();
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('entity')).toBe('products');
    expect(request.request.params.get('code')).toBe('PRD-0001');
    request.flush(buildPage([]));

    expect(screen().querySelector('tbody')?.textContent).toContain('No hay cambios registrados con estos filtros.');
  });

  it('lee los filtros de la URL e ignora una entidad desconocida', async () => {
    await open('/bitacora?entidad=passwords&codigo=prd-0001&pagina=2');

    const request = expectListRequest();
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.has('entity')).toBeFalse();
    expect(request.request.params.get('code')).toBe('prd-0001');
    request.flush(buildPage([]));

    expect((screen().querySelector('#entity') as HTMLSelectElement).value).toBe('');
    expect((screen().querySelector('#code') as HTMLInputElement).value).toBe('prd-0001');
  });

  it('"Limpiar" quita los filtros de la URL', async () => {
    await open('/bitacora?entidad=users&pagina=2');
    expectListRequest().flush(buildPage([]));

    Array.from(screen().querySelectorAll<HTMLButtonElement>('form button'))
      .find((button) => button.textContent?.trim() === 'Limpiar')
      ?.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe('/bitacora');
    expect(expectListRequest().request.params.keys()).toEqual(['page']);
  });

  it('"Ver cambios" abre la ventana con el antes y el después del registro', async () => {
    await open();
    expectListRequest().flush(buildPage([buildAuditLog()]));

    (screen().querySelector('tbody .btn-outline-primary') as HTMLButtonElement).click();
    const dialog = screen().querySelector('dialog') as HTMLDialogElement;

    expect(dialog.open).toBeTrue();
    expect(dialog.querySelector('h2')?.textContent?.trim()).toBe('Edición de producto PRD-0001');
  });

  it('exporta con los filtros aplicados (los de la URL), no con lo que se esté escribiendo', async () => {
    spyOn(HTMLAnchorElement.prototype, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:prueba');
    spyOn(URL, 'revokeObjectURL');
    await open('/bitacora?entidad=users&codigo=USR-0001');
    expectListRequest().flush(buildPage([systemLog]));

    const code = screen().querySelector('#code') as HTMLInputElement;
    code.value = 'PRD-9999';
    code.dispatchEvent(new Event('input'));
    const pdf = Array.from(screen().querySelectorAll<HTMLButtonElement>('.export-buttons button')).find(
      (button) => button.textContent?.trim() === 'Exportar a PDF',
    );
    pdf?.click();

    const request = httpTesting.expectOne((req) => req.url === `${auditLogsUrl}/export`);
    expect(request.request.params.get('format')).toBe('pdf');
    expect(request.request.params.get('entity')).toBe('users');
    expect(request.request.params.get('code')).toBe('USR-0001');
    request.flush(new Blob(['%PDF']));
  });

  it('avisa si la API falla', async () => {
    await open();
    expectListRequest().flush(null, { status: 500, statusText: 'Server Error' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar la bitácora.');
  });
});
