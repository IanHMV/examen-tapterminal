import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { buildPage } from '../../testing/pagination.fixtures';
import { SECTION_CATALOG, buildProfile } from '../../testing/profile.fixtures';
import { Profile, Section } from '../models/profile.model';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const baseUrl = `${environment.apiUrl}/profiles`;
  let service: ProfileService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProfileService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // Falla si quedó alguna petición sin revisar.
  afterEach(() => httpTesting.verify());

  it('list() pide la página indicada con GET', () => {
    service.list(3).subscribe();

    const request = httpTesting.expectOne((req) => req.url === baseUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('3');
    request.flush(buildPage([]));
  });

  it('get() busca por código y quita la envoltura "data"', () => {
    const profile = buildProfile();
    let result: Profile | undefined;

    service.get('PRF-0002').subscribe((response) => (result = response));
    httpTesting.expectOne(`${baseUrl}/PRF-0002`).flush({ data: profile });

    expect(result).toEqual(profile);
  });

  it('create() y update() envían nombre y claves de secciones', () => {
    const input = { name: 'Supervisor', sections: ['products', 'users'] };

    service.create(input).subscribe();
    const create = httpTesting.expectOne(baseUrl);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(input);
    create.flush({ data: buildProfile() }, { status: 201, statusText: 'Created' });

    service.update('PRF-0002', input).subscribe();
    const update = httpTesting.expectOne(`${baseUrl}/PRF-0002`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(input);
    update.flush({ data: buildProfile() });
  });

  it('delete() envía DELETE al código del perfil', () => {
    service.delete('PRF-0002').subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/PRF-0002`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('options() devuelve todos los perfiles (código y nombre) sin paginar', () => {
    const options = [{ code: 'PRF-0001', name: 'Administrador' }];
    let result: unknown;

    service.options().subscribe((response) => (result = response));
    httpTesting.expectOne(`${baseUrl}/options`).flush({ data: options });

    expect(result).toEqual(options);
  });

  it('sections() devuelve el catálogo de secciones', () => {
    let result: Section[] | undefined;

    service.sections().subscribe((response) => (result = response));
    httpTesting.expectOne(`${environment.apiUrl}/sections`).flush({ data: SECTION_CATALOG });

    expect(result).toEqual(SECTION_CATALOG);
  });
});
