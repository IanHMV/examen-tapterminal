import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';
import { sectionGuard } from './core/guards/section.guard';
import { AuthService } from './core/services/auth.service';

/** Lleva a la primera pantalla que el usuario tiene permitida. */
const toHome = () => inject(AuthService).homeUrl();

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión | Examen TAP Terminal',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'recuperar-contrasena',
    title: 'Recuperar contraseña | Examen TAP Terminal',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  // Sin guard: el enlace del correo debe abrir aunque haya otra sesión iniciada en el navegador.
  {
    path: 'restablecer-contrasena',
    title: 'Elegir contraseña | Examen TAP Terminal',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  // Todo lo demás requiere sesión (authGuard) y la sección de cada pantalla (sectionGuard).
  {
    path: '',
    canActivateChild: [authGuard, sectionGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: toHome },
      {
        path: 'sin-acceso',
        title: 'Sin acceso | Examen TAP Terminal',
        loadComponent: () => import('./features/errors/no-access/no-access.component').then((m) => m.NoAccessComponent),
      },
      {
        path: 'productos',
        title: 'Productos | Examen TAP Terminal',
        data: { section: 'products' },
        loadComponent: () =>
          import('./features/products/product-list/product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'productos/nuevo',
        title: 'Nuevo producto | Examen TAP Terminal',
        data: { section: 'products' },
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'productos/:code',
        title: 'Detalle del producto | Examen TAP Terminal',
        data: { section: 'products' },
        loadComponent: () =>
          import('./features/products/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
      },
      // Mismo formulario que el alta: con código en la URL, edita.
      {
        path: 'productos/:code/editar',
        title: 'Editar producto | Examen TAP Terminal',
        data: { section: 'products' },
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then((m) => m.ProductFormComponent),
      },
      {
        path: 'perfiles',
        title: 'Perfiles | Examen TAP Terminal',
        data: { section: 'profiles' },
        loadComponent: () =>
          import('./features/profiles/profile-list/profile-list.component').then((m) => m.ProfileListComponent),
      },
      {
        path: 'perfiles/nuevo',
        title: 'Nuevo perfil | Examen TAP Terminal',
        data: { section: 'profiles' },
        loadComponent: () =>
          import('./features/profiles/profile-form/profile-form.component').then((m) => m.ProfileFormComponent),
      },
      {
        path: 'perfiles/:code/editar',
        title: 'Editar perfil | Examen TAP Terminal',
        data: { section: 'profiles' },
        loadComponent: () =>
          import('./features/profiles/profile-form/profile-form.component').then((m) => m.ProfileFormComponent),
      },
      {
        path: 'usuarios',
        title: 'Usuarios | Examen TAP Terminal',
        data: { section: 'users' },
        loadComponent: () => import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'usuarios/nuevo',
        title: 'Nuevo usuario | Examen TAP Terminal',
        data: { section: 'users' },
        loadComponent: () => import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'usuarios/:code',
        title: 'Detalle del usuario | Examen TAP Terminal',
        data: { section: 'users' },
        loadComponent: () =>
          import('./features/users/user-detail/user-detail.component').then((m) => m.UserDetailComponent),
      },
      {
        path: 'usuarios/:code/editar',
        title: 'Editar usuario | Examen TAP Terminal',
        data: { section: 'users' },
        loadComponent: () => import('./features/users/user-form/user-form.component').then((m) => m.UserFormComponent),
      },
      {
        path: 'bitacora',
        title: 'Bitácora | Examen TAP Terminal',
        data: { section: 'audit_log' },
        loadComponent: () =>
          import('./features/audit-log/audit-log-list/audit-log-list.component').then((m) => m.AuditLogListComponent),
      },
    ],
  },
  // Cualquier otra URL lleva a la primera pantalla permitida (evita el error NG04002).
  { path: '**', redirectTo: toHome },
];
