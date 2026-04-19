import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomAdminPanel } from './bottom-admin-panel';

describe('BottomAdminPanel', () => {
  let component: BottomAdminPanel;
  let fixture: ComponentFixture<BottomAdminPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomAdminPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BottomAdminPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
