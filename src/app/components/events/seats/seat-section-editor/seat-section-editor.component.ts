// seat-section-editor.component.ts
import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Models
export interface VenueSection {
  id: string;
  name: string;
  type: 'stage' | 'vip' | 'premium' | 'standard' | 'economy' | 'standing' | 'bar' | 'seated';
  color: string;
  icon: string;
  price: number;
  description?: string;
  capacity: number;
  available: number;
  gridArea: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
  seatingConfig?: {
    rows: number;
    seatsPerRow: number;
    hasAisle: boolean;
    aislePosition?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VenueLayout {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  gridRows: number;
  gridCols: number;
  sections: VenueSection[];
  totalCapacity: number;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-seat-section-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seat-section-editor.component.html',
  styleUrls: ['./seat-section-editor.component.scss']
})
export class SeatSectionEditorComponent implements OnInit, OnDestroy {
  @Input() layout!: VenueLayout;
  @Input() eventId!: string;
  @Output() layoutChange = new EventEmitter<VenueLayout>();
  @Output() sectionSelect = new EventEmitter<VenueSection>();
  @Output() save = new EventEmitter<VenueLayout>();
  
  private destroy$ = new Subject<void>();
  
  // Grid configuration
  rows = 10;
  cols = 12;
  cellSize = 60;
  showGrid = true;
  Math = Math;
  // Section configuration
  sections: VenueSection[] = [];
  selectedSection: VenueSection | null = null;
  isDragging = false;
  dragStart: { row: number, col: number } | null = null;
  dragEnd: { row: number, col: number } | null = null;
  
  // Form models
  sectionForm = {
    name: '',
    type: 'seated' as VenueSection['type'],
    price: 0,
    capacity: 0,
    color: '#3b82f6',
    rows: 10,
    seatsPerRow: 12,
    hasAisle: true,
    aislePosition: 6
  };
  
  // Section types with professional color scheme
  sectionTypes = [
    { id: 'stage', name: 'Stage', icon: '🎤', color: '#1f2937', defaultPrice: 0 },
    { id: 'vip', name: 'VIP', icon: '👑', color: '#7c3aed', defaultPrice: 150 },
    { id: 'premium', name: 'Premium', icon: '💎', color: '#2563eb', defaultPrice: 100 },
    { id: 'standard', name: 'Standard', icon: '⭐', color: '#059669', defaultPrice: 75 },
    { id: 'economy', name: 'Economy', icon: '💺', color: '#d97706', defaultPrice: 50 },
    { id: 'standing', name: 'Standing', icon: '👥', color: '#dc2626', defaultPrice: 30 },
    { id: 'bar', name: 'Bar Area', icon: '🍸', color: '#9333ea', defaultPrice: 0 },
    { id: 'seated', name: 'Seated Area', icon: '🪑', color: '#0d9488', defaultPrice: 60 }
  ];
  
  // Grid templates
  gridTemplates = [
    { id: 'small', name: 'Small Venue', rows: 8, cols: 10 },
    { id: 'medium', name: 'Medium Venue', rows: 10, cols: 12 },
    { id: 'large', name: 'Large Venue', rows: 12, cols: 16 },
    { id: 'arena', name: 'Arena', rows: 15, cols: 20 },
    { id: 'custom', name: 'Custom', rows: 0, cols: 0 }
  ];
  selectedTemplate = 'medium';
  
  // UI state
  isEditing = false;
  isLoading = false;
  hasUnsavedChanges = false;
  
  ngOnInit() {
    if (this.layout) {
      this.loadLayout(this.layout);
    } else {
      this.initializeNewLayout();
    }
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadLayout(layout: VenueLayout) {
    this.rows = layout.gridRows;
    this.cols = layout.gridCols;
    this.sections = [...layout.sections];
  }
  
  initializeNewLayout() {
    this.layout = {
      id: '',
      eventId: this.eventId,
      name: 'Venue Layout',
      gridRows: this.rows,
      gridCols: this.cols,
      sections: [],
      totalCapacity: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  onTemplateChange() {
    const template = this.gridTemplates.find(t => t.id === this.selectedTemplate);
    if (template && template.id !== 'custom') {
      this.rows = template.rows;
      this.cols = template.cols;
      this.layout.gridRows = this.rows;
      this.layout.gridCols = this.cols;
      this.hasUnsavedChanges = true;
    }
  }
  
  onSectionTypeSelect(typeId: string) {
    const type = this.sectionTypes.find(t => t.id === typeId);
    if (type) {
      this.sectionForm.type = type.id as VenueSection['type'];
      this.sectionForm.color = type.color;
      this.sectionForm.price = type.defaultPrice;
      
      // Set default capacity based on type
      if (type.id === 'seated') {
        this.sectionForm.capacity = this.sectionForm.rows * this.sectionForm.seatsPerRow;
      } else if (type.id === 'standing') {
        this.sectionForm.capacity = 100;
      } else if (type.id === 'stage') {
        this.sectionForm.capacity = 0;
      } else {
        this.sectionForm.capacity = 50;
      }
    }
  }
  
  startDrag(row: number, col: number) {
    if (!this.sectionForm.name) {
      alert('Please enter a section name first');
      return;
    }
    
    this.isDragging = true;
    this.dragStart = { row, col };
    this.dragEnd = { row, col };
  }
  
  extendDrag(row: number, col: number) {
    if (this.isDragging && this.dragStart) {
      this.dragEnd = {
        row: Math.min(Math.max(row, 0), this.rows - 1),
        col: Math.min(Math.max(col, 0), this.cols - 1)
      };
    }
  }
  
  endDrag() {
    if (this.isDragging && this.dragStart && this.dragEnd) {
      const startRow = Math.min(this.dragStart.row, this.dragEnd.row);
      const endRow = Math.max(this.dragStart.row, this.dragEnd.row);
      const startCol = Math.min(this.dragStart.col, this.dragEnd.col);
      const endCol = Math.max(this.dragStart.col, this.dragEnd.col);
      
      if (this.isAreaAvailable(startRow, endRow, startCol, endCol)) {
        this.createSection(startRow, endRow, startCol, endCol);
      } else {
        alert('Selected area overlaps with existing sections');
      }
    }
    
    this.isDragging = false;
    this.dragStart = null;
    this.dragEnd = null;
  }
  
  isAreaAvailable(startRow: number, endRow: number, startCol: number, endCol: number): boolean {
    return !this.sections.some(section => {
      const { startRow: sRow, endRow: eRow, startCol: sCol, endCol: eCol } = section.gridArea;
      return !(endRow < sRow || startRow > eRow || endCol < sCol || startCol > eCol);
    });
  }
  
  createSection(startRow: number, endRow: number, startCol: number, endCol: number) {
    const sectionType = this.sectionTypes.find(t => t.id === this.sectionForm.type);
    
    const section: VenueSection = {
      id: `section-${Date.now()}`,
      name: this.sectionForm.name,
      type: this.sectionForm.type,
      color: this.sectionForm.color,
      icon: sectionType?.icon || '📌',
      price: this.sectionForm.price,
      capacity: this.sectionForm.capacity,
      available: this.sectionForm.capacity,
      gridArea: { startRow, endRow, startCol, endCol },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (this.sectionForm.type === 'seated') {
      section.seatingConfig = {
        rows: this.sectionForm.rows,
        seatsPerRow: this.sectionForm.seatsPerRow,
        hasAisle: this.sectionForm.hasAisle,
        aislePosition: this.sectionForm.aislePosition
      };
    }
    
    this.sections.push(section);
    this.selectedSection = section;
    this.updateLayoutStats();
    this.hasUnsavedChanges = true;
    
    // Reset form
    this.sectionForm.name = '';
  }
  
  onSectionClick(section: VenueSection) {
    this.selectedSection = section;
    this.isEditing = true;
    
    // Load section data into form
    this.sectionForm.name = section.name;
    this.sectionForm.type = section.type;
    this.sectionForm.price = section.price;
    this.sectionForm.capacity = section.capacity;
    this.sectionForm.color = section.color;
    
    if (section.seatingConfig) {
      this.sectionForm.rows = section.seatingConfig.rows;
      this.sectionForm.seatsPerRow = section.seatingConfig.seatsPerRow;
      this.sectionForm.hasAisle = section.seatingConfig.hasAisle;
      this.sectionForm.aislePosition = section.seatingConfig.aislePosition || 6;
    }
    
    this.sectionSelect.emit(section);
  }
  
  updateSection() {
    if (!this.selectedSection) return;
    
    const index = this.sections.findIndex(s => s.id === this.selectedSection!.id);
    if (index !== -1) {
      this.sections[index] = {
        ...this.sections[index],
        name: this.sectionForm.name,
        type: this.sectionForm.type,
        price: this.sectionForm.price,
        capacity: this.sectionForm.capacity,
        color: this.sectionForm.color,
        updatedAt: new Date(),
        seatingConfig: this.sectionForm.type === 'seated' ? {
          rows: this.sectionForm.rows,
          seatsPerRow: this.sectionForm.seatsPerRow,
          hasAisle: this.sectionForm.hasAisle,
          aislePosition: this.sectionForm.aislePosition
        } : undefined
      };
      
      this.updateLayoutStats();
      this.hasUnsavedChanges = true;
      this.isEditing = false;
    }
  }
  
  deleteSection(sectionId: string) {
    if (confirm('Are you sure you want to delete this section?')) {
      this.sections = this.sections.filter(s => s.id !== sectionId);
      if (this.selectedSection?.id === sectionId) {
        this.selectedSection = null;
        this.isEditing = false;
      }
      this.updateLayoutStats();
      this.hasUnsavedChanges = true;
    }
  }
  
  updateLayoutStats() {
    this.layout.sections = this.sections;
    this.layout.totalCapacity = this.sections.reduce((sum, section) => sum + section.capacity, 0);
    this.layout.updatedAt = new Date();
    this.layoutChange.emit(this.layout);
  }
  
  saveLayout() {
    this.isLoading = true;
    this.layout.updatedAt = new Date();
    
    // Simulate API call
    setTimeout(() => {
      this.save.emit(this.layout);
      this.hasUnsavedChanges = false;
      this.isLoading = false;
    }, 500);
  }
  
  cancelEdit() {
    this.isEditing = false;
    this.selectedSection = null;
    this.sectionForm.name = '';
  }
  
  // Grid helper methods
  isInDragArea(row: number, col: number): boolean {
    if (!this.isDragging || !this.dragStart || !this.dragEnd) return false;
    
    const startRow = Math.min(this.dragStart.row, this.dragEnd.row);
    const endRow = Math.max(this.dragStart.row, this.dragEnd.row);
    const startCol = Math.min(this.dragStart.col, this.dragEnd.col);
    const endCol = Math.max(this.dragStart.col, this.dragEnd.col);
    
    return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
  }
  
  getCellColor(row: number, col: number): string {
    const section = this.sections.find(s =>
      row >= s.gridArea.startRow && row <= s.gridArea.endRow &&
      col >= s.gridArea.startCol && col <= s.gridArea.endCol
    );
    
    if (section) {
      if (this.selectedSection?.id === section.id) {
        return this.adjustColor(section.color, 20); // Lighten selected section
      }
      return section.color;
    }
    
    if (this.isInDragArea(row, col)) {
      return this.sectionForm.color + '40'; // Add transparency
    }
    
    return '#f8fafc';
  }
  
  adjustColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(
      0x1000000 +
      (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1)}`;
  }

  // Add helper methods to component
getCellType(row: number, col: number): string {
  const section = this.sections.find(s =>
    row >= s.gridArea.startRow && row <= s.gridArea.endRow &&
    col >= s.gridArea.startCol && col <= s.gridArea.endCol
  );
  return section?.icon || '';
}

getCellCapacity(row: number, col: number): number {
  const section = this.sections.find(s =>
    row >= s.gridArea.startRow && row <= s.gridArea.endRow &&
    col >= s.gridArea.startCol && col <= s.gridArea.endCol
  );
  return section?.capacity || 0;
}

onCellClick(row: number, col: number) {
  const section = this.sections.find(s =>
    row >= s.gridArea.startRow && row <= s.gridArea.endRow &&
    col >= s.gridArea.startCol && col <= s.gridArea.endCol
  );
  if (section) {
    this.onSectionClick(section);
  }
}
}