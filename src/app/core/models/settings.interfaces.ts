export interface GeneralSettings {
  venueName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
}

export interface BookingSettings {
  maxTicketsPerOrder: number;
  bookingTimeoutMinutes: number;
  allowSeatSelection: boolean;
  requireAccount: boolean;
  allowGuestCheckout: boolean;
  autoCancelUnpaid: boolean;
  cancellationPolicy: string;
  refundPolicy: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingConfirmation: boolean;
  bookingReminder: boolean;
  eventUpdates: boolean;
  systemAlerts: boolean;
  lowSeatAlerts: boolean;
  adminNotifications: boolean;
}

export interface PaymentSettings {
  paymentMethods: string[];
  stripeEnabled: boolean;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paypalEnabled: boolean;
  paypalClientId?: string;
  paypalSecret?: string;
  taxRate: number;
  currency: string;
  testMode: boolean;
}

export interface SecuritySettings {
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  twoFactorAuth: boolean;
  loginAttempts: number;
  accountLockout: number;
  ipWhitelist: string[];
}

export interface SystemSettings {
  maintenanceMode: boolean;
  cacheEnabled: boolean;
  backupFrequency: string;
  logRetention: number;
  apiRateLimit: number;
  analyticsEnabled: boolean;
}