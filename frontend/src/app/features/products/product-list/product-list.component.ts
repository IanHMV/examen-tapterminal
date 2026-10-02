import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Paginated } from '../../../core/models/api.model';
import { Product } from '../../../core/models/product.model';
import { ProductService } from '../../../core/services/product.service';

type ListState = 'loading' | 'ready' | 'error';

/**
 * Tabla de productos paginada. La página viaja en la URL (?pagina=2),
 * así funcionan los botones Atrás/Adelante del navegador y los enlaces directos.
 */
@Component({
  selector: 'app-product-list',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
  private readonly productService = inject(ProductService);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<ListState>('loading');
  protected readonly result = signal<Paginated<Product> | null>(null);

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(
        map((params) => Number(params.get('pagina')) || 1),
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
}
