export interface VenueData {
  eventName : string;
  eventDate : Date;
  sections: VenueSection[];
  seatManagement: SeatManagement;
}

export interface SeatManagement {
  // Only these three statuses needed
  reservedSeats: SeatOverride[];
  blockedSeats: SeatOverride[];
  soldSeats: SeatOverride[];
}

export interface SeatOverride {
  seatId: string; // Format: "SECTION-ROW-NUMBER" e.g., "VIP-A-1"
  status: SeatStatus;
  reason?: string;
  bookingId?: string; // For SOLD seats
  reservationId?: string; // For RESERVED seats
  blockedBy?: string; // Admin/user who blocked
}


export interface VenueSection {
  id : string;
  name: string;
  x: number;
  mx : number;
  y: number;
  my: number;
  rows: number;
  seatsPerRow: number;
  sectionLabel?: string;
  seatSectionType?: SeatSectionType;
  rowOffset?: number;
  numberingDirection ? : string;
  rowConfigs: SectionRowConfig[];
  rowNumberingType?: RowNumberingType;
  skipRowLetters?: string[];       // Row letters to skip (e.g., ["I"])
  hasColumnGap?: boolean;          // Enable column gap
  gapAfterColumn?: number;         // Gap after this column (e.g., 12)
  gapSize?: number;                // Size of gap (default: 1)
}

export interface SectionRowConfig {
  id: string;
  fromRow: number;
  toRow: number;
  fromColumn: number;
  toColumn: number;
  type: TicketType;
  customPrice?: number;
  color: string; // Color specific to this ticket type in this row group
  numberingDirection ? : string;
  blockLetter?: string; // Add this: L, R, A, B, etc.
  skipRowLetters?: string[];       // Row letters to skip (e.g., ["I"])
  hasColumnGap?: boolean;          // Enable column gap
  gapAfterColumn?: number;         // Gap after this column (e.g., 12)
  gapSize?: number;                // Size of gap (default: 1)
}

// seats.model.ts
export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  SELECTED = 'SELECTED',
  BOOKED = 'BOOKED',
  UNAVAILABLE = 'UNAVAILABLE',
  PARTIAL_VIEW = 'PARTIAL_VIEW',
  RESERVED = 'RESERVED',
  BLOCKED = 'BLOCKED',
  HOLD = 'HOLD'
}

  export enum SeatSectionType
  {
      SEAT,
      STANDING,
      FOH
  }

export enum RowNumberingType  {
  PERSECTION,
  CONTINUOUS
}


export type TicketType = 'VIP' | 'DIAMOND' | 'GOLD' | 'SILVER' | 'FOH' | 'STANDING' | 'GENERAL' | 'BALCONY';

export interface Seat {
  id: string;
  cx: number;
  cy: number;
  r: number;
  rowLabel: string;
  seatNumber: number;
  sectionName: string;
  sectionId: string;
  sectionConfigId : string;
  ticketType: TicketType;
  status: SeatStatus;
  price: number;
  color: string; // From row config
  features?: string[];
  gridRow?: number;
  gridColumn?: number;
  isStandingArea : boolean;
  columnSectionIndex?: number;
  originalColumn?: number;
  isFirstInSection?: boolean;
  isLastInSection?: boolean;
  rowRangeIndex? :number;
  columnSectionNumber?: number; // 1, 2, 3, 4
  rowRangeNumber?: number; // 1, 2
  numberingDirection? :string;
  blockIndex : number;
  blockStartSeat: number;
  blockTotalSeats: number;
  blockLetter : string;
  rowNumberingType?: RowNumberingType;
  hasGapBefore ?: boolean;
  gapSize ?: number;
}

export interface SelectedSeat {
  seatId : string;
  row: string;
  number: number;
  sectionName: string;
  sectionId: string;
  sectionConfigId : string;
  tier: {
    id: string;
    name: string;
    price: number;
    color: string;
  };
  price: number;
  features: string[];
  isStandingArea : boolean;
  isGeneralAdmission : boolean;
}

export interface SeatStatusConfig {
  color: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  displayText: string | ((ticketType: TicketType) => string);
  cursor: string;
  canSelect: boolean;
  tooltip: string;
}

// Main configuration object
export const SEAT_STATUS_CONFIG: Record<SeatStatus, SeatStatusConfig> = {
  [SeatStatus.AVAILABLE]: {
    color: '', // Will be overridden by seat.color from row config
    stroke: '#333',
    strokeWidth: 1,
    opacity: 1,
    displayText: (ticketType: TicketType) => ticketType,
    cursor: 'pointer',
    canSelect: true,
    tooltip: 'Available for selection'
  },
  [SeatStatus.SELECTED]: {
    color: '#f8c51d',
    stroke: '#333',
    strokeWidth: 2,
    opacity: 1,
    displayText: 'Selected',
    cursor: 'pointer',
    canSelect: true,
    tooltip: 'Selected - Click to deselect'
  },
  [SeatStatus.BOOKED]: {
    color: '#888888',
    stroke: '#666',
    strokeWidth: 1,
    opacity: 0.6,
    displayText: 'Sold',
    cursor: 'not-allowed',
    canSelect: false,
    tooltip: 'Already purchased'
  },
  [SeatStatus.UNAVAILABLE]: {
    color: '#e9eaec',
    stroke: '#ddd',
    strokeWidth: 1,
    opacity: 0.6,
    displayText: 'Unavailable',
    cursor: 'not-allowed',
    canSelect: false,
    tooltip: 'Not available for sale'
  },
  [SeatStatus.PARTIAL_VIEW]: {
    color: 'transparent',
    stroke: '#999',
    strokeWidth: 1,
    opacity: 0.8,
    displayText: 'Partial View',
    cursor: 'pointer',
    canSelect: true,
    tooltip: 'Partial/obstructed view'
  },
  [SeatStatus.RESERVED]: {
    color: '#ff9900',
    stroke: '#ff6600',
    strokeWidth: 2,
    opacity: 1,
    displayText: 'Reserved',
    cursor: 'not-allowed',
    canSelect: false,
    tooltip: 'Reserved for special guests'
  },
  [SeatStatus.BLOCKED]: {
    color: '#ff4444',
    stroke: '#ff0000',
    strokeWidth: 2,
    opacity: 1,
    displayText: 'Blocked',
    cursor: 'not-allowed',
    canSelect: false,
    tooltip: 'Blocked by venue management'
  },
  [SeatStatus.HOLD]: {
    color: '#4fc3f7',
    stroke: '#2196f3',
    strokeWidth: 1,
    opacity: 0.8,
    displayText: 'On Hold',
    cursor: 'not-allowed',
    canSelect: false,
    tooltip: 'Temporarily on hold'
  }
} as const;

// Helper function to get config for a status
export function getSeatStatusConfig(status: SeatStatus): SeatStatusConfig {
  return SEAT_STATUS_CONFIG[status];
}

// Helper to check if seat is selectable
export function isSeatSelectable(status: SeatStatus): boolean {
  return SEAT_STATUS_CONFIG[status].canSelect;
}

// Helper to get display text
export function getSeatDisplayText(status: SeatStatus, ticketType: TicketType): string {
  const config = SEAT_STATUS_CONFIG[status];
  if (typeof config.displayText === 'function') {
    return config.displayText(ticketType);
  }
  return config.displayText;
}

// Helper to get seat color (handles AVAILABLE seat color override)
export function getSeatColor(seat: Seat): string {
  const config = SEAT_STATUS_CONFIG[seat.status];
  
  if (seat.status === SeatStatus.AVAILABLE) {
    return seat.color || config.color;
  }
  else{
    return "#ffff"
  }
  
  return config.color;
}

// Helper to get complete seat styles
export function getSeatStyles(seat: Seat) {
  const config = SEAT_STATUS_CONFIG[seat.status];
  
  return {
    fill: seat.status === SeatStatus.AVAILABLE ? (seat.color || config.color) : config.color,
    stroke: config.stroke,
    strokeWidth: config.strokeWidth,
    opacity: config.opacity,
    cursor: config.cursor
  };
}