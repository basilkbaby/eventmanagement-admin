
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeatingPlan } from '../../../../core/models/seating.interface';

@Component({
  selector: 'app-design-tools',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './design-tools.component.html',
  styleUrls: ['./design-tools.component.scss']
})
export class DesignToolsComponent {
  @Input() seatingPlan!: SeatingPlan;
  @Input() selectedTool: string = 'select';
  @Output() toolSelected = new EventEmitter<string>();
  @Output() sectionCreated = new EventEmitter<any>();
  @Output() templateSectionAdded = new EventEmitter<any>();

  layoutOptions = [
    { value: 'single', name: 'Single Section', description: 'One continuous seating area' },
    { value: 'split', name: 'Split Layout', description: 'Left, center, and right sections' },
    { value: 'stadium', name: 'Stadium Style', description: 'Tiered seating with multiple levels' },
    { value: 'theater', name: 'Theater Style', description: 'Orchestra and balcony sections' }
  ];

  sectionTemplates = [
    { name: 'Center Section', type: 'general', color: '#4CAF50', position: 'center', width: 100 },
    { name: 'Left Section', type: 'side', color: '#2196F3', position: 'left', width: 30 },
    { name: 'Right Section', type: 'side', color: '#2196F3', position: 'right', width: 30 },
    { name: 'VIP Section', type: 'vip', color: '#FF9800', position: 'center', width: 100 },
    { name: 'Box Seats', type: 'box', color: '#9C27B0', position: 'upper', width: 100 },
    { name: 'Balcony', type: 'balcony', color: '#607D8B', position: 'upper', width: 100 }
  ];

  newSectionConfig = {
    name: '',
    type: 'general' as 'general' | 'vip' | 'box' | 'balcony' | 'side',
    startRow: 'A',
    rowCount: 5,
    seatsPerRow: 10,
    color: '#4CAF50',
    position: 'center' as 'center' | 'left' | 'right' | 'upper' | 'lower',
    width: 100
  };

  selectTool(tool: string) {
    this.toolSelected.emit(tool);
  }

  createCustomSection() {
    if (!this.newSectionConfig.name.trim()) return;
    this.sectionCreated.emit({...this.newSectionConfig});
    
    // Reset form
    this.newSectionConfig = {
      name: '',
      type: 'general',
      startRow: 'A',
      rowCount: 5,
      seatsPerRow: 10,
      color: '#4CAF50',
      position: 'center',
      width: 100
    };
  }

  addTemplateSection(template: any) {
    this.templateSectionAdded.emit(template);
  }

  getLayoutDescription(): string {
    const layout = this.layoutOptions.find(l => l.value === this.seatingPlan.layout);
    return layout ? layout.description : '';
  }
}