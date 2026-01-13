import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EventAdditionalDetailDto, EventCouponDto, EventDetailDto, EventDto, EventSettingsDto, EventSponsorDto, EventVenueDto } from '../models/DTOs/event.DTO.model';

export interface EventFilter {
  searchTerm?: string;
  type?: string;
  status?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  isActive?: boolean;
  featured?: boolean;
  organizerId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface ToggleResponse {
  isActive?: boolean;
  featured?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private baseUrl = environment.apiUrl + '/AdminEvents';

  constructor(private http: HttpClient) {}

  // GET: Get all events (list view)
  getEvents(filter?: EventFilter): Observable<EventDto[]> {
    let params = this.buildFilterParams(filter);
    
    return this.http.get<EventDto[]>(this.baseUrl, { params });
  }

  // GET: Get single event by ID
  getEventById(eventId: string): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${this.baseUrl}/${eventId}`);
  }

  // GET: Get event details with all related data
  getEventDetails(eventId: string): Observable<EventDetailDto> {
    return this.http.get<EventDetailDto>(`${this.baseUrl}/GetEventDetails/${eventId}`);
  }

  // POST: Create new event
  createEvent(eventData: EventDto): Observable<string> {
    return this.http.post<string>(this.baseUrl, eventData, { 
      responseType: 'text' as 'json' 
    });
  }

  // PUT: Update existing event
  updateEvent(eventId: string, updates: EventDto): Observable<boolean> {
    return this.http.put(`${this.baseUrl}/${eventId}`, updates, { 
      observe: 'response' 
    }).pipe(
      map(response => response.status === 204)
    );
  }

  // ============ EVENT STATUS MANAGEMENT ============
  
  // PUT: Publish event (Final step: Publish event)
  publishEvent(eventId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${eventId}/publish`, {});
  }

  // POST: Cancel event
  cancelEvent(eventId: string, reason: string): Observable<boolean> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }
    
    return this.http.post(`${this.baseUrl}/${eventId}/cancel`, {}, { 
      params,
      observe: 'response' 
    }).pipe(
      map(response => response.status === 204)
    );
  }

  // DELETE: Delete event
  deleteEvent(eventId: string): Observable<boolean> {
    return this.http.delete(`${this.baseUrl}/${eventId}`, { 
      observe: 'response' 
    }).pipe(
      map(response => response.status === 204)
    );
  }

  // ============ EVENT TOGGLE METHODS ============
  
  // PUT: Toggle event active status
  toggleActive(eventId: string): Observable<ToggleResponse> {
    return this.http.put<ToggleResponse>(`${this.baseUrl}/${eventId}/toggle-active`, {});
  }

  // PUT: Toggle event featured status
  toggleFeatured(eventId: string): Observable<ToggleResponse> {
    return this.http.put<ToggleResponse>(`${this.baseUrl}/${eventId}/toggle-featured`, {});
  }

  // GET: Check if event exists
  checkEventExists(eventId: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/${eventId}/exists`);
  }

  // Helper methods
  private buildFilterParams(filter?: EventFilter): HttpParams {
    let params = new HttpParams();
    
    if (!filter) return params;
    
    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.startDateFrom) params = params.set('startDateFrom', filter.startDateFrom.toISOString());
    if (filter.startDateTo) params = params.set('startDateTo', filter.startDateTo.toISOString());
    if (filter.isActive !== undefined) params = params.set('isActive', filter.isActive.toString());
    if (filter.featured !== undefined) params = params.set('featured', filter.featured.toString());
    if (filter.organizerId) params = params.set('organizerId', filter.organizerId);
    if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDescending !== undefined) params = params.set('sortDescending', filter.sortDescending.toString());
    
    return params;
  }

  // ============ EVENT SETTINGS ============
  getEventSettings(eventId: string): Observable<EventSettingsDto> {
    return this.http.get<EventSettingsDto>(`${this.baseUrl}/${eventId}/settings`);
  }

  updateEventSettings(eventId: string, settingsData: any): Observable<EventSettingsDto> {
    return this.http.put<any>(`${this.baseUrl}/${eventId}/settings`, settingsData);
  }

  // ============ EVENT SPONSORS ============
  getEventSponsors(eventId: string): Observable<EventSponsorDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${eventId}/sponsors`);
  }

  addEventSponsor(eventId: string, sponsorData: any): Observable<EventSponsorDto> {
    return this.http.post<any>(`${this.baseUrl}/${eventId}/sponsors`, sponsorData);
  }

  updateEventSponsor(eventId: string, sponsorId:string ,sponsorData: any): Observable<EventSponsorDto> {
    return this.http.put<any>(`${this.baseUrl}/${eventId}/sponsors/${sponsorId}`, sponsorData);
  }

  deleteEventSponsor(eventId: string, sponsorId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/sponsors/${sponsorId}`);
  }

  reorderSponsors(eventId: string, sponsorIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${eventId}/sponsors/reorder`, { sponsorIds });
  }

  // In your event.service.ts
addEventOrganization(eventId: string, organizationData: any): Observable<EventSponsorDto> {
  return this.http.post<EventSponsorDto>(`${this.baseUrl}/${eventId}/sponsors`, organizationData);
}

updateEventOrganization(eventId: string, organizationId: string, organizationData: any): Observable<EventSponsorDto> {
  return this.http.put<EventSponsorDto>(`${this.baseUrl}/${eventId}/sponsors/${organizationId}`, organizationData);
}

deleteEventOrganization(eventId: string, organizationId: string): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/${eventId}/sponsors/${organizationId}`);
}

  // ============ EVENT VENUE ============
  getEventVenue(eventId: string): Observable<EventVenueDto> {
    return this.http.get<any>(`${this.baseUrl}/${eventId}/venue`);
  }

  updateEventVenue(eventId: string, venueData: any): Observable<EventVenueDto> {
    return this.http.put<any>(`${this.baseUrl}/${eventId}/venue`, venueData);
  }

  // ============ ADDITIONAL DETAILS ============
  getEventAdditionalDetails(eventId: string): Observable<EventAdditionalDetailDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${eventId}/additional-details`);
  }

  getVisibleAdditionalDetails(eventId: string): Observable<EventAdditionalDetailDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${eventId}/additional-details/visible`);
  }

  addAdditionalDetail(eventId: string, detailData: any): Observable<EventAdditionalDetailDto> {
    return this.http.post<any>(`${this.baseUrl}/${eventId}/additional-details`, detailData);
  }

  updateAdditionalDetail(eventId: string, detailId: string, detailData: any): Observable<EventAdditionalDetailDto> {
    return this.http.put<any>(`${this.baseUrl}/${eventId}/additional-details/${detailId}`, detailData);
  }

  deleteAdditionalDetail(eventId: string, detailId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/additional-details/${detailId}`);
  }

  reorderAdditionalDetails(eventId: string, detailIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${eventId}/additional-details/reorder`, { detailIds });
  }

  // ============ EVENT COUPONS ============
  getEventCoupons(eventId: string): Observable<EventCouponDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${eventId}/coupons`);
  }

  getValidEventCoupons(eventId: string): Observable<EventCouponDto[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${eventId}/coupons/valid`);
  }

  addEventCoupon(eventId: string, couponData: any): Observable<EventCouponDto> {
    return this.http.post<any>(`${this.baseUrl}/${eventId}/coupons`, couponData);
  }

  updateEventCoupon(eventId: string, couponId: string, couponData: any): Observable<EventCouponDto> {
    return this.http.put<any>(`${this.baseUrl}/${eventId}/coupons/${couponId}`, couponData);
  }

  deleteEventCoupon(eventId: string, couponId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${eventId}/coupons/${couponId}`);
  }

  validateCoupon(eventId: string, couponCode: string): Observable<EventCouponDto> {
    return this.http.post<any>(`${this.baseUrl}/${eventId}/coupons/validate`, { couponCode });
  }
}