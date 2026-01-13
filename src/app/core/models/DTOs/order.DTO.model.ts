import { OrderStatus, PaymentStatus, SeatType } from "../Enums/order.enum";

export interface OrderDto {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Amount breakdown
  totalAmount: number;           // Base amount before fees/discounts
  serviceFeeAmount: number;      // Service fee amount
  bulkDiscountAmount: number;    // Bulk discount amount
  bulkDiscountApplied: boolean;
  bulkDiscountName?: string;
  couponDiscount: number;        // Coupon discount amount
  discountAmount: number;        // Total discount (bulk + coupon)
  finalAmount: number;           // Final amount after all adjustments
  
  // Seat information
  seatCount: number;
  seatSummary: string;
  seatNumbers: string[];
  
  // Dates
  createdAt: Date;
  updatedAt?: Date;
  
  // Collections
  orderSeats: OrderSeatDto[];
    expanded: boolean;
    cancelledSeatsCount: number;
    totalSeatsCount: number;
}

export interface OrderSeatDto {
  id: string;
  seatNumber: string;
  rowLabel: string;
  rowNumber: number;
  columnNumber: number;
  seatType: SeatType;
  priceAtBooking: number;
  serviceFee: number;
  bulkDiscount: number;
  couponDiscount: number;
  finalPrice: number;
  bookedAt: Date;
  isCancelled: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
  sectionName?: string;
  sectionId?: string;

}

export interface OrderBreakdownDto {
  subtotal: number;
  serviceFee: number;
  bulkDiscount: number;
  couponDiscount: number;
  total: number;
}

export interface CartItemDto {
  seatId: string;
  seatNumber: string;
  sectionName: string;
  rowLabel: string;
  columnNumber: number;
  basePrice: number;
  serviceFee: number;
  discount: number;
  finalPrice: number;
  seatType: string;
}

export interface CartCalculationDto {
  items: CartItemDto[];
  subtotal: number;
  serviceFee: number;
  bulkDiscount: number;
  bulkDiscountName: string;
  total: number;
  appliedCouponCode?: string;
  couponDiscount: number;
  finalTotal: number;
}

export interface FeeCalculationDto {
  baseAmount: number;
  ticketCount: number;
  serviceFee: number;
  bulkDiscount: number;
  bulkDiscountApplied: boolean;
  bulkDiscountName: string;
  totalAmount: number;
}