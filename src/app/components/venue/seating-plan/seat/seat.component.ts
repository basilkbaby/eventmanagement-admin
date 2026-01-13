import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat } from '../../../../core/models/seating.interface';

@Component({
  selector: 'app-seat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat.component.html',
  styleUrls: ['./seat.component.scss']
})
export class SeatComponent {
  @Input() seat!: Seat;
  @Input() sectionColor: string = '#ccc';
  @Input() isSelected: boolean = false;
  @Output() seatClick = new EventEmitter<Seat>();

  onSeatClick() {
    this.seatClick.emit(this.seat);
  }

  getSeatColor(): string {
    if (this.seat.status === 'blocked') return '#9e9e9e';
    if (this.seat.status === 'reserved') return '#ff9800';
    
    switch (this.seat.type) {
      case 'accessible':
        return '#FF5722';
      case 'companion':
        return '#FF9800';
      default:
        return this.sectionColor;
    }
  }

  getSeatTitle(): string {
    return `Seat ${this.seat.row}${this.seat.number} - ${this.seat.type}`;
  }
}