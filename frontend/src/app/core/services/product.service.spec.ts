import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { buildPage, buildProduct } from '../../testing/product.fixtures';
import { Paginated } from '../models/api.model';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  const baseUrl = `${environment.apiUrl}/products`;
  let service: ProductService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // Falla si quedó alguna petición sin revisar.
  afterEach(() => httpTesting.verify());

  it('list() pide la página indicada con GET', () => {
    const page = buildPage([buildProduct()]);
    let result: Paginated<Product> | undefined;

    service.list(2).subscribe((response) => (result = response));

    const request = httpTesting.expectOne((req) => req.url === baseUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    request.flush(page);

    expect(result).toEqual(page);
  });

  it('get() busca por código y quita la envoltura "data"', () => {
    const product = buildProduct();
    let result: Product | undefined;

    service.get('PRD-0003').subscribe((response) => (result = response));
    httpTesting.expectOne(`${baseUrl}/PRD-0003`).flush({ data: product });

    expect(result).toEqual(product);
  });

  it('get() codifica el código para que no altere la URL', () => {
    service.get('a/b?c').subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/a%2Fb%3Fc`);
    expect(request.request.url).toBe(`${baseUrl}/a%2Fb%3Fc`);
    request.flush({ data: buildProduct() });
  });
  //Crear
  it('create() envía los datos con POST y devuelve el producto creado', () => {
    const product = buildProduct();
    const input = { name: product.name, brand: product.brand, price: 119 };
    let result: Product | undefined;

    service.create(input).subscribe((response) => (result = response));

    const request = httpTesting.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ data: product }, { status: 201, statusText: 'Created' });

    expect(result).toEqual(product);
  });
  //Actualizar
  it('update() envía los cambios con PUT al código del producto', () => {
    const product = buildProduct({ price: '129.50' });
    const input = { name: product.name, brand: product.brand, price: 129.5 };
    let result: Product | undefined;

    service.update('PRD-0003', input).subscribe((response) => (result = response));

    const request = httpTesting.expectOne(`${baseUrl}/PRD-0003`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(input);
    request.flush({ data: product });

    expect(result).toEqual(product);
  });
  //Borrar
  it('delete() envía DELETE al código del producto', () => {
    let completed = false;

    service.delete('PRD-0003').subscribe({ complete: () => (completed = true) });

    const request = httpTesting.expectOne(`${baseUrl}/PRD-0003`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBeTrue();
  });
});
