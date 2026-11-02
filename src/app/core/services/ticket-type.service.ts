import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  capacity: number;
  quantitySold: number;
  available: number;
  salesStart?: string | null;
  salesEnd?: string | null;
  minPerOrder: number;
  maxPerOrder: number;
  sortOrder: number;
  isActive: boolean;
  hideWhenSoldOut: boolean;
  soldOut: boolean;
  serviceFee: number;
  requiresAccessCode: boolean;
}

export interface TicketTypePayload {
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  capacity: number;
  salesStart?: string | null;
  salesEnd?: string | null;
  minPerOrder: number;
  maxPerOrder: number;
  sortOrder: number;
  isActive: boolean;
  hideWhenSoldOut: boolean;
  serviceFee: number;
  requiresAccessCode: boolean;
}

/** One line of an admin offline GA purchase. */
export interface GaPurchaseLine {
  ticketTypeId: string;
  quantity: number;
}

export interface GaPurchaseRequest {
  eventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostCode: string;
  transactionRef: string;
  discount: number;
  paymentCollected: boolean;
  tickets: GaPurchaseLine[];
}

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private base = `${environment.apiUrl}/admin/ticket-types`;

  constructor(private http: HttpClient) {}

  getByEvent(eventId: string): Observable<TicketType[]> {
    return this.http.get<{ success: boolean; data: TicketType[] }>(`${this.base}/event/${eventId}`)
      .pipe(map(r => r.data ?? []));
  }

  create(payload: TicketTypePayload): Observable<TicketType> {
    return this.http.post<{ success: boolean; data: TicketType }>(this.base, payload)
      .pipe(map(r => r.data));
  }

  update(id: string, payload: TicketTypePayload): Observable<TicketType> {
    return this.http.put<{ success: boolean; data: TicketType }>(`${this.base}/${id}`, { ...payload, id })
      .pipe(map(r => r.data));
  }

  delete(id: string): Observable<boolean> {
    return this.http.delete<{ success: boolean }>(`${this.base}/${id}`)
      .pipe(map(r => r.success));
  }

  // --- Shared event access code (unlocks access-code-gated categories) ---
  getAccessCode(eventId: string): Observable<string | null> {
    return this.http.get<{ success: boolean; data: { accessCode: string | null } }>(
      `${this.base}/event/${eventId}/access-code`)
      .pipe(map(r => r.data?.accessCode ?? null));
  }

  setAccessCode(eventId: string, accessCode: string | null): Observable<boolean> {
    return this.http.put<{ success: boolean }>(
      `${this.base}/event/${eventId}/access-code`, { accessCode })
      .pipe(map(r => r.success));
  }

  // --- Admin offline GA purchase ---
  purchaseGa(request: GaPurchaseRequest): Observable<{ success: boolean; error?: string }> {
    return this.http.post<{ success: boolean; error?: string }>(
      `${environment.apiUrl}/checkout/completeoffline-ga`, request);
  }
}
