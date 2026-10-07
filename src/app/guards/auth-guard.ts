import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (authService.estaAutenticado()) {
    return true; // Déjalo pasar a la cámara
  } else {
    router.navigate(['/login']); // Bloqueado, envíalo al login
    return false;
  }
};
