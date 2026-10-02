import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildProduct } from '../../../testing/product.fixtures';
import { ProductDetailComponent } from './product-detail.component';

describe('ProductDetailComponent', () => {
  const productsUrl = `${environment.apiUrl}/products`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      // Router real: el código se lee de la URL (/productos/:code).
      providers: [
        provideRouter([{ path: 'productos/:code', component: ProductDetailComponent }]),
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

  it('pide el producto del código en la URL y muestra sus datos', async () => {
    await harness.navigateByUrl('/productos/PRD-0003', ProductDetailComponent);
    httpTesting.expectOne(`${productsUrl}/PRD-0003`).flush({ data: buildProduct() });

    const details = screen().querySelector('.details')?.textContent ?? '';

    expect(screen().querySelector('h2')?.textContent).toBe('Guantes de carga de piel');
    expect(details).toContain('PRD-0003');
    expect(details).toContain('Urrea');
    expect(details).toContain('$119.00');
    expect(details).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/); // DD/MM/YYYY HH:MM
    expect(screen().querySelector('.product-detail__actions a')?.getAttribute('href')).toBe('/productos/PRD-0003/editar');
  });

  it('avisa que el producto no existe cuando la API responde 404', async () => {
    await harness.navigateByUrl('/productos/PRD-9999', ProductDetailComponent);
    httpTesting
      .expectOne(`${productsUrl}/PRD-9999`)
      .flush({ message: 'Recurso no encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El producto no existe.');
  });

  it('muestra un error genérico si la API falla por otro motivo', async () => {
    await harness.navigateByUrl('/productos/PRD-0003', ProductDetailComponent);
    httpTesting
      .expectOne(`${productsUrl}/PRD-0003`)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No se pudo cargar el producto');
  });

  describe('eliminar', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/productos/PRD-0003', ProductDetailComponent);
      httpTesting.expectOne(`${productsUrl}/PRD-0003`).flush({ data: buildProduct() });
    });

    /** Pulsa "Eliminar" y confirma en el diálogo. */
    function deleteAndConfirm(): void {
      (screen().querySelector('.product-detail__actions .btn-outline-danger') as HTMLButtonElement).click();
      const dialog = screen().querySelector('dialog') as HTMLDialogElement;
      expect(dialog.open).toBeTrue();
      (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();
    }

    it('Elimina tras confirmar y avisa que se eliminó', () => {
      deleteAndConfirm();

      const request = httpTesting.expectOne(`${productsUrl}/PRD-0003`);
      expect(request.request.method).toBe('DELETE');
      request.flush(null, { status: 204, statusText: 'No Content' });

      expect(screen().querySelector('[role="status"]')?.textContent).toContain('Se eliminó el producto PRD-0003.');
      expect(screen().querySelector('.details')).toBeNull();
    });

    it('si falla, muestra el error y conserva los datos en pantalla', () => {
      deleteAndConfirm();

      httpTesting
        .expectOne(`${productsUrl}/PRD-0003`)
        .flush(null, { status: 500, statusText: 'Internal Server Error' });

      expect(screen().querySelector('[role="alert"]')?.textContent).toContain('No se pudo eliminar el producto');
      expect(screen().querySelector('.details')).not.toBeNull();
    });
  });
});
