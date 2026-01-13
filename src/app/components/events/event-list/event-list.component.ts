import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { EventService } from '../../../core/services/event.service';
import { EventStatus, EventType } from '../../../core/models/Enums/event.enums';
import { EventDto } from '../../../core/models/DTOs/event.DTO.model';

interface StatusFilter {
  id: string;
  label: string;
  icon: string;
  iconClass: string;
  active: boolean;
  count: number;
  filterFn: (event: EventDto) => boolean;
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [DatePipe],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss']
})
export class EventListComponent implements OnInit {
  events: EventDto[] = [];
  displayedEvents: EventDto[] = [];
  isLoading: boolean = true;
  
  // Filter properties
  searchQuery: string = '';
  
  // Status filters
  statusFilters: StatusFilter[] = [
    {
      id: 'all',
      label: 'All Events',
      icon: 'event',
      iconClass: 'filter-all',
      active: true,
      count: 0,
      filterFn: () => true
    },
    {
      id: 'active',
      label: 'Active',
      icon: 'check_circle',
      iconClass: 'filter-active',
      active: false,
      count: 0,
      filterFn: (event: EventDto) => event.isActive
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: 'schedule',
      iconClass: 'filter-upcoming',
      active: false,
      count: 0,
      filterFn: (event: EventDto) => event.isUpcoming
    },
    {
      id: 'featured',
      label: 'Featured',
      icon: 'star',
      iconClass: 'filter-featured',
      active: false,
      count: 0,
      filterFn: (event: EventDto) => event.featured
    },
    {
      id: 'draft',
      label: 'Draft',
      icon: 'drafts',
      iconClass: 'filter-draft',
      active: false,
      count: 0,
      filterFn: (event: EventDto) => event.status === EventStatus.DRAFT
    }
  ];

  constructor(
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events = events;
        this.updateFilterCounts();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.snackBar.open('Failed to load events', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.events = [];
        this.displayedEvents = [];
      }
    });
  }

  updateFilterCounts() {
    this.statusFilters.forEach(filter => {
      filter.count = this.events.filter(filter.filterFn).length;
    });
  }

  applyFilters() {
    let filtered = [...this.events];

    // Apply active filters
    const activeFilters = this.statusFilters.filter(f => f.active && f.id !== 'all');
    if (activeFilters.length > 0) {
      filtered = filtered.filter(event => 
        activeFilters.some(filter => filter.filterFn(event))
      );
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        (event.description?.toLowerCase().includes(query))
      );
    }

    this.displayedEvents = filtered;
  }

  toggleFilter(filter: StatusFilter) {
    // If clicking "All", deactivate all other filters
    if (filter.id === 'all') {
      this.statusFilters.forEach(f => f.active = f.id === 'all');
    } else {
      // Deactivate "All" filter when selecting specific filters
      const allFilter = this.statusFilters.find(f => f.id === 'all');
      if (allFilter) allFilter.active = false;
      
      // Toggle the clicked filter
      filter.active = !filter.active;
      
      // If no filters are active, activate "All"
      const hasActiveFilters = this.statusFilters
        .filter(f => f.id !== 'all')
        .some(f => f.active);
      
      if (!hasActiveFilters && allFilter) {
        allFilter.active = true;
      }
    }
    
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.statusFilters.forEach(filter => {
      filter.active = filter.id === 'all';
    });
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return this.searchQuery.trim().length > 0 || 
           this.statusFilters.some(f => f.active && f.id !== 'all');
  }

  // Navigation to seat selection
  navigateToSeatSelection(event: EventDto) {
    if (this.canSelectSeats(event)) {
      this.router.navigate(['/admin/events/seatmap', event.id]); 
    } else {
      this.snackBar.open('Cannot select seats for this event', 'Close', { duration: 3000 });
    }
  }

  // Seat selection validation
  canSelectSeats(event: EventDto): boolean {
    return true;
    // return event.isActive && 
    //        event.status === EventStatus.PUBLISHED &&
    //        event.availableSeats > 0 &&
    //        !event.isPast;
  }

  isLowSeats(event: EventDto): boolean {
    return event.totalSeats > 0 && 
           (event.availableSeats / event.totalSeats) < 0.2;
  }

  // Format date for display
  getFormattedDate(date: Date): string {
    return this.datePipe.transform(date, 'MMM d, y') || '';
  }

  // Original methods
  getStatusClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'status-published';
      case EventStatus.DRAFT:
        return 'status-draft';
      case EventStatus.CANCELLED:
        return 'status-cancelled';
      case EventStatus.COMPLETED:
        return 'status-completed';
      default:
        return 'status-draft';
    }
  }

  toggleEventStatus(event: EventDto) {
    const newActiveStatus = !event.isActive;
    this.eventService.toggleActive(event.id).subscribe({
      next: (success) => {
        if (success) {
          event.isActive = newActiveStatus;
          this.updateFilterCounts();
          this.applyFilters();
          this.snackBar.open(
            `Event ${newActiveStatus ? 'activated' : 'deactivated'} successfully`, 
            'Close', 
            { duration: 3000 }
          );
        } else {
          this.snackBar.open('Failed to update event status', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error toggling event status:', error);
        this.snackBar.open('Failed to update event status', 'Close', { duration: 3000 });
      }
    });
  }

  deleteEvent(eventId: string) {
    if (confirm('Are you sure you want to delete this event?')) {
      this.eventService.deleteEvent(eventId).subscribe({
        next: (success) => {
          if (success) {
            this.events = this.events.filter(e => e.id !== eventId);
            this.updateFilterCounts();
            this.applyFilters();
            this.snackBar.open('Event deleted successfully', 'Close', { duration: 3000 });
          } else {
            this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.snackBar.open('Failed to delete event', 'Close', { duration: 3000 });
        }
      });
    }
  }

  canEditEvent(event: EventDto): boolean {
    return event.status !== EventStatus.COMPLETED;
  }

  canDeleteEvent(event: EventDto): boolean {
    return event.status === EventStatus.DRAFT;
  }

  handleImageError(event: any) {
    event.target.style.display = 'none';
  }

  toggleFeatured(event: EventDto) {
    const newFeaturedStatus = !event.featured;
    
    this.eventService.updateEvent(event.id, event).subscribe({
      next: (success) => {
        if (success) {
          event.featured = newFeaturedStatus;
          this.updateFilterCounts();
          this.applyFilters();
          const message = event.featured ? 'Event marked as featured' : 'Event removed from featured';
          this.snackBar.open(message, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to update featured status', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error updating featured status:', error);
        this.snackBar.open('Failed to update featured status', 'Close', { duration: 3000 });
      }
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }
}