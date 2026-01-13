import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  getSeatColor,
  getSeatDisplayText,
  getSeatStatusConfig,
  isSeatSelectable,
  RowNumberingType,
  Seat,
  SEAT_STATUS_CONFIG,
  SeatItemDto,
  SeatManagement,
  SeatOverride,
  SeatSectionType,
  SeatStatus,
  SectionRowConfig,
  SelectedSeat,
  TicketType,
  VenueData,
  VenueSection
} from '../../core/models/DTOs/seats.DTO.model';
import { SeatMapVisualComponent } from './seat-map-visual/seat-map-visual.component';
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
  // Data
  loading: boolean = false;
  venueData!: VenueData;
  seats: Seat[] = [];
  selectedSeats: SelectedSeat[] = [];
  selectedSeatIds: string[] = [];
  hoveredSeatId: string | null = null;
  eventId: string = "";
  isLoading: boolean = false;

  // Admin actions
  adminAction: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release' = 'block';

 customerInfo = {
    name: '',
    email: '',
    phone: '',
    postCode: '', // Added post code
    transactionRef: '' // Added transaction ref
  };

  // Pricing details
  pricingDetails = {
    subtotal: 0,
    discount: 0,
    discountType: 'none' as 'percentage' | 'fixed' | 'none',
    discountValue: 0,
    serviceFee: 0,
    serviceFeeType: 'none' as 'percentage' | 'fixed' | 'none',
    serviceFeeValue: 0, // Default 2%
    total: 0
  };
  // Confirmation
  showConfirmationModal: boolean = false;
  confirmationData: {
    title: string;
    message: string;
    action: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release';
    seats: SelectedSeat[];
  } = {
      title: '',
      message: '',
      action: 'block',
      seats: []
    };

  // Zoom & Pan
  scale = .75;
  offsetX = 0;
  offsetY = 0;
  private zoomSpeed = 0.1;
  private isDragging = false;
  private lastMousePos = { x: 0, y: 0 };
  public rowLabels: { x: number, y: number, label: string, side: 'left' | 'right' }[] = [];

  // Seat status configuration
  readonly seatStatusConfig = SEAT_STATUS_CONFIG;
  readonly SeatStatus = SeatStatus;
  readonly SeatSectionType = SeatSectionType;

  // Track middle section bounds
  middleMinX = Number.MAX_VALUE;
  middleMaxX = 0;
  middleBottomY = 0;
  usedStandingIds: string[] = [];

  constructor(
    private seatService: AdminSeatService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.eventId = params['eventId'];
      this.getSeatMap(this.eventId);
    });
  }

  ngOnDestroy() {
    this.cleanup();
  }

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
  
  // Calculate discount
  let discount = 0;
  if (this.pricingDetails.discountType === 'fixed') {
    discount = Math.min(this.pricingDetails.discountValue, subtotal);
  } else if (this.pricingDetails.discountType === 'percentage') {
    discount = (subtotal * Math.min(this.pricingDetails.discountValue, 100)) / 100;
  }
  
  // Calculate service fee
  let serviceFee = 0;
  if (this.pricingDetails.serviceFeeType === 'fixed') {
    serviceFee = this.pricingDetails.serviceFeeValue;
  } else if (this.pricingDetails.serviceFeeType === 'percentage') {
    serviceFee = ((subtotal - discount) * Math.min(this.pricingDetails.serviceFeeValue, 100)) / 100;
  }
  

  this.pricingDetails = {
    ...this.pricingDetails,
    subtotal: subtotal,
    discount: discount,
    serviceFee: serviceFee,
    total: subtotal - discount + serviceFee
  };
}

  generateTransactionRef(): string {
    const prefix = 'TXN';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  }

  generateNewTransactionRef() {
    this.customerInfo.transactionRef = this.generateTransactionRef();
  }

  // ========== ADMIN ACTIONS ==========
  setAdminAction(action: 'block' | 'unblock' | 'reserve' | 'purchase' | 'release') {
    this.adminAction = action;
        // Update pricing when seats change
    if (this.adminAction === 'purchase') {
      this.updatePricingDetails();
    }
  }

  applyAdminAction() {
    if (this.selectedSeats.length === 0) {
      this.notificationService.showWarning('Please select seats first');
      return;
    }

    // Validate customer info for reserve/purchase
    if ((this.adminAction === 'reserve' || this.adminAction === 'purchase') &&
      !this.customerInfo.name) {
      this.notificationService.showWarning('Please enter customer name');
      return;
    }

     // Validate transaction ref for purchase
    if (this.adminAction === 'purchase' && !this.customerInfo.transactionRef) {
      this.notificationService.showWarning('Please enter transaction reference');
      return;
    }

    // Show confirmation
    this.confirmationData = {
      title: this.getActionTitle(),
      message: this.getActionMessage(),
      action: this.adminAction,
      seats: [...this.selectedSeats]
    };
    this.showConfirmationModal = true;
  }

  confirmAction() {
    this.isLoading = true;

    switch (this.confirmationData.action) {
      case 'block':
        this.performBlock();
        break;
      case 'unblock':
        this.performUnblock();
        break;
      case 'reserve':
        this.performReserve();
        break;
      case 'purchase':
        this.performPurchase();
        break;
      case 'release':
        this.performRelease();
        break;
    }
  }

  private performBlock() {
    const seatIds = this.confirmationData.seats.map(seat => seat.seatId);
    const seatObjects = this.getSeatsByIds(seatIds);

    // Prepare seat items for the request
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(selectedSeat => {
      const seat = seatObjects.find(s => s?.id === selectedSeat.seatId);
      return {
        seatId: selectedSeat.seatId,
        seatSection: selectedSeat.sectionName,
        seatSectionId: selectedSeat.sectionId,
        price: selectedSeat.price
      };
    }).filter(item => item !== undefined); // Remove any undefined items

    this.seatService.blockSeats(this.eventId, seatItems, 'Administrative block').subscribe({
      next: (response) => {
        if (response.success) {
          // Update local seat status
          seatObjects.forEach(seat => {
            if (seat) seat.status = SeatStatus.BLOCKED;
          });

          this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} blocked successfully`);
          this.completeAction();
        } else {
          this.notificationService.showError(response.error || 'Failed to block seats');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.notificationService.showError('Failed to block seats');
        console.error('Error blocking seats:', error);
        this.isLoading = false;
      }
    });
  }

  private performUnblock() {
    const seatIds = this.confirmationData.seats.map(seat => seat.seatId);
    const seatObjects = this.getSeatsByIds(seatIds);

    // Prepare seat items for the request
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(selectedSeat => {
      const seat = seatObjects.find(s => s?.id === selectedSeat.seatId);
      return {
        seatId: selectedSeat.seatId,
        seatSection: selectedSeat.sectionName,
        seatSectionId: selectedSeat.sectionId,
        price: selectedSeat.price
      };
    }).filter(item => item !== undefined); // Remove any undefined items


    this.seatService.unblockSeats(this.eventId, seatItems).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local seat status
          seatObjects.forEach(seat => {
            if (seat) seat.status = SeatStatus.BLOCKED;
          });

          this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} unblocked successfully`);
          this.completeAction();
        } else {
          this.notificationService.showError(response.error || 'Failed to unblock seats');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.notificationService.showError('Failed to unblock seats');
        console.error('Error unblocking seats:', error);
        this.isLoading = false;
      }
    });
  }

  private performReserve() {
    const seatIds = this.confirmationData.seats.map(seat => seat.seatId);
    const seatObjects = this.getSeatsByIds(seatIds);
    const reservationData = {
      customerName: this.customerInfo.name,
      customerEmail: this.customerInfo.email,
      customerPhone: this.customerInfo.phone,
      customerPostCode: this.customerInfo.postCode,
      seatIds: seatIds,
      sectionConfigId: this.confirmationData.seats[0]?.sectionConfigId || '',
      reservationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    this.seatService.reserveSeats(this.eventId, reservationData).subscribe({
      next: (response) => {
        // Update local seat status
        seatObjects.forEach(seat => {
          if (seat) seat.status = SeatStatus.RESERVED;
        });

        this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} reserved successfully`);
        this.completeAction();
      },
      error: (error) => {
        this.notificationService.showError('Failed to reserve seats');
        console.error('Error reserving seats:', error);
        this.isLoading = false;
      }
    });
  }

  private performPurchase() {
    const seatIds = this.confirmationData.seats.map(seat => seat.seatId);
    const seatObjects = this.getSeatsByIds(seatIds);
    
    // Prepare seat items for the request
    const seatItems: SeatItemDto[] = this.confirmationData.seats.map(selectedSeat => {
      const seat = seatObjects.find(s => s?.id === selectedSeat.seatId);
      return {
        seatId: selectedSeat.seatId,
        seatSection: selectedSeat.sectionName,
        seatSectionId: selectedSeat.sectionId,
        price: selectedSeat.price
      };
    }).filter(item => item !== undefined); // Remove any undefined items

    const purchaseData = {
      eventId : this.eventId,
      customerName: this.customerInfo.name,
      customerEmail: this.customerInfo.email,
      customerPhone: this.customerInfo.phone,
      customerPostCode: this.customerInfo.postCode,
      transactionRef: this.customerInfo.transactionRef,
      seats: seatItems,
      sectionConfigId: this.confirmationData.seats[0]?.sectionConfigId || '',
      
      // Pricing details
      pricing: {
        subtotal: this.pricingDetails.subtotal,
        discount: this.pricingDetails.discount,
        discountType: this.pricingDetails.discountType,
        discountValue: this.pricingDetails.discountValue,
        serviceFee: this.pricingDetails.serviceFee,
        totalAmount: this.pricingDetails.total
      },
      
      totalAmount: this.pricingDetails.total,
      paymentMethod: 'admin_cash'
    };

    this.seatService.purchaseSeats(purchaseData).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local seat status
          seatObjects.forEach(seat => {
            if (seat) seat.status = SeatStatus.BOOKED;
          });

          this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} purchased successfully`);
          this.completeAction();
          this.getSeatMap(this.eventId);
        } else {
          this.notificationService.showError(response.error || 'Failed to purchase seats');
          this.isLoading = false;
        }
      },
      error: (error) => {
        this.notificationService.showError('Failed to purchase seats');
        console.error('Error purchasing seats:', error);
        this.isLoading = false;
      }
    });
  }

  private performRelease() {
    const seatIds = this.confirmationData.seats.map(seat => seat.seatId);
    const seatObjects = this.getSeatsByIds(seatIds);

    this.seatService.releaseSeats(this.eventId, seatIds).subscribe({
      next: (response) => {
        // Update local seat status
        seatObjects.forEach(seat => {
          if (seat) seat.status = SeatStatus.AVAILABLE;
        });

        this.notificationService.showSuccess(`${seatIds.length} seat${seatIds.length > 1 ? 's' : ''} released successfully`);
        this.completeAction();
      },
      error: (error) => {
        this.notificationService.showError('Failed to release seats');
        console.error('Error releasing seats:', error);
        this.isLoading = false;
      }
    });
  }

  private completeAction() {
    this.showConfirmationModal = false;
    this.clearSelection();
    this.resetCustomerInfo();
    this.resetPricing();

    this.isLoading = false;
  }

  // ========== HELPER METHODS ==========
  private getActionTitle(): string {
    switch (this.adminAction) {
      case 'block': return 'Block Seats';
      case 'unblock': return 'Unblock Seats';
      case 'reserve': return 'Reserve Seats';
      case 'purchase': return 'Purchase Seats';
      case 'release': return 'Release Seats';
      default: return 'Confirm Action';
    }
  }

  private getActionMessage(): string {
    const count = this.selectedSeats.length;
    const seatText = count === 1 ? 'seat' : 'seats';

    switch (this.adminAction) {
      case 'block':
        return `Block ${count} ${seatText}? This will make them unavailable for customers.`;
      case 'unblock':
        return `Unblock ${count} ${seatText}? This will make them available for customers.`;
      case 'reserve':
        return `Reserve ${count} ${seatText} for ${this.customerInfo.name}? Reservation expires in 24 hours.`;
      case 'purchase':
        const total = this.pricingDetails.total;
        const ref = this.customerInfo.transactionRef ? `(Ref: ${this.customerInfo.transactionRef})` : '';
        return `Purchase ${count} ${seatText} for ${this.customerInfo.name}? Total: ${this.formatPrice(total)} ${ref}`;
      case 'release':
        return `Release ${count} ${seatText} back to available?`;
      default: return `Apply action to ${count} ${seatText}?`;
    }
  }

  getActionButtonClass(): string {
    switch (this.adminAction) {
      case 'block': return 'btn-danger';
      case 'unblock': return 'btn-success';
      case 'reserve': return 'btn-warning';
      case 'purchase': return 'btn-primary';
      case 'release': return 'btn-secondary';
      default: return 'btn-primary';
    }
  }

  getActionButtonText(): string {
    const count = this.selectedSeats.length;
    const seatText = count === 1 ? 'Seat' : 'Seats';

    switch (this.adminAction) {
      case 'block': return `Block ${count} ${seatText}`;
      case 'unblock': return `Unblock ${count} ${seatText}`;
      case 'reserve': return `Reserve ${count} ${seatText}`;
      case 'purchase': return `Purchase ${count} ${seatText}`;
      case 'release': return `Release ${count} ${seatText}`;
      default: return `Apply to ${count} ${seatText}`;
    }
  }

  getActionIcon(): string {
    switch (this.adminAction) {
      case 'block': return 'bi-slash-circle';
      case 'unblock': return 'bi-check-circle';
      case 'reserve': return 'bi-clock';
      case 'purchase': return 'bi-credit-card';
      case 'release': return 'bi-arrow-clockwise';
      default: return 'bi-gear';
    }
  }

resetCustomerInfo() {
    this.customerInfo = {
      name: '',
      email: '',
      phone: '',
      postCode: '',
      transactionRef: this.generateTransactionRef()
    };
  }

resetPricing() {
  this.pricingDetails = {
    subtotal: 0,
    discount: 0,
    discountType: 'none',
    discountValue: 0,
    serviceFee: 0,
    serviceFeeType: 'none',
    serviceFeeValue: 0, 
    total: 0
  };
}

  getSeatsByIds(seatIds: string[]): (Seat | undefined)[] {
    return seatIds.map(id => this.seats.find(seat => seat.id === id));
  }

  getSelectedTotalPrice(): number {
    return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }

  // ========== EXISTING METHODS ==========
  generateSeats() {
    // Keep the same implementation as before
    this.seats = [];
    this.rowLabels = [];
    this.middleMinX = Number.MAX_VALUE;
    this.middleMaxX = 0;
    this.middleBottomY = 0;

    const statusMap = new Map<string, SeatOverride>();
    const categories: (keyof SeatManagement)[] = ['reservedSeats', 'blockedSeats', 'soldSeats'];

    categories.forEach(category => {
      this.venueData.seatManagement[category].forEach(seatOverride => {
        statusMap.set(seatOverride.seatId, seatOverride);
      });
    });

    const getDefaultBlockLetter = (index: number): string => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return letters[index % letters.length];
    };

    const defaultRowNumberingType = RowNumberingType.PERSECTION;
    const continuousLetterGenerator = this.createLetterGenerator();
    const sortedSections = [...this.venueData.sections].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    sortedSections.forEach((section) => {
      const sectionType = section.seatSectionType || SeatSectionType.SEAT;

      if (sectionType === SeatSectionType.FOH) {
        return;
      }

      if (sectionType === SeatSectionType.STANDING) {
        this.createStandingSection(section);
        return;
      }

      const sectionName = section.name.toUpperCase();
      const rowOffset = section.rowOffset || 0;
      const rowConfigs = section.rowConfigs || [];
      const sectionRowNumberingType = section.rowNumberingType || defaultRowNumberingType;
      const sectionSkipLetters = section.skipRowLetters || [];
      const sortedConfigs = [...rowConfigs].sort((a, b) =>
        (a.fromColumn || 0) - (b.fromColumn || 0)
      );

      const rowLabelPositions = new Map<string, {
        minX: number,
        maxX: number,
        y: number,
        numberingDirection: 'left' | 'right' | 'center',
        blockLetter: string,
        rowLetter: string
      }>();

      let currentColumnPosition = 0;

      sortedConfigs.forEach((rowConfig, configIndex) => {
        const fromRow = rowConfig.fromRow;
        const toRow = rowConfig.toRow;
        const fromColumn = rowConfig.fromColumn || 1;
        const toColumn = rowConfig.toColumn || section.seatsPerRow;

        const blockLetter = rowConfig.blockLetter || getDefaultBlockLetter(configIndex);
        const numberingDirection: 'left' | 'right' | 'center' =
          (rowConfig.numberingDirection as 'left' | 'right' | 'center') || 'left';

        const gapAfterColumn = rowConfig.gapAfterColumn;
        const gapSize = rowConfig.gapSize || 1;
        const skipLetters = rowConfig.skipRowLetters || sectionSkipLetters;

        if (configIndex > 0) {
          currentColumnPosition += 2;
        }

        let perConfigRowIndex = 0;

        const calculateSeatNumber = (col: number): number => {
          const actualCol = col - fromColumn + 1;
          const totalSeatsInBlock = toColumn - fromColumn + 1;

          switch (numberingDirection) {
            case 'right':
              return totalSeatsInBlock - actualCol + 1;
            case 'center':
              const middle = totalSeatsInBlock / 2;
              if (totalSeatsInBlock % 2 === 1) {
                const centerSeat = Math.ceil(middle);
                const distanceFromCenter = Math.abs(actualCol - centerSeat);
                const isLeftSide = actualCol < centerSeat;
                if (actualCol === centerSeat) return 1;
                return isLeftSide ? distanceFromCenter * 2 : distanceFromCenter * 2 + 1;
              } else {
                const leftCenter = Math.floor(middle);
                const rightCenter = Math.ceil(middle);
                if (actualCol <= leftCenter) {
                  return (leftCenter - actualCol + 1) * 2;
                } else {
                  return (actualCol - rightCenter) * 2 + 1;
                }
              }
            case 'left':
            default:
              return actualCol;
          }
        };

        for (let r = fromRow; r <= toRow; r++) {
          const globalRow = r + rowOffset;
          let rowLetter: string;

          if (sectionRowNumberingType === RowNumberingType.CONTINUOUS) {
            rowLetter = continuousLetterGenerator.getNextLetter(skipLetters);
          } else {
            rowLetter = this.getRowLetterForIndex(perConfigRowIndex, skipLetters);
            perConfigRowIndex++;
          }

          let rowMinX = Infinity;
          let rowMaxX = -Infinity;

          for (let c = fromColumn; c <= toColumn; c++) {
            let columnOffset = 0;
            if (gapAfterColumn && c > gapAfterColumn) {
              columnOffset = gapSize;
            }

            const numericSeatNumber = calculateSeatNumber(c);
            const shortSectionName = sectionName.charAt(0);

            let seatId: string;
            if (sectionRowNumberingType === RowNumberingType.CONTINUOUS) {
              seatId = `${shortSectionName}-${rowLetter}${numericSeatNumber}`;
            } else {
              seatId = `${shortSectionName}-${blockLetter}-${rowLetter}${numericSeatNumber}`;
            }

            const columnPosition = currentColumnPosition + (c - fromColumn) + columnOffset;
            const cx = section.x + (columnPosition * 22);
            const cy = section.y + (globalRow * 22);

            rowMinX = Math.min(rowMinX, cx);
            rowMaxX = Math.max(rowMaxX, cx);

            const seatOverride = statusMap.get(seatId);
            const seatStatus: SeatStatus = seatOverride?.status || SeatStatus.AVAILABLE;

            const seat: Seat = {
              id: seatId,
              cx,
              cy,
              r: 8,
              rowLabel: rowLetter,
              seatNumber: numericSeatNumber,
              sectionId: section.id,
              sectionName: section.sectionLabel || section.name,
              sectionConfigId: rowConfig.id,
              ticketType: rowConfig.type,
              status: seatStatus,
              originalStatus: seatStatus,
              price: rowConfig.customPrice || 0,
              color: rowConfig.color,
              gridRow: globalRow,
              gridColumn: columnPosition + 1,
              isStandingArea: false,
              originalColumn: c,
              numberingDirection: numberingDirection,
              blockIndex: configIndex,
              blockLetter: blockLetter,
              blockStartSeat: 1,
              blockTotalSeats: toColumn - fromColumn + 1,
              rowNumberingType: sectionRowNumberingType
            };

            this.seats.push(seat);
          }

          const rowKey = `${section.id}-${blockLetter}-${rowLetter}`;
          rowLabelPositions.set(rowKey, {
            minX: rowMinX,
            maxX: rowMaxX,
            y: section.y + (globalRow * 22),
            numberingDirection: numberingDirection,
            blockLetter: blockLetter,
            rowLetter: rowLetter
          });
        }

        currentColumnPosition += (toColumn - fromColumn + 1);
        if (gapAfterColumn) {
          currentColumnPosition += gapSize;
        }
      });

      rowLabelPositions.forEach((position) => {
        let labelX: number;
        let side: 'left' | 'right';

        if (position.numberingDirection === 'right') {
          labelX = position.maxX + 15;
          side = 'right';
        } else if (position.numberingDirection === 'left') {
          labelX = position.minX - 15;
          side = 'left';
        } else {
          if (position.blockLetter === 'C' || position.blockLetter === 'L') {
            labelX = position.minX - 15;
            side = 'left';
          } else if (position.blockLetter === 'R') {
            labelX = position.maxX + 15;
            side = 'right';
          } else {
            labelX = position.minX - 15;
            side = 'left';
          }
        }

        const adjustedY = position.y + 4;

        this.rowLabels.push({
          x: labelX,
          y: adjustedY,
          label: position.rowLetter,
          side: side
        });
      });
    });
  }

  private getRowLetterForIndex(index: number, skipLetters: string[] = []): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const uppercaseSkip = skipLetters.map(l => l.toUpperCase());

    let currentIndex = 0;
    let foundCount = -1;

    while (foundCount < index) {
      let letter: string;

      if (currentIndex < 26) {
        letter = letters[currentIndex];
      } else {
        const doubleIndex = currentIndex - 26;
        const firstCharIndex = Math.floor(doubleIndex / 26);
        const secondCharIndex = doubleIndex % 26;

        if (firstCharIndex >= 26) {
          return `Row${index + 1}`;
        }

        letter = `${letters[firstCharIndex]}${letters[secondCharIndex]}`;
      }

      if (!uppercaseSkip.includes(letter)) {
        foundCount++;
      }

      if (foundCount === index) {
        return letter;
      }

      currentIndex++;

      if (currentIndex > 1000) {
        console.warn('getRowLetterForIndex: Infinite loop prevented');
        return `Row${index + 1}`;
      }
    }

    return `Row${index + 1}`;
  }

  private createLetterGenerator() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let singleLetterIndex = 0;
    let doubleLetterIndex = 0;

    return {
      getNextLetter: (skipLetters: string[] = []) => {
        const uppercaseSkip = skipLetters.map(l => l.toUpperCase());

        while (true) {
          let letter: string;

          if (singleLetterIndex < 26) {
            letter = letters[singleLetterIndex];
            singleLetterIndex++;
          } else {
            const firstCharIndex = Math.floor(doubleLetterIndex / 26);
            const secondCharIndex = doubleLetterIndex % 26;

            if (firstCharIndex >= 26) {
              return `Row${singleLetterIndex + doubleLetterIndex}`;
            }

            letter = `${letters[firstCharIndex]}${letters[secondCharIndex]}`;
            doubleLetterIndex++;
          }

          if (!uppercaseSkip.includes(letter)) {
            return letter;
          }

          if (singleLetterIndex + doubleLetterIndex > 1000) {
            console.warn('Letter generator: Too many skipped letters');
            return `Row${singleLetterIndex + doubleLetterIndex}`;
          }
        }
      },

      reset: () => {
        singleLetterIndex = 0;
        doubleLetterIndex = 0;
      }
    };
  }

  private createStandingSection(section: VenueSection): void {
    const seatId = this.generateStandingTicketId(section);
    const cx = section.x;
    const cy = section.y;

    const rowConfig = section.rowConfigs[0] || this.getDefaultRowConfig();

    const seat: Seat = {
      id: seatId,
      cx,
      cy,
      r: Math.max(section.seatsPerRow, section.rows) * 22 / 4,
      rowLabel: 'ST',
      seatNumber: 0,
      sectionId: section.id,
      sectionName: section.sectionLabel || section.name,
      sectionConfigId: rowConfig.id,
      ticketType: rowConfig.type,
      status: SeatStatus.AVAILABLE,
      originalStatus: SeatStatus.AVAILABLE,
      price: rowConfig.customPrice || 0,
      color: rowConfig.color,
      gridRow: section.rows,
      gridColumn: section.seatsPerRow,
      isStandingArea: true,
      blockIndex: 0,
      blockStartSeat: 0,
      blockTotalSeats: 0,
      blockLetter: 'A'
    };

    this.seats.push(seat);
  }

  generateStandingTicketId(section: any): string {
    const sectionPrefix = section.name.charAt(0).toUpperCase();
    let seatId: string;

    do {
      const randomNum = Math.floor(Math.random() * 1000) + 1;
      seatId = `${sectionPrefix}-ST-${randomNum.toString().padStart(3, '0')}`;
    } while (this.usedStandingIds.includes(seatId));

    this.usedStandingIds.push(seatId);
    return seatId;
  }

  private getDefaultRowConfig(): SectionRowConfig {
    return {
      id: crypto.randomUUID(),
      fromRow: 0,
      toRow: 0,
      fromColumn: 0,
      toColumn: 0,
      type: 'STANDING',
      customPrice: 0,
      color: '#cccccc'
    };
  }

  // ========== SEAT SELECTION METHODS ==========
  onSeatClicked(seat: Seat) {
    if (!isSeatSelectable(seat.status)) return;

    if (seat.status === SeatStatus.SELECTED) {
      this.deselectSeat(seat);
    } else {
      this.selectSeat(seat);
    }
  }

  selectSeat(seat: Seat) {
    seat.status = SeatStatus.SELECTED;

    const selectedSeat: SelectedSeat = {
      seatId: seat.id,
      row: seat.rowLabel,
      number: seat.seatNumber,
      sectionName: seat.sectionName,
      sectionId: seat.sectionId,
      sectionConfigId: seat.sectionConfigId,
      tier: {
        id: seat.id,
        name: seat.ticketType,
        price: seat.price,
        color: seat.color
      },
      price: seat.price,
      features: seat.features || [],
      isStandingArea: seat.isStandingArea || false,
      isGeneralAdmission: false
    };

    this.selectedSeats.push(selectedSeat);
    this.selectedSeatIds.push(seat.id);

    // Update pricing when seats change
    if (this.adminAction === 'purchase') {
      this.updatePricingDetails();
    }
  }

  deselectSeat(seat: Seat) {
    seat.status = seat.originalStatus || SeatStatus.AVAILABLE;
    this.selectedSeats = this.selectedSeats.filter(s => s.seatId !== seat.id);
    this.selectedSeatIds = this.selectedSeatIds.filter(id => id !== seat.id);
     // Update pricing when seats change
    if (this.adminAction === 'purchase') {
      this.updatePricingDetails();
    }
  }

  clearSelection() {
    this.selectedSeats.forEach(seat => {
      const seatElement = this.seats.find(s => s.id === seat.seatId);
      if (seatElement) {
        seatElement.status = SeatStatus.AVAILABLE;
      }
    });
    this.selectedSeats = [];
    this.selectedSeatIds = [];
    // Reset pricing
    if (this.adminAction === 'purchase') {
      this.resetPricing();
    }
  }

  // ========== EVENT HANDLERS FROM VISUAL COMPONENT ==========
  onSeatHovered(event: { seat: Seat | null, mouseX: number, mouseY: number }) {
    this.hoveredSeatId = event.seat?.id || null;
  }

  onDragStarted(event: MouseEvent) {
    if (event.button !== 0) return;

    this.isDragging = true;
    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  onDragMoved(event: MouseEvent) {
    if (!this.isDragging) return;

    const container = document.querySelector('.svg-container');
    if (!container) return;

    const deltaX = this.lastMousePos.x - event.clientX;
    const deltaY = this.lastMousePos.y - event.clientY;

    container.scrollLeft += deltaX;
    container.scrollTop += deltaY;

    this.lastMousePos = { x: event.clientX, y: event.clientY };
  }

  onDragEnded() {
    this.isDragging = false;
  }

  onZoomed(event: WheelEvent) {
    event.preventDefault();

    const delta = event.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
    this.scale = Math.max(0.5, Math.min(3, this.scale + delta));
  }

  // ========== HELPER METHODS ==========
  getSeatById(seatId: string): Seat | undefined {
    return this.seats.find(s => s.id === seatId);
  }

  onRemoveSeat(seatId: string, event: MouseEvent) {
    event.stopPropagation();
    const seat = this.getSeatById(seatId);
    if (seat) {
      this.deselectSeat(seat);
    }
  }

  getTotalPrice(): number {
    return this.selectedSeats.reduce((total, seat) => total + seat.price, 0);
  }

  zoomIn() {
    this.scale = Math.min(3, this.scale * 1.2);
  }

  zoomOut() {
    this.scale = Math.max(0.5, this.scale * 0.8);
  }

  resetView() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  getRowArray(count: number): any[] {
    return new Array(count);
  }

  getUniqueTicketTiers(): Array<{ name: string, price: number, color: string }> {
    const tiers = new Map<string, { name: string, price: number, color: string }>();

    this.venueData.sections.forEach(section => {
      section.rowConfigs.forEach(rowConfig => {
        if (rowConfig.type === 'FOH') {
          return;
        }

        const key = rowConfig.type;
        if (!tiers.has(key)) {
          tiers.set(key, {
            name: rowConfig.type,
            price: rowConfig.customPrice || 0,
            color: rowConfig.color
          });
        }
      });
    });

    return Array.from(tiers.values()).sort((a, b) => a.price - b.price);
  }

  getDisplayStatuses() {
    const statuses = [
      SeatStatus.SELECTED,
      SeatStatus.BOOKED,
      SeatStatus.UNAVAILABLE,
      SeatStatus.PARTIAL_VIEW,
      SeatStatus.RESERVED,
      SeatStatus.BLOCKED
    ];

    return statuses.map(status => ({
      status,
      displayText: this.getSeatStatusText(status, 'VIP'),
      price: ''
    }));
  }

  getSeatStatusText(status: SeatStatus, ticketType: TicketType): string {
    return getSeatDisplayText(status, ticketType);
  }

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

  canSelectSeat(seat: Seat): boolean {
    return isSeatSelectable(seat.status);
  }

  hasStandingTickets(): boolean {
    return this.selectedSeats.some(seat => seat.isStandingArea);
  }

  addAnotherStandingTicket(): void {
    const standingSeat = this.selectedSeats.find(seat => seat.isStandingArea);
    if (!standingSeat) return;

    const originalStandingSeat = this.seats.find(seat => seat.id === standingSeat.seatId);
    if (!originalStandingSeat) return;

    const section = this.venueData.sections.find(s => s.id === originalStandingSeat.sectionId);
    if (!section) return;

    const newSeatId = this.generateStandingTicketId(section);

    const newSeat: Seat = {
      ...originalStandingSeat,
      id: newSeatId,
      cx: originalStandingSeat.cx + (Math.random() * 20 - 10),
      cy: originalStandingSeat.cy + (Math.random() * 20 - 10),
    };

    this.selectSeat(newSeat);
  }

  private cleanup() {
    // Clean up if needed
  }
}