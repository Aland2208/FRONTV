import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { guestGuard } from './guards/guest-guard';
import { resetPasswordGuard } from './guards/reset-password-guard';
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
        canActivate: [authGuard]
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
        canActivate: [guestGuard]
    },
    {
        path: 'registro',
        loadComponent: () => import('./pages/registro/registro.page').then(m => m.RegistroPage),
        canActivate: [guestGuard]
    },
    {
        path: 'recuperar',
        loadComponent: () => import('./pages/recuperar/recuperar.page').then(m => m.RecuperarPage),
        canActivate: [guestGuard]
    },
    {
        path: 'restablecer-password',
        loadComponent: () => import('./pages/restablecer-password/restablecer-password.page').then(m => m.RestablecerPasswordPage),
        canActivate: [guestGuard, resetPasswordGuard]
    },
    {
        path: '**',
        redirectTo: 'login'
    }
];