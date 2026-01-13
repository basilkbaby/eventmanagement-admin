import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CouponDto, CouponEvent } from '../models/DTOs/coupon.DTO.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private apiUrl = environment.apiUrl + '/coupons';

  constructor(private http: HttpClient) {}

  // Get all coupons with filters
  getCoupons(filters?: {
    search?: string;
    status?: string;
    discountType?: string;
  }): Observable<CouponDto[]> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.discountType) {
      params = params.set('discountType', filters.discountType);
    }

    return this.http.get<CouponDto[]>(this.apiUrl, { params });
  }

  // Get single coupon
  getCoupon(id: string): Observable<CouponDto> {
    return this.http.get<CouponDto>(`${this.apiUrl}/${id}`);
  }

  // Create coupon
  createCoupon(coupon: CouponDto): Observable<CouponDto> {
    return this.http.post<CouponDto>(this.apiUrl, coupon);
  }

  // Update coupon
  updateCoupon(id: string, coupon: CouponDto): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, coupon);
  }

  // Delete coupon
  deleteCoupon(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Duplicate coupon
  duplicateCoupon(id: string): Observable<CouponDto> {
    return this.http.post<CouponDto>(`${this.apiUrl}/${id}/duplicate`, {});
  }

  // Toggle coupon active status
  toggleActive(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/toggle-active`, {});
  }

  // Activate coupon
  activateCoupon(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/activate`, {});
  }

  // Deactivate coupon
  deactivateCoupon(id: string): Observable<{ isActive: boolean }> {
    return this.http.post<{ isActive: boolean }>(`${this.apiUrl}/${id}/deactivate`, {});
  }

  // Reset usage
  resetUsage(id: string): Observable<{ currentUses: number }> {
    return this.http.post<{ currentUses: number }>(`${this.apiUrl}/${id}/reset-usage`, {});
  }

  // Validate coupon
  validateCoupon(code: string, eventId: string, cartTotal: number): Observable<CouponDto> {
    return this.http.post<CouponDto>(`${this.apiUrl}/validate`, {
      code,
      eventId,
      cartTotal
    });
  }

  // Apply coupon
  applyCoupon(id: string, eventId: string, cartTotal: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/apply`, {
      eventId,
      cartTotal
    });
  }

  // Get all events for dropdown
  getEvents(): Observable<CouponEvent[]> {
    return this.http.get<CouponEvent[]>(`${this.apiUrl}/available-events` );
  }

  // Generate coupon code
  generateCouponCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}