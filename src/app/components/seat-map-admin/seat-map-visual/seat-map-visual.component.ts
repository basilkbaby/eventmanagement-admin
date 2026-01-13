import { Component, ElementRef, ViewChild, Input, Output, EventEmitter, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Seat, VenueData, SeatStatus,
  SeatSectionType, getSeatColor, getSeatStatusConfig, getSeatDisplayText,
  TicketType
} from '../../../core/models/DTOs/seats.DTO.model';

@Component({
  selector: 'app-seat-map-visual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-map-visual.component.html',
  styleUrls: ['./seat-map-visual.component.scss']
})
export class SeatMapVisualComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgElement') svgElement!: ElementRef<SVGSVGElement>;
  @ViewChild('svgContainer') svgContainer!: ElementRef<HTMLDivElement>;

  // Inputs - Data to display
  @Input() venueData!: VenueData;
  @Input() seats: Seat[] = [];
  @Input() selectedSeatIds: string[] = [];
  @Input() hoveredSeatId: string | null = null;
  @Input() scale = 1;
  @Input() offsetX = 0;
  @Input() offsetY = 0;
  @Input() rowLabels: {x: number, y: number, label: string, side: 'left' | 'right'}[] = [];

  // Outputs - Events to parent
  @Output() seatClicked = new EventEmitter<Seat>();
  @Output() seatHovered = new EventEmitter<{ seat: Seat | null, mouseX: number, mouseY: number }>();
  @Output() dragStarted = new EventEmitter<MouseEvent>();
  @Output() dragMoved = new EventEmitter<MouseEvent>();
  @Output() dragEnded = new EventEmitter<void>();
  @Output() zoomed = new EventEmitter<WheelEvent>();

  // Enums for template
  readonly SeatStatus = SeatStatus;
  readonly SeatSectionType = SeatSectionType;

  // Constants
  readonly CANVAS_WIDTH = 1400;
  readonly CANVAS_HEIGHT = 1200;
  readonly BASE_SEAT_RADIUS = 8;
  readonly BASE_SEAT_GAP = 22;
  readonly STAGE_WIDTH = 500;
  readonly STAGE_HEIGHT = 60;

  // Tooltip
  tooltipLeft = 0;
  tooltipTop = 0;
  tooltipVisible = false;

  tooltipSeat: Seat | null = null;
  tooltipX = 0;
  tooltipY = 0;


  ngAfterViewInit() {
    this.setupInteractions();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private setupInteractions() {
    const svg = this.svgElement?.nativeElement;
    if (svg) {
      svg.addEventListener('mousemove', (e) => this.onHover(e));
    }
  }

  // Event handlers (forward to parent)
  onSeatClick(seat: Seat, event: MouseEvent) {
    event.stopPropagation();
    this.seatClicked.emit(seat);
  }

  onSeatHover(seat: Seat, event: MouseEvent) {
    const rect = this.svgContainer?.nativeElement?.getBoundingClientRect();
    if (rect) {
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      this.seatHovered.emit({ seat, mouseX, mouseY });
    }
  }
  onHover(event: MouseEvent) {
    const { x, y } = this.getSvgPoint(event);

    const hoveredSeat = this.seats.find(seat => {
      const dx = seat.cx - x;
      const dy = seat.cy - y;
      const radius = seat.isStandingArea
        ? seat.r || this.BASE_SEAT_RADIUS * 2
        : this.BASE_SEAT_RADIUS;

      return dx * dx + dy * dy <= radius * radius;
    });

    const containerRect = this.svgContainer.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    this.tooltipLeft = mouseX + 12;
    this.tooltipTop = mouseY + 12;
    this.adjustTooltipPosition(
      containerRect.width,
      containerRect.height,
      mouseX,
      mouseY
    );

    if (hoveredSeat) {
      this.tooltipVisible = true;
      this.seatHovered.emit({ seat: hoveredSeat, mouseX, mouseY });
    } else {
      this.tooltipVisible = false;
      this.seatHovered.emit({ seat: null, mouseX, mouseY });
    }
  }

  private adjustTooltipPosition(containerWidth: number, containerHeight: number, mouseX: number, mouseY: number) {
    const tooltipWidth = 220; // Estimated tooltip width
    const tooltipHeight = 120; // Estimated tooltip height

    // Start with default position (right of cursor)
    let left = mouseX + 15;
    let top = mouseY - 40;

    // Adjust horizontal position if tooltip would go off-screen on the right
    if (left + tooltipWidth > containerWidth - 10) {
      left = mouseX - tooltipWidth - 15; // Show on left side of cursor
    }

    // Ensure tooltip stays within left boundary
    if (left < 10) {
      left = 10;
    }

    // Adjust vertical position if tooltip would go off-screen at the bottom
    if (top + tooltipHeight > containerHeight - 10) {
      top = mouseY - tooltipHeight - 15; // Show above cursor
    }

    // Ensure tooltip stays within top boundary
    if (top < 10) {
      top = 10;
    }

    // Apply the adjusted positions
    this.tooltipLeft = left;
    this.tooltipTop = top;
  }

  shouldShowTooltip(): boolean {
    const seat = this.getSeatById(this.hoveredSeatId || '');
    return this.tooltipVisible && !!seat;
  }

  // Update the cleanup method:
  private cleanup() {

  }

getSectionCenterX(section: any): number {
  const sectionSeats = this.seats.filter(seat => seat.sectionId === section.id);
  
  if (sectionSeats.length === 0) {
    // Fallback to original calculation
    return section.x + (section.seatsPerRow * this.BASE_SEAT_GAP / 2);
  }
  
  // Get leftmost and rightmost seat centers
  const minX = Math.min(...sectionSeats.map(seat => seat.cx));
  const maxX = Math.max(...sectionSeats.map(seat => seat.cx));
  
  // Center between leftmost and rightmost seats
  if(section.rowConfigs && section.rowConfigs.length > 1) {
    return ((minX + maxX) / 2)-25;
  }
  return ((minX + maxX) / 2)-20;
}

  // Helper methods for template
  getSeatColor(seat: Seat): string {
    return getSeatColor(seat);
  }

  getSeatStroke(seat: Seat): string {
    return getSeatStatusConfig(seat.status).stroke;
  }

  getSeatStrokeWidth(seat: Seat): number {
    return getSeatStatusConfig(seat.status).strokeWidth;
  }

  getSeatOpacity(seat: Seat): number {
    return getSeatStatusConfig(seat.status).opacity;
  }

  getSeatCursor(seat: Seat): string {
    return getSeatStatusConfig(seat.status).cursor;
  }

  getSeatStatusText(status: SeatStatus, ticketType: TicketType): string {
    return getSeatDisplayText(status, ticketType);
  }

  isSeatSelected(seat: Seat): boolean {
    return this.selectedSeatIds.includes(seat.id);
  }

  isSeatHovered(seat: Seat): boolean {
    return this.hoveredSeatId === seat.id;
  }

  getSeatById(seatId: string): Seat | undefined {
    return this.seats.find(s => s.id === seatId);
  }

  getRowLetter(rowIndex: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[rowIndex % letters.length];
  }

  getRowArray(count: number): any[] {
    return new Array(count);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  private getSvgPoint(event: MouseEvent): { x: number; y: number } {
    const svg = this.svgElement.nativeElement;
    const pt = svg.createSVGPoint();

    pt.x = event.clientX;
    pt.y = event.clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  }

}