import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { CouponDto, CouponEvent, CouponFilter } from '../../../core/models/DTOs/coupon.DTO.model';
import { MatListModule } from '@angular/material/list';
import { ClipboardModule } from '@angular/cdk/clipboard'; // Add this import
import { DiscountType } from '../../../core/models/Enums/coupon.enum';

@Component({
  selector: 'app-coupons-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
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

  // Data
  coupons: CouponDto[] = [];
  filteredCoupons: CouponDto[] = [];
  events: CouponEvent[] = [];
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
    dateRange: {
      start: null,
      end: null
    }
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
    { value: 'Percentage', label: 'Percentage' },
    { value: 'FixedAmount', label: 'Fixed Amount' }
  ];

  // Form
  couponForm: FormGroup;
  
  // Table
  displayedColumns: string[] = [
    'code', 
    'description', 
    'discount', 
    'dates', 
    'usage', 
    'status', 
    'actions'
  ];

  constructor(
    private couponService: CouponService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Initialize form
    this.couponForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
      discountType: ['Percentage', Validators.required],
      discountAmount: [0, [Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
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
      ticketsRequired: [null, [Validators.min(1)]]
    });

    // Update validators based on discount type
    this.couponForm.get('discountType')?.valueChanges.subscribe(type => {
      if (type === 'Percentage') {
        this.couponForm.get('discountPercentage')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
        this.couponForm.get('discountAmount')?.clearValidators();
      } else {
        this.couponForm.get('discountAmount')?.setValidators([Validators.required, Validators.min(0)]);
        this.couponForm.get('discountPercentage')?.clearValidators();
      }
      this.couponForm.get('discountPercentage')?.updateValueAndValidity();
      this.couponForm.get('discountAmount')?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.loadCoupons();
    this.loadEvents();
  }

  loadCoupons() {
    this.isLoading = true;
    this.couponService.getCoupons({
      search: this.filter.search || undefined,
      status: this.filter.status || undefined,
      discountType: this.filter.discountType || undefined
    }).subscribe({
      next: (coupons) => {
        this.coupons = coupons;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.showError('Failed to load coupons');
        this.isLoading = false;
      }
    });
  }



  applyFilters() {
    let filtered = [...this.coupons];

    // Apply date range filter
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

  clearFilters() {
    this.filter = {
      search: '',
      status: '',
      discountType: '',
      dateRange: { start: null, end: null }
    };
    this.loadCoupons();
  }

  loadEvents() {
    this.couponService.getEvents().subscribe({
      next: (events) => {
        this.events = events.filter(e => e.isActive);
      },
      error: (error) => {
        console.error('Failed to load events:', error);
      }
    });
  }
  // Dialog methods
  openCouponDialog(coupon?: CouponDto) {
    this.isEditMode = !!coupon;
    this.selectedCoupon = coupon || null;
    
    if (coupon) {
      // Edit mode
      this.couponForm.patchValue({
        ...coupon,
        discountType: coupon.discountType, // Assuming enum values
        eventIds: coupon.assignedEventIds || [],
        minTickets: coupon.minTickets || 0,
        maxTickets: coupon.maxTickets || null,
        applyToAllTickets: coupon.applyToAllTickets ?? true,
        ticketsRequired: coupon.ticketsRequired || null
      });
    } else {
      // Create mode
      this.couponForm.reset({
        code: this.couponService.generateCouponCode(),
        name: '',
        description: '',
        discountType: 'Percentage',
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
        eventIds: [] ,
        minTickets: 0,
        maxTickets: null,
        applyToAllTickets: true,
        ticketsRequired: null
      });
    }

    const dialogRef = this.dialog.open(this.couponDialog, {
      width: '800px',
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        this.couponForm.reset();
      }
    });
  }

  openDeleteDialog(coupon: CouponDto) {
    this.selectedCoupon = coupon;
    
    const dialogRef = this.dialog.open(this.deleteDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.confirmDeleteCoupon(coupon);
      }
      this.selectedCoupon = null;
    });
  }

  // Form submission
  onSubmit() {
    if (this.couponForm.invalid) {
      this.markFormGroupTouched(this.couponForm);
      return;
    }

    const formValue = this.couponForm.value;
    const couponData: CouponDto = {
      id: this.isEditMode && this.selectedCoupon ? this.selectedCoupon.id : '00000000-0000-0000-0000-000000000000',
      code: formValue.code,
      name: formValue.name,
      description: formValue.description,
      discountType: formValue.discountType === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXEDAMOUNT,
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
      isGlobal: formValue.isGlobal,
      applicableEventTypes: formValue.applicableEventTypes,
      status: 'active',
      createdAt: this.isEditMode && this.selectedCoupon ? this.selectedCoupon.createdAt : new Date(),
      updatedAt: new Date(),
      createdBy: 'admin',
      eventIds: formValue.eventIds || [],
      minTickets: formValue.minTickets || 0,
      maxTickets: formValue.maxTickets || null,
      applyToAllTickets: formValue.applyToAllTickets,
      ticketsRequired: formValue.ticketsRequired || null
    };

    this.isLoading = true;
    
    if (this.isEditMode) {
      this.couponService.updateCoupon(couponData.id, couponData).subscribe({
        next: () => {
          this.showSuccess('Coupon updated successfully');
          this.loadCoupons();
          this.dialog.closeAll();
        },
        error: (error) => {
          this.showError('Failed to update coupon');
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
        error: (error) => {
          this.showError('Failed to create coupon');
          this.isLoading = false;
        }
      });
    }
  }

  // Coupon actions
  duplicateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.duplicateCoupon(coupon.id).subscribe({
      next: (newCoupon) => {
        this.showSuccess('Coupon duplicated successfully');
        this.loadCoupons();
      },
      error: (error) => {
        this.showError('Failed to duplicate coupon');
        this.isLoading = false;
      }
    });
  }

  toggleCouponStatus(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.toggleActive(coupon.id).subscribe({
      next: (result) => {
        this.showSuccess(`Coupon ${result.isActive ? 'activated' : 'deactivated'} successfully`);
        this.loadCoupons();
      },
      error: (error) => {
        this.showError('Failed to update coupon status');
        this.isLoading = false;
      }
    });
  }

  activateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.activateCoupon(coupon.id).subscribe({
      next: () => {
        this.showSuccess('Coupon activated successfully');
        this.loadCoupons();
      },
      error: (error) => {
        this.showError('Failed to activate coupon');
        this.isLoading = false;
      }
    });
  }

  deactivateCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.deactivateCoupon(coupon.id).subscribe({
      next: () => {
        this.showSuccess('Coupon deactivated successfully');
        this.loadCoupons();
      },
      error: (error) => {
        this.showError('Failed to deactivate coupon');
        this.isLoading = false;
      }
    });
  }

  resetCouponUsage(coupon: CouponDto) {
    if (confirm(`Reset usage counter for "${coupon.code}"? This will set current uses to 0.`)) {
      this.isLoading = true;
      this.couponService.resetUsage(coupon.id).subscribe({
        next: () => {
          this.showSuccess('Usage counter reset successfully');
          this.loadCoupons();
        },
        error: (error) => {
          this.showError('Failed to reset usage counter');
          this.isLoading = false;
        }
      });
    }
  }

  confirmDeleteCoupon(coupon: CouponDto) {
    this.isLoading = true;
    this.couponService.deleteCoupon(coupon.id).subscribe({
      next: () => {
        this.showSuccess('Coupon deleted successfully');
        this.loadCoupons();
      },
      error: (error) => {
        this.showError('Failed to delete coupon');
        this.isLoading = false;
      }
    });
  }

  // UI Helpers
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'expired': return 'status-expired';
      case 'upcoming': return 'status-upcoming';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'expired': return 'Expired';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  }

  getDiscountDisplay(coupon: CouponDto): string {
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      return `${coupon.discountPercentage}% OFF`;
    } else {
      return `$${coupon.discountAmount} OFF`;
    }
  }

  getUsagePercentage(coupon: CouponDto): number {
    if (coupon.maxUses === 0) return 0;
    return (coupon.currentUses / coupon.maxUses) * 100;
  }

  isExpired(coupon: CouponDto): boolean {
    return new Date() > new Date(coupon.validUntil);
  }

  isUpcoming(coupon: CouponDto): boolean {
    return new Date() < new Date(coupon.validFrom);
  }

  isActiveNow(coupon: CouponDto): boolean {
    const now = new Date();
    const start = new Date(coupon.validFrom);
    const end = new Date(coupon.validUntil);
    return now >= start && now <= end && coupon.isActive;
  }

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.title : 'Unknown Event';
  }

  generateNewCode() {
    this.couponForm.patchValue({
      code: this.couponService.generateCouponCode()
    });
  }

  // Utility methods
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error']
    });
  }

  getTicketRuleDescription(coupon: CouponDto): string {
    const rules = [];
    
    if (coupon.minTickets > 0)
      rules.push(`Min ${coupon.minTickets}`);
    
    if (coupon.maxTickets && coupon.maxTickets > 0)
      rules.push(`Max ${coupon.maxTickets}`);
    
    if (coupon.ticketsRequired) {
      if (coupon.applyToAllTickets) {
        rules.push(`Apply to ${coupon.ticketsRequired} tickets`);
      } else {
        rules.push(`${coupon.ticketsRequired} tickets required`);
      }
    }
    
    return rules.length > 0 ? rules.join(', ') : 'No restrictions';
  }
}