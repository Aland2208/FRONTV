import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; // <-- 1. Importa el guard

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', 
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard] // <-- 3. PROTEGEMOS LA CÁMARA
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.page').then( m => m.RegistroPage)
  },
  {
    path: 'recuperar',
    loadComponent: () => import('./pages/recuperar/recuperar.page').then( m => m.RecuperarPage)
  },
  {
    path: 'restablecer-password',
    loadComponent: () => import('./pages/restablecer-password/restablecer-password.page').then( m => m.RestablecerPasswordPage)
  },
];