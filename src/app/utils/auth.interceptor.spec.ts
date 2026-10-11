import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { environment } from '../../environments/environment';

describe('authInterceptor', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem('veedor_token', 'session-token');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.removeItem('veedor_token');
  });

  it('adds the bearer token to backend API calls', () => {
    TestBed.inject(HttpClient)
      .get(`${environment.apiUrl}dashboard/veedor/21`)
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}dashboard/veedor/21`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    request.flush({ estado: 1 });
  });

  it('does not send the token to the public login endpoint', () => {
    TestBed.inject(HttpClient)
      .post(`${environment.apiUrl}auth/login`, {})
      .subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}auth/login`);
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ estado: 1 });
  });
});
