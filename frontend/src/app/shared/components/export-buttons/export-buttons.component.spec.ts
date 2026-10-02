import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { ExportButtonsComponent } from './export-buttons.component';

/** Componente anfitrión: usa los botones como lo hace la bitácora. */
@Component({
  imports: [ExportButtonsComponent],
  template: `<app-export-buttons resource="audit-logs" [filters]="filters()" />`,
})
class HostComponent {
  readonly filters = signal<Record<string, string>>({ code: 'PRD-0001' });
}

describe('ExportButtonsComponent', () => {
  const exportUrl = `${environment.apiUrl}/audit-logs/export`;
  let fixture: ComponentFixture<HostComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    spyOn(HTMLAnchorElement.prototype, 'click');
    spyOn(URL, 'createObjectURL').and.returnValue('blob:prueba');
    spyOn(URL, 'revokeObjectURL');
  });

  afterEach(() => httpTesting.verify());

  function buttons(): HTMLButtonElement[] {
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
  }

  function clickAndExpectRequest(label: string): TestRequest {
    buttons()
      .find((button) => button.textContent?.trim() === label)
      ?.click();
    return httpTesting.expectOne((req) => req.url === exportUrl);
  }

  it('pide el Excel con los filtros del listado y desactiva los botones mientras se genera', () => {
    const request = clickAndExpectRequest('Exportar a Excel');

    expect(request.request.params.get('format')).toBe('xlsx');
    expect(request.request.params.get('code')).toBe('PRD-0001');
    expect(buttons().map((button) => [button.textContent?.trim(), button.disabled])).toEqual([
      ['Generando…', true],
      ['Exportar a PDF', true],
    ]);

    request.flush(new Blob(['xlsx']));

    expect(buttons().every((button) => !button.disabled)).toBeTrue();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });

  it('pide el PDF', () => {
    const request = clickAndExpectRequest('Exportar a PDF');

    expect(request.request.params.get('format')).toBe('pdf');
    request.flush(new Blob(['%PDF']));
  });

  it('avisa si no se pudo generar el archivo', () => {
    clickAndExpectRequest('Exportar a PDF').flush(new Blob(), { status: 500, statusText: 'Server Error' });
    buttons();

    const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('No se pudo generar el archivo.');
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});
