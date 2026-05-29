import { Component, OnInit, ViewChild, TemplateRef, inject, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { CouponService } from '../../../core/services/coupon.service';
import { EventContextService } from '../../../core/services/event-context.service';
import { CouponDto, CouponEvent, CouponFilter, CouponStats } from '../../../core/models/DTOs/coupon.DTO.model';
import { DiscountType } from '../../../core/models/Enums/coupon.enum';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatCardModule,
    MatTabsModule,
    MatListModule,
    ClipboardModule
  ],
  templateUrl: './coupons-list.component.html',
  styleUrls: ['./coupons-list.component.scss']
})
export class CouponsListComponent implements OnInit {
  @ViewChild('couponDialog') couponDialog!: TemplateRef<any>;
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild('extendDialog') extendDialog!: TemplateRef<any>;
  @ViewChild('applyCouponDialog') applyCouponDialog!: TemplateRef<any>;
  @ViewChild('resetUsageDialog') resetUsageDialog!: TemplateRef<any>;

  // Expose enum to template
  DiscountType = DiscountType;

  // Chip input for excluded sections
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  excludedSectionsList: string[] = [];

  addExcludedSection(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.excludedSectionsList.includes(value)) {
      this.excludedSectionsList.push(value);
    }
    event.chipInput!.clear();
  }

  removeExcludedSection(section: string): void {
    const i = this.excludedSectionsList.indexOf(section);
    if (i >= 0) this.excludedSectionsList.splice(i, 1);
  }

  // Data
  coupons: CouponDto[] = [];
  filteredCoupons: CouponDto[] = [];
  events: CouponEvent[] = [];
  couponStats: CouponStats | null = null;
  selectedCoupon: CouponDto | null = null;
  isEditMode = false;
  isLoading = false;

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  // Filters
  filter: CouponFilter = {
    search: '',
    status: '',
    discountType: '',
    dateRange: { start: null, end: null }
  };

  statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' },
    { value: 'upcoming', label: 'Upcoming' }
  ];

  discountTypes = [
    { value: '', label: 'All Types' },
    { value: '1', label: 'Percentage' },
    { value: '2', label: 'Fixed Amount' },
    { value: '3', label: 'Both' }
  ];

  // Forms
  couponForm: FormGroup;
  extendForm: FormGroup;
  applyForm: FormGroup;


  constructor(
    private couponService: CouponService,
    readonly eventContext: EventContextService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      discountType: [DiscountType.PERCENTAGE, Validators.required],
      discountAmount: [0, [Validators.min(0)]],
      discountPercentage: [10, [Validators.min(0), Validators.max(100)]],
      minimumPurchaseAmount: [0, [Validators.min(0)]],
      maxDiscountAmount: [null],
      maxUses: [0, [Validators.min(0)]],
      usesPerCustomer: [1, [Validators.required, Validators.min(1)]],
      validFrom: [new Date(), Validators.required],
      validUntil: [new Date(new Date().setFullYear(new Date().getFullYear() + 1)), Validators.required],
      isActive: [true],
      isGlobal: [false],
      applicableEventTypes: [''],
      eventIds: [[]],
      minTickets: [0, [Validators.min(0)]],
      maxTickets: [null, [Validators.min(0)]],
      applyToAllTickets: [true],
      ticketsRequired: [null, [Validators.min(1)]],
      excludedSections: ['']
    });

    this.couponForm.get('discountType')?.valueChanges.subscribe(type => {
      if (type === DiscountType.PERCENTAGE) {
        this.couponForm.get('discountPercentage')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        this.couponForm.get('discountAmount')?.clearValidators();
      } else if (type === DiscountType.FIXEDAMOUNT) {
        this.couponForm.get('discountAmount')?.setValidators([Validators.required, Validators.min(0)]);
        this.couponForm.get('discountPercentage')?.clearValidators();
      } else {
        // BOTH
        this.couponForm.get('discountPercentage')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        this.couponForm.get('discountAmount')?.setValidators([Validators.required, Validators.min(0)]);
      }
      this.couponForm.get('discountPercentage')?.updateValueAndValidity();
      this.couponForm.get('discountAmount')?.updateValueAndValidity();
    });

    this.extendForm = this.fb.group({
      newValidFrom: [null],
      newValidUntil: [null, Validators.required]
    });

    this.applyForm = this.fb.group({
      eventId: ['', Validators.required],
      cartTotal: [0, [Validators.required, Validators.min(0)]]
    });

    // Reload + refilter whenever the global event changes
    const destroyRef = inject(DestroyRef);
    toObservable(this.eventContext.selectedEventId)
      .pipe(skip(1), takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadCoupons();
      });
  }

  ngOnInit() {
    this.loadCoupons();
    this.loadEvents();
  }

  loadCoupons() {
    this.isLoading = true;
    this.couponService.getCoupons({
      eventId: this.eventContext.selectedEventId() || undefined,
      search: this.filter.search || undefined,
      status: this.filter.status || undefined,
      discountType: this.filter.discountType || undefined,
      isAutomatic: false
    }).subscribe({
      next: (coupons) => {
        this.coupons = coupons.filter(c => c.isAutomatic !== true);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.showError('Failed to load coupons');
        this.isLoading = false;
      }
    });
  }

  private computeStats(coupons: CouponDto[]): CouponStats {
    let active = 0, inactive = 0, expired = 0, upcoming = 0, totalUses = 0;
    for (const c of coupons) {
      totalUses += c.currentUses;
      switch (c.status?.toLowerCase()) {
        case 'active':   active++;   break;
        case 'inactive': inactive++; break;
        case 'expired':  expired++;  break;
        case 'upcoming': upcoming++; break;
      }
    }
    return { total: coupons.length, active, inactive, expired, upcoming, totalUses };
  }

  loadEvents() {
    this.couponService.getEvents().subscribe({
      next: (events) => {
        this.events = events.filter(e => e.isActive);
      },
      error: () => {}
    });
  }

  applyFilters() {
    let filtered = [...this.coupons];

    // Stats from the full API result (event + isAutomatic filtering already done server-side)
    this.couponStats = this.computeStats(filtered);

    if (this.filter.dateRange.start && this.filter.dateRange.end) {
      filtered = filtered.filter(coupon => {
        const startDate = new Date(this.filter.dateRange.start!);
        const endDate = new Date(this.filter.dateRange.end!);
        const couponStart = new Date(coupon.validFrom);
        const couponEnd = new Date(coupon.validUntil);
        return (couponStart >= startDate && couponStart <= endDate) ||
               (couponEnd >= startDate && couponEnd <= endDate) ||
               (couponStart <= startDate && couponEnd >= endDate);
      });
    }

    this.filteredCoupons = filtered;
    this.totalItems = filtered.length;
    this.updatePagination();
  }

  updatePagination() {
    const startIndex = this.pageIndex * this.pageSize;
    this.filteredCoupons = this.filteredCoupons.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadCoupons();
  }

  clearFilters() {
    this.filter = {
      search: '',
      status: '',
      discountType: '',
      dateRange: { start: null, end: null }
    };
    this.pageIndex = 0;
    this.loadCoupons();
  }

  // ── Dialog: Create / Edit ─────────────────────────────────────────────────

  openCouponDialog(coupon?: CouponDto) {
    this.isEditMode = !!coupon;
    this.selectedCoupon = coupon || null;

    if (coupon) {
      this.excludedSectionsList = [...(coupon.excludedSections || [])];
      this.couponForm.patchValue({
        ...coupon,
        discountType: coupon.discountType,
        eventIds: coupon.assignedEventIds || [],
        minTickets: coupon.minTickets || 0,
        maxTickets: coupon.maxTickets || null,
        applyToAllTickets: coupon.applyToAllTickets ?? true,
        ticketsRequired: coupon.ticketsRequired || null,
        excludedSections: ''
      });
    } else {
      this.excludedSectionsList = [];
      this.couponForm.reset({
        code: this.couponService.generateCouponCode(),
        name: '',
        description: '',
        discountType: DiscountType.PERCENTAGE,
        discountAmount: 0,
        discountPercentage: 10,
        minimumPurchaseAmount: 0,
        maxDiscountAmount: null,
        maxUses: 0,
        usesPerCustomer: 1,
        validFrom: new Date(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        isGlobal: false,
        applicableEventTypes: '',
        eventIds: [],
        minTickets: 0,
        maxTickets: null,
        applyToAllTickets: true,
        ticketsRequired: null,
        excludedSections: ''
      });
    }

    const dialogRef = this.dialog.open(this.couponDialog, {
      width: '860px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'coupon-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) this.couponForm.reset();
    });
  }

  onSubmit() {
    if (this.couponForm.invalid) {
      this.markFormGroupTouched(this.couponForm);
      return;
    }

    const formValue = this.couponForm.value;
    const excludedSections = [...this.excludedSectionsList];

    const couponData: CouponDto = {
      id: this.isEditMode && this.selectedCoupon ? this.selectedCoupon.id : undefined,
      code: formValue.code,
      name: formValue.name,
      description: formValue.description,
      discountType: formValue.discountType,
      discountAmount: formValue.discountAmount || 0,
      discountPercentage: formValue.discountPercentage || 0,
      minimumPurchaseAmount: formValue.minimumPurchaseAmount || 0,
      maxDiscountAmount: formValue.maxDiscountAmount,
      maxUses: formValue.maxUses || 0,
      currentUses: this.isEditMode && this.selectedCoupon ? this.selectedCoupon.currentUses : 0,
      usesPerCustomer: formValue.usesPerCustomer,
      validFrom: formValue.validFrom,
      validUntil: formValue.validUntil,
      isActive: formValue.isActive,
      // Always scope to the event currently selected in the header
      isGlobal: false,
      eventIds: this.eventContext.selectedEventId()
        ? [this.eventContext.selectedEventId()]
        : [],
      applicableEventTypes: formValue.applicableEventTypes || '',
      status: 'active',
      createdAt: this.isEditMode && this.selectedCoupon ? this.selectedCoupon.createdAt : new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      minTickets: formValue.minTickets || 0,
      maxTickets: formValue.maxTickets || null,
      applyToAllTickets: formValue.applyToAllTickets,
      ticketsRequired: formValue.ticketsRequired || null,
      excludedSections,
      isAutomatic: false,
      canApplyWithCoupon: false
    };

    this.isLoading = true;

    if (this.isEditMode) {
      this.couponService.updateCoupon(couponData.id!, couponData).subscribe({
        next: () => {
          this.showSuccess('Coupon updated successfully');
          this.loadCoupons();
          this.dialog.closeAll();
        },
        error: (err) => {
          this.showError(err?.error?.message || 'Failed to update coupon');
          this.isLoading = false;
        }
      });
    } else {
      this.couponService.createCoupon(couponData).subscribe({
        next: () => {
          this.showSuccess('Coupon created successfully');
          this.loadCoupons();
          this.dialog.closeAll();
        },
        error: (err) => {
          this.showError(err?.error?.message || 'Failed to create coupon');
          this.isLoading = false;
        }
      });
    }
  }

  // ── Dialog: Delete ────────────────────────────────────────────────────────

  openDeleteDialog(coupon: CouponDto) {
    this.selectedCoupon = coupon;
    const dialogRef = this.dialog.open(this.deleteDialog, { width: '440px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.confirmDeleteCoupon(coupon);
      this.selectedCoupon = null;
    });
  }

  confirmDeleteCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.deleteCoupon(coupon.id!).subscribe({
      next: () => {
        this.showSuccess('Coupon deleted successfully');
        this.loadCoupons();
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Failed to delete coupon');
        this.isLoading = false;
      }
    });
  }

  // ── Dialog: Extend Validity ───────────────────────────────────────────────

  openExtendDialog(coupon: CouponDto) {
    this.selectedCoupon = coupon;
    this.extendForm.reset({
      newValidFrom: null,
      newValidUntil: new Date(coupon.validUntil)
    });
    this.dialog.open(this.extendDialog, { width: '500px' });
  }

  confirmExtend() {
    if (this.extendForm.invalid || !this.selectedCoupon) return;
    const { newValidFrom, newValidUntil } = this.extendForm.value;
    this.isLoading = true;
    this.couponService.extendValidity(this.selectedCoupon.id!, {
      newValidFrom: newValidFrom ? (newValidFrom as Date).toISOString() : undefined,
      newValidUntil: (newValidUntil as Date).toISOString()
    }).subscribe({
      next: () => {
        this.showSuccess('Validity extended successfully');
        this.loadCoupons();
        this.dialog.closeAll();
        this.selectedCoupon = null;
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Failed to extend validity');
        this.isLoading = false;
      }
    });
  }

  // ── Dialog: Apply Coupon (Admin Manual) ───────────────────────────────────

  openApplyCouponDialog(coupon: CouponDto) {
    this.selectedCoupon = coupon;
    this.applyForm.reset({ eventId: '', cartTotal: 0 });
    this.dialog.open(this.applyCouponDialog, { width: '500px' });
  }

  confirmApplyCoupon() {
    if (this.applyForm.invalid || !this.selectedCoupon) return;
    const { eventId, cartTotal } = this.applyForm.value;
    this.isLoading = true;
    this.couponService.applyCoupon(this.selectedCoupon.id!, eventId, cartTotal).subscribe({
      next: (result) => {
        this.showSuccess(`Coupon applied. Discount: £${result.discount.toFixed(2)}`);
        this.loadCoupons();
        this.dialog.closeAll();
        this.selectedCoupon = null;
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Coupon is not valid for this transaction');
        this.isLoading = false;
      }
    });
  }

  // ── Dialog: Reset Usage ───────────────────────────────────────────────────

  openResetUsageDialog(coupon: CouponDto) {
    this.selectedCoupon = coupon;
    const dialogRef = this.dialog.open(this.resetUsageDialog, { width: '440px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.selectedCoupon) this.confirmResetUsage(this.selectedCoupon);
      this.selectedCoupon = null;
    });
  }

  confirmResetUsage(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.resetUsage(coupon.id!).subscribe({
      next: () => {
        this.showSuccess('Usage counter reset to 0');
        this.loadCoupons();
      },
      error: () => {
        this.showError('Failed to reset usage counter');
        this.isLoading = false;
      }
    });
  }

  // ── Status Actions ────────────────────────────────────────────────────────

  toggleCouponStatus(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.toggleActive(coupon.id!).subscribe({
      next: (result) => {
        this.showSuccess(`Coupon ${result.isActive ? 'activated' : 'deactivated'}`);
        this.loadCoupons();
      },
      error: () => {
        this.showError('Failed to update coupon status');
        this.isLoading = false;
      }
    });
  }

  activateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.activateCoupon(coupon.id!).subscribe({
      next: () => {
        this.showSuccess('Coupon activated');
        this.loadCoupons();
      },
      error: () => {
        this.showError('Failed to activate coupon');
        this.isLoading = false;
      }
    });
  }

  deactivateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.deactivateCoupon(coupon.id!).subscribe({
      next: () => {
        this.showSuccess('Coupon deactivated');
        this.loadCoupons();
      },
      error: () => {
        this.showError('Failed to deactivate coupon');
        this.isLoading = false;
      }
    });
  }

  duplicateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.duplicateCoupon(coupon.id!).subscribe({
      next: (newCoupon) => {
        this.showSuccess(`Duplicated as "${newCoupon.code}" (inactive)`);
        this.loadCoupons();
      },
      error: () => {
        this.showError('Failed to duplicate coupon');
        this.isLoading = false;
      }
    });
  }

  // ── UI Helpers ────────────────────────────────────────────────────────────

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':   return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'expired':  return 'status-expired';
      case 'upcoming': return 'status-upcoming';
      default:         return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':   return 'check_circle';
      case 'inactive': return 'pause_circle';
      case 'expired':  return 'cancel';
      case 'upcoming': return 'schedule';
      default:         return 'help';
    }
  }

  getDiscountDisplay(coupon: CouponDto): string {
    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:  return `${coupon.discountPercentage}% OFF`;
      case DiscountType.FIXEDAMOUNT: return `£${coupon.discountAmount} OFF`;
      case DiscountType.BOTH:        return `${coupon.discountPercentage}% + £${coupon.discountAmount} OFF`;
      default:                       return `${coupon.discountPercentage}% OFF`;
    }
  }

  getDiscountTypeLabel(type: DiscountType): string {
    switch (type) {
      case DiscountType.PERCENTAGE:  return 'Percentage';
      case DiscountType.FIXEDAMOUNT: return 'Fixed';
      case DiscountType.BOTH:        return 'Both';
      default:                       return '';
    }
  }

  getUsagePercentage(coupon: CouponDto): number {
    if (!coupon.maxUses) return 0;
    return Math.min((coupon.currentUses / coupon.maxUses) * 100, 100);
  }

  isExpired(coupon: CouponDto): boolean {
    return new Date() > new Date(coupon.validUntil);
  }

  isUpcoming(coupon: CouponDto): boolean {
    return new Date() < new Date(coupon.validFrom);
  }

  isActiveNow(coupon: CouponDto): boolean {
    const now = new Date();
    return now >= new Date(coupon.validFrom) && now <= new Date(coupon.validUntil) && coupon.isActive;
  }

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  }

  generateNewCode() {
    this.couponForm.patchValue({ code: this.couponService.generateCouponCode() });
  }

  getTicketRuleDescription(coupon: CouponDto): string {
    const rules: string[] = [];
    if (coupon.minTickets > 0) rules.push(`Min ${coupon.minTickets}`);
    if (coupon.maxTickets && coupon.maxTickets > 0) rules.push(`Max ${coupon.maxTickets}`);
    if (coupon.ticketsRequired) {
      rules.push(coupon.applyToAllTickets
        ? `Apply to ${coupon.ticketsRequired} tickets`
        : `${coupon.ticketsRequired} tickets required`);
    }
    return rules.length > 0 ? rules.join(', ') : 'No restrictions';
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3500,
      panelClass: ['snackbar-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snackbar-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}
