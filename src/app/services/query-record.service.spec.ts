import { TestBed } from '@angular/core/testing';

import { QueryRecordService } from './query-record.service';

describe('QueryRecordService', () => {
  let service: QueryRecordService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueryRecordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
