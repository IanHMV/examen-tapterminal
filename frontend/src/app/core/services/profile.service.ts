import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResource, Paginated } from '../models/api.model';
import { Profile, ProfileInput, ProfileOption, Section } from '../models/profile.model';

/**
 * Operaciones de perfiles y catálogo de secciones en la API.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/profiles`;

  list(page: number): Observable<Paginated<Profile>> {
    const params = new HttpParams().set('page', page);

    return this.http.get<Paginated<Profile>>(this.baseUrl, { params });
  }

  get(code: string): Observable<Profile> {
    return this.http
      .get<ApiResource<Profile>>(this.itemUrl(code))
      .pipe(map((response) => response.data));
  }

  create(input: ProfileInput): Observable<Profile> {
    return this.http
      .post<ApiResource<Profile>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  update(code: string, input: ProfileInput): Observable<Profile> {
    return this.http
      .put<ApiResource<Profile>>(this.itemUrl(code), input)
      .pipe(map((response) => response.data));
  }

  /** La API responde 204 (sin contenido). */
  delete(code: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(code));
  }

  /** Todos los perfiles (código y nombre), para elegirlos en el formulario de usuarios. */
  options(): Observable<ProfileOption[]> {
    return this.http
      .get<ApiResource<ProfileOption[]>>(`${this.baseUrl}/options`)
      .pipe(map((response) => response.data));
  }

  /** Catálogo de secciones que se pueden asignar a un perfil. */
  sections(): Observable<Section[]> {
    return this.http
      .get<ApiResource<Section[]>>(`${environment.apiUrl}/sections`)
      .pipe(map((response) => response.data));
  }

  /** URL de un perfil. encodeURIComponent evita que el código altere la ruta. */
  private itemUrl(code: string): string {
    return `${this.baseUrl}/${encodeURIComponent(code)}`;
  }
}
