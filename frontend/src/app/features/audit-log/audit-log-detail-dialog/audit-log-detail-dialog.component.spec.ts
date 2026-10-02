import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditLog } from '../../../core/models/audit-log.model';
import { buildAuditLog } from '../../../testing/audit-log.fixtures';
import { AuditLogDetailDialogComponent } from './audit-log-detail-dialog.component';

/** Componente anfitrión: usa el modal igual que el listado de la bitácora. */
@Component({
  imports: [AuditLogDetailDialogComponent],
  template: `<app-audit-log-detail-dialog [log]="log()" />`,
})
class HostComponent {
  readonly log = signal<AuditLog | null>(null);
  readonly dialog = viewChild.required(AuditLogDetailDialogComponent);
}

/** Fila de la comparación: [campo, antes, después, ¿cambió?]. */
type Row = [string, string, string, boolean];

describe('AuditLogDetailDialogComponent', () => {
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

  function openWith(log: AuditLog): void {
    host.log.set(log);
    fixture.detectChanges();
    host.dialog().open();
  }

  function rows(): Row[] {
    return Array.from(dialogElement().querySelectorAll('tbody tr')).map((tr) => {
      const [field, before, after] = Array.from(tr.querySelectorAll('th, td')).map(
        (cell) => cell.textContent?.replace('cambió', '').replace(/\s+/g, ' ').trim() ?? '',
      );
      return [field, before, after, tr.classList.contains('table-warning')];
    });
  }

  it('compara campo por campo el dato anterior con el actual y resalta lo que cambió', () => {
    openWith(buildAuditLog());

    expect(dialogElement().open).toBeTrue();
    expect(dialogElement().querySelector('h2')?.textContent?.trim()).toBe('Edición de producto PRD-0001');
    expect(rows()).toEqual([
      ['Nombre', 'Casco de seguridad tipo I', 'Casco de seguridad tipo I', false],
      ['Marca', '3M', '3M', false],
      ['Precio', '289.00', '310.00', true],
    ]);
    expect(dialogElement().querySelectorAll('.badge').length).toBe(1);
  });

  it('muestra fecha (DD/MM/YYYY HH:MM), usuario e IP', () => {
    openWith(buildAuditLog());

    const details = dialogElement().querySelector('.details')?.textContent ?? '';
    expect(details).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(details).toContain('Administrador (USR-0001)');
    expect(details).toContain('203.0.113.7');
  });

  it('en un alta no hay dato anterior; el autor sin sesión es el sistema', () => {
    openWith(
      buildAuditLog({
        action: 'created',
        entity: 'profiles',
        entity_code: 'PRF-0002',
        before: null,
        after: { name: 'Capturista de productos', sections: ['products', 'audit_log'] },
        changed_fields: ['name', 'sections'],
        user: null,
        ip: null,
      }),
    );

    expect(dialogElement().querySelector('h2')?.textContent?.trim()).toBe('Alta de perfil PRF-0002');
    expect(rows()).toEqual([
      ['Nombre', '—', 'Capturista de productos', true],
      ['Secciones', '—', 'Productos, Bitácora', true],
    ]);
    expect(dialogElement().querySelector('.details')?.textContent).toContain('Sistema');
  });

  it('de la contraseña solo indica que cambió, nunca su valor', () => {
    const user = { name: 'Ana López', email: 'ana@example.com', phone: null, profile_codes: ['PRF-0002'] };
    openWith(
      buildAuditLog({
        entity: 'users',
        entity_code: 'USR-0002',
        before: user,
        after: user,
        changed_fields: ['password'],
      }),
    );

    expect(rows()).toContain(['Contraseña', '(oculta)', '(oculta)', true]);
    expect(rows()).toContain(['Teléfono', '(vacío)', '(vacío)', false]);
    expect(rows()).toContain(['Perfiles', 'PRF-0002', 'PRF-0002', false]);
  });
});
