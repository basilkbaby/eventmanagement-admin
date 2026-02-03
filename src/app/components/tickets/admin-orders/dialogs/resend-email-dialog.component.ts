import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderDto } from '../../../../core/models/DTOs/order.DTO.model';
import { MatInputModule } from '@angular/material/input';

export interface ResendEmailDialogData {
  order: OrderDto;
}

@Component({
  selector: 'app-resend-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Resend Order Confirmation</h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <div class="confirmation-info">
          <mat-icon class="info-icon">info</mat-icon>
          <div class="info-content">
            <p>You are about to resend the order confirmation email for:</p>
            <div class="order-details">
              <p><strong>Order #:</strong> {{ data.order.orderNumber }}</p>
              <p><strong>Customer:</strong> {{ data.order.customerName }}</p>
              <p><strong>Email:</strong> {{ data.order.customerEmail }}</p>
              <p><strong>Event:</strong> {{ data.order.eventName }}</p>
            </div>
          </div>
        </div>
        
        <div class="email-options">
          <h3>Email Options</h3>
               
          <div class="option-item">
            <mat-checkbox [(ngModel)]="sendToAlternateEmail" color="primary">
              Send to alternate email
            </mat-checkbox>
            <div class="alternate-email-input" *ngIf="sendToAlternateEmail">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Alternate Email</mat-label>
                <input matInput 
                       type="email"
                       [(ngModel)]="alternateEmail"
                       placeholder="Enter alternate email address">
                <mat-icon matPrefix>alternate_email</mat-icon>
              </mat-form-field>
            </div>
          </div>
          
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button 
              color="primary" 
              (click)="onSend()"
              [disabled]="loading">
        <mat-icon *ngIf="!loading">send</mat-icon>
        <mat-icon *ngIf="loading" class="spinner">hourglass_empty</mat-icon>
        {{ loading ? 'Sending...' : 'Send Email' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      padding: 16px 0;
    }
    
    .confirmation-info {
      display: flex;
      gap: 16px;
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      
      .info-icon {
        color: #1976d2;
        font-size: 24px;
        width: 24px;
        height: 24px;
        margin-top: 4px;
      }
      
      .info-content {
        flex: 1;
        
        p {
          margin: 0 0 12px 0;
          color: #333;
          font-size: 14px;
        }
        
        .order-details {
          p {
            margin: 0 0 6px 0;
            font-size: 13px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            strong {
              color: #666;
              min-width: 80px;
              display: inline-block;
            }
          }
        }
      }
    }
    
    .email-options {
      h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        color: #333;
      }
      
      .option-item {
        margin-bottom: 20px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .option-hint {
          margin: 4px 0 0 32px;
          font-size: 12px;
          color: #666;
        }
        
        .alternate-email-input,
        .admin-note-input {
          margin: 12px 0 0 32px;
        }
      }
    }
    
    .full-width {
      width: 100%;
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
export class ResendEmailDialogComponent {
  private dialogRef = inject(MatDialogRef<ResendEmailDialogComponent>);
  private snackBar = inject(MatSnackBar);
  
  loading = false;
  includeTickets = true;
  sendToAlternateEmail = false;
  addAdminNote = false;
  alternateEmail = '';
  adminNote = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: ResendEmailDialogData) {}

  onSend(): void {
    this.loading = true;
    
    // Prepare email data
    const emailData = {
      orderId: this.data.order.orderId,
      includeTickets: this.includeTickets,
      sendToAlternateEmail: this.sendToAlternateEmail,
      alternateEmail: this.sendToAlternateEmail ? this.alternateEmail : null,
      addAdminNote: this.addAdminNote,
      adminNote: this.addAdminNote ? this.adminNote : null
    };
    
    // Simulate API call
    setTimeout(() => {
      this.dialogRef.close(emailData);
      this.loading = false;
    }, 1500);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}