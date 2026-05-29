import { DiscountType } from "../Enums/coupon.enum";

export interface CouponDto {
  id?: string;
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountAmount: number;
  discountPercentage: number;
  minimumPurchaseAmount: number;
  maxDiscountAmount?: number;
  maxUses: number;
  currentUses: number;
  usesPerCustomer: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  isGlobal: boolean;
  applicableEventTypes: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
  createdBy: string;
  assignedEventIds?: string[];
  eventIds?: string[];
  isValid?: boolean;
  validationMessage?: string;
  calculatedDiscount?: number;
  discountValue?: number;
  // Ticket quantity rules
  minTickets: number;
  maxTickets?: number;
  applyToAllTickets: boolean;
  ticketsRequired?: number;
  ticketRuleDescription?: string;
  // Section exclusions
  excludedSections?: string[];
  // Bulk-discount specific
  allSectionsEvents?: string[];   // events where excludedSections is ignored
  isAutomatic: boolean;           // false = coupon code, true = bulk discount rule
  canApplyWithCoupon: boolean;    // true = stacks with a manual coupon code
}

export interface CouponStats {
  total: number;
  active: number;
  expired: number;
  inactive: number;
  upcoming: number;
  totalUses: number;
}

export interface CouponFilter {
  search: string;
  status: string;
  discountType: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface CouponEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}