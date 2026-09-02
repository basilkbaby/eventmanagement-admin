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
}
