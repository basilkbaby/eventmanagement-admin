import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignToolsComponent } from './design-tools.component';

describe('DesignToolComponent', () => {
  let component: DesignToolsComponent;
  let fixture: ComponentFixture<DesignToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignToolsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
