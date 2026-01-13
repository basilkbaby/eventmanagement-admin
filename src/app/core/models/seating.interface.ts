export interface Seat {
  id: string;
  row: string;
  number: number;
  type: 'standard' | 'accessible' | 'companion';
  section: string;
  x: number;
  y: number;
  status: 'available' | 'reserved' | 'blocked';
  priceTier?: string;
}

export interface SeatingSection {
  id: string;
  name: string;
  type: 'general' | 'vip' | 'box' | 'balcony' | 'side';
  color: string;
  rows: string[];
  seatsPerRow: number;
  capacity: number;
  startRow: string;
  rowCount: number;
  priceTier?: string;
  position: 'center' | 'left' | 'right' | 'upper' | 'lower';
  width: number;
}

export interface SeatingPlan {
  id: string;
  venueId: string;
  name: string;
  sections: SeatingSection[];
  seats: Seat[];
  totalSeats: number;
  accessibleSeats: number;
  stagePosition: 'north' | 'south' | 'east' | 'west';
  layout: 'single' | 'split' | 'stadium' | 'theater';
  createdAt: Date;
  lastModified: Date;
}