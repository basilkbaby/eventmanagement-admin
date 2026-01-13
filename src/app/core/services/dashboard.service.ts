import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { MOCK_EVENTS } from '../mock/mock-events.data';
import { EventStatus, EventType } from '../models/Enums/event.enums';
import { EventDto } from '../models/DTOs/event.DTO.model';

export interface DashboardEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  totalTickets: number;
  soldTickets: number;
  revenue: number;
  status?: EventStatus;
  type?: EventType;
}

export interface DashboardStats {
  totalRevenue: number;
  totalTicketsSold: number;
  totalEvents: number;
  attendanceRate: number;
  popularEvent: string;
  revenueGrowth: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  event: EventDto | null = null;
  // Calculate ticket availability for each event
  private calculateSoldTickets(event: EventDto): number {
    // if (!event.ticketTiers || event.ticketTiers.length === 0) {
    //   return 0;
    // }
    
    // Sum of all tickets sold across all tiers
    //const totalTickets = event.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
   // const availableTickets = event.ticketTiers.reduce((sum, tier) => sum + tier.available, 0);
    return 10;
    //return totalTickets - availableTickets;
  }

  // Calculate revenue based on ticket tiers and sales
  // private calculateRevenue(event: Event): number {
  //   if (!event.ticketTiers || event.ticketTiers.length === 0) {
  //     return 0;
  //   }
    
  //   return event.ticketTiers.reduce((revenue, tier) => {
  //     const soldTickets = tier.quantity - tier.available;
  //     return revenue + (soldTickets * tier.price);
  //   }, 0);
  // }

  // Convert your main Event interface to DashboardEvent
  private convertToDashboardEvent(event: EventDto): DashboardEvent {
    const soldTickets = this.calculateSoldTickets(event);
    //const revenue = this.calculateRevenue(event);
    
    return {
      id: event.id,
      name: event.title,
      date: event.startDate.toISOString().split('T')[0],
      venue: '',// event.venue.name,
      totalTickets: 10,// event.venue.capacity || 0,
      soldTickets: soldTickets,
      revenue: 0,
      status: event.status,
      type: event.type
    };
  }

  // Calculate overall statistics from all events
  private calculateOverallStats(events: EventDto[]): DashboardStats {
    const dashboardEvents = events.map(event => this.convertToDashboardEvent(event));
    
    if (dashboardEvents.length === 0) {
      return {
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalEvents: 0,
        attendanceRate: 0,
        popularEvent: '',
        revenueGrowth: 0
      };
    }

    const totalRevenue = dashboardEvents.reduce((sum, event) => sum + event.revenue, 0);
    const totalTicketsSold = dashboardEvents.reduce((sum, event) => sum + event.soldTickets, 0);
    const totalTicketsCapacity = dashboardEvents.reduce((sum, event) => sum + event.totalTickets, 0);
    
    // Calculate overall attendance rate
    const attendanceRate = totalTicketsCapacity > 0 
      ? Math.round((totalTicketsSold / totalTicketsCapacity) * 100) 
      : 0;
    
    // Find the event with highest revenue
    const popularEvent = dashboardEvents.reduce((prev, current) => 
      (prev.revenue > current.revenue) ? prev : current
    );

    // Mock revenue growth - in real app this would compare with previous period
    const revenueGrowth = 12.5; // Placeholder value

    return {
      totalRevenue,
      totalTicketsSold,
      totalEvents: events.length,
      attendanceRate,
      popularEvent: popularEvent.name,
      revenueGrowth
    };
  }

  // API methods (commented out for now)
  getEvents(): Observable<DashboardEvent[]> {
    // TODO: Uncomment when API is ready
    // return this.http.get<Event[]>('/api/events').pipe(
    //   map(events => events.map(event => this.convertToDashboardEvent(event)))
    // );
    
    // Use mock data from MOCK_EVENTS
    const dashboardEvents = MOCK_EVENTS.map(event => this.convertToDashboardEvent(event));
    return of(dashboardEvents);
  }

  getOverallStats(): Observable<DashboardStats> {
    // TODO: Uncomment when API is ready
    // return this.http.get<DashboardStats>('/api/dashboard/stats');
    
    // Calculate stats from MOCK_EVENTS
    const stats = this.calculateOverallStats(MOCK_EVENTS);
    return of(stats);
  }

  getEventStats(eventId: string): Observable<DashboardStats> {
    // TODO: Uncomment when API is ready
    // return this.http.get<DashboardStats>(`/api/dashboard/stats/${eventId}`);
    
    // Find specific event from MOCK_EVENTS
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    if (event) {
      const dashboardEvent = this.convertToDashboardEvent(event);
      const stats: DashboardStats = {
        totalRevenue: dashboardEvent.revenue,
        totalTicketsSold: dashboardEvent.soldTickets,
        totalEvents: 1,
        attendanceRate: Math.round((dashboardEvent.soldTickets / dashboardEvent.totalTickets) * 100),
        popularEvent: dashboardEvent.name,
        revenueGrowth: 8.2
      };
      return of(stats);
    }
    
    // Return overall stats if event not found
    const overallStats = this.calculateOverallStats(MOCK_EVENTS);
    return of(overallStats);
  }

  // Method to get full event details using your existing Event interface
  getEventDetails(eventId: string): Observable<EventDto | null> {
    // TODO: Uncomment when API is ready
    // return this.http.get<Event>(`/api/events/${eventId}`);
    
    // Find specific event from MOCK_EVENTS
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    return of(event || null);
  }

  // Method to get events by status
  getEventsByStatus(status: EventStatus): Observable<DashboardEvent[]> {
    // TODO: Uncomment when API is ready
    // return this.http.get<Event[]>(`/api/events?status=${status}`).pipe(
    //   map(events => events.map(event => this.convertToDashboardEvent(event)))
    // );
    
    // Filter MOCK_EVENTS by status
    const filteredEvents = MOCK_EVENTS.filter(event => event.status === status);
    const dashboardEvents = filteredEvents.map(event => this.convertToDashboardEvent(event));
    return of(dashboardEvents);
  }

  // Method to get events by type
  getEventsByType(type: EventType): Observable<DashboardEvent[]> {
    // TODO: Uncomment when API is ready
    // return this.http.get<Event[]>(`/api/events?type=${type}`).pipe(
    //   map(events => events.map(event => this.convertToDashboardEvent(event)))
    // );
    
    // Filter MOCK_EVENTS by type
    const filteredEvents = MOCK_EVENTS.filter(event => event.type === type);
    const dashboardEvents = filteredEvents.map(event => this.convertToDashboardEvent(event));
    return of(dashboardEvents);
  }

  // Helper method to get all events as DashboardEvent array
  getAllDashboardEvents(): DashboardEvent[] {
    return MOCK_EVENTS.map(event => this.convertToDashboardEvent(event));
  }

  // Helper method to get event by ID as DashboardEvent
  getDashboardEventById(eventId: string): DashboardEvent | null {
    const event = MOCK_EVENTS.find(e => e.id === eventId);
    return event ? this.convertToDashboardEvent(event) : null;
  }
}