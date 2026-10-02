import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos' },
  {
    path: 'productos',
    title: 'Productos | Examen TAP Terminal',
    loadComponent: () =>
      import('./features/products/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'productos/nuevo',
    title: 'Nuevo producto | Examen TAP Terminal',
    loadComponent: () =>
      import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  {
    path: 'productos/:code',
    title: 'Detalle del producto | Examen TAP Terminal',
    loadComponent: () =>
      import('./features/products/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
  },
  // Cualquier otra URL lleva al inicio (evita el error NG04002).
  // Apunta a la ruta final: Angular no encadena un redirect detrás de otro.
  { path: '**', redirectTo: 'productos' },
];
