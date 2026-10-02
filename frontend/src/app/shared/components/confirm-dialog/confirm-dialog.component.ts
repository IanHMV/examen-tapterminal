import { Component, ElementRef, input, output, viewChild } from '@angular/core';

/** Para que cada diálogo tenga un id único (aria-labelledby). */
let nextId = 0;

/**
 * Ventana de confirmación con el elemento <dialog> nativo del navegador:
 * bloquea el resto de la página, mantiene el foco dentro y se cierra con Esc.
 * El mensaje se escribe entre las etiquetas: <app-confirm-dialog>…</app-confirm-dialog>.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly confirmLabel = input('Confirmar');

  /** Solo se emite si el usuario confirma; Cancelar o Esc no emiten nada. */
  readonly confirmed = output<void>();

  protected readonly titleId = `confirm-dialog-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected confirm(): void {
    this.close();
    this.confirmed.emit();
  }
}
