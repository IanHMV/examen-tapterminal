import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SECTION_LINKS } from './core/constants/sections';
import { AuthService } from './core/services/auth.service';
import { HealthcheckService } from './core/services/healthcheck.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
})
export class AppComponent {
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);

  /** El menú solo muestra las secciones que el usuario tiene en sus perfiles. */
  protected readonly menu = computed(() => SECTION_LINKS.filter((link) => this.auth.hasSection(link.key)));

  constructor() {
    // El estado de la API solo se informa en la consola del navegador (útil para diagnosticar).
    inject(HealthcheckService)
      .check()
      .subscribe({
        next: (health) => console.info(`API en línea · ${health.service} · base de datos: ${health.checks.database}`),
        error: () => console.warn('No se pudo conectar con la API.'),
      });
  }

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
