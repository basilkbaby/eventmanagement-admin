// dialogs/check-in-dialog.component.ts
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { OrderDto } from '../../../../core/models/DTOs/order.DTO.model';

export interface CheckInDialogData {
  order: OrderDto;
  eventName: string;
  eventDate: Date;
  totalSeats: number;
  checkedInSeats: number;
}

@Component({
  selector: 'app-check-in-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Check In Order</h2>
    
    <mat-dialog-content>
      <div class="order-summary">
        <div class="summary-row">
          <mat-icon>event</mat-icon>
          <span>{{ data.eventName }}</span>
        </div>
        <div class="summary-row">
          <mat-icon>calendar_today</mat-icon>
          <span>{{ data.eventDate | date:'fullDate' }}</span>
        </div>
        <div class="summary-row">
          <mat-icon>confirmation_number</mat-icon>
          <span>Order #{{ data.order.orderNumber }}</span>
        </div>
        <div class="summary-row">
          <mat-icon>person</mat-icon>
          <span>{{ data.order.customerName }}</span>
        </div>
      </div>

      <mat-divider></mat-divider>

      <div class="seats-section">
        <h3>Select Seats to Check In</h3>
        <div class="seats-grid">
          <div *ngFor="let seat of data.order.seats" class="seat-option">
            <mat-checkbox 
              [checked]="!seat.checkedInAt"
              [disabled]="seat.checkedInAt || seat.isCancelled"
              (change)="toggleSeat(seat.seatId, $event.checked)">
<span class="seat-number" [class.checked-in]="seat.isCheckedIn" [class.cancelled]="seat.isCancelled">
  {{ seat.seatNumber }}
  <span *ngIf="seat.isCheckedIn && seat.checkedInAt" class="checked-in-label">
    (Checked in {{ seat.checkedInAt | date:'short' }})
  </span>
  <span *ngIf="seat.isCheckedIn && !seat.checkedInAt" class="checked-in-label">
    (Checked in)
  </span>
  <span *ngIf="seat.isCancelled" class="cancelled-label">
    (Cancelled)
  </span>
</span>

            </mat-checkbox>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>



      <div class="summary-footer" *ngIf="selectedSeats.size > 0">
        <mat-icon>info</mat-icon>
        <span>Checking in {{ selectedSeats.size }} of {{ data.order.seats.length }} seats</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button 
              color="primary" 
              [disabled]="selectedSeats.size === 0"
              (click)="confirm()">
        <mat-icon>qr_code_scanner</mat-icon>
        Check In {{ selectedSeats.size }} Seats
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .order-summary {
      margin-bottom: 20px;
      
      .summary-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        
        mat-icon {
          color: #666;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
        
        span {
          color: #333;
          font-size: 14px;
        }
      }
    }

    .seats-section {
      margin: 20px 0;
      
      h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: #333;
      }
      
      .seats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
        max-height: 300px;
        overflow-y: auto;
        padding: 4px;
        
        .seat-option {
          .seat-number {
            font-size: 14px;
            
            &.checked-in {
              color: #999;
              text-decoration: line-through;
            }
            
            .checked-in-label {
              color: #4caf50;
              font-size: 12px;
              margin-left: 4px;
              text-decoration: none;
            }
            
            .cancelled-label {
              color: #f44336;
              font-size: 12px;
              margin-left: 4px;
            }
          }
        }
      }
    }

    .options-section {
      margin: 20px 0;
      
      h3 {
        margin: 0 0 16px;
        font-size: 16px;
        color: #333;
      }
      
      .full-width {
        width: 100%;
        margin-top: 16px;
      }
    }

    .summary-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
      font-size: 14px;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class CheckInDialogComponent {
  selectedSeats = new Set<string>();
  sendNotification = true;
  notes = '';

  constructor(
public dialogRef: MatDialogRef<CheckInDialogComponent>,
  @Inject(MAT_DIALOG_DATA) public data: CheckInDialogData
) {
  // Pre-select all un-checked-in and non-cancelled seats by default
  data.order.seats?.forEach(seat => {
    if (!seat.isCheckedIn && !seat.isCancelled) {
      this.selectedSeats.add(seat.seatId);
    }
  });
  }

  toggleSeat(seatId: string, checked: boolean): void {
    if (checked) {
      this.selectedSeats.add(seatId);
    } else {
      this.selectedSeats.delete(seatId);
    }
  }

  confirm(): void {
    this.dialogRef.close({
      selectedSeats: Array.from(this.selectedSeats),
      sendNotification: this.sendNotification,
      notes: this.notes
    });
  }
}