import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, EMPTY, catchError, combineLatest, finalize, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Paginated } from '../../../core/models/api.model';
import { Profile } from '../../../core/models/profile.model';
import { ProfileService } from '../../../core/services/profile.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ProfileDetailDialogComponent } from '../profile-detail-dialog/profile-detail-dialog.component';

type ListState = 'loading' | 'ready' | 'error';

/**
 * Tabla de perfiles paginada (?pagina= en la URL). El detalle se abre en una
 * ventana modal con los datos de la fila, sin otra petición a la API.
 */
@Component({
  selector: 'app-profile-list',
  imports: [RouterLink, DatePipe, ConfirmDialogComponent, PaginationComponent, ProfileDetailDialogComponent],
  templateUrl: './profile-list.component.html',
})
export class ProfileListComponent {
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Emite para volver a pedir la página actual (por ejemplo, después de eliminar). */
  private readonly refresh = new BehaviorSubject<void>(undefined);
  private readonly detailDialog = viewChild.required(ProfileDetailDialogComponent);
  private readonly deleteDialog = viewChild.required(ConfirmDialogComponent);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  protected readonly state = signal<ListState>('loading');
  protected readonly result = signal<Paginated<Profile> | null>(null);

  /** Perfil que se muestra en el detalle (modal). */
  protected readonly selected = signal<Profile | null>(null);

  /** Perfil que el usuario eligió eliminar (falta confirmar). */
  protected readonly pendingDelete = signal<Profile | null>(null);
  protected readonly deleting = signal(false);
  protected readonly notice = signal<string | null>(null);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    combineLatest([this.route.queryParamMap, this.refresh])
      .pipe(
        map(([params]) => Number(params.get('pagina')) || 1),
        tap(() => this.state.set('loading')),
        switchMap((page) =>
          this.profileService.list(page).pipe(
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

  protected showDetail(profile: Profile): void {
    this.selected.set(profile);
    this.detailDialog().open();
  }

  protected askDelete(profile: Profile): void {
    this.pendingDelete.set(profile);
    this.deleteDialog().open();
  }

  /** Se ejecuta solo si el usuario confirmó en el diálogo. */
  protected deletePending(): void {
    const profile = this.pendingDelete();
    const page = this.result();

    if (!profile || !page) {
      return;
    }

    this.deleting.set(true);
    this.notice.set(null);
    this.deleteError.set(null);

    this.profileService
      .delete(profile.code)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => this.afterDelete(`Se eliminó el perfil ${profile.code}.`, page),
        error: (error: HttpErrorResponse) => {
          // 404: alguien más ya lo había borrado; el resultado es el mismo.
          if (error.status === 404) {
            this.afterDelete(`El perfil ${profile.code} ya no existía.`, page);
            return;
          }

          this.deleteError.set('No se pudo eliminar el perfil. Intenta de nuevo.');
        },
      });
  }

  private afterDelete(message: string, page: Paginated<Profile>): void {
    this.notice.set(message);
    this.pendingDelete.set(null);

    // Si era el último perfil de la página, se regresa a la anterior.
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
