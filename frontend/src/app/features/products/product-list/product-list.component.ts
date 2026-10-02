import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, EMPTY, catchError, combineLatest, finalize, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Paginated } from '../../../core/models/api.model';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ExportButtonsComponent } from '../../../shared/components/export-buttons/export-buttons.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

type ListState = 'loading' | 'ready' | 'error';

/**
 * Tabla de productos paginada. La página viaja en la URL (?pagina=2),
 * así funcionan los botones Atrás/Adelante del navegador y los enlaces directos.
 */
@Component({
  selector: 'app-product-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, ConfirmDialogComponent, PaginationComponent, ExportButtonsComponent],
  templateUrl: './product-list.component.html',
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Emite para volver a pedir la página actual (por ejemplo, después de eliminar). */
  private readonly refresh = new BehaviorSubject<void>(undefined);
  private readonly deleteDialog = viewChild.required(ConfirmDialogComponent);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<ListState>('loading');
  protected readonly result = signal<Paginated<Product> | null>(null);

  /** Producto que el usuario eligió eliminar (falta confirmar). */
  protected readonly pendingDelete = signal<Product | null>(null);
  protected readonly deleting = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    combineLatest([this.route.queryParamMap, this.refresh])
      .pipe(
        map(([params]) => Number(params.get('pagina')) || 1),
        tap(() => this.state.set('loading')),
        // switchMap cancela la petición anterior si el usuario cambia de página rápido.
        switchMap((page) =>
          this.productService.list(page).pipe(
            tap((result) => {
              this.result.set(result);
              this.state.set('ready');
            }),
            catchError(() => {
              this.state.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected askDelete(product: Product): void {
    this.pendingDelete.set(product);
    this.deleteDialog().open();
  }

  /** Se ejecuta solo si el usuario confirmó en el diálogo. */
  protected deletePending(): void {
    const product = this.pendingDelete();
    const page = this.result();

    if (!product || !page) {
      return;
    }

    this.deleting.set(true);
    this.notice.set(null);
    this.deleteError.set(null);

    this.productService
      .delete(product.code)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => this.afterDelete(`Se eliminó el producto ${product.code}.`, page),
        error: (error: HttpErrorResponse) => {
          // 404: alguien más ya lo había borrado; el resultado es el mismo.
          if (error.status === 404) {
            this.afterDelete(`El producto ${product.code} ya no existía.`, page);
            return;
          }

          this.deleteError.set('No se pudo eliminar el producto. Intenta de nuevo.');
        },
      });
  }

  private afterDelete(message: string, page: Paginated<Product>): void {
    this.notice.set(message);
    this.pendingDelete.set(null);

    // Si era el último producto de la página, se regresa a la anterior.
    if (page.data.length === 1 && page.meta.current_page > 1) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { pagina: page.meta.current_page - 1 },
      });
      return;
    }

    this.refresh.next();
  }
}
