import {
  Seat, VenueSection, SeatStatus, SeatSectionType, RowNumberingType, TicketType
} from '../models/DTOs/seats.DTO.model';

export interface SeatRowLabel { x: number; y: number; label: string; side: 'left' | 'right'; }
export interface GeneratedSeats { seats: Seat[]; rowLabels: SeatRowLabel[]; }

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Seat pitch — must stay in sync with the canvas renderer (SeatMapVisualComponent GAP = 26).
const GAP = 26;

function getRowLetterForIndex(index: number, skipLetters: string[] = []): string {
  const skip = skipLetters.map(l => l.toUpperCase());
  let cur = 0, found = -1;
  while (found < index) {
    const letter = cur < 26 ? ALPHA[cur] : `${ALPHA[Math.floor((cur - 26) / 26)]}${ALPHA[(cur - 26) % 26]}`;
    if (!skip.includes(letter)) { found++; if (found === index) return letter; }
    if (++cur > 1000) return `Row${index + 1}`;
  }
  return `Row${index + 1}`;
}

function createLetterGenerator() {
  let si = 0, di = 0;
  return {
    getNextLetter: (skipLetters: string[] = []) => {
      const skip = skipLetters.map(l => l.toUpperCase());
      while (true) {
        const letter = si < 26 ? ALPHA[si++] : `${ALPHA[Math.floor(di / 26)]}${ALPHA[di++ % 26]}`;
        if (!skip.includes(letter)) return letter;
        if (si + di > 1000) return `Row${si + di}`;
      }
    }
  };
}

function generateStandingTicketId(section: VenueSection, used: string[]): string {
  const prefix = section.name.charAt(0).toUpperCase();
  let seatId: string;
  do {
    const n = Math.floor(Math.random() * 1000) + 1;
    seatId = `${prefix}-ST-${n.toString().padStart(3, '0')}`;
  } while (used.includes(seatId));
  used.push(seatId);
  return seatId;
}

/**
 * Builds the seat list + row labels for a set of venue sections using the exact
 * same geometry, numbering, gap and standing rules as the live seat map
 * (SeatMapVisualComponent / seat-map-admin.generateSeats). All seats are returned
 * with AVAILABLE status — callers can overlay seat-management status if needed.
 */
export function generateVenueSeats(sections: VenueSection[]): GeneratedSeats {
  const seats: Seat[] = [];
  const rowLabels: SeatRowLabel[] = [];
  const usedStandingIds: string[] = [];

  const getDefaultBlockLetter = (i: number) => ALPHA[i % 26];
  const defaultRowNumberingType = RowNumberingType.PERSECTION;
  const continuousLetterGenerator = createLetterGenerator();

  const sortedSections = [...sections].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  sortedSections.forEach(section => {
    const sectionType = section.seatSectionType ?? SeatSectionType.SEAT;
    if (sectionType === SeatSectionType.FOH) return;

    if (sectionType === SeatSectionType.STANDING) {
      const rowConfig = section.rowConfigs?.[0];
      seats.push({
        id: generateStandingTicketId(section, usedStandingIds),
        cx: section.x, cy: section.y,
        r: Math.max(section.seatsPerRow, section.rows) * GAP / 4,
        rowLabel: 'ST', seatNumber: 0,
        sectionId: section.id, sectionName: section.sectionLabel || section.name,
        sectionConfigId: rowConfig?.id ?? '', ticketType: (rowConfig?.type as TicketType) ?? 'STANDING',
        status: SeatStatus.AVAILABLE, originalStatus: SeatStatus.AVAILABLE,
        price: rowConfig?.customPrice || 0, color: rowConfig?.color ?? '#6b7280',
        gridRow: section.rows, gridColumn: section.seatsPerRow,
        isStandingArea: true, blockIndex: 0, blockStartSeat: 0, blockTotalSeats: 0, blockLetter: 'A'
      });
      return;
    }

    const sectionName = section.name.toUpperCase();
    const rowOffset   = section.rowOffset || 0;
    const rowConfigs  = section.rowConfigs || [];
    const sectionRowNumberingType = section.rowNumberingType ?? defaultRowNumberingType;
    const sectionSkipLetters      = section.skipRowLetters || [];
    const sortedConfigs           = [...rowConfigs].sort((a, b) => (a.fromColumn || 0) - (b.fromColumn || 0));
    const rowLabelPositions = new Map<string, { minX: number; maxX: number; y: number; numberingDirection: 'left' | 'right' | 'center'; blockLetter: string; rowLetter: string }>();

    let currentColumnPosition = 0;

    sortedConfigs.forEach((rowConfig, configIndex) => {
      const fromRow    = rowConfig.fromRow;
      const toRow      = rowConfig.toRow;
      const fromColumn = rowConfig.fromColumn || 1;
      const toColumn   = rowConfig.toColumn || section.seatsPerRow;
      const blockLetter        = rowConfig.blockLetter || getDefaultBlockLetter(configIndex);
      const numberingDirection = (rowConfig.numberingDirection as 'left' | 'right' | 'center') || 'left';
      const gapCols = (rowConfig as any).gapColumns
        ? (rowConfig as any).gapColumns.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
        : (rowConfig.gapAfterColumn ? [rowConfig.gapAfterColumn] : []);
      const gapSize     = rowConfig.gapSize || 1;
      const skipLetters = rowConfig.skipRowLetters || sectionSkipLetters;

      if (configIndex > 0) currentColumnPosition += 2;

      let perConfigRowIndex = 0;

      const calculateSeatNumber = (col: number): number => {
        const actualCol = col - fromColumn + 1;
        const total     = toColumn - fromColumn + 1;
        switch (numberingDirection) {
          case 'right': return total - actualCol + 1;
          case 'center': {
            const middle = total / 2;
            if (total % 2 === 1) {
              const center = Math.ceil(middle);
              const dist   = Math.abs(actualCol - center);
              if (actualCol === center) return 1;
              return actualCol < center ? dist * 2 : dist * 2 + 1;
            } else {
              const lc = Math.floor(middle), rc = Math.ceil(middle);
              return actualCol <= lc ? (lc - actualCol + 1) * 2 : (actualCol - rc) * 2 + 1;
            }
          }
          default: return actualCol;
        }
      };

      for (let r = fromRow; r <= toRow; r++) {
        const globalRow = r + rowOffset;
        let rowLetter: string;
        if (sectionRowNumberingType === RowNumberingType.CONTINUOUS) {
          rowLetter = continuousLetterGenerator.getNextLetter(skipLetters);
        } else {
          rowLetter = getRowLetterForIndex(perConfigRowIndex, skipLetters);
          perConfigRowIndex++;
        }

        let rowMinX = Infinity, rowMaxX = -Infinity;

        for (let c = fromColumn; c <= toColumn; c++) {
          const columnOffset = gapCols.filter((g: number) => c > g).length * gapSize;
          const numericSeatNumber = calculateSeatNumber(c);
          const shortSectionName  = sectionName.charAt(0);
          let seatId: string;
          if (sectionRowNumberingType === RowNumberingType.CONTINUOUS)
            seatId = `${shortSectionName}-${rowLetter}${numericSeatNumber}`;
          else
            seatId = `${shortSectionName}-${blockLetter}-${rowLetter}${numericSeatNumber}`;

          const columnPosition = currentColumnPosition + (c - fromColumn) + columnOffset;
          const cx = section.x + (columnPosition * GAP);
          const cy = section.y + (globalRow * GAP);

          rowMinX = Math.min(rowMinX, cx);
          rowMaxX = Math.max(rowMaxX, cx);

          seats.push({
            id: seatId, cx, cy, r: 8,
            rowLabel: rowLetter, seatNumber: numericSeatNumber,
            sectionId: section.id, sectionName: section.sectionLabel || section.name,
            sectionConfigId: rowConfig.id, ticketType: rowConfig.type as TicketType,
            status: SeatStatus.AVAILABLE, originalStatus: SeatStatus.AVAILABLE,
            price: rowConfig.customPrice || 0, color: rowConfig.color,
            gridRow: globalRow, gridColumn: columnPosition + 1,
            isStandingArea: false, originalColumn: c,
            numberingDirection, blockIndex: configIndex, blockLetter,
            blockStartSeat: 1, blockTotalSeats: toColumn - fromColumn + 1,
            rowNumberingType: sectionRowNumberingType
          });
        }

        const rowKey = `${section.id}-${blockLetter}-${rowLetter}`;
        rowLabelPositions.set(rowKey, { minX: rowMinX, maxX: rowMaxX, y: section.y + (globalRow * GAP), numberingDirection, blockLetter, rowLetter });
      }

      currentColumnPosition += (toColumn - fromColumn + 1);
      currentColumnPosition += gapCols.filter((g: number) => g >= fromColumn && g < toColumn).length * gapSize;
    });

    rowLabelPositions.forEach(pos => {
      let labelX: number, side: 'left' | 'right';
      if (pos.numberingDirection === 'right')     { labelX = pos.maxX + 15; side = 'right'; }
      else if (pos.numberingDirection === 'left') { labelX = pos.minX - 15; side = 'left'; }
      else {
        if (pos.blockLetter === 'C' || pos.blockLetter === 'L') { labelX = pos.minX - 15; side = 'left'; }
        else if (pos.blockLetter === 'R') { labelX = pos.maxX + 15; side = 'right'; }
        else { labelX = pos.minX - 15; side = 'left'; }
      }
      rowLabels.push({ x: labelX, y: pos.y + 4, label: pos.rowLetter, side });
    });
  });

  return { seats, rowLabels };
}
