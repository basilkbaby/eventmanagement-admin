import { Component, OnInit, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { AuthService } from '../../../core/services/auth.service';
import { EditCustomerDialogComponent, EditCustomerDialogData } from './dialogs/edit-customer-dialog.component';
import { ResendEmailDialogComponent, ResendEmailDialogData } from './dialogs/resend-email-dialog.component';

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
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private eventService = inject(EventService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  
  readonly loading = signal(false);
  readonly hasAllEventAccess = signal(false);

  readonly allOrders = signal<OrderDto[]>([]);
  readonly filteredOrders = computed(() => {
  const orders = this.allOrders();
  const search = this.searchTerm().toLowerCase().trim();
  const eventFilter = this.selectedEvent();
  const searchField = this.searchField();

  let filtered = orders;

  // Apply event filter
  if (eventFilter) {
    filtered = filtered.filter(order => order.eventId === eventFilter);
  }

  // Apply search filter
  if (search) {
    filtered = filtered.filter(order => {
      switch (searchField) {
        case 'orderNumber':
          return order.orderNumber.toLowerCase().includes(search);
        case 'customerName':
          return order.customerName.toLowerCase().includes(search);
        case 'customerEmail':
          return order.customerEmail.toLowerCase().includes(search);
        case 'eventName':
          return order.eventName.toLowerCase().includes(search);
        case 'all':
        default:
          return (
            order.orderNumber.toLowerCase().includes(search) ||
            order.customerName.toLowerCase().includes(search) ||
            order.customerEmail.toLowerCase().includes(search) ||
            order.eventName.toLowerCase().includes(search)
          );
      }
    });
  }

  return filtered;
});

readonly searchFields = [
  { value: 'all', label: 'All Fields' },
  { value: 'orderNumber', label: 'Order Number' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'customerEmail', label: 'Customer Email' },
  { value: 'eventName', label: 'Event Name' }
];

  // Pagination signals
  readonly pageSize = signal(1000);
  readonly pageIndex = signal(0);
  
  // Displayed orders for current page
  readonly displayedOrders = computed(() => {
    const filtered = this.filteredOrders();
    const pageSize = this.pageSize();
    const pageIndex = this.pageIndex();
    
    const startIndex = pageIndex * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  });

  // Search and filter signals
  readonly searchTerm = signal('');
  readonly selectedEvent = signal('');
  readonly searchField = signal<'all' | 'orderNumber' | 'customerName' | 'customerEmail' | 'eventName'>('all');

  readonly stats = computed(() => {
    const orders = this.allOrders();
    const allSeats = orders.flatMap(order => order.seats);
    const totalOrders = orders.length;
    
    const confirmedOrders = orders.filter(o => o.status === OrderStatus.CONFIRMED);
    const totalRevenue = confirmedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    return {
      totalOrders: totalOrders,
      totalSeats: allSeats.length,
      activeSeats: allSeats.filter(s => !s.isCancelled).length,
      cancelledSeats: allSeats.filter(s => s.isCancelled).length,
      confirmedOrders: confirmedOrders.length,
      totalRevenue: totalRevenue,
      totalServiceFees: orders.reduce((sum, order) => sum + (order.serviceFee || 0), 0),
      totalBulkDiscounts: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
      totalCouponDiscounts: orders.reduce((sum, order) => sum + (order.couponDiscount || 0), 0),
      averageOrderValue: totalOrders > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / totalOrders : 0,
      averageSeatsPerOrder: totalOrders > 0 ? allSeats.length / totalOrders : 0
    };
  });

  events: EventDto[] = [];
  eventOptions = [
    { value: '', label: 'All Events' }
  ];

  orderStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: OrderStatus.PENDING, label: 'Pending' },
    { value: OrderStatus.CONFIRMED, label: 'Confirmed' },
    { value: OrderStatus.CANCELLED, label: 'Cancelled' }
  ];

  paymentStatusOptions = [
    { value: '', label: 'All Statuses' },
    { value: PaymentStatus.PENDING, label: 'Pending' },
    { value: PaymentStatus.PROCESSING, label: 'Processing' },
    { value: PaymentStatus.COMPLETED, label: 'Completed' },
    { value: PaymentStatus.FAILED, label: 'Failed' },
    { value: PaymentStatus.REFUNDED, label: 'Refunded' }
  ];

  // For loading states
  readonly resendingEmail = signal<Record<string, boolean>>({});
  readonly editingCustomer = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.loadEvents();
  }



  loadEvents(): void {
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.events = this.events.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        this.eventOptions = [
          ...this.events.map(event => ({
            value: event.id,
            label: `${event.title} (${this.formatEventDate(event.startDate)})`
          }))
        ];
        
        if (this.events.length >= 1) {
          this.selectedEvent.set(this.events[0].id);
          this.loadData();
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.showError('Failed to load events');
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    
    this.orderService.getOrders( this.selectedEvent()).subscribe({
      next: (response) => {
        const ordersWithDetails: OrderDto[] = response.orders;
        
        this.allOrders.set(ordersWithDetails);
        this.loading.set(false);
        
        // Reset to first page when data loads
        this.pageIndex.set(0);
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading.set(false);
        this.showError('Failed to load orders');
      }
    });
  }

  // Pagination handlers
  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  // Filter handlers
  onEventChange(eventId: string): void {
    this.selectedEvent.set(eventId);
    this.loadData();
  }

  onSearchChange(): void {
    this.pageIndex.set(0); // Reset to first page when search changes
  }

  clearFilters(): void {
  this.searchTerm.set('');
  this.searchField.set('all');
  this.selectedEvent.set('');
  this.pageIndex.set(0);
  }


  formatEventDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event?.title || '';
  }

  // Status helpers
  getSeatStatusClass(isCancelled: boolean): string {
    return isCancelled ? 'status-cancelled' : 'status-active';
  }

  getSeatStatusText(isCancelled: boolean): string {
    return isCancelled ? 'Cancelled' : 'Active';
  }

  getSeatTypeClass(seatType: SeatType | string): string {
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
    return seatType.toString();
  }

  getOrderStatusClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.CONFIRMED: return 'status-confirmed';
      case OrderStatus.PENDING: return 'status-pending';
      case OrderStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
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

  getMainStatus(order: OrderDto): string {
    if (order.status === OrderStatus.CANCELLED) {
      return 'cancelled';
    }
    
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      return 'refunded';
    }
    
    if (order.status === OrderStatus.CONFIRMED) {
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

  // Order Actions
  viewOrder(order: OrderDto): void {
    this.router.navigate(['/admin/orders', order.orderId]);
  }

resendOrderConfirmation(order: OrderDto): void {
  // Check if order is confirmed
  if (order.status !== OrderStatus.CONFIRMED) {
    this.showError('Can only resend emails for confirmed orders');
    return;
  }

  const dialogRef = this.dialog.open(ResendEmailDialogComponent, {
    width: '600px',
    data: { order } as ResendEmailDialogData,
    disableClose: true
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Call your API to resend email
      this.resendConfirmationEmail(order.orderId, result).subscribe({
        next: () => {
          const emailTo = result.sendToAlternateEmail && result.alternateEmail 
            ? result.alternateEmail 
            : order.customerEmail;
          this.showSuccess(`Confirmation email sent to ${emailTo}`);
        },
        error: (error) => {
          this.showError('Failed to resend confirmation email');
        }
      });
    }
  });
}

// Add this method to call your API
private resendConfirmationEmail(orderId: string, emailData: any) {
  // Replace this with your actual API call
  return this.orderService.resendConfirmationEmail(orderId, emailData);
}

editCustomerDetails(order: OrderDto): void {
  const dialogRef = this.dialog.open(EditCustomerDialogComponent, {
    width: '500px',
    data: { order } as EditCustomerDialogData,
    disableClose: true
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Call your API to update customer details
      this.updateCustomerDetails(order.orderId, result).subscribe({
        next: () => {
          this.showSuccess('Customer details updated successfully');
          this.loadData(); // Refresh the orders list
        },
        error: (error) => {
          this.showError('Failed to update customer details');
        }
      });
    }
  });
}

// Add this method to call your API
private updateCustomerDetails(orderId: string, customerData: any) {
  // Replace this with your actual API call
  return this.orderService.updateCustomerDetails(orderId, customerData);
}

  updateOrderStatus(order: OrderDto, status: OrderStatus): void {
    const action = status === OrderStatus.CANCELLED ? 'cancel' : 'update';
    const message = `Are you sure you want to ${action} order ${order.orderNumber}?`;
    
    if (confirm(message)) {
      this.orderService.updateOrderStatus(
        order.orderId, 
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

  processRefund(order: OrderDto): void {
    if (confirm(`Process refund for order ${order.orderNumber}? Amount: $${order.totalAmount}`)) {
      // Implement refund logic here
      this.showSuccess('Refund processed successfully');
    }
  }

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

  exportSingleOrder(order: OrderDto): void {

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

  get hasEventAccess(): boolean {
    return this.hasAllEventAccess();
  }

    formatPrice(price: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

}