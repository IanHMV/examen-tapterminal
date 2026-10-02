import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Profile } from '../../../core/models/profile.model';
import { buildProfile } from '../../../testing/profile.fixtures';
import { ProfileDetailDialogComponent } from './profile-detail-dialog.component';

/** Componente anfitrión: usa el modal igual que el listado de perfiles. */
@Component({
  imports: [ProfileDetailDialogComponent],
  template: `<app-profile-detail-dialog [profile]="profile()" />`,
})
class HostComponent {
  readonly profile = signal<Profile | null>(null);
  readonly dialog = viewChild.required(ProfileDetailDialogComponent);
}

describe('ProfileDetailDialogComponent', () => {
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

  function openWith(profile: Profile): void {
    host.profile.set(profile);
    fixture.detectChanges();
    host.dialog().open();
  }

  it('muestra código, nombre, fecha (DD/MM/YYYY HH:MM) y secciones del perfil', () => {
    openWith(buildProfile());

    const details = dialogElement().querySelector('.details')?.textContent ?? '';

    expect(dialogElement().open).toBeTrue();
    expect(details).toContain('PRF-0002');
    expect(details).toContain('Capturista de productos');
    expect(details).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(dialogElement().querySelector('li')?.textContent?.trim()).toBe('Productos');
  });

  it('avisa si el perfil no tiene secciones', () => {
    openWith(buildProfile({ sections: [] }));

    expect(dialogElement().querySelector('li')?.textContent?.trim()).toBe('Sin secciones asignadas.');
  });

  it('"Cerrar" cierra la ventana', () => {
    openWith(buildProfile());

    (dialogElement().querySelector('.btn-outline-secondary') as HTMLButtonElement).click();

    expect(dialogElement().open).toBeFalse();
  });
});
