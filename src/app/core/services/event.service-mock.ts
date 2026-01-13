// import { Injectable } from '@angular/core';
// import { Observable, of } from 'rxjs';
// import { Event, EventStatus, EventType } from '../models/event.interface';
// import { MOCK_EVENTS } from '../mock/mock-events.data';


// @Injectable({
//   providedIn: 'root'
// })
// export class EventServiceMock {
//   private mockEvents: Event[] = MOCK_EVENTS;

//   // GET methods
//   getEvents(): Observable<Event[]> {
//     return of(this.mockEvents);
//   }

//   getEventById(eventId: string): Observable<Event> {
//     const event = this.mockEvents.find(e => e.id === eventId);
//     if (event) {
//       return of(event);
//     }
//     throw new Error('Event not found');
//   }

//   getEventsByOrganizer(organizerId: string): Observable<Event[]> {
//     const filteredEvents = this.mockEvents.filter(event => event.organizerId === organizerId);
//     return of(filteredEvents);
//   }

//   getEventsByStatus(status: EventStatus): Observable<Event[]> {
//     const filteredEvents = this.mockEvents.filter(event => event.status === status);
//     return of(filteredEvents);
//   }

//   getFeaturedEvents(): Observable<Event[]> {
//     return of(this.mockEvents.filter(event => event.featured));
//   }

//   getUpcomingEvents(limit?: number): Observable<Event[]> {
//     const now = new Date();
//     let events = this.mockEvents
//       .filter(event => event.status === EventStatus.PUBLISHED && event.startDate > now)
//       .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
//     if (limit) {
//       events = events.slice(0, limit);
//     }
    
//     return of(events);
//   }

//   // CREATE method
//   createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.post<Event>('/api/events', eventData);
    
//     // Mock implementation
//     const newEvent: Event = {
//       ...eventData,
//       id: (this.mockEvents.length + 1).toString(),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
    
//     this.mockEvents.push(newEvent);
//     return of(newEvent);
//   }

//   // UPDATE methods
//   updateEvent(eventId: string, updates: Partial<Event>): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.patch<Event>(`/api/events/${eventId}`, updates);
    
//     // Mock implementation
//     const eventIndex = this.mockEvents.findIndex(e => e.id === eventId);
//     if (eventIndex !== -1) {
//       const updatedEvent = {
//         ...this.mockEvents[eventIndex],
//         ...updates,
//         updatedAt: new Date()
//       };
//       this.mockEvents[eventIndex] = updatedEvent;
//       return of(updatedEvent);
//     }
//     throw new Error('Event not found');
//   }

//   toggleEventStatus(eventId: string): Observable<Event> {
//     const event = this.mockEvents.find(e => e.id === eventId);
//     if (event) {
//       event.isActive = !event.isActive;
//       event.updatedAt = new Date();
//       return of(event);
//     }
//     throw new Error('Event not found');
//   }

//   updateEventStatus(eventId: string, status: EventStatus): Observable<Event> {
//     return this.updateEvent(eventId, { status });
//   }

//   // DELETE method
//   deleteEvent(eventId: string): Observable<void> {
//     // TODO: Uncomment when API is ready
//     // return this.http.delete<void>(`/api/events/${eventId}`);
    
//     // Mock implementation
//     const index = this.mockEvents.findIndex(e => e.id === eventId);
//     if (index !== -1) {
//       this.mockEvents.splice(index, 1);
//       return of(void 0);
//     }
//     throw new Error('Event not found');
//   }

//   // SEARCH and FILTER methods
//   searchEvents(query: string): Observable<Event[]> {
//     const searchTerm = query.toLowerCase();
//     const events = this.mockEvents.filter(event => 
//       event.title.toLowerCase().includes(searchTerm) ||
//       event.description.toLowerCase().includes(searchTerm) ||
//       event.venue.city.toLowerCase().includes(searchTerm) ||
//       event.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
//     );
//     return of(events);
//   }

//   getEventsByType(type: EventType): Observable<Event[]> {
//     const filteredEvents = this.mockEvents.filter(event => event.type === type);
//     return of(filteredEvents);
//   }

//   // Ticket Management methods
//   updateTicketAvailability(eventId: string, ticketTierId: string, newAvailable: number): Observable<void> {
//     // TODO: Uncomment when API is ready
//     // return this.http.patch<void>(`/api/events/${eventId}/tickets/${ticketTierId}`, { available: newAvailable });
    
//     // Mock implementation
//     const event = this.mockEvents.find(e => e.id === eventId);
//     if (event) {
//       const tier = event.ticketTiers.find(t => t.id === ticketTierId);
//       if (tier) {
//         tier.available = newAvailable;
//         return of(void 0);
//       }
//     }
//     throw new Error('Ticket tier not found');
//   }

//   // Sponsor Management methods
//   addSponsor(eventId: string, sponsor: any): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.post<Event>(`/api/events/${eventId}/sponsors`, sponsor);
    
//     // Mock implementation
//     const event = this.mockEvents.find(e => e.id === eventId);
//     if (event) {
//       if (!event.sponsors) {
//         event.sponsors = [];
//       }
//       event.sponsors.push(sponsor);
//       event.updatedAt = new Date();
//       return of(event);
//     }
//     throw new Error('Event not found');
//   }

//   removeSponsor(eventId: string, sponsorId: string): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.delete<Event>(`/api/events/${eventId}/sponsors/${sponsorId}`);
    
//     // Mock implementation
//     const event = this.mockEvents.find(e => e.id === eventId);
//     if (event && event.sponsors) {
//       event.sponsors = event.sponsors.filter(s => s.id !== sponsorId);
//       event.updatedAt = new Date();
//       return of(event);
//     }
//     throw new Error('Event or sponsor not found');
//   }

//   // Image Management methods
//   updateEventImages(eventId: string, images: { bannerImage?: string; thumbnailImage?: string; gallery?: string[] }): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.patch<Event>(`/api/events/${eventId}/images`, images);
    
//     // Mock implementation
//     return this.updateEvent(eventId, images);
//   }

//   // Checkout Questions methods
//   updateCheckoutQuestions(eventId: string, questions: any[]): Observable<Event> {
//     // TODO: Uncomment when API is ready
//     // return this.http.put<Event>(`/api/events/${eventId}/questions`, { questions });
    
//     // Mock implementation
//     return this.updateEvent(eventId, { checkoutQuestions: questions });
//   }
// }