// admin-seat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SeatOverride, SectionRowConfig, VenueData, VenueSection } from '../models/DTOs/seats.DTO.model';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface PurchaseData {
  seatIds: string[];
  customerName: string;
  customerEmail: string;
  notes?: string;
  totalAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  sectionConfigId?: string;
}

interface ReservationData {
  seatIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  sectionConfigId?: string;
  reservationExpiry?: Date;
}

interface BlockSeatsData {
  seatIds: string[];
  sectionConfigId?: string;
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSeatService {
  private apiUrl = `${environment.apiUrl}/seat`;

  constructor(private http: HttpClient) {}

  // ========== SEAT STATUS MANAGEMENT ==========
  
  // Block seats
  blockSeats(eventId: string, seatIds: string[], sectionConfigId?: string, reason: string = 'Administrative block'): Observable<ApiResponse> {
    const data: BlockSeatsData = {
      seatIds,
      sectionConfigId,
      reason
    };
    
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/block-seats`,
      data
    );
  }


  // Unblock seats
  unblockSeats(eventId: string, seatIds: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/unblock-seats`,
      { seatIds }
    );
  }

  // Reserve seats
  reserveSeats(eventId: string, reservationData: ReservationData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/reserve-seats`,
      reservationData
    );
  }

  // Purchase seats (admin override)
  purchaseSeats(eventId: string, purchaseData: PurchaseData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/purchase-seats`,
      purchaseData
    );
  }

  // Release seats (make available again)
  releaseSeats(eventId: string, seatIds: string[]): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/release-seats`,
      { seatIds }
    );
  }


  // ========== SEAT MAP MANAGEMENT ==========

  // Get seat map with admin privileges
  getAdminSeatMap(eventId: string): Observable<VenueData> {
    return this.http.get<VenueData>(`${this.apiUrl}/map/${eventId}`);
  }

  // Save seat map configuration
  saveSeatMap(eventId: string, venueData: VenueData): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(
      `${this.apiUrl}/events/${eventId}/admin/seat-map`,
      venueData
    );
  }

}