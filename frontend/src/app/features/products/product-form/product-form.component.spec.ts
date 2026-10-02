import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { buildProduct } from '../../../testing/product.fixtures';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  const productsUrl = `${environment.apiUrl}/products`;
  let fixture: ComponentFixture<ProductFormComponent>;
  let element: HTMLElement;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      // Router (enlace al detalle en el mensaje de éxito) y HttpClient simulado (sin red).
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductFormComponent);
    element = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  /** Escribe en un campo como lo haría el usuario. */
  function type(id: string, value: string): void {
    const input = element.querySelector(`#${id}`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submit(): void {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function errorOf(id: string): string | undefined {
    return element.querySelector(`#${id}-error`)?.textContent?.trim();
  }

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
    fixture.detectChanges();
    expect(errorOf('price')).toBe('El precio máximo es 999.99.');

    type('price', '12.345');
    fixture.detectChanges();
    expect(errorOf('price')).toBe('Máximo 2 decimales.');
  });

  it('envía el producto, bloquea el botón mientras guarda y enlaza al detalle', () => {
    fillValidForm();
    submit();

    const button = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
    expect(button.textContent?.trim()).toBe('Guardando…');

    const request = httpTesting.expectOne(productsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Extintor PQS 6 kg', brand: 'Badger', price: 899 });
    request.flush(
      { data: buildProduct({ code: 'PRD-0012', name: 'Extintor PQS 6 kg', brand: 'Badger', price: '899.00' }) },
      { status: 201, statusText: 'Created' },
    );
    fixture.detectChanges();

    const success = element.querySelector('.alert--success') as HTMLElement;
    expect(success.textContent).toContain('PRD-0012');
    expect(success.querySelector('a')?.getAttribute('href')).toBe('/productos/PRD-0012');
    expect((element.querySelector('#name') as HTMLInputElement).value).toBe('');
    expect(button.disabled).toBeFalse();
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
    fixture.detectChanges();

    expect(errorOf('price')).toBe('El campo precio no debe ser mayor que 999.99.');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Revisa los campos marcados.');
  });
});
