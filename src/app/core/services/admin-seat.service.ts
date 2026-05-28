// admin-seat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BlockSeatRequestDto, SeatItemDto, VenueData } from '../models/DTOs/seats.DTO.model';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface PurchaseData {
  seats: SeatItemDto[];
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


@Injectable({
  providedIn: 'root'
})
export class AdminSeatService {
  private apiUrl = `${environment.apiUrl}/seat`;
  private apiUrlCheckout = `${environment.apiUrl}/checkout`;

  constructor(private http: HttpClient) {}

  // ========== SEAT STATUS MANAGEMENT ==========
  
 // Update the blockSeats method in AdminSeatService:
blockSeats(eventId: string, seatItems: SeatItemDto[], reason: string = 'Administrative block'): Observable<ApiResponse> {
  const data: BlockSeatRequestDto = {
    seats: seatItems,
    eventId: eventId,
    reason: reason,
    blockedBy: 'admin' // Or get from auth service
  };
  
  return this.http.post<ApiResponse>(
    `${this.apiUrl}/block`,
    data
  );
}

  // Unblock seats
  unblockSeats(eventId: string, seatItems: SeatItemDto[]): Observable<ApiResponse> 
  {
    const data: BlockSeatRequestDto = {
      seats: seatItems,
      eventId: eventId
    };
  
    return this.http.post<ApiResponse>(
      `${this.apiUrl}/release`,data
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
  purchaseSeats(purchaseData: PurchaseData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(
      `${this.apiUrlCheckout}/completeoffline`,
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

  // Mark seats as unavailable — reuses /seat/block with status: UNAVAILABLE
  makeUnavailable(eventId: string, seatItems: SeatItemDto[], reason: string = 'Marked unavailable'): Observable<ApiResponse> {
    const data: BlockSeatRequestDto = {
      seats: seatItems,
      eventId,
      reason,
      blockedBy: 'admin',
      status: 'UNAVAILABLE'
    };
    return this.http.post<ApiResponse>(`${this.apiUrl}/block`, data);
  }

  // Restore unavailable seats — reuses /seat/release (handles both BLOCKED and UNAVAILABLE)
  restoreAvailable(eventId: string, seatItems: SeatItemDto[]): Observable<ApiResponse> {
    const data: BlockSeatRequestDto = {
      seats: seatItems,
      eventId
    };
    return this.http.post<ApiResponse>(`${this.apiUrl}/release`, data);
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