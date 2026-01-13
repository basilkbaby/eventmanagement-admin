import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatSectionViewComponent } from './seat-section-view.component';

describe('SeatSectionViewComponent', () => {
  let component: SeatSectionViewComponent;
  let fixture: ComponentFixture<SeatSectionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatSectionViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatSectionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
