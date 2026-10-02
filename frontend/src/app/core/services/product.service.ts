import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResource, Paginated } from '../models/api.model';
import { Product, ProductInput } from '../models/product.model';

/**
 * Operaciones del catálogo de productos en la API.
 */
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products`;

  list(page: number): Observable<Paginated<Product>> {
    const params = new HttpParams().set('page', page);

    return this.http.get<Paginated<Product>>(this.baseUrl, { params });
  }

  get(code: string): Observable<Product> {
    return this.http
      .get<ApiResource<Product>>(this.itemUrl(code))
      .pipe(map((response) => response.data));
  }

  create(input: ProductInput): Observable<Product> {
    return this.http
      .post<ApiResource<Product>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  update(code: string, input: ProductInput): Observable<Product> {
    return this.http
      .put<ApiResource<Product>>(this.itemUrl(code), input)
      .pipe(map((response) => response.data));
  }

  /** La API responde 204 (sin contenido). */
  delete(code: string): Observable<void> {
    return this.http.delete<void>(this.itemUrl(code));
  }

  /** URL de un producto. encodeURIComponent evita que el código altere la ruta. */
  private itemUrl(code: string): string {
    return `${this.baseUrl}/${encodeURIComponent(code)}`;
  }
}
