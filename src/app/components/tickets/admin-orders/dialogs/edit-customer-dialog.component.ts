import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderDto } from '../../../../core/models/DTOs/order.DTO.model';

export interface EditCustomerDialogData {
  order: OrderDto;
}

@Component({
  selector: 'app-edit-customer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Edit Customer Details</h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <div class="order-info">
          <p><strong>Order #:</strong> {{ data.order.orderNumber }}</p>
          <p><strong>Event:</strong> {{ data.order.eventName }}</p>
        </div>
        
        <form #editForm="ngForm" class="edit-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Customer Name</mat-label>
              <input matInput 
                     [(ngModel)]="customerName" 
                     name="customerName" 
                     required
                     placeholder="Enter customer name">
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput 
                     type="email"
                     [(ngModel)]="customerEmail" 
                     name="customerEmail" 
                     required
                     email
                     placeholder="Enter email address">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number</mat-label>
              <input matInput 
                     [(ngModel)]="customerPhone" 
                     name="customerPhone" 
                     placeholder="Enter phone number">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>
          </div>
          
          <div class="form-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Post Code</mat-label>
              <input matInput 
                     [(ngModel)]="customerPostCode" 
                     name="customerPostCode" 
                     placeholder="Enter post code">
              <mat-icon matPrefix>location_on</mat-icon>
            </mat-form-field>
          </div>
        </form>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button 
              color="primary" 
              (click)="onSave()"
              [disabled]="!editForm.valid || loading">
        <mat-icon *ngIf="!loading">save</mat-icon>
        <mat-icon *ngIf="loading" class="spinner">hourglass_empty</mat-icon>
        {{ loading ? 'Saving...' : 'Save Changes' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      padding: 16px 0;
    }
    
    .order-info {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 24px;
      
      p {
        margin: 0 0 8px 0;
        font-size: 14px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        strong {
          color: #333;
          margin-right: 8px;
        }
      }
    }
    
    .edit-form {
      .form-row {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
      
      .full-width {
        width: 100%;
      }
    }
    
    .spinner {
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class EditCustomerDialogComponent {
  private dialogRef = inject(MatDialogRef<EditCustomerDialogComponent>);
  private snackBar = inject(MatSnackBar);
  
  loading = false;
  
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerPostCode: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: EditCustomerDialogData) {
    this.customerName = data.order.customerName;
    this.customerEmail = data.order.customerEmail;
    this.customerPhone = data.order.customerPhone || '';
    this.customerPostCode = data.order.customerPostCode || '';
  }

  onSave(): void {
    this.loading = true;
    
    // Simulate API call
    setTimeout(() => {
      const updatedData = {
        customerName: this.customerName,
        customerEmail: this.customerEmail,
        customerPhone: this.customerPhone,
        customerPostCode: this.customerPostCode
      };
      
      this.dialogRef.close(updatedData);
      this.loading = false;
    }, 1000);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}