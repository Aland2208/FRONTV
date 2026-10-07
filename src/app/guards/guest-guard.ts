import {inject} from '@angular/core';
import {CanActivateFn,Router} from '@angular/router';
import {Auth} from '../servicios/auth';

export const guestGuard:CanActivateFn=()=>{
 const auth=inject(Auth);
 const router=inject(Router);

 if(!auth.estaAutenticado()) return true;

 return router.createUrlTree(['/home']);
};