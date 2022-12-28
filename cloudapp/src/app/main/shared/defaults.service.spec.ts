import { TestBed } from '@angular/core/testing';

import { DefaultsService } from './defaults.service';

describe('ConstantsService', () => {
  let service: DefaultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DefaultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
