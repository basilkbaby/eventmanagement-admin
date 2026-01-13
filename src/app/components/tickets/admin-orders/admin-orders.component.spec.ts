import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketOrderListComponent } from './admin-orders.component';

describe('TicketOrderListComponent', () => {
  let component: TicketOrderListComponent;
  let fixture: ComponentFixture<TicketOrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketOrderListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TicketOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
