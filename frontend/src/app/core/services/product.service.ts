import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResource } from '../models/api.model';
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

  create(input: ProductInput): Observable<Product> {
    return this.http
      .post<ApiResource<Product>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }
}
