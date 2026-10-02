import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { environment } from '../../../../environments/environment';
import { buildProduct } from '../../../testing/product.fixtures';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  const productsUrl = `${environment.apiUrl}/products`;
  let harness: RouterTestingHarness;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      // Router real con las dos rutas que usan este formulario.
      providers: [
        provideRouter([
          { path: 'productos/nuevo', component: ProductFormComponent },
          { path: 'productos/:code/editar', component: ProductFormComponent },
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

  /** Escribe en un campo como lo haría el usuario. */
  function type(id: string, value: string): void {
    const input = screen().querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function valueOf(id: string): string {
    return (screen().querySelector(`#${id}`) as HTMLInputElement).value;
  }

  function submit(): void {
    screen().querySelector('form')?.dispatchEvent(new Event('submit'));
  }

  function errorOf(id: string): string | undefined {
    return screen().querySelector(`#${id}-error`)?.textContent?.trim();
  }

  function submitButton(): HTMLButtonElement {
    return screen().querySelector('button[type="submit"]') as HTMLButtonElement;
  }

  describe('alta (/productos/nuevo)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/productos/nuevo', ProductFormComponent);
    });

    function fillValidForm(): void {
      type('name', 'Extintor PQS 6 kg');
      type('brand', 'Badger');
      type('price', '899');
    }

    it('no llama a la API y marca los campos obligatorios si el formulario está vacío', () => {
      submit();

      expect(errorOf('name')).toBe('El nombre es obligatorio.');
      expect(errorOf('brand')).toBe('La marca es obligatoria.');
      expect(errorOf('price')).toBe('El precio es obligatorio.');
      httpTesting.expectNone(productsUrl);
    });

    it('rechaza un nombre de más de 100 caracteres y una marca con solo espacios', () => {
      type('name', 'a'.repeat(101));
      type('brand', '   ');
      submit();

      expect(errorOf('name')).toBe('Máximo 100 caracteres.');
      expect(errorOf('brand')).toBe('La marca es obligatoria.');
    });

    it('valida el precio: mínimo 0.01, máximo 999.99 y 2 decimales', () => {
      type('price', '0');
      submit();
      expect(errorOf('price')).toBe('El precio mínimo es 0.01.');

      type('price', '1000');
      expect(errorOf('price')).toBe('El precio máximo es 999.99.');

      type('price', '12.345');
      expect(errorOf('price')).toBe('Máximo 2 decimales.');
    });

    it('envía el producto, bloquea el botón mientras guarda y enlaza al detalle', () => {
      fillValidForm();
      submit();

      expect(submitButton().disabled).toBeTrue();
      expect(submitButton().textContent?.trim()).toBe('Guardando…');

      const request = httpTesting.expectOne(productsUrl);
      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual({ name: 'Extintor PQS 6 kg', brand: 'Badger', price: 899 });
      request.flush(
        { data: buildProduct({ code: 'PRD-0012', name: 'Extintor PQS 6 kg', brand: 'Badger', price: '899.00' }) },
        { status: 201, statusText: 'Created' },
      );

      const success = screen().querySelector('.alert-success') as HTMLElement;
      expect(success.textContent).toContain('Se creó el producto');
      expect(success.querySelector('a')?.getAttribute('href')).toBe('/productos/PRD-0012');
      expect(valueOf('name')).toBe('');
      expect(submitButton().disabled).toBeFalse();
    });

    it('muestra los errores 422 de la API debajo del campo correspondiente', () => {
      fillValidForm();
      submit();

      httpTesting.expectOne(productsUrl).flush(
        {
          message: 'El campo precio no debe ser mayor que 999.99.',
          errors: { price: ['El campo precio no debe ser mayor que 999.99.'] },
        },
        { status: 422, statusText: 'Unprocessable Content' },
      );

      expect(errorOf('price')).toBe('El campo precio no debe ser mayor que 999.99.');
      expect(screen().querySelector('[role="alert"]')?.textContent).toContain('Revisa los campos marcados.');
    });
  });

  describe('edición (/productos/:code/editar)', () => {
    beforeEach(async () => {
      await harness.navigateByUrl('/productos/PRD-0003/editar', ProductFormComponent);
    });

    it('carga el producto y llena el formulario con sus datos', () => {
      expect(screen().textContent).toContain('Cargando producto…');

      httpTesting.expectOne(`${productsUrl}/PRD-0003`).flush({ data: buildProduct() });

      expect(screen().querySelector('h2')?.textContent).toBe('Editar producto');
      expect(valueOf('name')).toBe('Guantes de carga de piel');
      expect(valueOf('brand')).toBe('Urrea');
      expect(valueOf('price')).toBe('119');
      expect(submitButton().textContent?.trim()).toBe('Guardar cambios');
    });

    it('envía los cambios con PUT y conserva los datos en pantalla', () => {
      httpTesting.expectOne(`${productsUrl}/PRD-0003`).flush({ data: buildProduct() });

      type('price', '129.5');
      submit();

      const request = httpTesting.expectOne(`${productsUrl}/PRD-0003`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.body).toEqual({ name: 'Guantes de carga de piel', brand: 'Urrea', price: 129.5 });
      request.flush({ data: buildProduct({ price: '129.50' }) });

      const success = screen().querySelector('.alert-success') as HTMLElement;
      expect(success.textContent).toContain('Se guardaron los cambios de');
      expect(success.querySelector('a')?.getAttribute('href')).toBe('/productos/PRD-0003');
      expect(valueOf('price')).toBe('129.5');
    });

    it('avisa que el producto no existe y no muestra el formulario', () => {
      httpTesting
        .expectOne(`${productsUrl}/PRD-0003`)
        .flush({ message: 'Recurso no encontrado.' }, { status: 404, statusText: 'Not Found' });

      expect(screen().querySelector('[role="alert"]')?.textContent).toContain('El producto no existe.');
      expect(screen().querySelector('form')).toBeNull();
    });
  });
});
