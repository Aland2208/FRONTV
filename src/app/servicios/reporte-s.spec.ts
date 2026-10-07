import { TestBed } from '@angular/core/testing';

import { ReporteS } from './reporte-s';

describe('ReporteS', () => {
  let service: ReporteS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
