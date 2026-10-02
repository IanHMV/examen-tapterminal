import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Paginated } from '../../../core/models/api.model';
import { PaginationComponent } from './pagination.component';

type PageInfo = Pick<Paginated<unknown>, 'links' | 'meta'>;

/** Pantalla de prueba que usa el paginador como lo hacen los listados. */
@Component({
  imports: [PaginationComponent],
  template: `<app-pagination [page]="page()" itemsLabel="productos" />`,
})
class HostComponent {
  readonly page = signal<PageInfo>(buildPageInfo(1, 1, 3));
}

function buildPageInfo(current: number, last: number, total: number): PageInfo {
  const from = total > 0 && current <= last ? (current - 1) * 10 + 1 : null;

  return {
    links: {
      first: 'x',
      last: 'x',
      prev: current > 1 ? 'x' : null,
      next: current < last ? 'x' : null,
    },
    meta: {
      current_page: current,
      last_page: last,
      from,
      to: from === null ? null : Math.min(current * 10, total),
      total,
    },
  };
}

describe('PaginationComponent', () => {
  let harness: RouterTestingHarness;
  let host: HostComponent;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'lista', component: HostComponent }])],
    });
    harness = await RouterTestingHarness.create();
    host = await harness.navigateByUrl('/lista', HostComponent);
  });

  function show(page: PageInfo): { text: string; links: (string | null)[] } {
    host.page.set(page);
    harness.detectChanges();
    const nav = harness.routeNativeElement?.querySelector('nav') as HTMLElement;

    return {
      text: nav.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      links: Array.from(nav.querySelectorAll('a')).map((a) => a.getAttribute('href')),
    };
  }

  it('en una sola página muestra el resumen y ningún enlace', () => {
    const { text, links } = show(buildPageInfo(1, 1, 3));

    expect(text).toBe('1–3 de 3 productos · Página 1 de 1');
    expect(links).toEqual([]);
  });

  it('en una página intermedia enlaza a la anterior y la siguiente con ?pagina=', () => {
    const { text, links } = show(buildPageInfo(2, 3, 25));

    expect(text).toContain('11–20 de 25 productos');
    expect(links).toEqual(['/lista?pagina=1', '/lista?pagina=3']);
  });

  it('en una página sin datos (más allá de la última) omite el rango', () => {
    const { text } = show(buildPageInfo(9, 3, 25));

    expect(text).not.toContain('de 25');
    expect(text).toContain('Página 9 de 3');
  });
});
