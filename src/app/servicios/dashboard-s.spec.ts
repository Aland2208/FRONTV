import { TestBed } from '@angular/core/testing';

import { DashboardS } from './dashboard-s';

describe('DashboardS', () => {
  let service: DashboardS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
