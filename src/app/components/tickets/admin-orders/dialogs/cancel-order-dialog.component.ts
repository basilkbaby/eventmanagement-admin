// dialogs/cancel-order-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { OrderDto, OrderSeatDto } from '../../../../core/models/DTOs/order.DTO.model';

export interface CancelOrderDialogData {
  order: OrderDto;
}

export interface CancelOrderDialogResult {
  // Empty array = cancel the whole order (all seats). Otherwise the OrderSeat ids to cancel.
  seatIds: string[];
}

@Component({
  selector: 'app-cancel-order-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatCheckboxModule, MatRadioModule, MatIconModule, MatDividerModule
  ],
  template: `
    <h2 mat-dialog-title>Cancel Booking</h2>

    <mat-dialog-content>
      <div class="order-summary">
        <div class="summary-row"><mat-icon>confirmation_number</mat-icon><span>Order #{{ data.order.orderNumber }}</span></div>
        <div class="summary-row"><mat-icon>person</mat-icon><span>{{ data.order.customerName }}</span></div>
      </div>

      <mat-divider></mat-divider>

      <mat-radio-group [(ngModel)]="mode" class="mode-group">
        <mat-radio-button value="all">Cancel entire booking (all {{ seats.length }} seat{{ seats.length !== 1 ? 's' : '' }})</mat-radio-button>
        <mat-radio-button value="specific" [disabled]="seats.length <= 1">Cancel specific seats</mat-radio-button>
      </mat-radio-group>

      <div class="seat-list" *ngIf="mode === 'specific'">
        <label class="seat-row" *ngFor="let s of seats">
          <mat-checkbox [(ngModel)]="selected[s.seatId]">
            {{ s.sectionName }} — {{ s.seatNumber }}
          </mat-checkbox>
        </label>
      </div>

      <div class="warn">
        <mat-icon>warning</mat-icon>
        <span *ngIf="mode === 'all'">This permanently removes the order and frees its seats. This cannot be undone. No refund is issued here.</span>
        <span *ngIf="mode === 'specific'">Selected seats are permanently removed and freed. If it's the last seat, the whole order is removed. No refund is issued here.</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Back</button>
      <button mat-raised-button color="warn" [disabled]="!canConfirm()" (click)="confirm()">
        {{ mode === 'all' ? 'Cancel whole booking' : 'Cancel selected seats' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .order-summary { margin-bottom: 12px; }
    .summary-row { display: flex; align-items: center; gap: 8px; color: #475569; font-size: 14px; margin: 4px 0; }
    .summary-row mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .mode-group { display: flex; flex-direction: column; gap: 8px; margin: 14px 0; }
    .seat-list { display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; padding: 6px 2px 10px; }
    .seat-row { display: block; }
    .warn { display: flex; gap: 8px; align-items: flex-start; background: #fff4e5; color: #b45309; padding: 10px 12px; border-radius: 8px; font-size: 13px; margin-top: 8px; }
    .warn mat-icon { font-size: 18px; width: 18px; height: 18px; flex: 0 0 auto; }
  `]
})
export class CancelOrderDialogComponent {
  seats: OrderSeatDto[];
  mode: 'all' | 'specific' = 'all';
  selected: Record<string, boolean> = {};

  constructor(
    private dialogRef: MatDialogRef<CancelOrderDialogComponent, CancelOrderDialogResult>,
    @Inject(MAT_DIALOG_DATA) public data: CancelOrderDialogData
  ) {
    // Only active (not already cancelled) seats can be cancelled.
    this.seats = (data.order.seats || []).filter(s => !s.isCancelled);
  }

  canConfirm(): boolean {
    if (this.mode === 'all') return this.seats.length > 0;
    return Object.values(this.selected).some(v => v);
  }

  confirm(): void {
    const seatIds = this.mode === 'all'
      ? []
      : this.seats.filter(s => this.selected[s.seatId]).map(s => s.seatId);
    this.dialogRef.close({ seatIds });
  }

  close(): void {
    this.dialogRef.close();
  }
}
