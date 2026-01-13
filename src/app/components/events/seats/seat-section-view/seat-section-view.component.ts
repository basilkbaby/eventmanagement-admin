import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface VenueSection {
  id: string;
  name: string;
  type: 'middle-left' | 'middle-right' | 'wing-left' | 'wing-right' | 'stage' | 'vip' | 'standing';
  color: string;
  price: number;
  capacity: number;
  available: number;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  rowOffset?: number;
  seatingConfig?: {
    rows: number;
    seatsPerRow: number;
    aislePosition?: number;
  };
}

export interface VenueLayout {
  id: string;
  name: string;
  description?: string;
  sections: VenueSection[];
  totalCapacity: number;
}

@Component({
  selector: 'app-seat-section-view',
  standalone: true,
  imports: [CommonModule, FormsModule], // Add FormsModule
  templateUrl: './seat-section-view.component.html',
  styleUrls: ['./seat-section-view.component.scss']
})
export class SeatSectionViewComponent implements OnInit {
  @Input() layout?: VenueLayout;
  @Output() sectionSelect = new EventEmitter<VenueSection>();
  @Output() editSection = new EventEmitter<VenueSection>();
  
  selectedSection: VenueSection | null = null;
  isEditing = false;
  editedSection: VenueSection | null = null;
  
  // View modes
  viewMode: 'overview' | 'edit' | 'seats' = 'overview';
  

  // SIMPLIFIED sample sections with correct positioning
  sampleSections: VenueSection[] = [
    // Stage
    {
      id: 'stage',
      name: 'Main Stage',
      type: 'stage',
      color: '#0062ffff',
      price: 0,
      capacity: 0,
      available: 0,
      position: { top: 5, left: 25, width: 50, height: 10 }
    },
    // Wing Left Section
    {
      id: 'wing-left',
      name: 'Wing Left',
      type: 'wing-left',
      color: '#10b981',
      price: 120,
      capacity: 240,
      available: 110,
      position: { top: 30, left: 2, width: 22, height: 70 },
      rowOffset: 2,
      seatingConfig: {
        rows: 20,
        seatsPerRow: 12,
        aislePosition: 6
      }
    },
    // Middle Left Section
    {
      id: 'middle-left',
      name: 'Middle Left',
      type: 'middle-left',
      color: '#3b82f6',
      price: 150,
      capacity: 204,
      available: 85,
      position: { top: 25, left: 26, width: 22, height: 60 },
      seatingConfig: {
        rows: 17,
        seatsPerRow: 12,
        aislePosition: 6
      }
    },
    
    // Middle Right Section
    {
      id: 'middle-right',
      name: 'Middle Right',
      type: 'middle-right',
      color: '#3b82f6',
      price: 150,
      capacity: 204,
      available: 92,
      position: { top: 25, left: 50, width: 22, height: 60 },
      seatingConfig: {
        rows: 17,
        seatsPerRow: 12,
        aislePosition: 6
      }
    },
    
    
    
    // Wing Right Section
    {
      id: 'wing-right',
      name: 'Wing Right',
      type: 'wing-right',
      color: '#10b981',
      price: 120,
      capacity: 240,
      available: 105,
      position: { top: 30, left: 74, width: 22, height: 70 }, // Changed from left: 60 to 80
      rowOffset: 2,
      seatingConfig: {
        rows: 20,
        seatsPerRow: 12,
        aislePosition: 6
      }
    },
    
    // Standing Area
    {
      id: 'standing',
      name: 'Standing Area',
      type: 'standing',
      color: '#ef4444',
      price: 80,
      capacity: 300,
      available: 150,
      position: { top: 88, left: 26, width: 46, height: 20 }
    }
  ];


  
  currentSections: VenueSection[] = [];

  constructor(private router : Router) {}

  ngOnInit() {
    if (!this.layout) {
      this.layout = {
        id: 'venue-001',
        name: 'Main Concert Hall',
        description: 'Venue layout with middle and wing sections',
        sections: this.sampleSections,
        totalCapacity: 888
      };
    }
    this.currentSections = [...this.layout.sections];
  }

  // Get section by type
  getSectionByType(type: string): VenueSection | undefined {
    return this.currentSections.find(s => s.type === type);
  }

  // Get all seating sections
  getSeatingSections(): VenueSection[] {
    return this.currentSections.filter(s => s.type !== 'stage');
  }

  // Get section style
  getSectionStyle(section: VenueSection): any {
    return {
      'top': section.position.top + '%',
      'left': section.position.left + '%',
      'width': section.position.width + '%',
      'height': section.position.height + '%',
      'background-color': section.color
    };
  }

  // Select section
  selectSection(section: VenueSection) {
    this.selectedSection = section;
    this.viewMode = 'overview';
    this.isEditing = false;
    this.sectionSelect.emit(section);
  }

  // Start editing
  startEdit(section: VenueSection) {
    this.editedSection = { ...section }; // Create a copy for editing
    this.isEditing = true;
    this.viewMode = 'edit';
  }

  // Save edits
  saveEdit() {
    if (this.editedSection) {
      const index = this.currentSections.findIndex(s => s.id === this.editedSection!.id);
      if (index !== -1) {
        this.currentSections[index] = { ...this.editedSection };
        this.selectedSection = { ...this.editedSection };
        this.editSection.emit(this.editedSection);
      }
    }
    this.isEditing = false;
    this.viewMode = 'overview';
  }

  // Cancel edit
  cancelEdit() {
    this.isEditing = false;
    this.viewMode = 'overview';
    this.editedSection = null;
  }

  // Go to seat selection
  goToSeatSelection(section: VenueSection) {
    //this.viewMode = 'seats';
    // In a real app, you might navigate to a different component

    this.router.navigate(['/admin/venues/seateditor/middle-left']);
    // console.log('Navigating to seat selection for:', section.name);
    // this.sectionSelect.emit(section);
  }

  // Back to overview
  backToOverview() {
    this.viewMode = 'overview';
  }

  // Check if section has seats
  hasSeats(section: VenueSection): boolean {
    return section.capacity > 0 && section.type !== 'stage';
  }

  // Get price display
  getPriceDisplay(section: VenueSection): string {
    return section.price > 0 ? `£${section.price}` : 'Free';
  }

  // Get occupancy percentage
  getOccupancyPercentage(section: VenueSection): number {
    if (section.capacity === 0) return 0;
    return Math.round(((section.capacity - section.available) / section.capacity) * 100);
  }

  // Update available seats (when seats are selected)
  updateAvailableSeats(section: VenueSection, seatsSold: number) {
    const index = this.currentSections.findIndex(s => s.id === section.id);
    if (index !== -1) {
      this.currentSections[index].available = Math.max(0, section.available - seatsSold);
      this.selectedSection = { ...this.currentSections[index] };
    }
  }

  // Get total available seats
  getTotalAvailable(): number {
    return this.currentSections.reduce((total, section) => total + section.available, 0);
  }

  // Get total capacity
  getTotalCapacity(): number {
    return this.currentSections.reduce((total, section) => total + section.capacity, 0);
  }

  // Get overall occupancy
  getOverallOccupancy(): number {
    const total = this.getTotalCapacity();
    if (total === 0) return 0;
    const occupied = total - this.getTotalAvailable();
    return Math.round((occupied / total) * 100);
  }

  // Helper methods for seat selection view
getRowsArray(rowCount: number): number[] {
  return Array.from({ length: rowCount }, (_, i) => i);
}

getSeatsArray(seatCount: number): number[] {
  return Array.from({ length: seatCount }, (_, i) => i);
}

isAisleSeat(seatIndex: number, config: any): boolean {
  return config.aislePosition && seatIndex === config.aislePosition - 1;
}

toggleSeatSelection(rowIndex: number, seatIndex: number) {
  // Implement seat selection logic
  console.log('Toggling seat at:', { row: rowIndex + 1, seat: seatIndex + 1 });
}

updateAvailableOnCapacityChange() {
  if (this.editedSection && this.editedSection.capacity < this.editedSection.available) {
    this.editedSection.available = this.editedSection.capacity;
  }
}
}