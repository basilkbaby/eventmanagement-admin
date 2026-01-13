// notification.service.ts
import { Injectable, TemplateRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: number;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // Auto-close duration in ms (0 = no auto-close)
  showClose?: boolean;
  data?: any; // Additional data
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([]);
  private currentId = 0;

  constructor() {}

  // Get notifications as observable
  get notifications(): Observable<Notification[]> {
    return this.notifications$.asObservable();
  }

  // Success notification
  showSuccess(message: string, title?: string, duration: number = 3000): number {
    return this.addNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration
    });
  }

  // Error notification
  showError(message: string, title?: string, duration: number = 5000): number {
    return this.addNotification({
      type: 'error',
      title: title || 'Error',
      message,
      duration
    });
  }

  // Info notification
  showInfo(message: string, title?: string, duration: number = 3000): number {
    return this.addNotification({
      type: 'info',
      title: title || 'Info',
      message,
      duration
    });
  }

  // Warning notification
  showWarning(message: string, title?: string, duration: number = 4000): number {
    return this.addNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration
    });
  }

  // Generic method
  showNotification(notification: Omit<Notification, 'id'>): number {
    return this.addNotification(notification);
  }

  // Remove notification by ID
  removeNotification(id: number): void {
    const notifications = this.notifications$.value.filter(n => n.id !== id);
    this.notifications$.next(notifications);
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications$.next([]);
  }

  // Clear by type
  clearByType(type: NotificationType): void {
    const notifications = this.notifications$.value.filter(n => n.type !== type);
    this.notifications$.next(notifications);
  }

  private addNotification(notification: Omit<Notification, 'id'>): number {
    const id = ++this.currentId;
    const newNotification: Notification = {
      id,
      showClose: true,
      ...notification
    };

    const currentNotifications = this.notifications$.value;
    this.notifications$.next([...currentNotifications, newNotification]);

    // Auto-remove if duration is set
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }
}