import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { buildAuditLog } from '../../testing/audit-log.fixtures';
import { buildPage } from '../../testing/pagination.fixtures';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  const auditLogsUrl = `${environment.apiUrl}/audit-logs`;
  let service: AuditLogService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditLogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('list() pide la página con los filtros', () => {
    const page = buildPage([buildAuditLog()]);
    let received = 0;

    service.list(2, { entity: 'products', code: 'PRD-0001' }).subscribe((result) => (received = result.data.length));

    const request = httpTesting.expectOne((req) => req.url === auditLogsUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('entity')).toBe('products');
    expect(request.request.params.get('code')).toBe('PRD-0001');
    request.flush(page);

    expect(received).toBe(1);
  });

  it('list() no envía los filtros vacíos', () => {
    service.list(1, { entity: null, code: null }).subscribe();

    const request = httpTesting.expectOne((req) => req.url === auditLogsUrl);
    expect(request.request.params.keys()).toEqual(['page']);
    request.flush(buildPage([]));
  });
});
