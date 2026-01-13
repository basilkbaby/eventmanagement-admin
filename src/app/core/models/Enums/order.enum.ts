// Update ticket.interface.ts or create order.interface.ts

export enum OrderStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled'
}

export enum PaymentStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  REFUNDED = 'Refunded'
}

export enum SeatType {
  REGULAR = 'Regular',
  VIP = 'VIP',
  PREMIUM = 'Premium',
  STUDENT = 'Student',
  SENIOR = 'Senior'
}
