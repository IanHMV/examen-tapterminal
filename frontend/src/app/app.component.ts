import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { SECTION_LINKS } from './core/constants/sections';
import { AuthService } from './core/services/auth.service';
import { ApiStatusComponent } from './shared/components/api-status/api-status.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ApiStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly router = inject(Router);

  protected readonly auth = inject(AuthService);

  /** El menú solo muestra las secciones que el usuario tiene en sus perfiles. */
  protected readonly menu = computed(() => SECTION_LINKS.filter((link) => this.auth.hasSection(link.key)));

  protected logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
