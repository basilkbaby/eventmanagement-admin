import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Coupon, CouponFormData } from '../../../core/models/coupon.interfaces';

@Component({
  selector: 'app-coupon-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  templateUrl: './coupon-form.component.html',
  styleUrls: ['./coupon-form.component.scss']
})
export class CouponFormComponent {
  @Input() coupon: Coupon | null = null;
  @Output() save = new EventEmitter<CouponFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: CouponFormData = {
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: undefined,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    usageLimit: 100,
    status: 'active',
    applicableTo: 'all',
    applicableEvents: [],
    applicableSections: []
  };

  // Mock data for events and sections
  events = [
    { id: '1', name: 'Summer Concert Series' },
    { id: '2', name: 'Winter Festival' },
    { id: '3', name: 'Spring Gala' }
  ];

  sections = [
    { id: 'vip', name: 'VIP Section' },
    { id: 'premium', name: 'Premium Seating' },
    { id: 'general', name: 'General Admission' }
  ];

  ngOnInit() {
    if (this.coupon) {
      // Convert expired status to inactive for editing
      const editableStatus = this.coupon.status === 'expired' ? 'inactive' : this.coupon.status;
      
      this.formData = {
        code: this.coupon.code,
        description: this.coupon.description,
        discountType: this.coupon.discountType,
        discountValue: this.coupon.discountValue,
        minOrderAmount: this.coupon.minOrderAmount,
        maxDiscountAmount: this.coupon.maxDiscountAmount,
        startDate: new Date(this.coupon.startDate),
        endDate: new Date(this.coupon.endDate),
        usageLimit: this.coupon.usageLimit,
        status: editableStatus as 'active' | 'inactive',
        applicableTo: this.coupon.applicableTo,
        applicableEvents: this.coupon.applicableEvents || [],
        applicableSections: this.coupon.applicableSections || []
      };
    } else {
      this.generateCode();
    }
  }

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.formData.code = result;
  }

  onSave() {
    // Validate form
    if (this.formData.discountType === 'percentage' && this.formData.discountValue > 100) {
      alert('Percentage discount cannot exceed 100%');
      return;
    }

    if (this.formData.endDate <= this.formData.startDate) {
      alert('End date must be after start date');
      return;
    }

    if (this.formData.usageLimit < 1) {
      alert('Usage limit must be at least 1');
      return;
    }

    this.save.emit(this.formData);
  }

  onCancel() {
    this.cancel.emit();
  }

  toggleEvent(eventId: string) {
    const index = this.formData.applicableEvents.indexOf(eventId);
    if (index > -1) {
      this.formData.applicableEvents.splice(index, 1);
    } else {
      this.formData.applicableEvents.push(eventId);
    }
  }

  toggleSection(sectionId: string) {
    const index = this.formData.applicableSections.indexOf(sectionId);
    if (index > -1) {
      this.formData.applicableSections.splice(index, 1);
    } else {
      this.formData.applicableSections.push(sectionId);
    }
  }

  // Helper to check if coupon would be expired based on dates
  wouldBeExpired(): boolean {
    return new Date() > this.formData.endDate;
  }
}