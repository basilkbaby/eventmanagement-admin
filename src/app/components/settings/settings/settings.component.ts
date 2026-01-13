import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { 
  GeneralSettings, 
  BookingSettings, 
  NotificationSettings, 
  PaymentSettings, 
  SecuritySettings, 
  SystemSettings 
} from '../../../core/models/settings.interfaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  generalSettings: GeneralSettings = {
    venueName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    timezone: 'UTC',
    currency: 'GBP',
    dateFormat: 'MM/DD/YYYY',
    language: 'en'
  };

  bookingSettings: BookingSettings = {
    maxTicketsPerOrder: 10,
    bookingTimeoutMinutes: 15,
    allowSeatSelection: true,
    requireAccount: false,
    allowGuestCheckout: true,
    autoCancelUnpaid: true,
    cancellationPolicy: '',
    refundPolicy: ''
  };

  notificationSettings: NotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmation: true,
    bookingReminder: true,
    eventUpdates: true,
    systemAlerts: true,
    lowSeatAlerts: true,
    adminNotifications: true
  };

  paymentSettings: PaymentSettings = {
    paymentMethods: ['credit_card', 'paypal'],
    stripeEnabled: true,
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalEnabled: true,
    paypalClientId: '',
    paypalSecret: '',
    taxRate: 8.5,
    currency: 'GBP',
    testMode: true
  };

  securitySettings: SecuritySettings = {
    sessionTimeout: 60,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    twoFactorAuth: false,
    loginAttempts: 5,
    accountLockout: 30,
    ipWhitelist: []
  };

  systemSettings: SystemSettings = {
    maintenanceMode: false,
    cacheEnabled: true,
    backupFrequency: 'daily',
    logRetention: 30,
    apiRateLimit: 1000,
    analyticsEnabled: true
  };

  timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' }
  ];

  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' }
  ];

  dateFormats = [
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD',
    'MMM DD, YYYY'
  ];

  backupFrequencies = [
    { value: 'hourly', label: 'Every Hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  paymentMethodOptions = [
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' }
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    // Mock data - replace with API call
    this.generalSettings = {
      venueName: 'Grand Theater Hall',
      contactEmail: 'info@grandtheater.com',
      contactPhone: '+1-555-0123',
      address: '123 Theater Street, New York, NY 10001',
      timezone: 'America/New_York',
      currency: 'GBP',
      dateFormat: 'MM/DD/YYYY',
      language: 'en'
    };

    this.bookingSettings = {
      maxTicketsPerOrder: 10,
      bookingTimeoutMinutes: 15,
      allowSeatSelection: true,
      requireAccount: false,
      allowGuestCheckout: true,
      autoCancelUnpaid: true,
      cancellationPolicy: 'Cancellations allowed up to 48 hours before the event for a full refund.',
      refundPolicy: 'Refunds will be processed within 5-7 business days to the original payment method.'
    };

    this.paymentSettings = {
      paymentMethods: ['credit_card', 'paypal'],
      stripeEnabled: true,
      stripePublicKey: 'pk_test_...',
      stripeSecretKey: 'sk_test_...',
      paypalEnabled: true,
      paypalClientId: 'AY...',
      paypalSecret: 'EC...',
      taxRate: 8.5,
      currency: 'GBP',
      testMode: true
    };
  }

  saveGeneralSettings() {
    console.log('Saving general settings:', this.generalSettings);
    this.showSuccess('General settings saved successfully');
  }

  saveBookingSettings() {
    console.log('Saving booking settings:', this.bookingSettings);
    this.showSuccess('Booking settings saved successfully');
  }

  saveNotificationSettings() {
    console.log('Saving notification settings:', this.notificationSettings);
    this.showSuccess('Notification settings saved successfully');
  }

  savePaymentSettings() {
    console.log('Saving payment settings:', this.paymentSettings);
    this.showSuccess('Payment settings saved successfully');
  }

  saveSecuritySettings() {
    console.log('Saving security settings:', this.securitySettings);
    this.showSuccess('Security settings saved successfully');
  }

  saveSystemSettings() {
    console.log('Saving system settings:', this.systemSettings);
    this.showSuccess('System settings saved successfully');
  }

  saveAllSettings() {
    this.saveGeneralSettings();
    this.saveBookingSettings();
    this.saveNotificationSettings();
    this.savePaymentSettings();
    this.saveSecuritySettings();
    this.saveSystemSettings();
    this.showSuccess('All settings saved successfully');
  }

  resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      this.loadSettings();
      this.showSuccess('Settings reset to default values');
    }
  }

  testStripeConnection() {
    // Implement Stripe connection test
    this.showSuccess('Stripe connection test successful');
  }

  testPaypalConnection() {
    // Implement PayPal connection test
    this.showSuccess('PayPal connection test successful');
  }

  togglePaymentMethod(method: string) {
    
    this.showSuccess('PayPal connection test successful');
  }

  toggleMaintenanceMode() {
    if (this.systemSettings.maintenanceMode) {
      if (confirm('Enabling maintenance mode will make the system unavailable to users. Continue?')) {
        this.showSuccess('Maintenance mode enabled');
      } else {
        this.systemSettings.maintenanceMode = false;
      }
    } else {
      this.showSuccess('Maintenance mode disabled');
    }
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  getPasswordPolicyDescription(): string {
    const policy = this.securitySettings.passwordPolicy;
    const requirements = [];

    if (policy.requireUppercase) requirements.push('uppercase letters');
    if (policy.requireLowercase) requirements.push('lowercase letters');
    if (policy.requireNumbers) requirements.push('numbers');
    if (policy.requireSpecialChars) requirements.push('special characters');

    return `Minimum ${policy.minLength} characters${requirements.length > 0 ? ', including ' + requirements.join(', ') : ''}`;
  }
}