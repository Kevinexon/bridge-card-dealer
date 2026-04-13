import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiddingPanel } from './bidding-panel';

describe('BiddingPanel', () => {
  let component: BiddingPanel;
  let fixture: ComponentFixture<BiddingPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiddingPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BiddingPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
