import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatSectionsComponent } from './seat-sections.component';

describe('SeatSectionsComponent', () => {
  let component: SeatSectionsComponent;
  let fixture: ComponentFixture<SeatSectionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatSectionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatSectionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
