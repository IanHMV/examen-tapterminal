import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'productos/nuevo' },
  {
    path: 'productos/nuevo',
    title: 'Nuevo producto | Examen TAP Terminal',
    loadComponent: () =>
      import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
  },
  // Cualquier otra URL lleva al inicio (evita el error NG04002).
  // Apunta a la ruta final: Angular no encadena un redirect detrás de otro.
  { path: '**', redirectTo: 'productos/nuevo' },
];
