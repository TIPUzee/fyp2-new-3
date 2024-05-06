import { TestBed } from '@angular/core/testing';

import { DiseasePredictorService } from './disease-predictor.service';

describe('DiseasePredictorService', () => {
  let service: DiseasePredictorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiseasePredictorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
