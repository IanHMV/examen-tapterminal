import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;
  let httpTesting: HttpTestingController;
  /** Nombre con el que el navegador guardaría cada archivo. */
  let savedAs: string[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExportService);
    httpTesting = TestBed.inject(HttpTestingController);

    // Sin descargas reales: se anota el nombre del archivo en lugar de guardarlo.
    savedAs = [];
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      savedAs.push(this.download);
    });
    spyOn(URL, 'createObjectURL').and.returnValue('blob:prueba');
    spyOn(URL, 'revokeObjectURL');
  });

  afterEach(() => httpTesting.verify());

  it('pide el archivo con el formato, la zona horaria del navegador y los filtros', () => {
    service.download('audit-logs', 'pdf', { entity: 'products' }).subscribe();

    const request = httpTesting.expectOne((req) => req.url === `${environment.apiUrl}/audit-logs/export`);
    expect(request.request.responseType).toBe('blob');
    expect(request.request.params.get('format')).toBe('pdf');
    expect(request.request.params.get('entity')).toBe('products');
    expect(request.request.params.get('timezone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    request.flush(new Blob(['%PDF']));
  });

  it('guarda el archivo con el nombre que propone la API y libera el enlace temporal', () => {
    service.download('products', 'xlsx').subscribe();

    httpTesting
      .expectOne((req) => req.url === `${environment.apiUrl}/products/export`)
      .flush(new Blob(['xlsx']), {
        headers: { 'Content-Disposition': 'attachment; filename=productos-2026-10-02-1534.xlsx' },
      });

    expect(savedAs).toEqual(['productos-2026-10-02-1534.xlsx']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prueba');
  });

  it('si la API no envía el nombre, usa el del recurso', () => {
    service.download('users', 'pdf').subscribe();

    httpTesting.expectOne((req) => req.url === `${environment.apiUrl}/users/export`).flush(new Blob(['%PDF']));

    expect(savedAs).toEqual(['users.pdf']);
  });
});
