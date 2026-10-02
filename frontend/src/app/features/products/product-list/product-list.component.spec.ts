import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildPage, buildProduct } from '../../../testing/product.fixtures';
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

  it('muestra las columnas del examen: código, nombre, precio y fecha', async () => {
    await harness.navigateByUrl('/productos', ProductListComponent);
    httpTesting.expectOne((req) => req.url === productsUrl).flush(buildPage([buildProduct()]));

    const cells = Array.from(screen().querySelectorAll('tbody td')).map((td) => td.textContent?.trim());

    expect(cells[0]).toBe('PRD-0003');
    expect(cells[1]).toBe('Guantes de carga de piel');
    expect(cells[2]).toBe('$119.00');
    expect(cells[3]).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/); // DD/MM/YYYY HH:MM
    expect(screen().querySelector('tbody a')?.getAttribute('href')).toBe('/productos/PRD-0003');
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

    const pagination = screen().querySelector('.pagination') as HTMLElement;
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
});
