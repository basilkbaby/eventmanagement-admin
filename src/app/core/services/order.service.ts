import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, tap } from 'rxjs';
import { OrderDto, OrderSeatDto, OrderBreakdownDto ,  CartItemDto, CartCalculationDto, FeeCalculationDto, CheckinRequest, CheckinResponse } from '../models/DTOs/order.DTO.model';
import { OrderStatus, PaymentStatus, SeatType,  } from '../models/Enums/order.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

export interface OrdersResponse {
  orders: OrderDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExportResponse {
  blob: Blob;
  filename: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  cancellationReason?: string;
}

export interface CancelSeatRequest {
  reason: string;
}

export interface UpdateCustomerInfoRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  companyName?: string;
  taxNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  acceptsMarketingEmails: boolean;
  acceptsEventUpdates: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  
  private apiUrl =  environment.apiUrl+'/admin/adminorder';
  private cartApiUrl = environment.apiUrl+'/api/cart';
  private checkoutApiUrl = environment.apiUrl+'/api/checkout';

  constructor() {}

  // ==================== ORDER MANAGEMENT ====================

  getOrders(
    eventId?: string,
    search?: string,
    status?: OrderStatus,
    paymentStatus?: PaymentStatus,
    page: number = 1,
    pageSize: number = 1000
  ): Observable<OrdersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (search) params = params.set('search', search);
    if (eventId) params = params.set('eventId', eventId);
    if (status) params = params.set('status', status);
    if (paymentStatus) params = params.set('paymentStatus', paymentStatus);

    return this.http.get<OrdersResponse>(this.apiUrl, { params }).pipe(
      map(response => ({
        ...response,
        orders: response.orders
      })),
      catchError(this.handleError)
    );
  }

  getOrder(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiUrl}/${id}`).pipe(
      map(order => order),
      catchError(this.handleError)
    );
  }

  updateOrderStatus(id: string, status: OrderStatus, cancellationReason?: string): Observable<any> {
    const request: UpdateOrderStatusRequest = { status };
    if (cancellationReason) {
      request.cancellationReason = cancellationReason;
    }

    return this.http.put(`${this.apiUrl}/${id}/status`, request).pipe(
      catchError(this.handleError)
    );
  }

  cancelSeat(orderId: string, seatId: string, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/seats/${seatId}/cancel`, { reason }).pipe(
      catchError(this.handleError)
    );
  }

  updateCustomerInfo(orderId: string, customerInfo: UpdateCustomerInfoRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${orderId}/customer`, customerInfo).pipe(
      catchError(this.handleError)
    );
  }

  resendConfirmation(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/resend-confirmation`, {}).pipe(
      catchError(this.handleError)
    );
  }

  exportOrders(format: string = 'csv', eventId?: string): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
      headers: new HttpHeaders({
        'Accept': format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          : 'text/csv'
      })
    }).pipe(
      catchError(this.handleError)
    );
  }

  exportOrderTickets(orderId: string): Observable<Blob> {
  return this.http.get(`${this.apiUrl}/exportticket/${orderId}`, {
    responseType: 'blob',
    headers: new HttpHeaders({
      'Accept': 'application/pdf, application/zip'
    })
  });
}

  updateCustomerDetails(orderId: string, customerData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/${orderId}/updateordercustomer`, customerData, {
  });
}

resendConfirmationEmail(orderId: string, emailData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/${orderId}/resend-confirmation`, emailData, {
  });
}

confirmCheckin(request: CheckinRequest): Observable<CheckinResponse> {
    return this.http.post<CheckinResponse>(
      `${this.apiUrl}/${request.orderId}/checkin`, 
      {
        seatIds: request.seatIds,
        staffId: request.staffId,
        staffName: request.staffName,
        eventId: request.eventId
      }
    ).pipe(
      tap(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error during check-in:', error);
        throw error;
      })
    );
  }

  // ==================== CART MANAGEMENT ====================

  getCart(): Observable<CartCalculationDto> {
    return this.http.get<CartCalculationDto>(this.cartApiUrl).pipe(
      catchError(this.handleError)
    );
  }

  addToCart(eventId: string, seat: any): Observable<CartCalculationDto> {
    return this.http.post<CartCalculationDto>(this.cartApiUrl, {
      eventId,
      seatId: seat.id,
      seatNumber: seat.seatNumber,
      sectionName: seat.sectionName,
      rowLabel: seat.rowLabel,
      columnNumber: seat.columnNumber,
      basePrice: seat.price,
      seatType: seat.seatType
    }).pipe(
      catchError(this.handleError)
    );
  }

  removeFromCart(seatId: string): Observable<CartCalculationDto> {
    return this.http.delete<CartCalculationDto>(`${this.cartApiUrl}/items/${seatId}`).pipe(
      catchError(this.handleError)
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.cartApiUrl).pipe(
      catchError(this.handleError)
    );
  }

  extendReservation(): Observable<CartCalculationDto> {
    return this.http.post<CartCalculationDto>(`${this.cartApiUrl}/extend`, {}).pipe(
      catchError(this.handleError)
    );
  }

  applyCoupon(couponCode: string): Observable<CartCalculationDto> {
    return this.http.post<CartCalculationDto>(`${this.cartApiUrl}/coupon`, { couponCode }).pipe(
      catchError(this.handleError)
    );
  }

  removeCoupon(): Observable<CartCalculationDto> {
    return this.http.delete<CartCalculationDto>(`${this.cartApiUrl}/coupon`).pipe(
      catchError(this.handleError)
    );
  }

  calculateFees(
    baseAmount: number, 
    seatCount: number, 
    eventSettings: any,
    couponCode?: string
  ): Observable<FeeCalculationDto> {
    return this.http.post<FeeCalculationDto>(`${this.cartApiUrl}/calculate-fees`, {
      baseAmount,
      seatCount,
      eventSettings,
      couponCode
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== CHECKOUT & PAYMENT ====================


  getPaymentStatus(orderId: string): Observable<{ status: PaymentStatus; details?: any }> {
    return this.http.get<{ status: PaymentStatus; details?: any }>(
      `${this.checkoutApiUrl}/${orderId}/payment-status`
    ).pipe(
      catchError(this.handleError)
    );
  }

  initiateRefund(orderId: string, amount: number, reason: string): Observable<any> {
    return this.http.post(`${this.checkoutApiUrl}/${orderId}/refund`, {
      amount,
      reason
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ==================== HELPER METHODS ====================

  calculateOrderBreakdown(order: OrderDto): OrderBreakdownDto {
    return {
      subtotal: order.totalAmount,
      serviceFee: order.serviceFeeAmount,
      bulkDiscount: order.bulkDiscountAmount,
      couponDiscount: order.couponDiscount,
      total: order.totalAmount
    };
  }

  hasDiscount(order: OrderDto): boolean {
    return order.bulkDiscountApplied || order.couponDiscount > 0;
  }

  getDiscountDescription(order: OrderDto): string {
    const parts = [];
    if (order.bulkDiscountApplied && order.bulkDiscountName) {
      parts.push(`${order.bulkDiscountName} (-$${order.bulkDiscountAmount.toFixed(2)})`);
    }
    if (order.couponDiscount > 0) {
      parts.push(`Coupon (-$${order.couponDiscount.toFixed(2)})`);
    }
    return parts.join(' + ');
  }

  getServiceFeeDescription(order: OrderDto): string {
    if (order.serviceFeeAmount ?? 0 <= 0) return 'No service fee';
    
    const percentage = (order.serviceFeeAmount / order.totalAmount) * 100;
    return `Service fee: $${order.serviceFeeAmount} (${percentage.toFixed(1)}%)`;
  }

  // ==================== ERROR HANDLING ====================

  private handleError = (error: any): Observable<never> => {
    console.error('OrderService error:', error);
    
    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Show error notification
    this.snackBar.open(errorMessage, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    return throwError(() => error);
  }

  // ==================== STATIC CALCULATIONS (for offline use) ====================

  static calculateServiceFee(
    baseAmount: number, 
    settings: any, 
    seatCount: number = 1
  ): number {
    if (!settings?.applyServiceFee) return 0;
    
    let fee = 0;
    
    // Percentage fee
    if (settings.serviceFeePercentage > 0) {
      fee += baseAmount * (settings.serviceFeePercentage / 100);
    }
    
    // Fixed fee per ticket
    if (settings.serviceFeeFixedAmount) {
      fee += settings.serviceFeeFixedAmount * seatCount;
    }
    
    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  static calculateBulkDiscount(
    baseAmount: number, 
    seatCount: number, 
    settings: any
  ): { amount: number; name: string; applied: boolean } {
    if (!settings?.enableBulkDiscount || seatCount < settings.bulkDiscountThreshold) {
      return { amount: 0, name: '', applied: false };
    }
    
    let discountAmount = 0;
    
    // Calculate percentage discount
    if (settings.bulkDiscountPercentage > 0) {
      discountAmount = baseAmount * (settings.bulkDiscountPercentage / 100);
    }
    
    // Calculate fixed amount discount per ticket
    if (settings.bulkDiscountFixedAmount) {
      const fixedDiscount = settings.bulkDiscountFixedAmount * seatCount;
      if (settings.bulkDiscountPercentage === 0 || fixedDiscount > discountAmount) {
        discountAmount = fixedDiscount;
      }
    }
    
    // Apply max discount limit
    if (settings.bulkDiscountMaxAmount && discountAmount > settings.bulkDiscountMaxAmount) {
      discountAmount = settings.bulkDiscountMaxAmount;
    }
    
    discountAmount = Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
    
    return {
      amount: discountAmount,
      name: settings.bulkDiscountName || 'Group Discount',
      applied: discountAmount > 0
    };
  }

  static calculateCouponDiscount(
    baseAmount: number, 
    coupon: any
  ): number {
    if (!coupon || !coupon.isValid) return 0;
    
    let discount = 0;
    
    if (coupon.couponType === 'Percentage') {
      discount = baseAmount * (coupon.discountValue / 100);
    } else if (coupon.couponType === 'FixedAmount') {
      discount = Math.min(coupon.discountValue, baseAmount);
    }
    
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  static calculateTotal(
    baseAmount: number,
    serviceFee: number,
    bulkDiscount: number,
    couponDiscount: number
  ): number {
    const total = baseAmount + serviceFee - bulkDiscount - couponDiscount;
    return Math.round(Math.max(total, 0) * 100) / 100; // Ensure non-negative, round to 2 decimals
  }

  static distributeToSeats(
    seats: CartItemDto[],
    serviceFee: number,
    bulkDiscount: number,
    couponDiscount: number
  ): CartItemDto[] {
    const subtotal = seats.reduce((sum, seat) => sum + seat.basePrice, 0);
    
    if (subtotal <= 0) return seats;
    
    return seats.map(seat => {
      const proportion = seat.basePrice / subtotal;
      
      return {
        ...seat,
        serviceFee: Math.round(serviceFee * proportion * 100) / 100,
        discount: Math.round((bulkDiscount + couponDiscount) * proportion * 100) / 100,
        finalPrice: Math.round((seat.basePrice + serviceFee * proportion - (bulkDiscount + couponDiscount) * proportion) * 100) / 100
      };
    });
  }
}