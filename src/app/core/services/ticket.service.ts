import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { 
  Ticket, 
  TicketStatus, 
  TicketStats, 
  Order, 
  OrderStatus, 
  PaymentStatus,
  Coupon,
  Attendee,
  ScanResult,
  DiscountType
} from '../models/ticket.interface';
import { MOCK_TICKETS, MOCK_ORDERS, MOCK_EVENTS } from '../mock/mock-tickets.data';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private mockTickets: Ticket[] = MOCK_TICKETS;
  private mockOrders: Order[] = MOCK_ORDERS;
  private mockEvents = MOCK_EVENTS;

  constructor() {
    // Link tickets to orders
    this.mockOrders.forEach(order => {
      order.tickets = this.mockTickets.filter(ticket => ticket.orderId === order.id);
    });

    // Link orders to tickets
    this.mockTickets.forEach(ticket => {
      ticket.order = this.mockOrders.find(order => order.id === ticket.orderId) || {} as Order;
    });
  }

  // TICKET METHODS
  getTickets(): Observable<Ticket[]> {
    return of(this.mockTickets);
  }

  getTicketsByEvent(eventId: string): Observable<Ticket[]> {
    const filteredTickets = this.mockTickets.filter(ticket => ticket.eventId === eventId);
    return of(filteredTickets);
  }

  getTicketById(ticketId: string): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      return of(ticket);
    }
    throw new Error('Ticket not found');
  }

  updateTicketStatus(ticketId: string, status: TicketStatus): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = status;
      return of(ticket);
    }
    throw new Error('Ticket not found');
  }

  scanTicket(ticketId: string, scannedBy: string): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      if (ticket.status !== TicketStatus.ACTIVE) {
        throw new Error('Ticket is not active');
      }
      ticket.status = TicketStatus.USED;
      ticket.scannedAt = new Date();
      ticket.scannedBy = scannedBy;
      return of(ticket);
    }
    throw new Error('Ticket not found');
  }

  cancelTicket(ticketId: string): Observable<Ticket> {
    return this.updateTicketStatus(ticketId, TicketStatus.CANCELLED);
  }

  validateTicket(ticketNumber: string): Observable<ScanResult> {
    const ticket = this.mockTickets.find(t => t.ticketNumber === ticketNumber);
    
    if (!ticket) {
      return of({
        success: false,
        message: 'Ticket not found',
        error: 'NOT_FOUND'
      });
    }

    if (ticket.status !== TicketStatus.ACTIVE) {
      return of({
        success: false,
        message: `Ticket is ${ticket.status}`,
        ticket: ticket,
        error: 'INVALID_STATUS'
      });
    }

    return of({
      success: true,
      message: 'Ticket is valid',
      ticket: ticket
    });
  }

  transferTicket(ticketId: string, newAttendee: Attendee): Observable<Ticket> {
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      if (!ticket.transferable) {
        throw new Error('Ticket is not transferable');
      }
      if (ticket.status !== TicketStatus.ACTIVE) {
        throw new Error('Only active tickets can be transferred');
      }

      if (!ticket.transferHistory) {
        ticket.transferHistory = [];
      }
      
      ticket.transferHistory.push({
        fromAttendee: { ...ticket.attendee },
        toAttendee: newAttendee,
        transferredAt: new Date()
      });
      
      ticket.attendee = newAttendee;
      
      return of(ticket);
    }
    throw new Error('Ticket not found');
  }

  resendTicket(ticketId: string): Observable<void> {
    const ticket = this.mockTickets.find(t => t.id === ticketId);
    if (ticket) {
      console.log(`Resending ticket ${ticket.ticketNumber} to ${ticket.attendee.email}`);
      return of(void 0);
    }
    throw new Error('Ticket not found');
  }

  // ORDER METHODS
  getOrders(): Observable<Order[]> {
    return of(this.mockOrders);
  }

  getOrdersByEvent(eventId: string): Observable<Order[]> {
    const filteredOrders = this.mockOrders.filter(order => order.eventId === eventId);
    return of(filteredOrders);
  }

  getOrderById(orderId: string): Observable<Order> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (order) {
      return of(order);
    }
    throw new Error('Order not found');
  }

  cancelOrder(orderId: string): Observable<void> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (order) {
      order.status = OrderStatus.CANCELLED;
      order.paymentStatus = PaymentStatus.REFUNDED;
      
      // Cancel all tickets in the order
      order.tickets.forEach(ticket => {
        ticket.status = TicketStatus.CANCELLED;
      });
      
      return of(void 0);
    }
    throw new Error('Order not found');
  }

  resendOrderConfirmation(orderId: string): Observable<void> {
    const order = this.mockOrders.find(o => o.id === orderId);
    if (order) {
      console.log(`Resending order confirmation for ${order.orderNumber} to ${order.userEmail}`);
      return of(void 0);
    }
    throw new Error('Order not found');
  }

  // EVENT METHODS
  getEvents(): Observable<any[]> {
    return of(this.mockEvents);
  }

  // STATS METHODS
  getTicketStats(eventId?: string): Observable<TicketStats> {
    const tickets = eventId 
      ? this.mockTickets.filter(t => t.eventId === eventId)
      : this.mockTickets;

    const stats: TicketStats = {
      total: tickets.length,
      sold: tickets.filter(t => t.status !== TicketStatus.CANCELLED && t.status !== TicketStatus.REFUNDED).length,
      available: 0,
      revenue: tickets
        .filter(t => t.status !== TicketStatus.CANCELLED && t.status !== TicketStatus.REFUNDED)
        .reduce((sum, ticket) => sum + ticket.price, 0),
      used: tickets.filter(t => t.status === TicketStatus.USED).length,
      cancelled: tickets.filter(t => t.status === TicketStatus.CANCELLED || t.status === TicketStatus.REFUNDED).length
    };

    return of(stats);
  }

  getOrderStats(eventId?: string): Observable<any> {
    const orders = eventId
      ? this.mockOrders.filter(o => o.eventId === eventId)
      : this.mockOrders;

    const stats = {
      totalOrders: orders.length,
      confirmedOrders: orders.filter(o => o.status === OrderStatus.CONFIRMED).length,
      cancelledOrders: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
      totalRevenue: orders
        .filter(o => o.status === OrderStatus.CONFIRMED)
        .reduce((sum, order) => sum + order.finalAmount, 0),
      averageOrderValue: 0
    };

    stats.averageOrderValue = stats.confirmedOrders > 0 ? stats.totalRevenue / stats.confirmedOrders : 0;

    return of(stats);
  }

  // SEARCH METHODS
  searchTickets(query: string, eventId?: string): Observable<Ticket[]> {
    let tickets = this.mockTickets;
    if (eventId) {
      tickets = tickets.filter(t => t.eventId === eventId);
    }

    const searchTerm = query.toLowerCase();
    const filteredTickets = tickets.filter(ticket => 
      ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
      ticket.attendee.name.toLowerCase().includes(searchTerm) ||
      ticket.attendee.email.toLowerCase().includes(searchTerm) ||
      ticket.eventName.toLowerCase().includes(searchTerm) ||
      (ticket.order && ticket.order.orderNumber.toLowerCase().includes(searchTerm))
    );

    return of(filteredTickets);
  }

  searchOrders(query: string, eventId?: string): Observable<Order[]> {
    let orders = this.mockOrders;
    if (eventId) {
      orders = orders.filter(o => o.eventId === eventId);
    }

    const searchTerm = query.toLowerCase();
    const filteredOrders = orders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchTerm) ||
      order.userName.toLowerCase().includes(searchTerm) ||
      order.userEmail.toLowerCase().includes(searchTerm) ||
      order.eventName.toLowerCase().includes(searchTerm)
    );

    return of(filteredOrders);
  }

  // EXPORT METHODS
  exportTickets(format: 'csv' | 'pdf' | 'excel' = 'csv', eventId?: string): Observable<Blob> {
    const tickets = eventId 
      ? this.mockTickets.filter(t => t.eventId === eventId)
      : this.mockTickets;

    // Create CSV content
    const headers = ['Ticket Number', 'Attendee Name', 'Attendee Email', 'Event', 'Ticket Type', 'Status', 'Price', 'Purchase Date'];
    const csvContent = tickets.map(ticket => [
      ticket.ticketNumber,
      ticket.attendee.name,
      ticket.attendee.email,
      ticket.eventName,
      ticket.ticketType.name,
      ticket.status,
      ticket.price.toString(),
      this.formatDateForExport(ticket.purchaseDate)
    ].join(','));

    const csv = [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    return of(blob);
  }

  exportOrders(format: 'csv' | 'pdf' | 'excel' = 'csv', eventId?: string): Observable<Blob> {
    const orders = eventId
      ? this.mockOrders.filter(o => o.eventId === eventId)
      : this.mockOrders;

    // Create CSV content
    const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Event', 'Total Amount', 'Status', 'Payment Status', 'Order Date'];
    const csvContent = orders.map(order => [
      order.orderNumber,
      order.userName,
      order.userEmail,
      order.eventName,
      order.finalAmount.toString(),
      order.status,
      order.paymentStatus,
      this.formatDateForExport(order.createdAt)
    ].join(','));

    const csv = [headers.join(','), ...csvContent].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });

    return of(blob);
  }

  private formatDateForExport(date: Date): string {
    return new Intl.DateTimeFormat('en-UK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  // BULK OPERATIONS
  bulkScanTickets(ticketIds: string[], scannedBy: string): Observable<Ticket[]> {
    const scannedTickets: Ticket[] = [];
    
    ticketIds.forEach(ticketId => {
      const ticket = this.mockTickets.find(t => t.id === ticketId);
      if (ticket && ticket.status === TicketStatus.ACTIVE) {
        ticket.status = TicketStatus.USED;
        ticket.scannedAt = new Date();
        ticket.scannedBy = scannedBy;
        scannedTickets.push(ticket);
      }
    });

    return of(scannedTickets);
  }

  bulkCancelTickets(ticketIds: string[]): Observable<Ticket[]> {
    const cancelledTickets: Ticket[] = [];
    
    ticketIds.forEach(ticketId => {
      const ticket = this.mockTickets.find(t => t.id === ticketId);
      if (ticket) {
        ticket.status = TicketStatus.CANCELLED;
        cancelledTickets.push(ticket);
      }
    });

    return of(cancelledTickets);
  }
}