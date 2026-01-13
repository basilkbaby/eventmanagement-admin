export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  status: 'active' | 'inactive' | 'expired'; // Can be expired based on dates
  applicableTo: 'all' | 'specific';
  applicableEvents?: string[];
  applicableSections?: string[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

export interface CouponFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  status: 'active' | 'inactive'; // Only active/inactive for form (expired is automatic)
  applicableTo: 'all' | 'specific';
  applicableEvents: string[];
  applicableSections: string[];
}

export interface CouponUsage {
  id: string;
  couponCode: string;
  userId: string;
  userName: string;
  orderId: string;
  orderAmount: number;
  discountApplied: number;
  usedAt: Date;
}