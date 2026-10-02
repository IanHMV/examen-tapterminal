import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';

type DetailState = 'loading' | 'ready' | 'not-found' | 'error';

/**
 * Detalle de un producto. El código viene en la URL (/productos/PRD-0001).
 */
@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly productService = inject(ProductService);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<DetailState>('loading');
  protected readonly product = signal<Product | null>(null);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('code') ?? ''),
        tap(() => this.state.set('loading')),
        switchMap((code) =>
          this.productService.get(code).pipe(
            tap((product) => {
              this.product.set(product);
              this.state.set('ready');
            }),
            catchError((error: HttpErrorResponse) => {
              this.state.set(error.status === 404 ? 'not-found' : 'error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
