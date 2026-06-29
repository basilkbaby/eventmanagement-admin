import { Injectable, inject, signal, computed } from '@angular/core';
import { EventService } from './event.service';
import { AuthService } from './auth.service';
import { EventDto } from '../models/DTOs/event.DTO.model';

const STORAGE_KEY = 'admin_selected_event_id';

@Injectable({ providedIn: 'root' })
export class EventContextService {
  private eventService = inject(EventService);
  private authService = inject(AuthService);

  readonly events = signal<EventDto[]>([]);
  readonly selectedEventId = signal<string>('');
  readonly isLoading = signal(false);

  readonly selectedEvent = computed(() =>
    this.events().find(e => e.id === this.selectedEventId()) ?? null
  );

  constructor() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadEvents();
      } else {
        // Clear in-memory state on logout; also wipe storage so the
        // next login starts fresh for that user's accessible events.
        this.events.set([]);
        this.selectedEventId.set('');
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  loadEvents(): void {
    this.isLoading.set(true);
    // Admins manage active + inactive events, so don't filter by isActive here.
    // (The public site hides inactive events via the separate /Event endpoints.)
    this.eventService.getEvents().subscribe({
      next: (events) => {
        const sorted = [...events].sort((a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        this.events.set(sorted);

        // Try to restore the previously selected event.
        // Only honour the stored ID if that event is still in the accessible list.
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId && sorted.some(e => e.id === storedId)) {
          this.selectedEventId.set(storedId);
        } else if (sorted.length > 0) {
          // Stored event gone or nothing stored — default to most recent.
          const firstId = sorted[0].id;
          this.selectedEventId.set(firstId);
          localStorage.setItem(STORAGE_KEY, firstId);
        }

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  setSelectedEvent(id: string): void {
    this.selectedEventId.set(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  formatEventDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
