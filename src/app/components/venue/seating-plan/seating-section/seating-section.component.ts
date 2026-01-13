import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat, SeatingSection } from '../../../../core/models/seating.interface';
import { SeatComponent } from '../seat/seat.component';

@Component({
  selector: 'app-seating-section',
  standalone: true,
  imports: [CommonModule, SeatComponent],
  templateUrl: './seating-section.component.html',
  styleUrls: ['./seating-section.component.scss']
})
export class SeatingSectionComponent {
  @Input() section!: SeatingSection;
  @Input() seats: Seat[] = [];
  @Input() selectedSeat: Seat | null = null;
  @Input() priceTiers: any[] = [];
  @Output() priceTierChange = new EventEmitter<{section: SeatingSection, priceTierId: string}>();
  @Output() action = new EventEmitter<{section: SeatingSection, action: string}>();
  @Output() seatClick = new EventEmitter<Seat>();

  getSectionStyle(): any {
    return {
      'background': this.section.color + '20',
      'border-color': this.section.color
    };
  }

  getUniqueRows(): string[] {
    const seatsInSection = this.seats.filter(seat => seat.section === this.section.id);
    return [...new Set(seatsInSection.map(seat => seat.row))].sort();
  }

  getSeatsForRow(row: string): Seat[] {
    return this.seats.filter(seat => 
      seat.section === this.section.id && seat.row === row
    ).sort((a, b) => a.number - b.number);
  }

  isSeatSelected(seat: Seat): boolean {
    return this.selectedSeat?.id === seat.id;
  }

  // FIXED: Proper event handling for price tier change
  onPriceTierChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const priceTierId = selectElement.value;
    console.log('Price tier changed to:', priceTierId, 'for section:', this.section.name);
    
    this.priceTierChange.emit({
      section: this.section, 
      priceTierId: priceTierId
    });
  }

  // FIXED: Action methods with proper logging
  onAddRows() {
    console.log('Add rows clicked for section:', this.section.name);
    this.action.emit({section: this.section, action: 'add-rows'});
  }

  onAdjustColumns() {
    console.log('Adjust columns clicked for section:', this.section.name);
    this.action.emit({section: this.section, action: 'adjust-columns'});
  }

  onDuplicate() {
    console.log('Duplicate clicked for section:', this.section.name);
    this.action.emit({section: this.section, action: 'duplicate'});
  }

  onDelete() {
    console.log('Delete clicked for section:', this.section.name);
    this.action.emit({section: this.section, action: 'delete'});
  }

  onSeatClicked(seat: Seat) {
    console.log('Seat clicked:', seat);
    this.seatClick.emit(seat);
  }
}