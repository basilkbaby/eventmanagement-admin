import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatMapVisualComponent } from './seat-map-visual.component';

describe('SeatMapVisualComponent', () => {
  let component: SeatMapVisualComponent;
  let fixture: ComponentFixture<SeatMapVisualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatMapVisualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatMapVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
