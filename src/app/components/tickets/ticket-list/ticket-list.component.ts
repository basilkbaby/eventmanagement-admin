import { Component, OnInit, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
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

import { TicketService} from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, OrderStatus, PaymentStatus } from '../../../core/models/ticket.interface';
import { MatDividerModule } from '@angular/material/divider';


interface FilterState {
  search: string;
  event: string;
  status: string;
  ticketType: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
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
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit, AfterViewInit {
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Signals for state management
  readonly tickets = signal<Ticket[]>([]);
  readonly loading = signal(false);
  readonly searchTerm = signal('');
  readonly selectedEvent = signal('');
  readonly selectedStatus = signal('');
  readonly selectedTicketType = signal('');
  
  // Date range filters
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);



  readonly stats = computed(() => {
    const tickets = this.tickets();
    return {
      total: tickets.length,
      active: tickets.filter(t => t.status === TicketStatus.ACTIVE).length,
      used: tickets.filter(t => t.status === TicketStatus.USED).length,
      cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED || t.status === TicketStatus.REFUNDED).length,
      revenue: tickets
        .filter(t => t.status !== TicketStatus.CANCELLED && t.status !== TicketStatus.REFUNDED)
        .reduce((sum, ticket) => sum + ticket.price, 0)
    };
  });

  // Table setup
  displayedColumns: string[] = [
    'select',
    'ticketNumber',
    'attendee',
    'event',
    'ticketType',
    'status',
    'price',
    'purchaseDate',
    'scannedAt',
    'actions'
  ];
  
  dataSource = new MatTableDataSource<Ticket>();
  selection = new SelectionModel<Ticket>(true, []);
  
  events: any[] = [];
  ticketTypes: any[] = [];

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: TicketStatus.ACTIVE, label: 'Active' },
    { value: TicketStatus.USED, label: 'Used' },
    { value: TicketStatus.CANCELLED, label: 'Cancelled' },
    { value: TicketStatus.REFUNDED, label: 'Refunded' },
    { value: TicketStatus.EXPIRED, label: 'Expired' }
  ];

  // Pagination options
  pageSizeOptions = [10, 25, 50, 100];
  defaultPageSize = 25;
  eventOptions = [
    { value: '', label: 'All Events' }
  ];
  ngOnInit(): void {
    this.loadTickets();
    this.loadEvents();
    this.loadTicketTypes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Set up custom sorting
    this.dataSource.sortingDataAccessor = (item: Ticket, property: string) => {
      switch (property) {
        case 'attendee':
          return item.attendee.name.toLowerCase();
        case 'event':
          return item.eventName.toLowerCase();
        case 'ticketType':
          return item.ticketType.name.toLowerCase();
        case 'price':
          return item.price;
        case 'purchaseDate':
          return new Date(item.purchaseDate).getTime();
        case 'scannedAt':
          return item.scannedAt ? new Date(item.scannedAt).getTime() : 0;
        default:
          return (item as any)[property];
      }
    };
  }

  loadTickets(): void {
    this.loading.set(true);
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.dataSource.data = tickets;
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.loading.set(false);
        this.showError('Failed to load tickets');
      }
    });
  }

 loadEvents(): void {
    this.ticketService.getEvents().subscribe({
      next: (events) => {
        // Sort events by date (most recent first)
        this.events = events.sort((a, b) => 
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        
        // Create event options for dropdown
        this.eventOptions = [
          { value: '', label: 'All Events' },
          ...this.events.map(event => ({
            value: event.id,
            label: `${event.name} (${this.formatEventDate(event.startDate)})`
          }))
        ];
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.showError('Failed to load events');
      }
    });
  }

  formatEventDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

     // Computed values
  readonly filteredTickets = computed(() => {
    const tickets = this.tickets();
    const search = this.searchTerm().toLowerCase();
    const eventFilter = this.selectedEvent();
    const statusFilter = this.selectedStatus();
    const typeFilter = this.selectedTicketType();
    const startDate = this.startDate();
    const endDate = this.endDate();

    return tickets.filter(ticket => {
      // Search filter
      const matchesSearch = !search || 
        ticket.ticketNumber.toLowerCase().includes(search) ||
        ticket.attendee.name.toLowerCase().includes(search) ||
        ticket.attendee.email.toLowerCase().includes(search) ||
        ticket.eventName.toLowerCase().includes(search) ||
        (ticket.order?.orderNumber?.toLowerCase().includes(search));

      // Event filter
      const matchesEvent = !eventFilter || ticket.eventId === eventFilter;

      // Status filter
      const matchesStatus = !statusFilter || ticket.status === statusFilter;

      // Ticket type filter
      const matchesType = !typeFilter || ticket.ticketType.id === typeFilter;

      // Date range filter
      const purchaseDate = new Date(ticket.purchaseDate);
      const matchesStartDate = !startDate || purchaseDate >= startDate;
      const matchesEndDate = !endDate || purchaseDate <= endDate;
      const matchesDateRange = matchesStartDate && matchesEndDate;

      return matchesSearch && matchesEvent && matchesStatus && matchesType && matchesDateRange;
    });
  });

  loadTicketTypes(): void {
    // Extract unique ticket types from tickets
    const typesMap = new Map();
    this.tickets().forEach(ticket => {
      if (!typesMap.has(ticket.ticketType.id)) {
        typesMap.set(ticket.ticketType.id, ticket.ticketType);
      }
    });
    this.ticketTypes = Array.from(typesMap.values());
  }

  applyFilters(): void {
    this.dataSource.data = this.filteredTickets();
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedEvent.set('');
    this.selectedStatus.set('');
    this.selectedTicketType.set('');
    this.startDate.set(null);
    this.endDate.set(null);
    this.applyFilters();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  // Action methods
  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/admin/orders', ticket.id]);
  }

  scanTicket(ticket: Ticket): void {
    this.ticketService.scanTicket(ticket.id, 'admin').subscribe({
      next: (updatedTicket) => {
        this.showSuccess('Ticket scanned successfully');
        this.refreshTicket(updatedTicket);
      },
      error: (error) => {
        this.showError(error.message || 'Failed to scan ticket');
      }
    });
  }

  transferTicket(ticket: Ticket): void {
    
  }

  cancelTicket(ticket: Ticket): void {
    if (confirm(`Are you sure you want to cancel ticket ${ticket.ticketNumber}? This action cannot be undone.`)) {
      this.ticketService.cancelTicket(ticket.id).subscribe({
        next: (updatedTicket) => {
          this.showSuccess('Ticket cancelled successfully');
          this.refreshTicket(updatedTicket);
        },
        error: (error) => {
          this.showError(error.message || 'Failed to cancel ticket');
        }
      });
    }
  }

  resendTicket(ticket: Ticket): void {
    this.ticketService.resendTicket(ticket.id).subscribe({
      next: () => {
        this.showSuccess('Ticket sent successfully to ' + ticket.attendee.email);
      },
      error: (error) => {
        this.showError(error.message || 'Failed to resend ticket');
      }
    });
  }

  refundTicket(ticket: Ticket): void {
    if (confirm(`Are you sure you want to refund ticket ${ticket.ticketNumber}?`)) {
      this.ticketService.updateTicketStatus(ticket.id, TicketStatus.REFUNDED).subscribe({
        next: (updatedTicket) => {
          this.showSuccess('Ticket refunded successfully');
          this.refreshTicket(updatedTicket);
        },
        error: (error) => {
          this.showError(error.message || 'Failed to refund ticket');
        }
      });
    }
  }

  // Bulk actions
  openBulkOperations(): void {
    
  }

  private handleBulkOperation(operation: string, parameters: any): void {
    const ticketIds = this.selection.selected.map(ticket => ticket.id);
    
    switch (operation) {
      case 'scan':
        this.bulkScanTickets(ticketIds);
        break;
      case 'cancel':
        this.bulkCancelTickets(ticketIds);
        break;
      case 'transfer':
        this.bulkTransferTickets(ticketIds, parameters.newAttendee);
        break;
      case 'resend':
        this.bulkResendTickets(ticketIds);
        break;
      case 'refund':
        this.bulkRefundTickets(ticketIds);
        break;
    }
  }

  bulkScanTickets(ticketIds: string[]): void {
    this.ticketService.bulkScanTickets(ticketIds, 'admin').subscribe({
      next: (tickets) => {
        this.showSuccess(`${tickets.length} tickets scanned successfully`);
        this.selection.clear();
        this.loadTickets();
      },
      error: (error) => {
        this.showError('Failed to scan tickets');
      }
    });
  }

  bulkCancelTickets(ticketIds: string[]): void {
    this.ticketService.bulkCancelTickets(ticketIds).subscribe({
      next: (tickets) => {
        this.showSuccess(`${tickets.length} tickets cancelled successfully`);
        this.selection.clear();
        this.loadTickets();
      },
      error: (error) => {
        this.showError('Failed to cancel tickets');
      }
    });
  }

  bulkTransferTickets(ticketIds: string[], newAttendee: any): void {
    // Implement bulk transfer logic
    let completed = 0;
    let errors = 0;

    ticketIds.forEach(ticketId => {
      this.ticketService.transferTicket(ticketId, newAttendee).subscribe({
        next: () => {
          completed++;
          if (completed + errors === ticketIds.length) {
            this.showSuccess(`Transferred ${completed} tickets successfully${errors > 0 ? `, ${errors} failed` : ''}`);
            this.selection.clear();
            this.loadTickets();
          }
        },
        error: () => {
          errors++;
          if (completed + errors === ticketIds.length) {
            this.showSuccess(`Transferred ${completed} tickets successfully${errors > 0 ? `, ${errors} failed` : ''}`);
            this.selection.clear();
            this.loadTickets();
          }
        }
      });
    });
  }

  bulkResendTickets(ticketIds: string[]): void {
    let completed = 0;
    
    ticketIds.forEach(ticketId => {
      this.ticketService.resendTicket(ticketId).subscribe({
        next: () => {
          completed++;
          if (completed === ticketIds.length) {
            this.showSuccess(`Resent ${completed} tickets successfully`);
          }
        },
        error: () => {
          completed++;
          if (completed === ticketIds.length) {
            this.showSuccess(`Resent ${completed} tickets successfully`);
          }
        }
      });
    });
  }

  bulkRefundTickets(ticketIds: string[]): void {
    let completed = 0;
    let errors = 0;

    ticketIds.forEach(ticketId => {
      this.ticketService.updateTicketStatus(ticketId, TicketStatus.REFUNDED).subscribe({
        next: () => {
          completed++;
          if (completed + errors === ticketIds.length) {
            this.showSuccess(`Refunded ${completed} tickets successfully${errors > 0 ? `, ${errors} failed` : ''}`);
            this.selection.clear();
            this.loadTickets();
          }
        },
        error: () => {
          errors++;
          if (completed + errors === ticketIds.length) {
            this.showSuccess(`Refunded ${completed} tickets successfully${errors > 0 ? `, ${errors} failed` : ''}`);
            this.selection.clear();
            this.loadTickets();
          }
        }
      });
    });
  }

  // Export functionality
  exportTickets(): void {
    const eventId = this.selectedEvent() || undefined;
    this.ticketService.exportTickets('csv', eventId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tickets-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showSuccess('Tickets exported successfully');
      },
      error: (error) => {
        this.showError('Failed to export tickets');
      }
    });
  }

  // Refresh individual ticket in the list
  private refreshTicket(updatedTicket: Ticket): void {
    const updatedTickets = this.tickets().map(ticket => 
      ticket.id === updatedTicket.id ? updatedTicket : ticket
    );
    this.tickets.set(updatedTickets);
    this.applyFilters();
  }

  // Status helpers
  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE: return 'status-active';
      case TicketStatus.USED: return 'status-used';
      case TicketStatus.CANCELLED: return 'status-cancelled';
      case TicketStatus.REFUNDED: return 'status-refunded';
      case TicketStatus.EXPIRED: return 'status-expired';
      default: return 'status-unknown';
    }
  }

  getStatusText(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE: return 'Active';
      case TicketStatus.USED: return 'Used';
      case TicketStatus.CANCELLED: return 'Cancelled';
      case TicketStatus.REFUNDED: return 'Refunded';
      case TicketStatus.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-UK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-UK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  get TicketStatus() {
    return TicketStatus;
  }

  get selectedCount(): number {
    return this.selection.selected.length;
  }

  get totalCount(): number {
    return this.tickets().length;
  }

  get filteredCount(): number {
    return this.filteredTickets().length;
  }
}