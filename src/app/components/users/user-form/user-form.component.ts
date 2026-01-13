import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { User, UserFormData } from '../../../core/models/user.interfaces';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatCardModule
  ],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent {
  @Input() user: User | null = null;
  @Output() save = new EventEmitter<UserFormData>();
  @Output() cancel = new EventEmitter<void>();

  formData: UserFormData = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'user',
    status: 'active',
    permissions: []
  };

  permissionOptions = [
    { value: 'events', label: 'Event Management' },
    { value: 'bookings', label: 'Booking Management' },
    { value: 'reports', label: 'Report Access' },
    { value: 'users', label: 'User Management' },
    { value: 'settings', label: 'System Settings' }
  ];

  ngOnInit() {
    if (this.user) {
      this.formData = {
        email: this.user.email,
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phone: this.user.phone,
        role: this.user.role,
        status: this.user.status,
        permissions: [...this.user.permissions]
      };
    }
  }

  onSave() {
    this.save.emit(this.formData);
  }

  onCancel() {
    this.cancel.emit();
  }

  togglePermission(permission: string) {
    const index = this.formData.permissions.indexOf(permission);
    if (index > -1) {
      this.formData.permissions.splice(index, 1);
    } else {
      this.formData.permissions.push(permission);
    }
  }
}