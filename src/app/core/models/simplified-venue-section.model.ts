// simplified-venue-section.model.ts
export interface SimplifiedVenueSection {
  id: string;
  name: string;
  type: 'stage' | 'seated' | 'standing' | 'foh';
  color: string;
  icon: string;
  price?: number;
  description?: string;
  
  // Grid-based positioning
  gridArea: {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
  };
  
  // Seating configuration (for seated sections)
  seatingConfig?: {
    rows: number;
    colsPerRow: number;
    hasAisle: boolean;
    aislePosition?: number;
  };
  
  // Stats
  capacity?: number;
  available?: number;
}

export interface SimplifiedVenueLayout {
  id: string;
  name: string;
  gridRows: number;        // Total grid rows
  gridCols: number;        // Total grid columns
  sections: SimplifiedVenueSection[];
}