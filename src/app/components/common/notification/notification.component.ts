// notification.component.ts
import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  template: `
    <div class="notification-container">
      <div 
        *ngFor="let notification of notifications"
        [@slideInOut]
        class="notification"
        [ngClass]="'notification-' + notification.type"
        (mouseenter)="pauseAutoClose(notification.id)"
        (mouseleave)="resumeAutoClose(notification.id)">
        
        <div class="notification-icon">
          <span *ngIf="notification.type === 'success'">✅</span>
          <span *ngIf="notification.type === 'error'">❌</span>
          <span *ngIf="notification.type === 'warning'">⚠️</span>
          <span *ngIf="notification.type === 'info'">ℹ️</span>
        </div>
        
        <div class="notification-content">
          <div *ngIf="notification.title" class="notification-title">
            {{ notification.title }}
          </div>
          <div class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        
        <button 
          *ngIf="notification.showClose"
          class="notification-close"
          (click)="close(notification.id)">
          ✕
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    }

    .notification {
      display: flex;
      align-items: flex-start;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: fadeIn 0.3s ease;
      background: white;
      border-left: 4px solid;
      min-width: 300px;
      max-width: 350px;
    }

    .notification-success {
      border-left-color: #10b981;
      background-color: #f0fdf4;
    }

    .notification-error {
      border-left-color: #ef4444;
      background-color: #fef2f2;
    }

    .notification-warning {
      border-left-color: #f59e0b;
      background-color: #fffbeb;
    }

    .notification-info {
      border-left-color: #3b82f6;
      background-color: #eff6ff;
    }

    .notification-icon {
      margin-right: 12px;
      font-size: 20px;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .notification-message {
      font-size: 14px;
      line-height: 1.4;
      color: #374151;
    }

    .notification-close {
      background: none;
      border: none;
      color: #6b7280;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin-left: 8px;
      flex-shrink: 0;
      line-height: 1;
    }

    .notification-close:hover {
      color: #374151;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  standalone: true,
  imports: [CommonModule]
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];
  private timeouts = new Map<number, any>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  close(id: number): void {
    this.notificationService.removeNotification(id);
    this.clearTimeout(id);
  }

  pauseAutoClose(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification?.duration) {
      this.clearTimeout(id);
    }
  }

  resumeAutoClose(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification?.duration) {
      this.setTimeout(id, notification.duration);
    }
  }

  private setTimeout(id: number, duration: number): void {
    this.clearTimeout(id);
    const timeout = setTimeout(() => {
      this.close(id);
    }, duration);
    this.timeouts.set(id, timeout);
  }

  private clearTimeout(id: number): void {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }
}