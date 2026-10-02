import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión | Examen TAP Terminal',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  // Todo lo demás requiere sesión: authGuard revisa cada pantalla hija.
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
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
      // Mismo formulario que el alta: con código en la URL, edita.
      {
        path: 'productos/:code/editar',
        title: 'Editar producto | Examen TAP Terminal',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'perfiles',
        title: 'Perfiles | Examen TAP Terminal',
        loadComponent: () =>
          import('./features/profiles/profile-list/profile-list.component').then((m) => m.ProfileListComponent),
      },
      {
        path: 'perfiles/nuevo',
        title: 'Nuevo perfil | Examen TAP Terminal',
        loadComponent: () =>
          import('./features/profiles/profile-form/profile-form.component').then((m) => m.ProfileFormComponent),
      },
      {
        path: 'perfiles/:code/editar',
        title: 'Editar perfil | Examen TAP Terminal',
        loadComponent: () =>
          import('./features/profiles/profile-form/profile-form.component').then((m) => m.ProfileFormComponent),
      },
      {
        path: 'usuarios',
        title: 'Usuarios | Examen TAP Terminal',
        loadComponent: () => import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'usuarios/nuevo',
        title: 'Nuevo usuario | Examen TAP Terminal',
        loadComponent: () => import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'usuarios/:code',
        title: 'Detalle del usuario | Examen TAP Terminal',
        loadComponent: () =>
          import('./features/users/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'usuarios/:code/editar',
        title: 'Editar usuario | Examen TAP Terminal',
        loadComponent: () => import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
    ],
  },
  // Cualquier otra URL lleva al inicio (evita el error NG04002).
  // Apunta a la ruta final: Angular no encadena un redirect detrás de otro.
  { path: '**', redirectTo: 'productos' },
];
