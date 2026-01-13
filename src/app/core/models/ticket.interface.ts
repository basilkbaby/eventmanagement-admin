export interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  ticketNumber: string;
  attendee: Attendee;
  ticketType: TicketType;
  status: TicketStatus;
  price: number;
  originalPrice: number;
  purchaseDate: Date;
  scannedAt?: Date;
  scannedBy?: string;
  orderId: string;
  order: Order;
  checkoutAnswers: CheckoutAnswer[];
  couponApplied?: Coupon;
  seatInfo?: SeatInfo;
  transferable: boolean;
  transferHistory?: TicketTransfer[];
  updatedAt?: Date;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  isActive: boolean;
  salesStart: Date;
  salesEnd: Date;
}

export interface CheckoutAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventName: string;
  tickets: Ticket[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  couponCode?: string;
  coupon?: Coupon;
  billingAddress?: BillingAddress;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableTicketTypes?: string[];
}

export interface SeatInfo {
  section: string;
  row: string;
  seatNumber: string;
  seatType: string;
}

export interface TicketTransfer {
  fromAttendee: Attendee;
  toAttendee: Attendee;
  transferredAt: Date;
  reason?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  ticket?: Ticket;
  error?: string;
}

export interface TicketStats {
  total: number;
  sold: number;
  available: number;
  revenue: number;
  used: number;
  cancelled: number;
}

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  EXPIRED = 'expired'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}