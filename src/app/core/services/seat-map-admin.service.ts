// services/seat-map-admin.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SeatMapLayout {
  eventId: string;
  canvasWidth: number;
  canvasHeight: number;
  stageY: number;
  stageWidth: number;
  stageHeight: number;
  sections: SectionLayout[];
}

export interface SectionLayout {
  id?: string;
  eventId: string;
  name: string;
  description: string;
  sectionType: 'WING' | 'MIDDLE';
  ticketType: 'VIP' | 'DIAMOND' | 'GOLD';
  basePrice: number;
  canvasX: number;
  canvasY: number;
  sectionIndex: number;
  rowsPerSection: number;
  seatsPerRow: number;
  color: string;
  icon: string;
  rowLetterStart: string;
  isVisible: boolean;
  seatRadius: number;
  seatGap: number;
  totalSeats?: number;
  availableSeats?: number;
  bookedSeats?: number;
}

export interface Seat {
  id: string;
  sectionId: string;
  seatNumber: string;
  rowLabel: string;
  rowNumber: number;
  columnNumber: number;
  gridRow: number;
  gridCol: number;
  ticketType: string;
  price: number;
  sectionName: string;
  status: string;
  isPartialView: boolean;
  features: string[];
  blockedUntil?: string;
  reservedByCartId?: string;
}

export interface CreateSectionDto {
  eventId: string;
  name: string;
  description: string;
  sectionType: 'WING' | 'MIDDLE';
  ticketType: 'VIP' | 'DIAMOND' | 'GOLD';
  basePrice: number;
  canvasX: number;
  canvasY: number;
  sectionIndex: number;
  rowsPerSection: number;
  seatsPerRow: number;
  color: string;
  icon: string;
  rowLetterStart: string;
  isVisible: boolean;
  seatRadius: number;
  seatGap: number;
}

export interface UpdateSectionDto {
  name?: string;
  description?: string;
  sectionType?: 'WING' | 'MIDDLE';
  ticketType?: 'VIP' | 'DIAMOND' | 'GOLD';
  basePrice?: number;
  canvasX?: number;
  canvasY?: number;
  sectionIndex?: number;
  rowsPerSection?: number;
  seatsPerRow?: number;
  color?: string;
  icon?: string;
  rowLetterStart?: string;
  isVisible?: boolean;
  seatRadius?: number;
  seatGap?: number;
}

export interface CreateSeatDto {
  sectionId: string;
  seatNumber: string;
  gridRow: number;
  gridCol: number;
  rowLabel: string;
  ticketType: string;
  price: number;
  sectionName: string;
  rowNumber?: number;
  columnNumber?: number;
  isPartialView: boolean;
  features: string[];
}

export interface BulkSeatCreateDto {
  sectionId: string;
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  ticketType: string;
  price: number;
  sectionName: string;
}

export interface UpdateSeatStatusDto {
  seatId: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'NOT_AVAILABLE' | 'PARTIAL_VIEW';
  reason: string;
}

export interface BulkUpdateSeatStatusDto {
  seatIds: string[];
  status: string;
  reason: string;
}

export interface SeatStatusReport {
  eventId: string;
  eventName: string;
  totalSections: number;
  totalSeats: number;
  statusCounts: { [key: string]: number };
  ticketTypeCounts: { [key: string]: number };
  sectionTypeCounts: { [key: string]: number };
  sections: SectionReport[];
}

export interface SectionReport {
  sectionId: string;
  sectionName: string;
  ticketType: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  reservedSeats: number;
  notAvailableSeats: number;
  partialViewSeats: number;
}

export interface SeatStatistics {
  eventId: string;
  eventName: string;
  totalSections: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  reservedSeats: number;
  notAvailableSeats: number;
  partialViewSeats: number;
  ticketTypeDistribution: { [key: string]: number };
  sectionTypeDistribution: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class SeatMapAdminService {
  private apiUrl = environment.apiUrl + '/admin/adminseatmap';

  constructor(private http: HttpClient) {}

  // Layout Operations
  getLayout(eventId: string): Observable<SeatMapLayout> {
    return this.http.get<SeatMapLayout>(`${this.apiUrl}/layout/${eventId}`);
  }

  saveLayout(eventId: string, layout: SeatMapLayout): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/layout/${eventId}`, layout);
  }

  // Section Operations
  getSections(eventId: string): Observable<SectionLayout[]> {
    return this.http.get<SectionLayout[]>(`${this.apiUrl}/sections/${eventId}`);
  }

  getSectionDetail(sectionId: string): Observable<SectionLayout> {
    return this.http.get<SectionLayout>(`${this.apiUrl}/sections/detail/${sectionId}`);
  }

  createSection(section: CreateSectionDto): Observable<SectionLayout> {
    return this.http.post<SectionLayout>(`${this.apiUrl}/sections`, section);
  }

  updateSection(sectionId: string, section: UpdateSectionDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/sections/${sectionId}`, section);
  }

  deleteSection(sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sections/${sectionId}`);
  }

  generateSeatsForSection(sectionId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/sections/${sectionId}/generate-seats`, {});
  }

  // Seat Operations
  getSeats(eventId: string): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.apiUrl}/seats/${eventId}`);
  }

  getSeatDetail(seatId: string): Observable<Seat> {
    return this.http.get<Seat>(`${this.apiUrl}/seats/detail/${seatId}`);
  }

  createSeat(seat: CreateSeatDto): Observable<Seat> {
    return this.http.post<Seat>(`${this.apiUrl}/seats`, seat);
  }

  createBulkSeats(bulkDto: BulkSeatCreateDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/seats/bulk`, bulkDto);
  }

  updateSeat(seatId: string, seatData: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/seats/${seatId}`, seatData);
  }

  updateSeatStatus(dto: UpdateSeatStatusDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/seats/status`, dto);
  }

  updateBulkSeatStatus(dto: BulkUpdateSeatStatusDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/seats/bulk-status`, dto);
  }

  deleteSeat(seatId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/seats/${seatId}`);
  }

  // Reports & Statistics
  getSeatStatusReport(eventId: string): Observable<SeatStatusReport> {
    return this.http.get<SeatStatusReport>(`${this.apiUrl}/reports/${eventId}`);
  }

  getSeatStatistics(eventId: string): Observable<SeatStatistics> {
    return this.http.get<SeatStatistics>(`${this.apiUrl}/statistics/${eventId}`);
  }

  // Search Seats
  searchSeats(
    eventId: string,
    filters: {
      sectionName?: string;
      rowLabel?: string;
      rowNumber?: number;
      seatNumber?: number;
      ticketType?: string;
      status?: string;
    }
  ): Observable<Seat[]> {
    const params: any = {};
    if (filters.sectionName) params.sectionName = filters.sectionName;
    if (filters.rowLabel) params.rowLabel = filters.rowLabel;
    if (filters.rowNumber) params.rowNumber = filters.rowNumber;
    if (filters.seatNumber) params.seatNumber = filters.seatNumber;
    if (filters.ticketType) params.ticketType = filters.ticketType;
    if (filters.status) params.status = filters.status;

    return this.http.get<Seat[]>(`${this.apiUrl}/seats/search/${eventId}`, { params });
  }
}