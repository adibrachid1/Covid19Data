import { TestBed } from '@angular/core/testing';

import { SecurePagesGuard } from './secure-pages.guard';

describe('SecurePagesGuard', () => {
  let guard: SecurePagesGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SecurePagesGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
