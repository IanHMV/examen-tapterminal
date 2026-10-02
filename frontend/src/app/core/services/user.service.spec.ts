import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { buildPage } from '../../testing/pagination.fixtures';
import { buildPhoto, buildUser } from '../../testing/user.fixtures';
import { UserDetail } from '../models/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  const baseUrl = `${environment.apiUrl}/users`;
  const input = {
    name: 'Ana López',
    email: 'ana.lopez@tapterminal.com',
    phone: '+52 314 123 4567',
    profile_codes: ['PRF-0001', 'PRF-0002'],
  };
  let service: UserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  // Falla si quedó alguna petición sin revisar.
  afterEach(() => httpTesting.verify());

  it('list() pide la página indicada y get() quita la envoltura "data"', () => {
    let result: UserDetail | undefined;

    service.list(2).subscribe();
    const list = httpTesting.expectOne((req) => req.url === baseUrl);
    expect(list.request.params.get('page')).toBe('2');
    list.flush(buildPage([]));

    service.get('USR-0002').subscribe((user) => (result = user));
    httpTesting.expectOne(`${baseUrl}/USR-0002`).flush({ data: buildUser() });

    expect(result?.profiles.length).toBe(1);
  });

  it('create() envía multipart/form-data con los perfiles como lista y la foto', () => {
    const photo = buildPhoto();

    service.create(input, photo).subscribe();

    const request = httpTesting.expectOne(baseUrl);
    const body = request.request.body as FormData;
    expect(request.request.method).toBe('POST');
    expect(body instanceof FormData).toBeTrue();
    expect(body.get('name')).toBe('Ana López');
    expect(body.get('email')).toBe('ana.lopez@tapterminal.com');
    expect(body.get('phone')).toBe('+52 314 123 4567');
    expect(body.getAll('profile_codes[]')).toEqual(['PRF-0001', 'PRF-0002']);
    expect(body.get('photo')).toBe(photo);
    request.flush({ data: buildUser() }, { status: 201, statusText: 'Created' });
  });

  it('create() no envía el teléfono si está vacío', () => {
    service.create({ ...input, phone: null }, buildPhoto()).subscribe();

    const request = httpTesting.expectOne(baseUrl);
    expect((request.request.body as FormData).has('phone')).toBeFalse();
    request.flush({ data: buildUser() }, { status: 201, statusText: 'Created' });
  });

  it('update() envía JSON con PUT y updatePhoto() la foto con POST', () => {
    const photo = buildPhoto();

    service.update('USR-0002', input).subscribe();
    const update = httpTesting.expectOne(`${baseUrl}/USR-0002`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual(input);
    update.flush({ data: buildUser() });

    service.updatePhoto('USR-0002', photo).subscribe();
    const upload = httpTesting.expectOne(`${baseUrl}/USR-0002/photo`);
    expect(upload.request.method).toBe('POST');
    expect((upload.request.body as FormData).get('photo')).toBe(photo);
    upload.flush({ data: buildUser() });
  });

  it('delete() envía DELETE al código del usuario', () => {
    service.delete('USR-0002').subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/USR-0002`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
