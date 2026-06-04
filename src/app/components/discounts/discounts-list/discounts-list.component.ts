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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { CouponService } from '../../../core/services/coupon.service';
import { EventContextService } from '../../../core/services/event-context.service';
import { CouponDto, CouponEvent, CouponStats } from '../../../core/models/DTOs/coupon.DTO.model';
import { DiscountType } from '../../../core/models/Enums/coupon.enum';

@Component({
  selector: 'app-discounts-list',
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
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCardModule
  ],
  templateUrl: './discounts-list.component.html',
  styleUrls: ['./discounts-list.component.scss']
})
export class DiscountsListComponent implements OnInit {
  @ViewChild('discountDialog') discountDialog!: TemplateRef<any>;
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild('extendDialog') extendDialog!: TemplateRef<any>;

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
  discounts: CouponDto[] = [];
  filteredDiscounts: CouponDto[] = [];
  events: CouponEvent[] = [];
  stats: CouponStats | null = null;
  selectedDiscount: CouponDto | null = null;
  isEditMode = false;
  isLoading = false;

  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;

  // Filters
  searchText = '';
  statusFilter = '';

  statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'expired', label: 'Expired' },
    { value: 'upcoming', label: 'Upcoming' }
  ];

  // Forms
  discountForm: FormGroup;
  extendForm: FormGroup;


  constructor(
    private couponService: CouponService,
    readonly eventContext: EventContextService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.discountForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      discountType: [DiscountType.PERCENTAGE, Validators.required],
      discountPercentage: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      discountAmount: [0, [Validators.min(0.01)]],
      minTickets: [1, [Validators.required, Validators.min(0)]],
      validFrom: [new Date(), Validators.required],
      validUntil: [new Date(new Date().setFullYear(new Date().getFullYear() + 1)), Validators.required],
      isActive: [true]
    });

    // Swap validators when discount type changes
    this.discountForm.get('discountType')!.valueChanges.subscribe(type => {
      this.updateDiscountValidators(type);
    });

    this.extendForm = this.fb.group({
      newValidFrom: [null],
      newValidUntil: [null, Validators.required]
    });

    const destroyRef = inject(DestroyRef);
    toObservable(this.eventContext.selectedEventId)
      .pipe(skip(1), takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadDiscounts();
      });
  }

  ngOnInit() {
    this.loadDiscounts();
    this.loadEvents();
  }

  loadDiscounts() {
    this.isLoading = true;
    this.couponService.getCoupons({
      eventId: this.eventContext.selectedEventId() || undefined,
      search: this.searchText || undefined,
      status: this.statusFilter || undefined,
      isAutomatic: true
    }).subscribe({
      next: (coupons) => {
        this.discounts = coupons.filter(c => c.isAutomatic === true);
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.showError('Failed to load bulk discount rules');
        this.isLoading = false;
      }
    });
  }

  loadEvents() {
    this.couponService.getEvents().subscribe({
      next: (events) => { this.events = events.filter(e => e.isActive); },
      error: () => {}
    });
  }

  private computeStats(items: CouponDto[]): CouponStats {
    let active = 0, inactive = 0, expired = 0, upcoming = 0, totalUses = 0;
    for (const c of items) {
      totalUses += c.currentUses;
      switch (c.status?.toLowerCase()) {
        case 'active':   active++;   break;
        case 'inactive': inactive++; break;
        case 'expired':  expired++;  break;
        case 'upcoming': upcoming++; break;
      }
    }
    return { total: items.length, active, inactive, expired, upcoming, totalUses };
  }

  applyFilters() {
    this.stats = this.computeStats(this.discounts);
    this.filteredDiscounts = [...this.discounts];
    this.totalItems = this.filteredDiscounts.length;
    this.updatePagination();
  }

  updatePagination() {
    const start = this.pageIndex * this.pageSize;
    this.filteredDiscounts = this.filteredDiscounts.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  onFilterChange() {
    this.pageIndex = 0;
    this.loadDiscounts();
  }

  clearFilters() {
    this.searchText = '';
    this.statusFilter = '';
    this.pageIndex = 0;
    this.loadDiscounts();
  }

  // ── Dialog: Create / Edit ─────────────────────────────────────────────────

  openDiscountDialog(discount?: CouponDto) {
    this.isEditMode = !!discount;
    this.selectedDiscount = discount || null;

    if (discount) {
      this.excludedSectionsList = [...(discount.excludedSections || [])];
      this.discountForm.patchValue({
        name: discount.name,
        description: discount.description,
        discountType: discount.discountType ?? DiscountType.PERCENTAGE,
        discountPercentage: discount.discountPercentage,
        discountAmount: discount.discountAmount ?? 0,
        minTickets: discount.minTickets,
        validFrom: new Date(discount.validFrom),
        validUntil: new Date(discount.validUntil),
        isActive: discount.isActive
      });
      this.updateDiscountValidators(discount.discountType ?? DiscountType.PERCENTAGE);
    } else {
      this.excludedSectionsList = [];
      this.discountForm.reset({
        name: '',
        description: '',
        discountType: DiscountType.PERCENTAGE,
        discountPercentage: 10,
        discountAmount: 0,
        minTickets: 1,
        validFrom: new Date(),
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true
      });
      this.updateDiscountValidators(DiscountType.PERCENTAGE);
    }

    const dialogRef = this.dialog.open(this.discountDialog, {
      width: '780px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'discount-form-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) this.discountForm.reset();
    });
  }

  onSubmit() {
    if (this.discountForm.invalid) {
      this.markFormGroupTouched(this.discountForm);
      return;
    }

    const fv = this.discountForm.value;
    const autoCode = 'BULK_' + (fv.name as string).toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const isFixed = fv.discountType === DiscountType.FIXEDAMOUNT;

    const payload: CouponDto = {
      id: this.isEditMode && this.selectedDiscount ? this.selectedDiscount.id : undefined,
      code: this.isEditMode && this.selectedDiscount ? this.selectedDiscount.code : autoCode,
      name: fv.name,
      description: fv.description || '',
      discountType: fv.discountType,
      discountAmount: isFixed ? fv.discountAmount : 0,
      discountPercentage: isFixed ? 0 : fv.discountPercentage,
      minimumPurchaseAmount: 0,
      maxUses: 0,
      currentUses: this.isEditMode && this.selectedDiscount ? this.selectedDiscount.currentUses : 0,
      usesPerCustomer: 1,
      validFrom: fv.validFrom,
      validUntil: fv.validUntil,
      isActive: fv.isActive,
      isGlobal: false,
      eventIds: this.isEditMode && this.selectedDiscount
        ? (this.selectedDiscount.assignedEventIds || [])
        : (this.eventContext.selectedEventId() ? [this.eventContext.selectedEventId()!] : []),
      applicableEventTypes: '',
      status: 'active',
      createdAt: this.isEditMode && this.selectedDiscount ? this.selectedDiscount.createdAt : new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      minTickets: fv.minTickets || 0,
      applyToAllTickets: true,
      excludedSections: [...this.excludedSectionsList],
      // auto-wire to the currently selected event; preserve existing on edit
      allSectionsEvents: this.isEditMode && this.selectedDiscount
        ? (this.selectedDiscount.allSectionsEvents || [])
        : (this.eventContext.selectedEventId() ? [this.eventContext.selectedEventId()!] : []),
      isAutomatic: true,
      canApplyWithCoupon: false
    };

    this.isLoading = true;

    if (this.isEditMode) {
      this.couponService.updateCoupon(payload.id!, payload).subscribe({
        next: () => {
          this.showSuccess('Bulk discount rule updated');
          this.loadDiscounts();
          this.dialog.closeAll();
        },
        error: (err) => {
          this.showError(err?.error?.message || 'Failed to update rule');
          this.isLoading = false;
        }
      });
    } else {
      this.couponService.createCoupon(payload).subscribe({
        next: () => {
          this.showSuccess('Bulk discount rule created');
          this.loadDiscounts();
          this.dialog.closeAll();
        },
        error: (err) => {
          this.showError(err?.error?.message || 'Failed to create rule');
          this.isLoading = false;
        }
      });
    }
  }

  // ── Dialog: Delete ────────────────────────────────────────────────────────

  openDeleteDialog(discount: CouponDto) {
    this.selectedDiscount = discount;
    const dialogRef = this.dialog.open(this.deleteDialog, { width: '440px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.confirmDelete(discount);
      this.selectedDiscount = null;
    });
  }

  confirmDelete(discount: CouponDto) {
    this.isLoading = true;
    this.couponService.deleteCoupon(discount.id!).subscribe({
      next: () => {
        this.showSuccess('Rule deleted');
        this.loadDiscounts();
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Failed to delete rule');
        this.isLoading = false;
      }
    });
  }

  // ── Dialog: Extend Validity ───────────────────────────────────────────────

  openExtendDialog(discount: CouponDto) {
    this.selectedDiscount = discount;
    this.extendForm.reset({
      newValidFrom: null,
      newValidUntil: new Date(discount.validUntil)
    });
    this.dialog.open(this.extendDialog, { width: '500px' });
  }

  confirmExtend() {
    if (this.extendForm.invalid || !this.selectedDiscount) return;
    const { newValidFrom, newValidUntil } = this.extendForm.value;
    this.isLoading = true;
    this.couponService.extendValidity(this.selectedDiscount.id!, {
      newValidFrom: newValidFrom ? (newValidFrom as Date).toISOString() : undefined,
      newValidUntil: (newValidUntil as Date).toISOString()
    }).subscribe({
      next: () => {
        this.showSuccess('Validity extended');
        this.loadDiscounts();
        this.dialog.closeAll();
        this.selectedDiscount = null;
      },
      error: (err) => {
        this.showError(err?.error?.message || 'Failed to extend validity');
        this.isLoading = false;
      }
    });
  }

  // ── Status Actions ────────────────────────────────────────────────────────

  toggleStatus(discount: CouponDto) {
    this.couponService.toggleActive(discount.id!).subscribe({
      next: (r) => { this.showSuccess(`Rule ${r.isActive ? 'activated' : 'deactivated'}`); this.loadDiscounts(); },
      error: () => this.showError('Failed to update status')
    });
  }

  activateDiscount(discount: CouponDto) {
    this.couponService.activateCoupon(discount.id!).subscribe({
      next: () => { this.showSuccess('Rule activated'); this.loadDiscounts(); },
      error: () => this.showError('Failed to activate')
    });
  }

  deactivateDiscount(discount: CouponDto) {
    this.couponService.deactivateCoupon(discount.id!).subscribe({
      next: () => { this.showSuccess('Rule deactivated'); this.loadDiscounts(); },
      error: () => this.showError('Failed to deactivate')
    });
  }

  duplicateDiscount(discount: CouponDto) {
    this.couponService.duplicateCoupon(discount.id!).subscribe({
      next: (d) => { this.showSuccess(`Duplicated as "${d.code}" (inactive)`); this.loadDiscounts(); },
      error: () => this.showError('Failed to duplicate')
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

  get isFixedAmount(): boolean {
    return this.discountForm.get('discountType')?.value === DiscountType.FIXEDAMOUNT;
  }

  private updateDiscountValidators(type: DiscountType): void {
    const pctCtrl = this.discountForm.get('discountPercentage')!;
    const amtCtrl = this.discountForm.get('discountAmount')!;
    if (type === DiscountType.FIXEDAMOUNT) {
      pctCtrl.clearValidators();
      amtCtrl.setValidators([Validators.required, Validators.min(0.01)]);
    } else {
      pctCtrl.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      amtCtrl.clearValidators();
    }
    pctCtrl.updateValueAndValidity();
    amtCtrl.updateValueAndValidity();
  }

  getDiscountLabel(d: CouponDto): string {
    return d.discountType === DiscountType.FIXEDAMOUNT
      ? `£${(d.discountAmount ?? 0).toFixed(2)} OFF`
      : `${d.discountPercentage}% OFF`;
  }

  isExpired(d: CouponDto): boolean { return new Date() > new Date(d.validUntil); }
  isUpcoming(d: CouponDto): boolean { return new Date() < new Date(d.validFrom); }
  isActiveNow(d: CouponDto): boolean {
    const now = new Date();
    return now >= new Date(d.validFrom) && now <= new Date(d.validUntil) && d.isActive;
  }

  getEventName(id: string): string {
    return this.events.find(e => e.id === id)?.title ?? id;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private markFormGroupTouched(fg: FormGroup) {
    Object.values(fg.controls).forEach(c => {
      c.markAsTouched();
      if (c instanceof FormGroup) this.markFormGroupTouched(c);
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
