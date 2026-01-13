import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Seat {
  row: number;
  number: number;
  status: 'available' | 'selected' | 'sold' | 'blocked' | 'accessible' | 'partial-view';
  price: number;
  isAccessible?: boolean;
  isPartialView?: boolean;
  userDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    purchaseAmount?: number;
    purchaseDate?: Date;
    transactionId?: string;
  };
  blockedUntil?: Date;
  blockedReason?: string;
  notes?: string;
}

interface VenueSection {
  id: string;
  name: string;
  type: 'middle-left' | 'middle-right' | 'wing-left' | 'wing-right' | 'stage' | 'vip' | 'standing';
  color: string;
  basePrice: number;
  capacity: number;
  available: number;
  rowOffset?: number;
  seatingConfig?: {
    rows: number;
    seatsPerRow: number;
    aislePosition?: number;
    accessibleRows?: number[];
    partialViewRows?: number[];
  };
}

interface QuickAction {
  label: string;
  icon: string;
  action: () => void;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  selector: 'app-seat-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './seat-editor.component.html',
  styleUrls: ['./seat-editor.component.scss']
})
export class SeatEditorComponent implements OnInit {
  @ViewChild('seatMapContainer') seatMapContainer!: ElementRef;
  @ViewChild('selectedList') selectedList!: ElementRef;

  // Core data
  sectionId?: string;
  section?: VenueSection;
  rows: number[] = [];
  seats: number[] = [];
  
  // Seat collections
  selectedSeats: Seat[] = [];
  seatMap = new Map<string, Seat>();
  
  // Modal states
  activeModal: 'sold' | 'block' | 'details' | null = null;
  currentSeat?: Seat;
  
  Math = Math;
  // Forms with better structure
  saleForm = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    purchaseAmount: 0,
    transactionId: '',
    notes: ''
  };
  
  blockForm = {
    reason: 'Maintenance',
    duration: 24,
    notes: ''
  };
  
  seatForm = {
    isAccessible: false,
    isPartialView: false,
    notes: ''
  };
  
  // Tooltip
  tooltip = {
    show: false,
    content: '',
    x: 0,
    y: 0
  };
  
  // Zoom & Pan
  zoomLevel = 1;
  panOffset = { x: 0, y: 0 };
  isPanning = false;
  startPanPoint = { x: 0, y: 0 };
  
  // Quick actions
  quickActions: QuickAction[] = [];
  
  // Statistics
  stats = {
    total: 0,
    sold: 0,
    blocked: 0,
    accessible: 0,
    partialView: 0,
    available: 0,
    selected: 0
  };
  
  // Sample data
  sampleSections: VenueSection[] = [
    {
      id: 'middle-left',
      name: 'Middle Left Section',
      type: 'middle-left',
      color: '#3b82f6',
      basePrice: 150,
      capacity: 204,
      available: 85,
      rowOffset: 0,
      seatingConfig: {
        rows: 17,
        seatsPerRow: 12,
        aislePosition: 6,
        accessibleRows: [1, 2],
        partialViewRows: [16, 17]
      }
    },
    {
      id: 'middle-right',
      name: 'Middle Right Section',
      type: 'middle-right',
      color: '#3b82f6',
      basePrice: 150,
      capacity: 204,
      available: 92,
      rowOffset: 0,
      seatingConfig: {
        rows: 17,
        seatsPerRow: 12,
        aislePosition: 6,
        accessibleRows: [1, 2],
        partialViewRows: [16, 17]
      }
    }
  ];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.sectionId = params.get('sectionId') || undefined;
      this.loadSectionData();
    });
  }
  
  loadSectionData() {
    if (!this.sectionId) return;
    
    this.section = this.sampleSections.find(s => s.id === this.sectionId);
    if (!this.section) {
      this.router.navigate(['/venue']);
      return;
    }
    
    this.initializeSeatMap();
    this.generateSeatData();
    this.initQuickActions();
    this.updateStatistics();
  }
  
  initializeSeatMap() {
    if (this.section?.seatingConfig) {
      const config = this.section.seatingConfig;
      this.rows = Array.from({ length: config.rows }, (_, i) => i + 1);
      this.seats = Array.from({ length: config.seatsPerRow }, (_, i) => i + 1);
    }
  }
  
generateSeatData() {
  if (!this.section?.seatingConfig) return;
  const config = this.section.seatingConfig;
  const basePrice = this.section?.basePrice || 0; // Add null check
  
  // Clear existing data
  this.seatMap.clear();
  
  // Generate all seats
  this.rows.forEach(row => {
    this.seats.forEach(seatNum => {
      if (this.isAisleSeat(seatNum)) return;
      
      const seatKey = `${row}-${seatNum}`;
      const actualRow = row + (this.section?.rowOffset || 0);
      let status: Seat['status'] = 'available';
      let price = basePrice; // Use the checked variable
      let isAccessible = config.accessibleRows?.includes(row) || false;
      let isPartialView = config.partialViewRows?.includes(row) || false;
      
      if (isAccessible) status = 'accessible';
      if (isPartialView) {
        status = 'partial-view';
        price = basePrice * 0.8; // Use the checked variable
      }
      
      const seat: Seat = {
        row: actualRow,
        number: seatNum,
        status,
        price,
        isAccessible,
        isPartialView
      };
      
      this.seatMap.set(seatKey, seat);
    });
  });
  
  // Generate sample data
  this.generateSampleData();
}
  
  generateSampleData() {
    // Sample sold seats
    const soldSeats = [
      '2-3', '2-4', '3-5', '4-2', '4-3', '5-7', '6-1', '6-2',
      '7-8', '8-4', '8-5', '9-6', '10-3', '10-4', '11-7'
    ];
    
    soldSeats.forEach(key => {
      const seat = this.seatMap.get(key);
      if (seat) {
        seat.status = 'sold';
        seat.userDetails = {
          name: `Customer ${Math.floor(Math.random() * 100)}`,
          email: `customer${Math.floor(Math.random() * 1000)}@example.com`,
          phone: `+1 (555) ${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
          purchaseAmount: seat.price,
          purchaseDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          transactionId: `TXN${100000 + Math.floor(Math.random() * 900000)}`
        };
      }
    });
    
    // Sample blocked seats
    const blockedSeats = ['1-8', '3-10', '5-4', '7-1', '9-11'];
    blockedSeats.forEach(key => {
      const seat = this.seatMap.get(key);
      if (seat && seat.status !== 'sold') {
        seat.status = 'blocked';
        seat.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        seat.blockedReason = 'Maintenance';
        seat.notes = 'Seat temporarily unavailable for maintenance';
      }
    });
  }
  
  initQuickActions() {
    this.quickActions = [
      {
        label: 'Mark as Sold',
        icon: '💰',
        action: () => this.openModal('sold'),
        color: 'success',
        tooltip: 'Mark selected seats as sold with customer details'
      },
      {
        label: 'Toggle Block',
        icon: '🚫',
        action: () => this.openModal('block'),
        color: 'danger',
        tooltip: 'Block or unblock selected seats'
      },
      {
        label: 'Make Accessible',
        icon: '♿',
        action: () => this.toggleAccessible(),
        color: 'primary',
        tooltip: 'Toggle accessible status for selected seats'
      },
      {
        label: 'Partial View',
        icon: '👁️',
        action: () => this.togglePartialView(),
        color: 'warning',
        tooltip: 'Toggle partial view status (20% discount)'
      },
      {
        label: 'Bulk Edit',
        icon: '✏️',
        action: () => this.openModal('details'),
        color: 'info',
        tooltip: 'Edit details for all selected seats'
      },
      {
        label: 'Clear All',
        icon: '🗑️',
        action: () => this.clearSelection(),
        color: 'secondary',
        tooltip: 'Clear all selected seats'
      }
    ];
  }
  
  // Seat interaction
  toggleSeat(row: number, seatNum: number, event?: MouseEvent) {
    if (event?.ctrlKey || event?.metaKey) {
      this.showSeatDetails(row, seatNum);
      return;
    }
    
    if (event?.shiftKey) {
      this.selectRange(row, seatNum);
      return;
    }
    
    const seatKey = `${row}-${seatNum}`;
    const seatData = this.seatMap.get(seatKey);
    
    if (!seatData || seatData.status === 'sold' || seatData.status === 'blocked' || this.isAisleSeat(seatNum)) {
      return;
    }
    
    const index = this.selectedSeats.findIndex(s => 
      s.row === seatData.row && s.number === seatData.number
    );
    
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push({ ...seatData });
    }
    
    this.updateStatistics();
  }
  
  showSeatDetails(row: number, seatNum: number) {
    const seatKey = `${row}-${seatNum}`;
    const seatData = this.seatMap.get(seatKey);
    
    if (seatData) {
      this.currentSeat = seatData;
      this.seatForm = {
        isAccessible: seatData.isAccessible || false,
        isPartialView: seatData.isPartialView || false,
        notes: seatData.notes || ''
      };
      this.openModal('details');
    }
  }
  
  selectRange(row: number, seatNum: number) {
    // Simple range selection for demo
    const seatKey = `${row}-${seatNum}`;
    const seatData = this.seatMap.get(seatKey);
    
    if (!seatData) return;
    
    // Select seats in the same row
    this.seats.forEach(num => {
      if (num !== seatNum && !this.isAisleSeat(num)) {
        const key = `${row}-${num}`;
        const data = this.seatMap.get(key);
        if (data && data.status === 'available') {
          const exists = this.selectedSeats.some(s => 
            s.row === data.row && s.number === data.number
          );
          if (!exists) {
            this.selectedSeats.push({ ...data });
          }
        }
      }
    });
    
    this.updateStatistics();
  }
  
  isAisleSeat(seatNum: number): boolean {
    return seatNum === this.section?.seatingConfig?.aislePosition;
  }
  
  // Tooltip functions
  showTooltip(event: MouseEvent, row: number, seatNum: number) {
    const seatKey = `${row}-${seatNum}`;
    const seatData = this.seatMap.get(seatKey);
    const actualRow = row + (this.section?.rowOffset || 0);
    
    if (!seatData) {
      this.tooltip.content = `Row ${actualRow}, Seat ${seatNum}\nStatus: Available\nPrice: £${this.section?.basePrice || 0}`;
    } else {
      let content = `📍 Row ${actualRow}, Seat ${seatNum}\n`;
      content += `🎟️ Price: £${seatData.price.toFixed(2)}\n`;
      
      switch(seatData.status) {
        case 'sold':
          content += `🔴 Status: SOLD\n`;
          content += `👤 Customer: ${seatData.userDetails?.name}\n`;
          content += `📧 Email: ${seatData.userDetails?.email}\n`;
          content += `📅 Purchased: ${seatData.userDetails?.purchaseDate?.toLocaleDateString()}\n`;
          content += `💳 Transaction: ${seatData.userDetails?.transactionId}`;
          break;
        case 'blocked':
          content += `🚫 Status: BLOCKED\n`;
          content += `📝 Reason: ${seatData.blockedReason}\n`;
          content += `⏰ Until: ${seatData.blockedUntil?.toLocaleDateString()}\n`;
          content += `📋 Notes: ${seatData.notes || 'No notes'}`;
          break;
        case 'accessible':
          content += `♿ Status: ACCESSIBLE\n`;
          content += `✨ Features: Wheelchair accessible, extra legroom`;
          break;
        case 'partial-view':
          content += `👁️ Status: PARTIAL VIEW\n`;
          content += `💰 Discount: 20% off\n`;
          content += `📝 Note: Limited view of stage`;
          break;
        case 'selected':
          content += `⭐ Status: SELECTED\n`;
          content += `🎯 Click to deselect`;
          break;
        default:
          content += `✅ Status: AVAILABLE\n`;
          content += `🎯 Click to select`;
      }
      
      if (seatData.notes && seatData.status !== 'blocked') {
        content += `\n📋 Notes: ${seatData.notes}`;
      }
      
      this.tooltip.content = content;
    }
    
    this.tooltip.show = true;
    this.tooltip.x = event.clientX + 15;
    this.tooltip.y = event.clientY + 15;
    
    // Hide tooltip after 5 seconds
    setTimeout(() => {
      this.tooltip.show = false;
    }, 5000);
  }
  
  hideTooltip() {
    this.tooltip.show = false;
  }
  
  // Zoom & Pan
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (event.ctrlKey) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel + delta));
    }
  }
  
  startPan(event: MouseEvent) {
    if (event.button === 1 || event.altKey) { // Middle click or Alt key
      event.preventDefault();
      this.isPanning = true;
      this.startPanPoint = { x: event.clientX, y: event.clientY };
    }
  }
  
  onPan(event: MouseEvent) {
    if (!this.isPanning) return;
    
    const deltaX = event.clientX - this.startPanPoint.x;
    const deltaY = event.clientY - this.startPanPoint.y;
    
    this.panOffset.x += deltaX;
    this.panOffset.y += deltaY;
    
    this.startPanPoint = { x: event.clientX, y: event.clientY };
  }
  
  endPan() {
    this.isPanning = false;
  }
  
  resetView() {
    this.zoomLevel = 1;
    this.panOffset = { x: 0, y: 0 };
  }
  
  // Quick action methods
  toggleAccessible() {
    this.selectedSeats.forEach(seat => {
      const seatKey = `${seat.row - (this.section?.rowOffset || 0)}-${seat.number}`;
      const seatData = this.seatMap.get(seatKey);
      
      if (seatData) {
        seatData.isAccessible = !seatData.isAccessible;
        seatData.status = seatData.isAccessible ? 'accessible' : 'available';
        if (!seatData.isAccessible && !seatData.isPartialView) {
          seatData.price = this.section?.basePrice || 0;
        }
      }
    });
    this.updateStatistics();
  }
  
  togglePartialView() {
    this.selectedSeats.forEach(seat => {
      const seatKey = `${seat.row - (this.section?.rowOffset || 0)}-${seat.number}`;
      const seatData = this.seatMap.get(seatKey);
      
      if (seatData) {
        seatData.isPartialView = !seatData.isPartialView;
        seatData.status = seatData.isPartialView ? 'partial-view' : 'available';
        seatData.price = seatData.isPartialView ? 
          (this.section?.basePrice || 0) * 0.8 : 
          (this.section?.basePrice || 0);
      }
    });
    this.updateStatistics();
  }
  
  // Modal methods
  openModal(type: 'sold' | 'block' | 'details') {
    if (this.selectedSeats.length === 0 && type !== 'details') return;
    
    this.activeModal = type;
    this.currentSeat = this.selectedSeats[0];
    
    if (type === 'sold') {
      this.saleForm = {
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        purchaseAmount: this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
        transactionId: `TXN${Date.now()}`,
        notes: ''
      };
    } else if (type === 'block') {
      this.blockForm = {
        reason: 'Maintenance',
        duration: 24,
        notes: ''
      };
    }
  }
  
  closeModal() {
    this.activeModal = null;
    this.currentSeat = undefined;
  }
  
  markAsSold() {
    this.selectedSeats.forEach(seat => {
      const seatKey = `${seat.row - (this.section?.rowOffset || 0)}-${seat.number}`;
      const seatData = this.seatMap.get(seatKey);
      
      if (seatData) {
        seatData.status = 'sold';
        seatData.userDetails = {
          name: this.saleForm.customerName,
          email: this.saleForm.customerEmail,
          phone: this.saleForm.customerPhone,
          purchaseAmount: this.saleForm.purchaseAmount / this.selectedSeats.length,
          purchaseDate: new Date(),
          transactionId: this.saleForm.transactionId
        };
        seatData.notes = this.saleForm.notes;
      }
    });
    
    this.selectedSeats = [];
    this.closeModal();
    this.updateStatistics();
  }
  
  toggleBlock() {
    this.selectedSeats.forEach(seat => {
      const seatKey = `${seat.row - (this.section?.rowOffset || 0)}-${seat.number}`;
      const seatData = this.seatMap.get(seatKey);
      
      if (seatData) {
        if (seatData.status === 'blocked') {
          seatData.status = 'available';
          seatData.blockedUntil = undefined;
          seatData.blockedReason = undefined;
        } else {
          seatData.status = 'blocked';
          seatData.blockedUntil = new Date(Date.now() + this.blockForm.duration * 60 * 60 * 1000);
          seatData.blockedReason = this.blockForm.reason;
          seatData.notes = this.blockForm.notes;
        }
      }
    });
    
    this.selectedSeats = [];
    this.closeModal();
    this.updateStatistics();
  }
  
  saveSeatDetails() {
    this.selectedSeats.forEach(seat => {
      const seatKey = `${seat.row - (this.section?.rowOffset || 0)}-${seat.number}`;
      const seatData = this.seatMap.get(seatKey);
      
      if (seatData) {
        seatData.notes = this.seatForm.notes;
        seatData.isAccessible = this.seatForm.isAccessible;
        seatData.isPartialView = this.seatForm.isPartialView;
        
        if (seatData.isAccessible) {
          seatData.status = 'accessible';
        } else if (seatData.isPartialView) {
          seatData.status = 'partial-view';
          seatData.price = (this.section?.basePrice || 0) * 0.8;
        } else if (seatData.status === 'accessible' || seatData.status === 'partial-view') {
          seatData.status = 'available';
          seatData.price = this.section?.basePrice || 0;
        }
      }
    });
    
    this.closeModal();
    this.updateStatistics();
  }
  
  // Utility methods
  removeSeat(seat: Seat) {
    const index = this.selectedSeats.findIndex(s => 
      s.row === seat.row && s.number === seat.number
    );
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
      this.updateStatistics();
    }
  }
  
  clearSelection() {
    this.selectedSeats = [];
    this.updateStatistics();
  }
  
  selectAllAvailable() {
    this.seatMap.forEach((seat, key) => {
      if (seat.status === 'available' && !this.isAisleSeat(seat.number)) {
        const exists = this.selectedSeats.some(s => 
          s.row === seat.row && s.number === seat.number
        );
        if (!exists) {
          this.selectedSeats.push({ ...seat });
        }
      }
    });
    this.updateStatistics();
  }
  
  // Statistics
  updateStatistics() {
    const stats = {
      total: 0,
      sold: 0,
      blocked: 0,
      accessible: 0,
      partialView: 0,
      available: 0,
      selected: this.selectedSeats.length
    };
    
    this.seatMap.forEach(seat => {
      stats.total++;
      switch(seat.status) {
        case 'sold': stats.sold++; break;
        case 'blocked': stats.blocked++; break;
        case 'accessible': stats.accessible++; break;
        case 'partial-view': stats.partialView++; break;
        case 'available': stats.available++; break;
      }
    });
    
    this.stats = stats;
  }
  
  getSelectedTotal(): number {
    return this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }
  
  getOccupancyPercentage(): number {
    return Math.round((this.stats.sold / this.stats.total) * 100) || 0;
  }
  
  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    // Ctrl/Cmd + A to select all available
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAllAvailable();
    }
    
    // Escape to clear selection
    if (event.key === 'Escape') {
      this.clearSelection();
    }
    
    // Delete to remove from selected
    if (event.key === 'Delete' && this.selectedSeats.length > 0) {
      this.selectedSeats.pop();
      this.updateStatistics();
    }
  }
  
  // Helper for seat class
  getSeatClass(row: number, seatNum: number): string {
    const seatKey = `${row}-${seatNum}`;
    const seatData = this.seatMap.get(seatKey);
    
    if (this.isAisleSeat(seatNum)) return 'aisle';
    if (!seatData) return 'available';
    
    // Check if seat is selected
    const actualRow = row + (this.section?.rowOffset || 0);
    const isSelected = this.selectedSeats.some(s => 
      s.row === actualRow && s.number === seatNum
    );
    
    return isSelected ? 'selected' : seatData.status;
  }

  formatTooltipContent(content: string): string {
    return content.replace(/\n/g, '<br>');
  }
}