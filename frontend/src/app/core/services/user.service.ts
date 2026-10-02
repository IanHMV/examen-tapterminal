import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResource, Paginated } from '../models/api.model';
import { User, UserDetail, UserInput } from '../models/user.model';

/**
 * Operaciones de usuarios en la API.
 *
 * El alta y el cambio de foto se envían como multipart/form-data (llevan un
 * archivo); la edición de datos, como JSON.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  list(page: number): Observable<Paginated<User>> {
    const params = new HttpParams().set('page', page);

    return this.http.get<Paginated<User>>(this.baseUrl, { params });
  }

  get(code: string): Observable<UserDetail> {
    return this.http
      .get<ApiResource<UserDetail>>(this.itemUrl(code))
      .pipe(map((response) => response.data));
  }

  create(input: UserInput, photo: File): Observable<UserDetail> {
    const body = new FormData();
    body.append('name', input.name);
    body.append('email', input.email);

    if (input.phone) {
      body.append('phone', input.phone);
    }

    // "profile_codes[]": así PHP recibe una lista.
    input.profile_codes.forEach((code) => body.append('profile_codes[]', code));
    body.append('photo', photo);

    return this.http
      .post<ApiResource<UserDetail>>(this.baseUrl, body)
      .pipe(map((response) => response.data));
  }

  update(code: string, input: UserInput): Observable<UserDetail> {
    return this.http
      .put<ApiResource<UserDetail>>(this.itemUrl(code), input)
      .pipe(map((response) => response.data));
  }

  updatePhoto(code: string, photo: File): Observable<UserDetail> {
    const body = new FormData();
    body.append('photo', photo);

    return this.http
      .post<ApiResource<UserDetail>>(`${this.itemUrl(code)}/photo`, body)
      .pipe(map((response) => response.data));
  }

  /** La API responde 204 (sin contenido). */
  delete(code: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(code));
  }

  /** URL de un usuario. encodeURIComponent evita que el código altere la ruta. */
  private itemUrl(code: string): string {
    return `${this.baseUrl}/${encodeURIComponent(code)}`;
  }
}
