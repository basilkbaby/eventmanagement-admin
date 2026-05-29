import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CouponDto, CouponEvent, CouponStats } from '../models/DTOs/coupon.DTO.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = environment.apiUrl + '/coupons';

  constructor(private http: HttpClient) {}

  getCoupons(filters?: {
    eventId?: string;
    search?: string;
    status?: string;
    discountType?: string;
    isAutomatic?: boolean;
  }): Observable<CouponDto[]> {
    let params = new HttpParams();
    if (filters?.eventId)      params = params.set('eventId', filters.eventId);
    if (filters?.search)       params = params.set('search', filters.search);
    if (filters?.status)       params = params.set('status', filters.status);
    if (filters?.discountType) params = params.set('discountType', filters.discountType);
    if (filters?.isAutomatic !== undefined) params = params.set('isAutomatic', String(filters.isAutomatic));
    return this.http.get<CouponDto[]>(this.apiUrl, { params });
  }

  getCoupon(id: string): Observable<CouponDto> {
    return this.http.get<CouponDto>(`${this.apiUrl}/${id}`);
  }

  getCouponByCode(code: string): Observable<CouponDto> {
    return this.http.get<CouponDto>(`${this.apiUrl}/by-code/${code}`);
  }

  getStats(): Observable<CouponStats> {
    return this.http.get<CouponStats>(`${this.apiUrl}/stats`);
  }

  getEvents(): Observable<CouponEvent[]> {
    return this.http.get<CouponEvent[]>(`${this.apiUrl}/available-events`);
  }

  createCoupon(coupon: CouponDto): Observable<CouponDto> {
    return this.http.post<CouponDto>(this.apiUrl, coupon);
  }

  updateCoupon(id: string, coupon: CouponDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, coupon);
  }

  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  duplicateCoupon(id: string): Observable<CouponDto> {
    return this.http.post<CouponDto>(`${this.apiUrl}/${id}/duplicate`, {});
  }

  toggleActive(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  activateCoupon(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivateCoupon(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  resetUsage(id: string): Observable<{ currentUses: number }> {
    return this.http.post<{ currentUses: number }>(`${this.apiUrl}/${id}/reset-usage`, {});
  }

  extendValidity(id: string, body: { newValidFrom?: string; newValidUntil: string }): Observable<{ validFrom: string; validUntil: string }> {
    return this.http.patch<{ validFrom: string; validUntil: string }>(`${this.apiUrl}/${id}/extend`, body);
  }

  applyCoupon(id: string, eventId: string, cartTotal: number): Observable<{ message: string; discount: number }> {
    return this.http.post<{ message: string; discount: number }>(`${this.apiUrl}/${id}/apply`, { eventId, cartTotal });
  }

  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
