import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { DesignToolsComponent } from './design-tools/design-tools.component';
import { PropertiesPanelComponent } from './properties-panel/properties-panel.component';
import { SeatingSectionComponent } from './seating-section/seating-section.component';


import { Seat, SeatingPlan, SeatingSection } from '../../../core/models/seating.interface';


@Component({
  selector: 'app-seating-plan',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatButtonModule,
    MatSelectModule,
    DesignToolsComponent,
    PropertiesPanelComponent,
    SeatingSectionComponent
  ],
  templateUrl: './seating-plan.component.html',
  styleUrls: ['./seating-plan.component.scss']
})
export class SeatingPlanComponent implements OnInit {
  venueId: string = '';
  venueName: string = 'Venue Name';
  
  seatingPlan: SeatingPlan = {
    id: '1',
    venueId: '1',
    name: 'Main Hall Seating',
    sections: [],
    seats: [],
    totalSeats: 0,
    accessibleSeats: 0,
    stagePosition: 'north',
    layout: 'single',
    createdAt: new Date(),
    lastModified: new Date()
  };

  selectedTool: string = 'select';
  selectedSeat: Seat | null = null;
  
  priceTiers = [
    { id: 'premium', name: 'Premium', price: 150 },
    { id: 'standard', name: 'Standard', price: 100 },
    { id: 'economy', name: 'Economy', price: 50 }
  ];

  rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.venueId = params['id'];
      this.loadVenueData();
      this.loadSeatingPlan();
    });
  }

  private loadVenueData() {
    const mockVenues = [
      { id: '1', name: 'Grand Theater Hall' },
      { id: '2', name: 'Conference Center A' },
      { id: '3', name: 'Sports Arena Main' }
    ];
    
    const venue = mockVenues.find(v => v.id === this.venueId);
    if (venue) {
      this.venueName = venue.name;
    }
  }

  private loadSeatingPlan() {
    const sections: SeatingSection[] = [
      {
        id: '1',
        name: 'Orchestra Center',
        type: 'general',
        color: '#4CAF50',
        rows: ['A', 'B', 'C', 'D', 'E'],
        seatsPerRow: 8,
        capacity: 60,
        startRow: 'A',
        rowCount: 5,
        priceTier: 'premium',
        position: 'center',
        width: 50
      },
      {
        id: '2',
        name: 'Orchestra Left',
        type: 'side',
        color: '#2196F3',
        rows: ['A', 'B', 'C', 'D', 'E'],
        seatsPerRow: 8,
        capacity: 30,
        startRow: 'A',
        rowCount: 5,
        priceTier: 'standard',
        position: 'left',
        width: 25
      },
      {
        id: '3',
        name: 'Orchestra Right',
        type: 'side',
        color: '#2196F3',
        rows: ['A', 'B', 'C', 'D', 'E'],
        seatsPerRow: 8,
        capacity: 30,
        startRow: 'A',
        rowCount: 5,
        priceTier: 'standard',
        position: 'right',
        width: 25
      }
    ];

    const seats = this.generateSeatsFromSections(sections);

    this.seatingPlan = {
      id: '1',
      venueId: this.venueId,
      name: `${this.venueName} Seating Plan`,
      sections: sections,
      seats: seats,
      totalSeats: seats.length,
      accessibleSeats: seats.filter(seat => seat.type === 'accessible').length,
      stagePosition: 'north',
      layout: 'split',
      createdAt: new Date(),
      lastModified: new Date()
    };
  }

  private generateSeatsFromSections(sections: SeatingSection[]): Seat[] {
    const seats: Seat[] = [];
    let seatId = 1;

    sections.forEach(section => {
      section.rows.forEach(row => {
        for (let i = 1; i <= section.seatsPerRow; i++) {
          const isAccessible = (row === 'A' && i <= 2);
          seats.push({
            id: (seatId++).toString(),
            row: row,
            number: i,
            type: isAccessible ? 'accessible' : 'standard',
            section: section.id,
            x: 0,
            y: 0,
            status: 'available',
            priceTier: section.priceTier
          });
        }
      });
    });

    return seats;
  }

  // Tool Methods
  onToolSelected(tool: string) {
    this.selectedTool = tool;
    this.selectedSeat = null;
  }

  onSeatClick(seat: Seat) {
    if (this.selectedTool === 'select') {
      this.selectedSeat = seat;
    } else if (this.selectedTool === 'accessible') {
      this.toggleSeatAccessibility(seat);
    } else if (this.selectedTool === 'block') {
      this.toggleSeatBlock(seat);
    }
  }

  // Section Methods
  onSectionCreated(config: any) {
    const rows = this.generateRowLabels(config.startRow, config.rowCount);
    
    const newSection: SeatingSection = {
      id: Date.now().toString(),
      name: config.name,
      type: config.type,
      color: config.color,
      rows: rows,
      seatsPerRow: config.seatsPerRow,
      capacity: config.rowCount * config.seatsPerRow,
      startRow: config.startRow,
      rowCount: config.rowCount,
      priceTier: 'standard',
      position: config.position,
      width: config.width
    };

    this.seatingPlan.sections.push(newSection);
    this.generateSeatsForSection(newSection);
    this.calculateStats();
  }

  onTemplateSectionAdded(template: any) {
    const rows = this.generateRowLabels('A', 5);
    
    const newSection: SeatingSection = {
      id: Date.now().toString(),
      name: template.name,
      type: template.type,
      color: template.color,
      rows: rows,
      seatsPerRow: 10,
      capacity: 50,
      startRow: 'A',
      rowCount: 5,
      priceTier: template.type === 'vip' ? 'premium' : 'standard',
      position: template.position,
      width: template.width
    };

    this.seatingPlan.sections.push(newSection);
    this.generateSeatsForSection(newSection);
    this.calculateStats();
  }











  // Seat Methods
  toggleSeatAccessibility(seat: Seat) {
    if (seat.type === 'accessible') {
      seat.type = 'standard';
    } else {
      seat.type = 'accessible';
    }
    this.calculateStats();
  }

  toggleSeatBlock(seat: Seat) {
    if (seat.status === 'blocked') {
      seat.status = 'available';
    } else {
      seat.status = 'blocked';
    }
  }

  // Layout Methods
  changeLayout(layout: string) {
    this.seatingPlan.layout = layout as any;
    
    if ((layout === 'split' || layout === 'theater' || layout === 'stadium') && this.seatingPlan.sections.length === 0) {
      this.autoGenerateLayout();
    }
  }

  autoGenerateLayout() {
    this.seatingPlan.sections = [];
    this.seatingPlan.seats = [];
    
    switch (this.seatingPlan.layout) {
      case 'split':
        this.autoGenerateSplitLayout();
        break;
      case 'theater':
        this.autoGenerateTheaterLayout();
        break;
      case 'stadium':
        this.autoGenerateStadiumLayout();
        break;
      default:
        this.autoGenerateSingleLayout();
        break;
    }
    
    this.calculateStats();
  }

  private autoGenerateSingleLayout() {
    const section: SeatingSection = {
      id: '1',
      name: 'Main Seating',
      type: 'general',
      color: '#4CAF50',
      rows: this.generateRowLabels('A', 10),
      seatsPerRow: 15,
      capacity: 150,
      startRow: 'A',
      rowCount: 10,
      priceTier: 'standard',
      position: 'center',
      width: 100
    };

    this.seatingPlan.sections.push(section);
    this.generateSeatsForSection(section);
  }

  private autoGenerateSplitLayout() {
    const sections = [
      { name: 'Orchestra Left', position: 'left', color: '#2196F3', width: 30, rows: 5, seatsPerRow: 6 },
      { name: 'Orchestra Center', position: 'center', color: '#4CAF50', width: 40, rows: 5, seatsPerRow: 12 },
      { name: 'Orchestra Right', position: 'right', color: '#2196F3', width: 30, rows: 5, seatsPerRow: 6 }
    ];

    sections.forEach((config, index) => {
      const section: SeatingSection = {
        id: (index + 1).toString(),
        name: config.name,
        type: config.position === 'center' ? 'general' : 'side',
        color: config.color,
        rows: this.generateRowLabels('A', config.rows),
        seatsPerRow: config.seatsPerRow,
        capacity: config.rows * config.seatsPerRow,
        startRow: 'A',
        rowCount: config.rows,
        priceTier: config.position === 'center' ? 'premium' : 'standard',
        position: config.position as any,
        width: config.width
      };

      this.seatingPlan.sections.push(section);
      this.generateSeatsForSection(section);
    });
  }

  private autoGenerateTheaterLayout() {
    const sections = [
      { name: 'Orchestra', position: 'center', color: '#4CAF50', width: 100, rows: 10, seatsPerRow: 15, type: 'general' },
      { name: 'Mezzanine', position: 'upper', color: '#FF9800', width: 100, rows: 6, seatsPerRow: 12, type: 'balcony' },
      { name: 'Balcony', position: 'upper', color: '#607D8B', width: 100, rows: 4, seatsPerRow: 10, type: 'balcony' }
    ];

    sections.forEach((config, index) => {
      const startRow = index === 0 ? 'A' : index === 1 ? 'K' : 'Q';
      
      const section: SeatingSection = {
        id: (index + 1).toString(),
        name: config.name,
        type: config.type as any,
        color: config.color,
        rows: this.generateRowLabels(startRow, config.rows),
        seatsPerRow: config.seatsPerRow,
        capacity: config.rows * config.seatsPerRow,
        startRow: startRow,
        rowCount: config.rows,
        priceTier: index === 0 ? 'premium' : 'standard',
        position: config.position as any,
        width: config.width
      };

      this.seatingPlan.sections.push(section);
      this.generateSeatsForSection(section);
    });
  }

  private autoGenerateStadiumLayout() {
    const sections = [
      { name: 'Lower Level', position: 'lower', color: '#4CAF50', width: 100, rows: 15, seatsPerRow: 20, type: 'general' },
      { name: 'Club Level', position: 'center', color: '#FF9800', width: 100, rows: 10, seatsPerRow: 18, type: 'vip' },
      { name: 'Upper Level', position: 'upper', color: '#2196F3', width: 100, rows: 8, seatsPerRow: 15, type: 'general' }
    ];

    sections.forEach((config, index) => {
      const startRow = index === 0 ? 'A' : index === 1 ? 'P' : 'Z';
      
      const section: SeatingSection = {
        id: (index + 1).toString(),
        name: config.name,
        type: config.type as any,
        color: config.color,
        rows: this.generateRowLabels(startRow, config.rows),
        seatsPerRow: config.seatsPerRow,
        capacity: config.rows * config.seatsPerRow,
        startRow: startRow,
        rowCount: config.rows,
        priceTier: index === 1 ? 'premium' : 'standard',
        position: config.position as any,
        width: config.width
      };

      this.seatingPlan.sections.push(section);
      this.generateSeatsForSection(section);
    });
  }

  // Utility Methods
  private calculateStats() {
    this.seatingPlan.totalSeats = this.seatingPlan.seats.length;
    this.seatingPlan.accessibleSeats = this.seatingPlan.seats.filter(seat => 
      seat.type === 'accessible' || seat.type === 'companion'
    ).length;
    
    this.seatingPlan.sections.forEach(section => {
      const sectionSeats = this.seatingPlan.seats.filter(seat => seat.section === section.id);
      section.capacity = sectionSeats.length;
    });
  }

  private generateRowLabels(startRow: string, count: number): string[] {
    const startIndex = this.rowLetters.indexOf(startRow.toUpperCase());
    if (startIndex === -1) return [startRow];
    
    const rows: string[] = [];
    for (let i = 0; i < count; i++) {
      if (startIndex + i < this.rowLetters.length) {
        rows.push(this.rowLetters[startIndex + i]);
      } else {
        const firstChar = this.rowLetters[Math.floor((startIndex + i) / this.rowLetters.length) - 1];
        const secondChar = this.rowLetters[(startIndex + i) % this.rowLetters.length];
        rows.push(firstChar + secondChar);
      }
    }
    return rows;
  }


  // Helper Methods for Template
  getSectionsByPosition(position: string): SeatingSection[] {
    return this.seatingPlan.sections.filter(section => section.position === position);
  }

  getSeatsForSection(sectionId: string): Seat[] {
    return this.seatingPlan.seats.filter(seat => seat.section === sectionId);
  }

  hasSections(): boolean {
    return this.seatingPlan.sections.length > 0;
  }

  // Navigation Methods
  saveSeatingPlan() {
    this.seatingPlan.lastModified = new Date();
    console.log('Saving seating plan:', this.seatingPlan);
    this.router.navigate(['/venues']);
  }

  cancel() {
    this.router.navigate(['/venues']);
  }
































  // Add this method to handle section actions
  onSectionAction(event: {section: SeatingSection, action: string}) {
    console.log('Section action received:', event.action, 'for section:', event.section.name);
    
    switch (event.action) {
      case 'delete':
        this.deleteSection(event.section);
        break;
      case 'duplicate':
        this.duplicateSection(event.section);
        break;
      case 'add-rows':
        this.addRowsToSection(event.section);
        break;
      case 'adjust-columns':
        this.adjustColumnsInSection(event.section);
        break;
      default:
        console.warn('Unknown action:', event.action);
    }
  }

  // FIXED: Complete implementation for add rows
  addRowsToSection(section: SeatingSection) {
    const currentLastRow = section.rows[section.rows.length - 1];
    const newRowLabel = this.getNextRow(currentLastRow);
    
    // Add new row to section
    section.rows.push(newRowLabel);
    section.rowCount = section.rows.length;
    
    // Generate seats for the new row
    this.generateSeatsForNewRow(section, newRowLabel);
    this.calculateStats();
    
    console.log(`Added row ${newRowLabel} to section ${section.name}`);
  }

  // FIXED: Complete implementation for adjust columns
  adjustColumnsInSection(section: SeatingSection) {
    const newSeatsPerRow = prompt(
      `Enter new number of seats per row for "${section.name}":`, 
      section.seatsPerRow.toString()
    );
    
    if (newSeatsPerRow) {
      const seatsPerRow = parseInt(newSeatsPerRow, 10);
      if (seatsPerRow > 0 && seatsPerRow <= 50) {
        const oldSeatsPerRow = section.seatsPerRow;
        section.seatsPerRow = seatsPerRow;
        
        if (seatsPerRow > oldSeatsPerRow) {
          // Add new seats to existing rows
          this.addSeatsToExistingRows(section, oldSeatsPerRow, seatsPerRow);
        } else {
          // Remove excess seats
          this.removeExcessSeats(section, seatsPerRow);
        }
        
        this.calculateStats();
        console.log(`Adjusted columns to ${seatsPerRow} for section ${section.name}`);
      } else {
        alert('Please enter a valid number between 1 and 50.');
      }
    }
  }

  // FIXED: Complete implementation for duplicate section
  duplicateSection(section: SeatingSection) {
    const newSection: SeatingSection = {
      ...section,
      id: Date.now().toString(),
      name: `${section.name} Copy`,
      rows: [...section.rows], // Copy the rows array
      startRow: section.rows[0] // Use first row as start
    };

    this.seatingPlan.sections.push(newSection);
    
    // Generate seats for the duplicated section
    this.generateSeatsForSection(newSection);
    this.calculateStats();
    
    console.log(`Duplicated section: ${section.name} -> ${newSection.name}`);
  }

  // FIXED: Complete implementation for delete section
  deleteSection(section: SeatingSection) {
    if (confirm(`Are you sure you want to delete section "${section.name}" and all its ${section.capacity} seats?`)) {
      this.seatingPlan.sections = this.seatingPlan.sections.filter(s => s.id !== section.id);
      this.seatingPlan.seats = this.seatingPlan.seats.filter(seat => seat.section !== section.id);
      this.calculateStats();
      console.log(`Deleted section: ${section.name}`);
    }
  }

  // FIXED: Price tier change implementation
  onPriceTierChange(event: {section: SeatingSection, priceTierId: string}) {
    console.log('Price tier change:', event.priceTierId, 'for section:', event.section.name);
    
    event.section.priceTier = event.priceTierId;
    
    // Update all seats in this section with the new price tier
    this.seatingPlan.seats.forEach(seat => {
      if (seat.section === event.section.id) {
        seat.priceTier = event.priceTierId;
      }
    });
    
    this.calculateStats();
  }

  // NEW: Helper method to generate seats for a new row
  private generateSeatsForNewRow(section: SeatingSection, rowLabel: string) {
    let seatId = this.seatingPlan.seats.length + 1;
    
    for (let i = 1; i <= section.seatsPerRow; i++) {
      this.seatingPlan.seats.push({
        id: (seatId++).toString(),
        row: rowLabel,
        number: i,
        type: 'standard',
        section: section.id,
        x: 0,
        y: 0,
        status: 'available',
        priceTier: section.priceTier
      });
    }
  }

  // NEW: Helper method to add seats to existing rows
  private addSeatsToExistingRows(section: SeatingSection, oldSeatsPerRow: number, newSeatsPerRow: number) {
    let seatId = this.seatingPlan.seats.length + 1;
    
    section.rows.forEach(row => {
      for (let i = oldSeatsPerRow + 1; i <= newSeatsPerRow; i++) {
        this.seatingPlan.seats.push({
          id: (seatId++).toString(),
          row: row,
          number: i,
          type: 'standard',
          section: section.id,
          x: 0,
          y: 0,
          status: 'available',
          priceTier: section.priceTier
        });
      }
    });
  }

  // NEW: Helper method to remove excess seats
  private removeExcessSeats(section: SeatingSection, newSeatsPerRow: number) {
    this.seatingPlan.seats = this.seatingPlan.seats.filter(seat => {
      if (seat.section === section.id) {
        return seat.number <= newSeatsPerRow;
      }
      return true;
    });
  }

  // FIXED: Improved seat generation method
  private generateSeatsForSection(section: SeatingSection) {
    // Remove existing seats for this section
    this.seatingPlan.seats = this.seatingPlan.seats.filter(seat => seat.section !== section.id);

    let seatId = this.seatingPlan.seats.length + 1;

    section.rows.forEach(row => {
      for (let i = 1; i <= section.seatsPerRow; i++) {
        this.seatingPlan.seats.push({
          id: (seatId++).toString(),
          row: row,
          number: i,
          type: 'standard',
          section: section.id,
          x: 0,
          y: 0,
          status: 'available',
          priceTier: section.priceTier
        });
      }
    });
  }

  // ... rest of existing methods ...

  // Ensure this method exists for row label generation
  private getNextRow(currentRow: string): string {
    if (currentRow.length === 1) {
      const index = this.rowLetters.indexOf(currentRow);
      return index < this.rowLetters.length - 1 ? this.rowLetters[index + 1] : 'AA';
    } else {
      // Handle double-letter rows (AA, AB, etc.)
      const firstChar = currentRow[0];
      const secondChar = currentRow[1];
      const secondIndex = this.rowLetters.indexOf(secondChar);
      
      if (secondIndex < this.rowLetters.length - 1) {
        return firstChar + this.rowLetters[secondIndex + 1];
      } else {
        // If second char is Z, move to next first char
        const firstIndex = this.rowLetters.indexOf(firstChar);
        return this.rowLetters[firstIndex + 1] + 'A';
      }
    }
  }
}