import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildPage } from '../../../testing/pagination.fixtures';
import { buildProduct } from '../../../testing/product.fixtures';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  const productsUrl = `${environment.apiUrl}/products`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      // Router real con la ruta del listado: así se prueba la lectura de ?pagina= desde la URL.
      providers: [
        provideRouter([{ path: 'productos', component: ProductListComponent }]),
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

  it('muestra las columnas del examen: código, nombre, marca, precio y fecha', async () => {
    await harness.navigateByUrl('/productos', ProductListComponent);
    httpTesting.expectOne((req) => req.url === productsUrl).flush(buildPage([buildProduct()]));

    const cells = Array.from(screen().querySelectorAll('tbody td')).map((td) => td.textContent?.trim());

    expect(cells[0]).toBe('PRD-0003');
    expect(cells[1]).toBe('Guantes de carga de piel');
    expect(cells[2]).toBe(buildProduct().brand);
    expect(cells[3]).toBe('$119.00');
    expect(cells[4]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // DD/MM/YYYY HH:MM
    const actions = Array.from(screen().querySelectorAll('tbody a')).map((a) => a.getAttribute('href'));
    expect(actions).toEqual(['/productos/PRD-0003', '/productos/PRD-0003/editar']);
  });

  it('ofrece exportar el listado a Excel y PDF', async () => {
    await harness.navigateByUrl('/productos', ProductListComponent);
    httpTesting.expectOne((req) => req.url === productsUrl).flush(buildPage([buildProduct()]));

    const labels = Array.from(screen().querySelectorAll('.page-header .export-buttons button')).map((button) =>
      button.textContent?.trim(),
    );
    expect(labels).toEqual(['Exportar a Excel', 'Exportar a PDF']);
  });

  it('lee la página de la URL (?pagina=2) y enlaza a la anterior y la siguiente', async () => {
    await harness.navigateByUrl('/productos?pagina=2', ProductListComponent);

    const request = httpTesting.expectOne((req) => req.url === productsUrl);
    expect(request.request.params.get('page')).toBe('2');
    request.flush(
      buildPage(
        [buildProduct()],
        { current_page: 2, last_page: 3, from: 11, to: 11, total: 21 },
        { prev: `${productsUrl}?page=1`, next: `${productsUrl}?page=3` },
      ),
    );

    const pagination = screen().querySelector('nav[aria-label="Paginación"]') as HTMLElement;
    const links = Array.from(pagination.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    expect(pagination.textContent).toContain('11–11 de 21 productos');
    expect(pagination.textContent).toContain('Página 2 de 3');
    expect(links).toEqual(['/productos?pagina=1', '/productos?pagina=3']);
  });

  it('usa la página 1 si ?pagina= no es un número', async () => {
    await harness.navigateByUrl('/productos?pagina=abc', ProductListComponent);

    const request = httpTesting.expectOne((req) => req.url === productsUrl);
    expect(request.request.params.get('page')).toBe('1');
    request.flush(buildPage([]));

    expect(screen().querySelector('tbody')?.textContent).toContain('No hay productos en esta página.');
  });

  it('muestra un aviso si la API falla', async () => {
    await harness.navigateByUrl('/productos', ProductListComponent);
    httpTesting
      .expectOne((req) => req.url === productsUrl)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar el listado');
  });

  describe('eliminar', () => {
    const second = buildProduct({ id: '6abf11b87c2123d8c1054973', code: 'PRD-0004', name: 'Botas dieléctricas' });

    async function openListWith(url: string, page: ReturnType<typeof buildPage>): Promise<void> {
      await harness.navigateByUrl(url, ProductListComponent);
      httpTesting.expectOne((req) => req.url === productsUrl).flush(page);
    }

    /** Pulsa "Eliminar" en la primera fila y devuelve el diálogo de confirmación. */
    function clickDeleteOnFirstRow(): HTMLDialogElement {
      (screen().querySelector('.btn-outline-danger') as HTMLButtonElement).click();
      return screen().querySelector('dialog') as HTMLDialogElement;
    }

    function confirmIn(dialog: HTMLDialogElement): void {
      (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();
    }

    it('pide confirmación y, al confirmar, elimina y recarga la página', async () => {
      await openListWith('/productos', buildPage([buildProduct(), second]));

      const dialog = clickDeleteOnFirstRow();
      expect(dialog.open).toBeTrue();
      expect(dialog.textContent).toContain('PRD-0003');

      confirmIn(dialog);

      const deleteRequest = httpTesting.expectOne(`${productsUrl}/PRD-0003`);
      expect(deleteRequest.request.method).toBe('DELETE');
      deleteRequest.flush(null, { status: 204, statusText: 'No Content' });

      const reload = httpTesting.expectOne((req) => req.url === productsUrl);
      expect(reload.request.params.get('page')).toBe('1');
      reload.flush(buildPage([second]));

      expect(screen().querySelector('[role="status"]')?.textContent).toContain('Se eliminó el producto PRD-0003.');
      expect(screen().querySelectorAll('tbody tr').length).toBe(1);
    });

    it('Cancelar cierra el diálogo y no elimina nada', async () => {
      await openListWith('/productos', buildPage([buildProduct()]));

      const dialog = clickDeleteOnFirstRow();
      (dialog.querySelector('.btn-outline-secondary') as HTMLButtonElement).click();

      expect(dialog.open).toBeFalse();
      httpTesting.expectNone((req) => req.method === 'DELETE');
    });

    it('si elimina el último producto de la página, regresa a la anterior', async () => {
      await openListWith(
        '/productos?pagina=2',
        buildPage([buildProduct()], { current_page: 2, last_page: 2, from: 11, to: 11, total: 11 }),
      );

      confirmIn(clickDeleteOnFirstRow());
      httpTesting.expectOne(`${productsUrl}/PRD-0003`).flush(null, { status: 204, statusText: 'No Content' });
      await harness.fixture.whenStable();

      const reload = httpTesting.expectOne((req) => req.url === productsUrl);
      expect(reload.request.params.get('page')).toBe('1');
      reload.flush(buildPage([second]));

      expect(TestBed.inject(Router).url).toBe('/productos?pagina=1');
    });

    it('muestra un error si la API no pudo eliminar', async () => {
      await openListWith('/productos', buildPage([buildProduct()]));

      confirmIn(clickDeleteOnFirstRow());
      httpTesting
        .expectOne(`${productsUrl}/PRD-0003`)
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No se pudo eliminar el producto');
      expect(screen().querySelectorAll('tbody tr').length).toBe(1);
    });
  });
});
