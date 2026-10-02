import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDialogComponent } from './confirm-dialog.component';

/** Componente anfitrión: usa el diálogo igual que lo hacen las pantallas. */
@Component({
  imports: [ConfirmDialogComponent],
  template: `
    <app-confirm-dialog title="¿Eliminar producto?" confirmLabel="Eliminar" (confirmed)="confirmations = confirmations + 1">
      Esta acción no se puede deshacer.
    </app-confirm-dialog>
  `,
})
class HostComponent {
  readonly dialog = viewChild.required(ConfirmDialogComponent);
  confirmations = 0;
}

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  function dialogElement(): HTMLDialogElement {
    return (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
  }

  function clickButton(label: string): void {
    const buttons = Array.from(dialogElement().querySelectorAll('button'));
    buttons.find((button) => button.textContent?.trim() === label)?.click();
  }

  it('empieza cerrado y open() lo muestra con el título y el mensaje', () => {
    expect(dialogElement().open).toBeFalse();

    host.dialog().open();

    expect(dialogElement().open).toBeTrue();
    expect(dialogElement().textContent).toContain('¿Eliminar producto?');
    expect(dialogElement().textContent).toContain('Esta acción no se puede deshacer.');
    expect(dialogElement().getAttribute('aria-labelledby')).toBe(dialogElement().querySelector('h2')?.id ?? '');
  });

  it('Cancelar cierra sin confirmar', () => {
    host.dialog().open();
    clickButton('Cancelar');

    expect(dialogElement().open).toBeFalse();
    expect(host.confirmations).toBe(0);
  });

  it('el botón de confirmar cierra y avisa una sola vez', () => {
    host.dialog().open();
    clickButton('Eliminar');

    expect(dialogElement().open).toBeFalse();
    expect(host.confirmations).toBe(1);
  });
});
