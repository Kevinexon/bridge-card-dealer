import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiddingTable } from './bidding-table';

describe('BiddingTable', () => {
  let component: BiddingTable;
  let fixture: ComponentFixture<BiddingTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiddingTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiddingTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
