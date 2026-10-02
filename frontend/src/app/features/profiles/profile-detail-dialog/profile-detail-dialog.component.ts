import { DatePipe } from '@angular/common';
import { Component, ElementRef, input, viewChild } from '@angular/core';

import { DATE_TIME_FORMAT } from '../../../core/constants/date-formats';
import { Profile } from '../../../core/models/profile.model';

/**
 * Detalle de un perfil en una ventana modal (requisito del examen):
 * código, nombre, fecha de creación y secciones.
 */
@Component({
  selector: 'app-profile-detail-dialog',
  imports: [DatePipe],
  templateUrl: './profile-detail-dialog.component.html',
})
export class ProfileDetailDialogComponent {
  /** Perfil a mostrar; ya trae sus secciones, no hace falta otra petición. */
  readonly profile = input<Profile | null>(null);

  protected readonly dateTimeFormat = DATE_TIME_FORMAT;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
