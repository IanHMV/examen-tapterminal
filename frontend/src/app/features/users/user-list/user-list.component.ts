import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, EMPTY, catchError, combineLatest, finalize, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Paginated } from '../../../core/models/api.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

type ListState = 'loading' | 'ready' | 'error';

/**
 * Tabla de usuarios paginada (?pagina= en la URL).
 */
@Component({
  selector: 'app-user-list',
  imports: [RouterLink, DatePipe, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './user-list.component.html',
})
export class UserListComponent {
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Emite para volver a pedir la página actual (por ejemplo, después de eliminar). */
  private readonly refresh = new BehaviorSubject<void>(undefined);
  private readonly deleteDialog = viewChild.required(ConfirmDialogComponent);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  private readonly auth = inject(AuthService);
  protected readonly currentUserCode = computed(() => this.auth.currentUser()?.code);
  protected readonly state = signal<ListState>('loading');
  protected readonly result = signal<Paginated<User> | null>(null);

  /** Usuario que se eligió eliminar (falta confirmar). */
  protected readonly pendingDelete = signal<User | null>(null);
  protected readonly deleting = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    combineLatest([this.route.queryParamMap, this.refresh])
      .pipe(
        map(([params]) => Number(params.get('pagina')) || 1),
        tap(() => this.state.set('loading')),
        switchMap((page) =>
          this.userService.list(page).pipe(
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

  protected askDelete(user: User): void {
    this.pendingDelete.set(user);
    this.deleteDialog().open();
  }

  /** Se ejecuta solo si el usuario confirmó en el diálogo. */
  protected deletePending(): void {
    const user = this.pendingDelete();
    const page = this.result();

    if (!user || !page) {
      return;
    }

    this.deleting.set(true);
    this.notice.set(null);
    this.deleteError.set(null);

    this.userService
      .delete(user.code)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => this.afterDelete(`Se eliminó el usuario ${user.code}.`, page),
        error: (error: HttpErrorResponse) => {
          // 404: alguien más ya lo había borrado; el resultado es el mismo.
          if (error.status === 404) {
            this.afterDelete(`El usuario ${user.code} ya no existía.`, page);
            return;
          }

          // 409: la API explica el motivo (por ejemplo, que es el propio usuario).
          this.deleteError.set(
            error.status === 409 ? error.error?.message : 'No se pudo eliminar el usuario. Intenta de nuevo.',
          );
        },
      });
  }

  private afterDelete(message: string, page: Paginated<User>): void {
    this.notice.set(message);
    this.pendingDelete.set(null);

    // Si era el último usuario de la página, se regresa a la anterior.
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
