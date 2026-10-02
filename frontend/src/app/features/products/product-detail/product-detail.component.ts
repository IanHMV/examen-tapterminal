import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type DetailState = 'loading' | 'ready' | 'not-found' | 'error' | 'deleted';

/**
 * Detalle de un producto. El código viene en la URL (/productos/PRD-0001).
 */
@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, ConfirmDialogComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent {
  private readonly productService = inject(ProductService);
  private readonly deleteDialog = viewChild.required(ConfirmDialogComponent);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<DetailState>('loading');
  protected readonly product = signal<Product | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

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

  protected askDelete(): void {
    this.deleteDialog().open();
  }

  /** Se ejecuta solo si el usuario confirmó en el diálogo. */
  protected deleteProduct(): void {
    const product = this.product();

    if (!product) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.productService
      .delete(product.code)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => this.state.set('deleted'),
        error: (error: HttpErrorResponse) => {
          // 404: alguien más ya lo había borrado; el resultado es el mismo.
          if (error.status === 404) {
            this.state.set('deleted');
            return;
          }

          this.deleteError.set('No se pudo eliminar el producto. Intenta de nuevo.');
        },
      });
  }
}
