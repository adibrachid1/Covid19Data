import { TestBed } from '@angular/core/testing';

import { CovidServiceService } from './covid-service.service';

describe('CovidServiceService', () => {
  let service: CovidServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CovidServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
