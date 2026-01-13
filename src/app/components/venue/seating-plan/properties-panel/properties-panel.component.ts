
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat, SeatingSection } from '../../../../core/models/seating.interface';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './properties-panel.component.html',
  styleUrls: ['./properties-panel.component.scss']
})
export class PropertiesPanelComponent {
  @Input() selectedSeat: Seat | null = null;
  @Input() sections: SeatingSection[] = [];
  @Output() accessibilityToggle = new EventEmitter<Seat>();
  @Output() blockToggle = new EventEmitter<Seat>();
  @Output() closePanel = new EventEmitter<void>();

  getSectionName(sectionId: string): string {
    const section = this.sections.find(s => s.id === sectionId);
    return section ? section.name : 'Unknown Section';
  }

  getAccessibilityButtonText(): string {
    if (!this.selectedSeat) return 'Mark as Accessible';
    return this.selectedSeat.type === 'accessible' ? 'Remove Accessibility' : 'Mark as Accessible';
  }

  getBlockButtonText(): string {
    if (!this.selectedSeat) return 'Block Seat';
    return this.selectedSeat.status === 'blocked' ? 'Unblock Seat' : 'Block Seat';
  }

  onAccessibilityToggle() {
    if (this.selectedSeat) {
      this.accessibilityToggle.emit(this.selectedSeat);
    }
  }

  onBlockToggle() {
    if (this.selectedSeat) {
      this.blockToggle.emit(this.selectedSeat);
    }
  }

  closePanelProperty() {
    this.closePanel.emit();
  }
}