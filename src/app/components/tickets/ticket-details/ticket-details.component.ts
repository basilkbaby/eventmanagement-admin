import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';

// Services and Interfaces
import { TicketService } from '../../../core/services/ticket.service';
import { 
  Ticket, 
  TicketStatus, 
  CheckoutAnswer,
  Attendee,
  TicketType,
  Order,
  Coupon,
  OrderStatus,
  PaymentStatus,
  DiscountType
} from '../../../core/models/ticket.interface';

@Component({
  selector: 'app-ticket-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule,
    MatMenuModule,
    MatSnackBarModule,
    MatExpansionModule
  ],
  templateUrl: './ticket-details.component.html',
  styleUrls: ['./ticket-details.component.scss']
})
export class TicketDetailsComponent implements OnInit {
  ticket!: Ticket;
  ticketId!: string;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private ticketService: TicketService
  ) {}

  ngOnInit() {
    this.ticketId = this.route.snapshot.paramMap.get('id')!;
    this.loadTicketDetails();
  }

  loadTicketDetails() {
    this.isLoading = true;
    this.ticketService.getTicketById(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading ticket:', error);
        this.snackBar.open('Error loading ticket details', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
        // Fallback to mock data if API fails
        this.loadMockTicket();
      }
    });
  }

  private loadMockTicket() {
    // Mock data with complete interface
    const mockOrder: Order = {
      id: 'ORD-001',
      orderNumber: 'ORD-001',
      userId: 'user-1',
      userName: 'John Smith',
      userEmail: 'john.smith@example.com',
      eventId: '1',
      eventName: 'Tech Conference 2024',
      tickets: [],
      totalAmount: 299,
      discountAmount: 0,
      finalAmount: 299,
      currency: 'GBP',
      status: OrderStatus.CONFIRMED,
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.COMPLETED,
      createdAt: new Date('2024-01-15T10:30:00'),
      updatedAt: new Date('2024-01-15T10:30:00')
    };

    const mockCoupon: Coupon = {
      id: 'coupon-1',
      code: 'EARLYBIRD20',
      name: 'Early Bird Discount',
      description: '20% off for early registrations',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minimumOrderAmount: 100,
      usedCount: 45,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-02-01'),
      isActive: true
    };

    
  }

  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE:
        return 'status-active';
      case TicketStatus.USED:
        return 'status-used';
      case TicketStatus.CANCELLED:
        return 'status-cancelled';
      case TicketStatus.REFUNDED:
        return 'status-refunded';
      case TicketStatus.EXPIRED:
        return 'status-expired';
      default:
        return 'status-active';
    }
  }

  getStatusText(status: TicketStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-UK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('en-UK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  scanTicket() {
    if (this.ticket.status === TicketStatus.ACTIVE) {
      this.ticketService.scanTicket(this.ticket.id, 'Current User').subscribe({
        next: (updatedTicket) => {
          this.ticket = updatedTicket;
          this.snackBar.open('Ticket scanned successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.snackBar.open('Error scanning ticket', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.snackBar.open('Ticket cannot be scanned. Invalid status.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  cancelTicket() {
    if (this.ticket.status === TicketStatus.ACTIVE) {
      if (confirm(`Are you sure you want to cancel ticket ${this.ticket.ticketNumber}? This action cannot be undone.`)) {
        this.ticketService.cancelTicket(this.ticket.id).subscribe({
          next: (updatedTicket) => {
            this.ticket = updatedTicket;
            this.snackBar.open('Ticket cancelled successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            this.snackBar.open('Error cancelling ticket', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    } else {
      this.snackBar.open('Ticket cannot be cancelled. Invalid status.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  refundTicket() {
    if (this.ticket.status === TicketStatus.ACTIVE || this.ticket.status === TicketStatus.CANCELLED) {
      if (confirm(`Are you sure you want to refund ticket ${this.ticket.ticketNumber}?`)) {
        this.ticketService.updateTicketStatus(this.ticket.id, TicketStatus.REFUNDED).subscribe({
          next: (updatedTicket) => {
            this.ticket = updatedTicket;
            this.snackBar.open('Ticket refunded successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          },
          error: (error) => {
            this.snackBar.open('Error refunding ticket', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    } else {
      this.snackBar.open('Ticket cannot be refunded. Invalid status.', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  transferTicket() {
    // Implement transfer functionality
    this.router.navigate(['/admin/orders', this.ticket.id, 'transfer']);
  }

  canScan(): boolean {
    return this.ticket.status === TicketStatus.ACTIVE;
  }

  canCancel(): boolean {
    return this.ticket.status === TicketStatus.ACTIVE;
  }

  canRefund(): boolean {
    return this.ticket.status === TicketStatus.ACTIVE || this.ticket.status === TicketStatus.CANCELLED;
  }

  canTransfer(): boolean {
    return this.ticket.status === TicketStatus.ACTIVE && this.ticket.transferable;
  }

  getAnswerDisplay(answer: string | string[]): string {
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  }

  hasDiscount(): boolean {
    return this.ticket.couponApplied !== undefined;
  }

  getDiscountAmount(): number {
    return this.ticket.originalPrice - this.ticket.price;
  }

  getDiscountPercentage(): number {
    return ((this.ticket.originalPrice - this.ticket.price) / this.ticket.originalPrice) * 100;
  }

  hasSeating(): boolean {
    return this.ticket.seatInfo !== undefined;
  }

  printTicket() {
    // Implement print functionality
    window.print();
  }

  sendEmail() {
    this.ticketService.resendTicket(this.ticket.id).subscribe({
      next: () => {
        this.snackBar.open('Ticket email sent to attendee!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        this.snackBar.open('Error sending ticket email', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  viewOrderDetails() {
    this.router.navigate(['/admin/orders', this.ticket.orderId]);
  }
}