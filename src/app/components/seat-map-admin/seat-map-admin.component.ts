import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  getSeatColor, getSeatDisplayText, getSeatStatusConfig, isSeatSelectable,
  RowNumberingType, Seat, SEAT_STATUS_CONFIG, SeatItemDto, SeatManagement,
  SeatOverride, SeatSectionType, SeatStatus, SectionRowConfig, SelectedSeat,
  TicketType, VenueData, VenueSection
} from '../../core/models/DTOs/seats.DTO.model';
import { SeatMapVisualComponent } from './seat-map-visual/seat-map-visual.component';
import { applyCurveToSection, applyRotationToSection, parseRowNums } from '../../core/utils/seat-generation.util';
import { AdminSeatService } from '../../core/services/admin-seat.service';
import { NotificationService } from '../../core/services/notification.service';
import { FormatDatePipe } from '../../core/pipes/format-date.pipe';

@Component({
  selector: 'app-seat-map-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SeatMapVisualComponent, FormatDatePipe],
  templateUrl: './seat-map-admin.component.html',
  styleUrls: ['./seat-map-admin.component.scss']
})
export class SeatMapAdminComponent implements OnInit, OnDestroy {
  loading = false;
  venueData!: VenueData;
  seats: Seat[] = [];
  selectedSeats: SelectedSeat[] = [];
  selectedSeatIds: string[] = [];
  hoveredSeatId: string | null = null;
  eventId = '';
  isLoading = false;

  adminAction: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release' | 'unavailable' | 'available' = 'block';

  customerInfo = {
    name: '', email: '', phone: '', postCode: '', transactionRef: ''
  };

  pricingDetails = {
    subtotal: 0, discount: 0,
    discountType:   'none' as 'percentage' | 'fixed' | 'none',
    discountValue:  0,
    serviceFee:     0,
    serviceFeeType: 'none' as 'percentage' | 'fixed' | 'none',
    serviceFeeValue: 0,
    total: 0
  };

  showConfirmationModal = false;
  confirmationData: {
    title: string; message: string;
    action: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release' | 'unavailable' | 'available';
    seats: SelectedSeat[];
  } = { title: '', message: '', action: 'block', seats: [] };

  public rowLabels: { x: number; y: number; label: string; side: 'left' | 'right' }[] = [];

  readonly seatStatusConfig = SEAT_STATUS_CONFIG;
  readonly SeatStatus       = SeatStatus;
  readonly SeatSectionType  = SeatSectionType;

  middleMinX = Number.MAX_VALUE;
  middleMaxX = 0;
  middleBottomY = 0;
  usedStandingIds: string[] = [];

  constructor(
    private seatService: AdminSeatService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.eventId = params['eventId'];
      this.getSeatMap(this.eventId);
    });
  }

  ngOnDestroy() {}

  getSeatMap(eventId: string) {
    this.loading = true;
    this.seatService.getAdminSeatMap(eventId).subscribe({
      next: (seatmap) => {
        this.venueData = seatmap;
        this.generateSeats();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading event:', error);
        this.notificationService.showError('Failed to load seat map');
      }
    });
  }

  updatePricingDetails() {
    const subtotal = this.getSelectedTotalPrice();
    let discount = 0;
    if (this.pricingDetails.discountType === 'fixed')
      discount = Math.min(this.pricingDetails.discountValue, subtotal);
    else if (this.pricingDetails.discountType === 'percentage')
      discount = (subtotal * Math.min(this.pricingDetails.discountValue, 100)) / 100;

    let serviceFee = 0;
    if (this.pricingDetails.serviceFeeType === 'fixed')
      serviceFee = this.pricingDetails.serviceFeeValue;
    else if (this.pricingDetails.serviceFeeType === 'percentage')
      serviceFee = ((subtotal - discount) * Math.min(this.pricingDetails.serviceFeeValue, 100)) / 100;

    this.pricingDetails = { ...this.pricingDetails, subtotal, discount, serviceFee, total: subtotal - discount + serviceFee };
  }

  generateTransactionRef(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${timestamp}${random}`;
  }

  generateNewTransactionRef() { this.customerInfo.transactionRef = this.generateTransactionRef(); }

  // ── Admin actions ──────────────────────────────────────────────────────────

  setAdminAction(action: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release' | 'unavailable' | 'available') {
    this.adminAction = action;
    this.clearSelection();
    if (this.adminAction === 'purchase') this.updatePricingDetails();
  }

  applyAdminAction() {
    if (this.selectedSeats.length === 0) { this.notificationService.showWarning('Please select seats first'); return; }
    if ((this.adminAction === 'reserve' || this.adminAction === 'purchase') && !this.customerInfo.name) {
      this.notificationService.showWarning('Please enter customer name'); return;
    }
    if (this.adminAction === 'purchase' && !this.customerInfo.transactionRef) {
      this.notificationService.showWarning('Please enter transaction reference'); return;
    }
    this.confirmationData = { title: this.getActionTitle(), message: this.getActionMessage(), action: this.adminAction, seats: [...this.selectedSeats] };
    this.showConfirmationModal = true;
  }

  confirmAction() {
    this.isLoading = true;
    switch (this.confirmationData.action) {
      case 'block':       this.performBlock();            break;
      case 'unblock':     this.performUnblock();          break;
      case 'reserve':     this.performReserve();          break;
      case 'purchase':    this.performPurchase();         break;
      case 'release':     this.performRelease();          break;
      case 'unavailable': this.performMakeUnavailable();  break;
      case 'available':   this.performRestoreAvailable(); break;
    }
  }

  private performBlock() {
    const seatIds = this.confirmationData.seats.map(s => s.seatId);
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(s => ({
      seatId: s.seatId, seatSection: s.sectionName, seatSectionId: s.sectionId, price: s.price
    }));
    this.seatService.blockSeats(this.eventId, seatItems, 'Administrative block').subscribe({
      next: (r) => {
        if (r.success) {
          this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} blocked`);
          this.completeAction(); this.getSeatMap(this.eventId);
        } else { this.notificationService.showError(r.error || 'Failed to block seats'); this.isLoading = false; }
      },
      error: () => { this.notificationService.showError('Failed to block seats'); this.isLoading = false; }
    });
  }

  private performUnblock() {
    const seatIds = this.confirmationData.seats.map(s => s.seatId);
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(s => ({
      seatId: s.seatId, seatSection: s.sectionName, seatSectionId: s.sectionId, price: s.price
    }));
    this.seatService.unblockSeats(this.eventId, seatItems).subscribe({
      next: (r) => {
        if (r.success) {
          this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} unblocked`);
          this.completeAction(); this.getSeatMap(this.eventId);
        } else { this.notificationService.showError(r.error || 'Failed to unblock seats'); this.isLoading = false; }
      },
      error: () => { this.notificationService.showError('Failed to unblock seats'); this.isLoading = false; }
    });
  }

  private performReserve() {
    const seatIds = this.confirmationData.seats.map(s => s.seatId);
    const data = {
      customerName: this.customerInfo.name, customerEmail: this.customerInfo.email,
      customerPhone: this.customerInfo.phone, customerPostCode: this.customerInfo.postCode,
      seatIds, sectionConfigId: this.confirmationData.seats[0]?.sectionConfigId || '',
      reservationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    this.seatService.reserveSeats(this.eventId, data).subscribe({
      next: () => {
        this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} reserved`);
        this.completeAction();
      },
      error: () => { this.notificationService.showError('Failed to reserve seats'); this.isLoading = false; }
    });
  }

  private performPurchase() {
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(s => ({
      seatId: s.seatId, seatSection: s.sectionName, seatSectionId: s.sectionId, price: s.price
    }));
    const data = {
      eventId: this.eventId, customerName: this.customerInfo.name,
      customerEmail: this.customerInfo.email, customerPhone: this.customerInfo.phone,
      customerPostCode: this.customerInfo.postCode, transactionRef: this.customerInfo.transactionRef,
      seats: seatItems, sectionConfigId: this.confirmationData.seats[0]?.sectionConfigId || '',
      pricing: {
        subtotal: this.pricingDetails.subtotal, discount: this.pricingDetails.discount,
        discountType: this.pricingDetails.discountType, discountValue: this.pricingDetails.discountValue,
        serviceFee: this.pricingDetails.serviceFee, totalAmount: this.pricingDetails.total
      },
      totalAmount: this.pricingDetails.total, paymentMethod: 'admin_cash'
    };
    this.seatService.purchaseSeats(data).subscribe({
      next: (r) => {
        if (r.success) {
          this.notificationService.showSuccess(`${seatItems.length} seat${seatItems.length > 1 ? 's' : ''} purchased`);
          this.completeAction(); this.getSeatMap(this.eventId);
        } else { this.notificationService.showError(r.error || 'Failed to purchase seats'); this.isLoading = false; }
      },
      error: () => { this.notificationService.showError('Failed to purchase seats'); this.isLoading = false; }
    });
  }

  private performRelease() {
    const seatIds = this.confirmationData.seats.map(s => s.seatId);
    this.seatService.releaseSeats(this.eventId, seatIds).subscribe({
      next: () => {
        this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} released`);
        this.completeAction();
      },
      error: () => { this.notificationService.showError('Failed to release seats'); this.isLoading = false; }
    });
  }

  private performMakeUnavailable() {
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(s => ({
      seatId: s.seatId, seatSection: s.sectionName, seatSectionId: s.sectionId, price: s.price
    }));
    this.seatService.makeUnavailable(this.eventId, seatItems).subscribe({
      next: (r) => {
        if (r.success) {
          this.notificationService.showSuccess(`${seatItems.length} seat${seatItems.length > 1 ? 's' : ''} marked unavailable`);
          this.completeAction(); this.getSeatMap(this.eventId);
        } else { this.notificationService.showError(r.error || 'Failed to mark seats unavailable'); this.isLoading = false; }
      },
      error: () => { this.notificationService.showError('Failed to mark seats unavailable'); this.isLoading = false; }
    });
  }

  private performRestoreAvailable() {
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(s => ({
      seatId: s.seatId, seatSection: s.sectionName, seatSectionId: s.sectionId, price: s.price
    }));
    this.seatService.restoreAvailable(this.eventId, seatItems).subscribe({
      next: (r) => {
        if (r.success) {
          this.notificationService.showSuccess(`${seatItems.length} seat${seatItems.length > 1 ? 's' : ''} restored to available`);
          this.completeAction(); this.getSeatMap(this.eventId);
        } else { this.notificationService.showError(r.error || 'Failed to restore seats'); this.isLoading = false; }
      },
      error: () => { this.notificationService.showError('Failed to restore seats'); this.isLoading = false; }
    });
  }

  private completeAction() {
    this.showConfirmationModal = false;
    this.clearSelection();
    this.resetCustomerInfo();
    this.resetPricing();
    this.isLoading = false;
  }

  // ── Helper text ────────────────────────────────────────────────────────────

  private getActionTitle(): string {
    const map: Record<string, string> = {
      block: 'Block Seats', unblock: 'Unblock Seats',
      reserve: 'Reserve Seats', purchase: 'Purchase Seats', release: 'Release Seats',
      unavailable: 'Mark as Unavailable', available: 'Make Available'
    };
    return map[this.adminAction] ?? 'Confirm';
  }

  private getActionMessage(): string {
    const count = this.selectedSeats.length;
    const st = count === 1 ? 'seat' : 'seats';
    switch (this.adminAction) {
      case 'block':       return `Block ${count} ${st}? This will make them unavailable for customers.`;
      case 'unblock':     return `Unblock ${count} ${st}? This will make them available again.`;
      case 'reserve':     return `Reserve ${count} ${st} for ${this.customerInfo.name}?`;
      case 'purchase':    return `Purchase ${count} ${st} for ${this.customerInfo.name}? Total: ${this.formatPrice(this.pricingDetails.total)}`;
      case 'release':     return `Release ${count} ${st} back to available?`;
      case 'unavailable': return `Mark ${count} ${st} as unavailable? They will be hidden from customers.`;
      case 'available':   return `Make ${count} ${st} available? They will become visible to customers.`;
      default:            return `Apply to ${count} ${st}?`;
    }
  }

  getActionButtonText(): string {
    const count = this.selectedSeats.length;
    const st = count === 1 ? 'Seat' : 'Seats';
    const map: Record<string, string> = {
      block: `Block ${count} ${st}`, unblock: `Unblock ${count} ${st}`,
      reserve: `Reserve ${count} ${st}`, purchase: `Purchase ${count} ${st}`, release: `Release ${count} ${st}`,
      unavailable: `Mark ${count} ${st} Unavailable`, available: `Make ${count} ${st} Available`
    };
    return map[this.adminAction] ?? `Apply to ${count} ${st}`;
  }

  getActionIcon(): string {
    const map: Record<string, string> = {
      block: 'bi-slash-circle', unblock: 'bi-check-circle',
      reserve: 'bi-clock', purchase: 'bi-credit-card', release: 'bi-arrow-clockwise',
      unavailable: 'bi-eye-slash', available: 'bi-eye'
    };
    return map[this.adminAction] ?? 'bi-gear';
  }

  resetCustomerInfo() {
    this.customerInfo = { name: '', email: '', phone: '', postCode: '', transactionRef: this.generateTransactionRef() };
  }

  resetPricing() {
    this.pricingDetails = { subtotal: 0, discount: 0, discountType: 'none', discountValue: 0, serviceFee: 0, serviceFeeType: 'none', serviceFeeValue: 0, total: 0 };
  }

  getSeatsByIds(ids: string[]) { return ids.map(id => this.seats.find(s => s.id === id)); }
  getSelectedTotalPrice() { return this.selectedSeats.reduce((t, s) => t + s.price, 0); }

  // ── Seat generation ────────────────────────────────────────────────────────
  // KEY CHANGE: gap is 26px (matching canvas GAP constant) not 22px

  generateSeats() {
    this.seats = [];
    this.rowLabels = [];
    this.middleMinX = Number.MAX_VALUE;
    this.middleMaxX = 0;
    this.middleBottomY = 0;

    const statusMap = new Map<string, SeatOverride>();
    const categories: (keyof SeatManagement)[] = ['reservedSeats', 'blockedSeats', 'soldSeats', 'unavailableSeats'];
    categories.forEach(cat => {
      (this.venueData.seatManagement[cat] ?? []).forEach(o => statusMap.set(o.seatId, o));
    });

    const getDefaultBlockLetter = (i: number) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i % 26];
    const defaultRowNumberingType = RowNumberingType.PERSECTION;
    // Shared across sections so CONTINUOUS numbering runs venue-wide (letters never repeat).
    const continuousLetterGenerator = this.createLetterGenerator();

    const sortedSections = [...this.venueData.sections].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

    sortedSections.forEach(section => {
      const sectionType = section.seatSectionType || SeatSectionType.SEAT;
      if (sectionType === SeatSectionType.FOH) return;
      if (sectionType === SeatSectionType.STANDING) { this.createStandingSection(section); return; }

      // Remember where this section's seats/labels begin so we can curve just this
      // section once its flat geometry is laid out.
      const seatStart  = this.seats.length;
      const labelStart = this.rowLabels.length;

      const sectionName = section.name.toUpperCase();
      const rowOffset   = section.rowOffset || 0;
      const rowConfigs  = section.rowConfigs || [];
      const sectionRowNumberingType = section.rowNumberingType || defaultRowNumberingType;
      const sectionSkipLetters      = section.skipRowLetters || [];
      // One continuous letter per physical row, shared across all blocks of that row.
      // The generator is shared across sections, so letters continue venue-wide.
      const continuousRowLetters      = new Map<number, string>();
      const sortedConfigs           = [...rowConfigs].sort((a, b) => (a.fromColumn || 0) - (b.fromColumn || 0));
      const rowLabelPositions       = new Map<string, { minX: number; maxX: number; y: number; numberingDirection: 'left'|'right'|'center'; blockLetter: string; rowLetter: string }>();

      let currentColumnPosition = 0;

      sortedConfigs.forEach((rowConfig, configIndex) => {
        const fromRow    = rowConfig.fromRow;
        const toRow      = rowConfig.toRow;
        const fromColumn = rowConfig.fromColumn || 1;
        const toColumn   = rowConfig.toColumn || section.seatsPerRow;
        const blockLetter         = rowConfig.blockLetter || getDefaultBlockLetter(configIndex);
        const numberingDirection  = (rowConfig.numberingDirection as 'left'|'right'|'center') || 'left';
        // gapColumns: comma-separated string of column numbers after which a gap is inserted
        const gapCols  = (rowConfig as any).gapColumns
          ? (rowConfig as any).gapColumns.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n))
          : (rowConfig.gapAfterColumn ? [rowConfig.gapAfterColumn] : []);
        const gapSize    = rowConfig.gapSize || 1;
        const skipLetters = rowConfig.skipRowLetters || sectionSkipLetters;

        // Aisle (in columns) inserted before each block after the first. Per-section, default 2.
        const blockGap = Math.max(0, (section as any).blockGap ?? 2);
        if (configIndex > 0) currentColumnPosition += blockGap;

        let perConfigRowIndex = 0;

        // Row taper: each row going back gets `step` extra seats, centred on the block.
        const step       = Math.max(0, (section as any).rowWidthStep || 0);
        const baseWidth  = toColumn - fromColumn + 1;
        // Seat numbering starts at this section's SeatStartNumber (default 1).
        const sectionStart = Math.max(1, (section as any).seatStartNumber || 1);
        // Per-row overrides: RowSeatCounts gives each row its own width (and optionally its
        // own start number). Absent -> previous behaviour (fixed cols / taper).
        const rowCounts = parseRowNums((rowConfig as any).rowSeatCounts);
        const rowStarts = parseRowNums((rowConfig as any).rowStartNumbers);
        const shaped    = !!rowCounts || step > 0;
        // Effective block width = the WIDEST row, so centring and advance stay consistent
        // even when per-row counts (or taper) differ from the column range.
        const blockWidth = rowCounts
          ? Math.max(1, ...rowCounts.map(n => (n > 0 ? n : baseWidth)))
          : step > 0 ? baseWidth + step * (toRow - fromRow)
          : baseWidth;
        // Row alignment within the block. "auto" = edges fan outward, middle centred.
        const blockCount = sortedConfigs.length;
        const align = ((rowConfig as any).rowAlign || 'auto').toLowerCase();
        const resolvedAlign = align !== 'auto' ? align
          : (blockCount > 1 && configIndex === 0) ? 'right'
          : (blockCount > 1 && configIndex === blockCount - 1) ? 'left'
          : 'center';

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
            // One letter per physical row, reused across every block of that row.
            const cached = continuousRowLetters.get(globalRow);
            if (cached !== undefined) {
              rowLetter = cached;
            } else {
              rowLetter = continuousLetterGenerator.getNextLetter(skipLetters);
              continuousRowLetters.set(globalRow, rowLetter);
            }
          } else {
            rowLetter = this.getRowLetterForIndex(perConfigRowIndex, skipLetters);
            perConfigRowIndex++;
          }

          const ri = r - fromRow;
          const rowWidth = rowCounts
            ? (rowCounts[ri] > 0 ? rowCounts[ri] : baseWidth)
            : step > 0 ? baseWidth + step * ri
            : baseWidth;
          const rowStart = rowCounts && rowStarts && rowStarts[ri] > 0 ? rowStarts[ri] : sectionStart;
          const rowOffsetNum = rowStart - 1;
          // Anchor shaped rows: left = flush left, right = flush right, center = centred.
          const rowAnchor = resolvedAlign === 'left' ? 0
                          : resolvedAlign === 'right' ? (blockWidth - rowWidth)
                          : (blockWidth - rowWidth) / 2;
          let rowMinX = Infinity, rowMaxX = -Infinity;

          for (let k = 0; k < rowWidth; k++) {
            // Shaped rows (per-row counts or taper) anchor per numbering direction; plain
            // rows keep the original left-to-right packing (incl. column gaps).
            let columnPosition: number;
            let numericSeatNumber: number;
            if (shaped) {
              columnPosition    = currentColumnPosition + rowAnchor + k;
              numericSeatNumber = numberFor(k + 1, rowWidth) + rowOffsetNum;
            } else {
              const c = fromColumn + k;
              const columnOffset = gapCols.filter((g: number) => c > g).length * gapSize;
              columnPosition     = currentColumnPosition + (c - fromColumn) + columnOffset;
              numericSeatNumber  = numberFor(c - fromColumn + 1, baseWidth) + rowOffsetNum;
            }

            const shortSectionName  = sectionName.charAt(0);
            const seatId = sectionRowNumberingType === RowNumberingType.CONTINUOUS
              ? `${shortSectionName}-${rowLetter}${numericSeatNumber}`
              : `${shortSectionName}-${blockLetter}-${rowLetter}${numericSeatNumber}`;

            // ── GAP changed from 22 to 26 to match canvas rendering ──
            const cx = section.x + (columnPosition * 26);
            const cy = section.y + (globalRow     * 26);

            rowMinX = Math.min(rowMinX, cx);
            rowMaxX = Math.max(rowMaxX, cx);

            const seatStatus = statusMap.get(seatId)?.status || SeatStatus.AVAILABLE;

            this.seats.push({
              id: seatId, cx, cy, r: 8,
              rowLabel: rowLetter, seatNumber: numericSeatNumber,
              sectionId: section.id, sectionName: section.sectionLabel || section.name,
              sectionConfigId: rowConfig.id, ticketType: rowConfig.type,
              status: seatStatus, originalStatus: seatStatus,
              price: rowConfig.customPrice || 0, color: rowConfig.color,
              gridRow: globalRow, gridColumn: Math.round(columnPosition) + 1,
              isStandingArea: false, originalColumn: shaped ? k + 1 : fromColumn + k,
              numberingDirection, blockIndex: configIndex, blockLetter,
              blockStartSeat: 1, blockTotalSeats: rowWidth,
              rowNumberingType: sectionRowNumberingType
            });
          }

          // One label per physical row (merge all blocks), so the row letter shows once at the
          // row's start even when blocks share a block letter. Keep the leftmost block's values.
          const rowKey = `${section.id}-${globalRow}`;
          const exLbl = rowLabelPositions.get(rowKey);
          rowLabelPositions.set(rowKey, {
            minX: Math.min(rowMinX, exLbl?.minX ?? Infinity),
            maxX: Math.max(rowMaxX, exLbl?.maxX ?? -Infinity),
            y: section.y + (globalRow * 26),
            numberingDirection: exLbl?.numberingDirection ?? numberingDirection,
            blockLetter: exLbl?.blockLetter ?? blockLetter,
            rowLetter: exLbl?.rowLetter ?? rowLetter
          });
        }

        if (shaped) {
          currentColumnPosition += blockWidth;
        } else {
          currentColumnPosition += (toColumn - fromColumn + 1);
          // Add gaps that fall within this config's column range
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
        this.rowLabels.push({ x: labelX, y: pos.y + 4, label: pos.rowLetter, side });
      });

      // Bend this section's rows onto an arc, then tilt the whole block, when configured.
      applyCurveToSection(this.seats.slice(seatStart), this.rowLabels.slice(labelStart), section.curveStrength);
      applyRotationToSection(this.seats.slice(seatStart), this.rowLabels.slice(labelStart), (section as any).rotation);
    });
  }

  private getRowLetterForIndex(index: number, skipLetters: string[] = []): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const skip = skipLetters.map(l => l.toUpperCase());
    let cur = 0, found = -1;
    while (found < index) {
      let letter = cur < 26 ? letters[cur] : `${letters[Math.floor((cur-26)/26)]}${letters[(cur-26)%26]}`;
      if (!skip.includes(letter)) { found++; if (found === index) return letter; }
      if (++cur > 1000) return `Row${index + 1}`;
    }
    return `Row${index + 1}`;
  }

  private createLetterGenerator() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let si = 0, di = 0;
    return {
      getNextLetter: (skipLetters: string[] = []) => {
        const skip = skipLetters.map(l => l.toUpperCase());
        while (true) {
          const letter = si < 26 ? letters[si++] : `${letters[Math.floor(di/26)]}${letters[di++ % 26]}`;
          if (!skip.includes(letter)) return letter;
          if (si + di > 1000) return `Row${si + di}`;
        }
      },
      reset: () => { si = 0; di = 0; }
    };
  }

  private createStandingSection(section: VenueSection) {
    const seatId    = this.generateStandingTicketId(section);
    const rowConfig = section.rowConfigs[0] || this.getDefaultRowConfig();
    this.seats.push({
      id: seatId, cx: section.x, cy: section.y,
      r: Math.max(section.seatsPerRow, section.rows) * 26 / 4,
      rowLabel: 'ST', seatNumber: 0,
      sectionId: section.id, sectionName: section.sectionLabel || section.name,
      sectionConfigId: rowConfig.id, ticketType: rowConfig.type,
      status: SeatStatus.AVAILABLE, originalStatus: SeatStatus.AVAILABLE,
      price: rowConfig.customPrice || 0, color: rowConfig.color,
      gridRow: section.rows, gridColumn: section.seatsPerRow,
      isStandingArea: true, blockIndex: 0, blockStartSeat: 0, blockTotalSeats: 0, blockLetter: 'A'
    });
  }

  generateStandingTicketId(section: any): string {
    const prefix = section.name.charAt(0).toUpperCase();
    let seatId: string;
    do {
      const n = Math.floor(Math.random() * 1000) + 1;
      seatId = `${prefix}-ST-${n.toString().padStart(3, '0')}`;
    } while (this.usedStandingIds.includes(seatId));
    this.usedStandingIds.push(seatId);
    return seatId;
  }

  private getDefaultRowConfig(): SectionRowConfig {
    return { id: crypto.randomUUID(), fromRow: 0, toRow: 0, fromColumn: 0, toColumn: 0, type: 'STANDING', customPrice: 0, color: '#cccccc' };
  }

  // ── Seat selection ─────────────────────────────────────────────────────────

  onSeatClicked(seat: Seat) {
    const canSelect = this.adminAction === 'available'
      ? seat.status === SeatStatus.UNAVAILABLE || seat.status === SeatStatus.SELECTED
      : isSeatSelectable(seat.status);
    if (!canSelect) return;
    seat.status === SeatStatus.SELECTED ? this.deselectSeat(seat) : this.selectSeat(seat);
  }

  selectSeat(seat: Seat) {
    seat.status = SeatStatus.SELECTED;
    this.selectedSeats.push({
      seatId: seat.id, row: seat.rowLabel, number: seat.seatNumber,
      sectionName: seat.sectionName, sectionId: seat.sectionId,
      sectionConfigId: seat.sectionConfigId, tier: { id: seat.id, name: seat.ticketType, price: seat.price, color: seat.color },
      price: seat.price, features: seat.features || [], isStandingArea: seat.isStandingArea || false, isGeneralAdmission: false
    });
    this.selectedSeatIds.push(seat.id);
    // Trigger change detection for the canvas component
    this.selectedSeatIds = [...this.selectedSeatIds];
    if (this.adminAction === 'purchase') this.updatePricingDetails();
  }

  deselectSeat(seat: Seat) {
    seat.status = seat.originalStatus || SeatStatus.AVAILABLE;
    this.selectedSeats    = this.selectedSeats.filter(s => s.seatId !== seat.id);
    this.selectedSeatIds  = this.selectedSeatIds.filter(id => id !== seat.id);
    if (this.adminAction === 'purchase') this.updatePricingDetails();
  }

  clearSelection() {
    this.selectedSeats.forEach(s => {
      const seat = this.seats.find(x => x.id === s.seatId);
      if (seat) seat.status = SeatStatus.AVAILABLE;
    });
    this.selectedSeats   = [];
    this.selectedSeatIds = [];
    if (this.adminAction === 'purchase') this.resetPricing();
  }

  onSeatHovered(event: { seat: Seat | null; mouseX: number; mouseY: number }) {
    this.hoveredSeatId = event.seat?.id || null;
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  getSeatById(id: string) { return this.seats.find(s => s.id === id); }

  onRemoveSeat(seatId: string, event: MouseEvent) {
    event.stopPropagation();
    const seat = this.getSeatById(seatId);
    if (seat) this.deselectSeat(seat);
  }

  getTotalPrice()  { return this.selectedSeats.reduce((t, s) => t + s.price, 0); }
  formatPrice(p: number) {
    return new Intl.NumberFormat('en-UK', { style: 'currency', currency: 'GBP' }).format(p);
  }

  getUniqueTicketTiers() {
    const tiers = new Map<string, { name: string; price: number; color: string }>();
    this.venueData.sections.forEach(sec => {
      sec.rowConfigs.forEach(rc => {
        if (rc.type === 'FOH') return;
        if (!tiers.has(rc.type)) tiers.set(rc.type, { name: rc.type, price: rc.customPrice || 0, color: rc.color });
      });
    });
    return Array.from(tiers.values()).sort((a, b) => a.price - b.price);
  }

  getDisplayStatuses() {
    return [SeatStatus.SELECTED, SeatStatus.BOOKED, SeatStatus.UNAVAILABLE, SeatStatus.PARTIAL_VIEW, SeatStatus.RESERVED, SeatStatus.BLOCKED]
      .map(status => ({ status, displayText: getSeatDisplayText(status, 'VIP'), price: '' }));
  }

  getSeatColor(seat: Seat)      { return getSeatColor(seat); }
  getSeatCursor(seat: Seat)     { return getSeatStatusConfig(seat.status).cursor; }
  canSelectSeat(seat: Seat)     { return isSeatSelectable(seat.status); }
  hasStandingTickets()          { return this.selectedSeats.some(s => s.isStandingArea); }

  addAnotherStandingTicket() {
    const standingSeat = this.selectedSeats.find(s => s.isStandingArea);
    if (!standingSeat) return;
    const orig = this.seats.find(s => s.id === standingSeat.seatId);
    if (!orig) return;
    const section = this.venueData.sections.find(s => s.id === orig.sectionId);
    if (!section) return;
    const newId = this.generateStandingTicketId(section);
    this.selectSeat({ ...orig, id: newId, cx: orig.cx + (Math.random() * 20 - 10), cy: orig.cy + (Math.random() * 20 - 10) });
  }
}