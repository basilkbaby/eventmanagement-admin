import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatSectionEditorComponent } from './seat-section-editor.component';

describe('SeatSectionEditorComponent', () => {
  let component: SeatSectionEditorComponent;
  let fixture: ComponentFixture<SeatSectionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatSectionEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatSectionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
