import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SECTION_LINKS } from '../../../core/constants/sections';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Se muestra cuando el usuario entra a una sección que no tiene en sus perfiles,
 * o cuando no tiene ninguna sección asignada.
 */
@Component({
  selector: 'app-no-access',
  imports: [RouterLink],
  templateUrl: './no-access.component.html',
})
export class NoAccessComponent {
  private readonly auth = inject(AuthService);

  /** Secciones a las que sí puede ir. */
  protected readonly allowedLinks = computed(() =>
    SECTION_LINKS.filter((link) => this.auth.hasSection(link.key)),
  );
}
