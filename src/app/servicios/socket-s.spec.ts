import { TestBed } from '@angular/core/testing';

import { SocketS } from './socket-s';

describe('SocketS', () => {
  let service: SocketS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
