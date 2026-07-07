import {
  Seat, VenueSection, SeatStatus, SeatSectionType, RowNumberingType, TicketType
} from '../models/DTOs/seats.DTO.model';

export interface SeatRowLabel { x: number; y: number; label: string; side: 'left' | 'right'; }
export interface GeneratedSeats { seats: Seat[]; rowLabels: SeatRowLabel[]; }

// Maximum half-sweep (radians) at curveStrength = 100. Bounding the angle keeps the
// widest row from folding past 90° into a vertical stack at the ends.
const CURVE_PHI_CAP = 1.15;

/**
 * Bends one section's seats (and its row labels) onto a bounded arc, in place.
 * `points` and `labels` must contain ONLY the items for a single section.
 * curveStrength 0 (or falsy) is a no-op — the section stays a flat grid.
 *
 * The transform mirrors the approved preview: rows bow so their ends rise toward
 * the stage (concave up), and the sweep angle is capped so seats never fold over.
 * It operates purely on already-computed x/y, so it composes with any numbering,
 * gap or block rules without touching them.
 */
/**
 * Parse a CSV like "30,32,34" into numbers, preserving index alignment (blanks/invalid → NaN).
 * Returns null when there's nothing usable, so callers can fall back to the old behaviour.
 */
export function parseRowNums(csv: string | null | undefined): number[] | null {
  if (!csv) return null;
  const arr = csv.split(',').map(s => { const n = parseInt(s.trim(), 10); return isNaN(n) ? NaN : n; });
  return arr.some(n => !isNaN(n)) ? arr : null;
}

export function applyCurveToSection(
  points: { cx: number; cy: number }[],
  labels: { x: number; y: number }[],
  curveStrength: number | undefined | null
): void {
  const strength = Math.max(0, Math.min(100, curveStrength || 0));
  if (strength <= 0 || points.length === 0) return;

  let minX = Infinity, maxX = -Infinity, minY = Infinity;
  for (const p of points) {
    if (p.cx < minX) minX = p.cx;
    if (p.cx > maxX) maxX = p.cx;
    if (p.cy < minY) minY = p.cy;
  }
  const centreX = (minX + maxX) / 2;
  const baseY   = minY;                       // front row (nearest the stage)
  const maxHalf = (maxX - minX) / 2;          // widest row's half-width, in px
  const phiMax  = (strength / 100) * CURVE_PHI_CAP;
  if (phiMax <= 1e-4 || maxHalf <= 0) return;
  const R0 = maxHalf / phiMax;                // radius that caps the widest row at phiMax

  const warp = (x: number, y: number): { x: number; y: number } => {
    const dx     = x - centreX;               // flat horizontal offset from centre
    const rowPx  = y - baseY;                 // distance behind the front row
    const radius = R0 + rowPx;
    const phi    = dx / radius;
    return { x: centreX + radius * Math.sin(phi), y: baseY + rowPx - radius * (1 - Math.cos(phi)) };
  };

  for (const p of points) { const w = warp(p.cx, p.cy); p.cx = w.x; p.cy = w.y; }
  for (const l of labels) { const w = warp(l.x,  l.y);  l.x  = w.x; l.y  = w.y; }
}

/**
 * Rotates one section's seats (and its row labels) around the section's centre, in place.
 * `points` and `labels` must contain ONLY the items for a single section.
 * rotationDeg 0 (or falsy) is a no-op. Apply this AFTER curve so the whole (curved)
 * block tilts as one — used to slant side blocks toward the stage.
 */
export function applyRotationToSection(
  points: { cx: number; cy: number }[],
  labels: { x: number; y: number }[],
  rotationDeg: number | undefined | null
): void {
  const th = ((rotationDeg || 0) * Math.PI) / 180;
  if (th === 0 || points.length === 0) return;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.cx < minX) minX = p.cx; if (p.cx > maxX) maxX = p.cx;
    if (p.cy < minY) minY = p.cy; if (p.cy > maxY) maxY = p.cy;
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const cos = Math.cos(th), sin = Math.sin(th);
  const rot = (x: number, y: number): { x: number; y: number } => {
    const dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  };

  for (const p of points) { const r = rot(p.cx, p.cy); p.cx = r.x; p.cy = r.y; }
  for (const l of labels) { const r = rot(l.x,  l.y);  l.x  = r.x; l.y  = r.y; }
}

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

    // Remember where this section's seats/labels begin so we can curve just this
    // section after its flat geometry is laid out.
    const seatStart  = seats.length;
    const labelStart = rowLabels.length;

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

      // Row taper: each row going back gets `step` extra seats, centred on the block.
      const step       = Math.max(0, section.rowWidthStep || 0);
      const baseWidth  = toColumn - fromColumn + 1;
      const baseCentre = currentColumnPosition + (baseWidth - 1) / 2;
      // Seat numbering starts at this section's SeatStartNumber (default 1).
      const sectionStart = Math.max(1, section.seatStartNumber || 1);
      // Per-row overrides: when RowSeatCounts is set, each row uses its own width (and
      // optionally its own start number). Absent -> previous behaviour (fixed cols / taper).
      const rowCounts = parseRowNums(rowConfig.rowSeatCounts);
      const rowStarts = parseRowNums(rowConfig.rowStartNumbers);
      const shaped    = !!rowCounts;

      const numberFor = (actualCol: number, total: number): number => {
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

        const ri = r - fromRow;
        const rowWidth = shaped
          ? (rowCounts![ri] > 0 ? rowCounts![ri] : baseWidth)
          : baseWidth + step * ri;
        const rowStart = shaped && rowStarts && rowStarts[ri] > 0 ? rowStarts[ri] : sectionStart;
        const rowOffsetNum = rowStart - 1;
        const shapedRow = shaped || step > 0;
        let rowMinX = Infinity, rowMaxX = -Infinity;

        for (let k = 0; k < rowWidth; k++) {
          // Shaped rows (per-row counts or taper) widen symmetrically around the block
          // centre; plain rows keep the original left-to-right packing (incl. column gaps).
          let columnPosition: number;
          let numericSeatNumber: number;
          if (shapedRow) {
            columnPosition    = baseCentre - (rowWidth - 1) / 2 + k;
            numericSeatNumber = numberFor(k + 1, rowWidth) + rowOffsetNum;
          } else {
            const c = fromColumn + k;
            const columnOffset = gapCols.filter((g: number) => c > g).length * gapSize;
            columnPosition     = currentColumnPosition + (c - fromColumn) + columnOffset;
            numericSeatNumber  = numberFor(c - fromColumn + 1, baseWidth) + rowOffsetNum;
          }

          const shortSectionName = sectionName.charAt(0);
          const seatId = sectionRowNumberingType === RowNumberingType.CONTINUOUS
            ? `${shortSectionName}-${rowLetter}${numericSeatNumber}`
            : `${shortSectionName}-${blockLetter}-${rowLetter}${numericSeatNumber}`;

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
            gridRow: globalRow, gridColumn: Math.round(columnPosition) + 1,
            isStandingArea: false, originalColumn: shapedRow ? k + 1 : fromColumn + k,
            numberingDirection, blockIndex: configIndex, blockLetter,
            blockStartSeat: 1, blockTotalSeats: rowWidth,
            rowNumberingType: sectionRowNumberingType
          });
        }

        const rowKey = `${section.id}-${blockLetter}-${rowLetter}`;
        rowLabelPositions.set(rowKey, { minX: rowMinX, maxX: rowMaxX, y: section.y + (globalRow * GAP), numberingDirection, blockLetter, rowLetter });
      }

      if (shaped) {
        const maxW = Math.max(baseWidth, ...rowCounts!.map(n => (n > 0 ? n : 0)));
        currentColumnPosition += maxW + 2;
      } else if (step > 0) {
        currentColumnPosition += baseWidth + step * (toRow - fromRow) + 2;
      } else {
        currentColumnPosition += (toColumn - fromColumn + 1);
        currentColumnPosition += gapCols.filter((g: number) => g >= fromColumn && g < toColumn).length * gapSize;
      }
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

    // Bend this section's rows onto an arc, then tilt the whole block, when configured.
    applyCurveToSection(seats.slice(seatStart), rowLabels.slice(labelStart), section.curveStrength);
    applyRotationToSection(seats.slice(seatStart), rowLabels.slice(labelStart), section.rotation);
  });

  return { seats, rowLabels };
}
