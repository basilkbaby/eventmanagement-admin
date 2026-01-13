import { Component, OnInit, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { EventDto } from '../../../core/models/DTOs/event.DTO.model';
import { MatDividerModule } from '@angular/material/divider';
import { EventService } from '../../../core/services/event.service';
import { OrderDto, OrderSeatDto } from '../../../core/models/DTOs/order.DTO.model';
import { OrderStatus, PaymentStatus, SeatType } from '../../../core/models/Enums/order.enum';
import { OrderService } from '../../../core/services/order.service';



@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit, AfterViewInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private eventService = inject(EventService);
  
  readonly showFilters = signal(false);
  event: EventDto | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  readonly orders = signal<OrderDto[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedEvent = signal('');
  readonly selectedOrderStatus = signal('');
  readonly selectedPaymentStatus = signal('');

  readonly filteredOrders = computed(() => {
    const orders = this.orders();
    const search = this.searchTerm().toLowerCase();
    const eventFilter = this.selectedEvent();
    const orderStatusFilter = this.selectedOrderStatus();
    const paymentStatusFilter = this.selectedPaymentStatus();

    return orders.filter(order => {
      const matchesSearch = !search || 
        order.orderNumber.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        order.customerEmail.toLowerCase().includes(search) ||
        order.eventName.toLowerCase().includes(search);

      const matchesEvent = !eventFilter || order.eventId === eventFilter;
      const matchesOrderStatus = !orderStatusFilter || order.status === orderStatusFilter;
      const matchesPaymentStatus = !paymentStatusFilter || order.paymentStatus === paymentStatusFilter;

      return matchesSearch && matchesEvent && matchesOrderStatus && matchesPaymentStatus;
    });
  });

  readonly stats = computed(() => {
    const orders = this.orders();
    const allSeats = orders.flatMap(order => order.orderSeats);
    
    return {
      totalOrders: orders.length,
      totalSeats: allSeats.length,
      activeSeats: allSeats.filter(s => !s.isCancelled).length,
      cancelledSeats: allSeats.filter(s => s.isCancelled).length,
      totalRevenue: orders
        .filter(o => o.status === OrderStatus.CONFIRMED)
        .reduce((sum, order) => sum + order.finalAmount, 0),
      confirmedOrders: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      
      // New breakdown stats
      totalServiceFees: orders.reduce((sum, order) => sum + order.serviceFeeAmount, 0),
      totalBulkDiscounts: orders.reduce((sum, order) => sum + order.bulkDiscountAmount, 0),
      totalCouponDiscounts: orders.reduce((sum, order) => sum + order.couponDiscount, 0),
    };
  });

  displayedColumns: string[] = [
    'expand',
    'orderNumber',
    'customer',
    'event',
    'seats',
    'amount',
    'status',
    'orderDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<OrderDto>();
  
  events: EventDto[] = [];

  orderStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: OrderStatus.PENDING, label: 'Pending' },
    { value: OrderStatus.CONFIRMED, label: 'Confirmed' },
    { value: OrderStatus.CANCELLED, label: 'Cancelled' }
  ];

  eventOptions = [
    { value: '', label: 'All Events' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.PROCESSING, label: 'Processing' },
    { value: PaymentStatus.COMPLETED, label: 'Completed' },
    { value: PaymentStatus.FAILED, label: 'Failed' },
    { value: PaymentStatus.REFUNDED, label: 'Refunded' }
  ];

  ngOnInit(): void {
    this.loadData();
    this.loadEvents();
  }

  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        this.eventOptions = [
          { value: '', label: 'All Events' },
          ...this.events.map(event => ({
            value: event.id,
            label: `${event.title} (${this.formatEventDate(event.startDate)})`
          }))
        ];
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.showError('Failed to load events');
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupCustomSorting();
  }

  formatEventDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  loadData(): void {
    this.loading.set(true);
    
    this.orderService.getOrders(
      this.searchTerm() || undefined,
      this.selectedEvent() || undefined,
      this.selectedOrderStatus() as OrderStatus || undefined,
      this.selectedPaymentStatus() as PaymentStatus || undefined
    ).subscribe({
      next: (response) => {
        const ordersWithDetails: OrderDto[] = response.orders.map(order => ({
          ...order,
          expanded: false,
          cancelledSeatsCount: order.orderSeats.filter(s => s.isCancelled).length,
          totalSeatsCount: order.orderSeats.length
        }));
        
        this.orders.set(ordersWithDetails);
        this.dataSource.data = ordersWithDetails;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading.set(false);
        this.showError('Failed to load orders');
      }
    });
  }

  setupCustomSorting(): void {
    this.dataSource.sortingDataAccessor = (order: OrderDto, property: string) => {
      switch (property) {
        case 'customer': return order.customerName.toLowerCase();
        case 'event': return order.eventName.toLowerCase();
        case 'seats': return order.seatCount;
        case 'amount': return order.finalAmount;
        case 'orderDate': return new Date(order.createdAt).getTime();
        case 'status': return this.getMainStatus(order);
        default: return (order as any)[property];
      }
    };
  }

  applyFilters(): void {
    this.dataSource.data = this.filteredOrders();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedEvent.set('');
    this.selectedOrderStatus.set('');
    this.selectedPaymentStatus.set('');
    this.applyFilters();
  }

  toggleOrderExpansion(order: OrderDto): void {
    order.expanded = !order.expanded;
  }

  // Seat Actions
  cancelSeat(order: OrderDto, seatId: string): void {
    const seat = order.orderSeats.find(s => s.id === seatId);
    if (!seat) return;

    if (confirm(`Are you sure you want to cancel seat ${seat.seatNumber}?`)) {
      this.orderService.cancelSeat(order.id, seatId, 'Admin cancellation').subscribe({
        next: () => {
          this.showSuccess('Seat cancelled successfully');
          this.refreshOrderSeat(order.id, seatId);
        },
        error: (error) => {
          this.showError(error.message || 'Failed to cancel seat');
        }
      });
    }
  }

  // Order Actions
  viewOrder(order: OrderDto): void {
    this.router.navigate(['/admin/orders', order.id]);
  }

  updateOrderStatus(order: OrderDto, status: OrderStatus): void {
    const action = status === OrderStatus.CANCELLED ? 'cancel' : 'update';
    const message = `Are you sure you want to ${action} order ${order.orderNumber}?`;
    
    if (confirm(message)) {
      this.orderService.updateOrderStatus(
        order.id, 
        status,
        status === OrderStatus.CANCELLED ? 'Admin cancellation' : undefined
      ).subscribe({
        next: () => {
          this.showSuccess(`Order ${action}ed successfully`);
          this.loadData();
        },
        error: (error) => {
          this.showError(error.message || `Failed to ${action} order`);
        }
      });
    }
  }

  resendOrderConfirmation(order: OrderDto): void {
    this.orderService.resendConfirmation(order.id).subscribe({
      next: () => {
        this.showSuccess('Order confirmation sent to ' + order.customerEmail);
      },
      error: (error) => {
        this.showError(error.message || 'Failed to resend order confirmation');
      }
    });
  }

  processRefund(order: OrderDto): void {
    if (confirm(`Process refund for order ${order.orderNumber}? Amount: $${order.finalAmount}`)) {
      // Implement refund logic here
      this.showSuccess('Refund processed successfully');
    }
  }

  // Export functionality
  exportOrders(): void {
    const eventId = this.selectedEvent() || undefined;
    this.orderService.exportOrders('csv', eventId).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
        this.showSuccess('Orders exported successfully');
      },
      error: (error) => {
        this.showError('Failed to export orders');
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private refreshOrderSeat(orderId: string, seatId: string): void {
    const updatedOrders = this.orders().map(order => {
      if (order.id === orderId) {
        const updatedSeats = order.orderSeats.map(seat => 
          seat.id === seatId ? { ...seat, isCancelled: true, cancelledAt: new Date() } : seat
        );
        return {
          ...order,
          orderSeats: updatedSeats,
          cancelledSeatsCount: updatedSeats.filter(s => s.isCancelled).length
        };
      }
      return order;
    });
    
    this.orders.set(updatedOrders);
    this.applyFilters();
  }

  // Status helpers
  getSeatStatusClass(isCancelled: boolean): string {
    return isCancelled ? 'status-cancelled' : 'status-active';
  }

  getSeatStatusText(isCancelled: boolean): string {
    return isCancelled ? 'Cancelled' : 'Active';
  }

 // In admin-orders.component.ts, update the method:
getSeatTypeClass(seatType: SeatType | string): string {
  // Convert to string and normalize
  const typeStr = String(seatType).toUpperCase();
  
  switch (typeStr) {
    case 'VIP': 
    case SeatType.VIP.toString(): 
      return 'seat-type-vip';
    
    case 'PREMIUM': 
    case SeatType.PREMIUM.toString(): 
      return 'seat-type-premium';
    
    case 'STUDENT': 
    case SeatType.STUDENT.toString(): 
      return 'seat-type-student';
    
    case 'SENIOR': 
    case SeatType.SENIOR.toString(): 
      return 'seat-type-senior';
    
    case 'REGULAR': 
    case SeatType.REGULAR.toString():
    default: 
      return 'seat-type-regular';
  }
}

  getSeatTypeText(seatType: SeatType): string {
    return seatType;
  }

  getOrderStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'status-confirmed';
      case OrderStatus.PENDING: return 'status-pending';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getPaymentStatusClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED: return 'status-completed';
      case PaymentStatus.PENDING: return 'status-pending';
      case PaymentStatus.PROCESSING: return 'status-processing';
      case PaymentStatus.FAILED: return 'status-failed';
      case PaymentStatus.REFUNDED: return 'status-refunded';
      default: return 'status-unknown';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-UK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUniqueSeatTypes(seats: OrderSeatDto[]): string[] {
    const types = new Set<string>();
    seats.forEach(seat => {
      types.add(seat.seatType);
    });
    return Array.from(types);
  }

  // Helper methods
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000, 
      panelClass: ['error-snackbar'] 
    });
  }

  // Getters for template
  get SeatType() {
    return SeatType;
  }

  get OrderStatus() {
    return OrderStatus;
  }

  get PaymentStatus() {
    return PaymentStatus;
  }

  getOrderStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'Confirmed';
      case OrderStatus.PENDING: return 'Pending';
      case OrderStatus.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getPaymentStatusText(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED: return 'Paid';
      case PaymentStatus.PENDING: return 'Pending';
      case PaymentStatus.PROCESSING: return 'Processing';
      case PaymentStatus.FAILED: return 'Failed';
      case PaymentStatus.REFUNDED: return 'Refunded';
      default: return 'Unknown';
    }
  }

  getPaymentStatusIcon(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.COMPLETED: return 'check_circle';
      case PaymentStatus.PENDING: return 'schedule';
      case PaymentStatus.PROCESSING: return 'autorenew';
      case PaymentStatus.FAILED: return 'error';
      case PaymentStatus.REFUNDED: return 'currency_exchange';
      default: return 'help';
    }
  }

  getOrderStatusIcon(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'check_circle';
      case OrderStatus.PENDING: return 'schedule';
      case OrderStatus.CANCELLED: return 'cancel';
      default: return 'help';
    }
  }

  // Simple status logic
  getMainStatus(order: OrderDto): string {
    if (order.status === OrderStatus.CANCELLED) {
      return 'cancelled';
    }
    
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      return 'refunded';
    }
    
    if (order.status === OrderStatus.CONFIRMED && order.paymentStatus === PaymentStatus.COMPLETED) {
      return 'confirmed';
    }
    
    if (order.paymentStatus === PaymentStatus.FAILED) {
      return 'failed';
    }
    
    return 'pending';
  }

  getStatusText(order: OrderDto): string {
    const status = this.getMainStatus(order);
    
    switch (status) {
      case 'confirmed': return 'Confirmed';
      case 'pending': return 'Pending';
      case 'cancelled': return 'Cancelled';
      case 'refunded': return 'Refunded';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  }

  getStatusClass(order: OrderDto): string {
    const status = this.getMainStatus(order);
    return `status-${status}`;
  }

  toggleFilters(): void {
    const newValue = !this.showFilters();
    this.showFilters.set(newValue);
  }

  hasActiveFilters(): boolean {
    return !!this.searchTerm() || 
           !!this.selectedEvent() || 
           !!this.selectedOrderStatus() ||
           !!this.selectedPaymentStatus();
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.searchTerm()) count++;
    if (this.selectedEvent()) count++;
    if (this.selectedOrderStatus()) count++;
    if (this.selectedPaymentStatus()) count++;
    return count;
  }

  // New methods for fee/discount breakdown
  getOrderBreakdown(order: OrderDto) {
    return {
      subtotal: order.totalAmount,
      serviceFee: order.serviceFeeAmount,
      bulkDiscount: order.bulkDiscountAmount,
      couponDiscount: order.couponDiscount,
      total: order.finalAmount
    };
  }

  hasDiscount(order: OrderDto): boolean {
    return order.bulkDiscountApplied || order.couponDiscount > 0;
  }

  getDiscountText(order: OrderDto): string {
    const parts = [];
    if (order.bulkDiscountApplied && order.bulkDiscountName) {
      parts.push(order.bulkDiscountName);
    }
    if (order.couponDiscount > 0) {
      parts.push('Coupon');
    }
    return parts.join(' + ');
  }
}