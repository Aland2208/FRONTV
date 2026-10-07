import { TestBed } from '@angular/core/testing';

import { BalanzaS } from './balanza-s';

describe('BalanzaS', () => {
  let service: BalanzaS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BalanzaS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
