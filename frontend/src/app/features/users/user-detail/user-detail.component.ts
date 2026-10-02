import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, map, switchMap, tap } from 'rxjs';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { UserDetail } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

type DetailState = 'loading' | 'ready' | 'not-found' | 'error' | 'deleted';

/**
 * Detalle de un usuario (requisito del examen): usuario, nombre, teléfono,
 * foto de perfil y lista de perfiles. El código viene en la URL (/usuarios/USR-0001).
 */
@Component({
  selector: 'app-user-detail',
  imports: [RouterLink, DatePipe, ConfirmDialogComponent],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent {
  private readonly userService = inject(UserService);
  private readonly deleteDialog = viewChild.required(ConfirmDialogComponent);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  private readonly auth = inject(AuthService);
  protected readonly currentUserCode = computed(() => this.auth.currentUser()?.code);
  protected readonly state = signal<DetailState>('loading');
  protected readonly user = signal<UserDetail | null>(null);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('code') ?? ''),
        tap(() => this.state.set('loading')),
        switchMap((code) =>
          this.userService.get(code).pipe(
            tap((user) => {
              this.user.set(user);
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
  protected deleteUser(): void {
    const user = this.user();

    if (!user) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.userService
      .delete(user.code)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => this.state.set('deleted'),
        error: (error: HttpErrorResponse) => {
          // 404: alguien más ya lo había borrado; el resultado es el mismo.
          if (error.status === 404) {
            this.state.set('deleted');
            return;
          }

          // 409: la API explica el motivo (por ejemplo, que es el propio usuario).
          this.deleteError.set(
            error.status === 409 ? error.error?.message : 'No se pudo eliminar el usuario. Intenta de nuevo.',
          );
        },
      });
  }
}
