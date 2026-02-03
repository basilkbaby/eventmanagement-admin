import { OrderStatus, PaymentStatus, SeatType } from "../Enums/order.enum";

export interface OrderDto {
  // Core order properties (matching API)
  orderId: string;  // Changed from 'id' to match API
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerPostCode?: string;
  eventId: string;
  eventName: string;
  eventDate: Date;
  venue: string;
  subtotal: number;
  serviceFee: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  
  // Collections
  seats: OrderSeatDto[];
  
  // Additional API properties
  qrCodeData?: string | null;
  serviceFeeType?: string;
  serviceFeeValue?: number;
  couponCode?: string | null;
  couponDiscount: number;
  discount: number;
  totalDiscount: number;
  total: number;
  
  // UI properties (not from API)
  expanded?: boolean;
  cancelledSeatsCount?: number;
  seatCount?: number;
  seatSummary?: string;
  
  // Payment and discount properties (may come from API or calculated)
  paymentStatus?: PaymentStatus;
  serviceFeeAmount: number;
  bulkDiscountAmount: number;
  bulkDiscountApplied: boolean;
  bulkDiscountName?: string;
  finalAmount?: number;
}

export interface OrderSeatDto {
  // Core seat properties (matching API)
  seatId: string;  // Changed from 'id' to match API
  seatNumber: string;
  sectionName: string;
  price: number;
  ticketNumber: string;
  
  // Additional seat properties
  isCancelled?: boolean;
  cancelledAt?: string;
  seatType?: SeatType;
  rowLabel?: string;
  columnNumber?: number;
  serviceFee?: number;
  bulkDiscount?: number;
  couponDiscount?: number;
  priceAtBooking?: number;
  finalPrice?: number;
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