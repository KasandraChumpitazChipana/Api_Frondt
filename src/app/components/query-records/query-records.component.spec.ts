import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryRecordsComponent } from './query-records.component';

describe('QueryRecordsComponent', () => {
  let component: QueryRecordsComponent;
  let fixture: ComponentFixture<QueryRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QueryRecordsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QueryRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
