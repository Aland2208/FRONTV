import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

const PUBLIC_AUTH_PATHS = [
  '/auth/registro',
  '/auth/verificar-correo',
  '/auth/login',
  '/auth/recuperar',
  '/auth/restablecer',
  '/auth/validar-reset/'
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isBackendRequest = request.url.startsWith(environment.apiUrl);
  const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(path =>
    request.url.includes(path)
  );
  const token = sessionStorage.getItem('veedor_token');

  if (!isBackendRequest || isPublicAuthRequest || !token) {
    return next(request);
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  }));
};
