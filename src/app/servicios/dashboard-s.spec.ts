import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DashboardS } from './dashboard-s';

describe('DashboardS', () => {
  let service: DashboardS;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem('veedor_token', 'test-token');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DashboardS);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.removeItem('veedor_token');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends the session token when loading the veedor dashboard', () => {
    service.obtenerDashboardVeedor(21).subscribe();

    const request = httpTesting.expectOne(request => request.url.endsWith('/dashboard/veedor/21'));
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    request.flush({ estado: 1 });
  });

  it('sends the session token and filters for the administrator dashboard', () => {
    service.obtenerDashboardAdministrador(10, '7dias', 21).subscribe();

    const request = httpTesting.expectOne(request => request.url.endsWith('/dashboard/admin/10'));
    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.params.get('periodo')).toBe('7dias');
    expect(request.request.params.get('id_usuario')).toBe('21');
    request.flush({ estado: 1 });
  });
});
