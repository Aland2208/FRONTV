import {inject} from '@angular/core';
import {CanActivateFn,Router} from '@angular/router';

export const resetPasswordGuard:CanActivateFn=(route)=>{
 const router=inject(Router);

 const token=route.queryParamMap.get('token');
 const tokenUsado=sessionStorage.getItem('reset_token_usado');

 if(!token){
  return router.createUrlTree(['/login']);
 }

 if(tokenUsado===token){
  return router.createUrlTree(['/login']);
 }

 return true;
};