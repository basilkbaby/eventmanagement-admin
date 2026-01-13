import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

// Update import to use the correct model
import { EventService } from '../../../core/services/event.service';
import { EventAdditionalDetailDto, EventDetailDto, EventDto, EventVenueDto } from '../../../core/models/DTOs/event.DTO.model';
import { DetailType, EventStatus, EventType, OrganizationType, SectionType } from '../../../core/models/Enums/event.enums';
import { OrganizationFilterPipe } from '../../../core/pipes/organization-filter.pipe';
import { FormatDatePipe } from '../../../core/pipes/format-date.pipe';
import { FormatTimePipe } from '../../../core/pipes/time-format.pipe';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    RouterModule,
    OrganizationFilterPipe,
    FormatDatePipe,
    FormatTimePipe
  ],
  providers: [DatePipe],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss']
})
export class EventDetailsComponent implements OnInit {
  event: EventDetailDto | null = null;
  isLoading: boolean = true;
  currentUserRole: string = 'admin'; // This would come from auth service

  OrganizationType = OrganizationType;
  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    this.loadEvent();
  }

  loadEvent() {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.isLoading = true;
      // Use getEventDetails to get full event with all related data
      this.eventService.getEventDetails(eventId).subscribe({
        next: (event) => {
          this.event = event;
          this.isLoading = false;
          console.log(this.event)
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.snackBar.open('Failed to load event details', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

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

  getStatusText(status: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT:
        return 'Draft';
      case EventStatus.PUBLISHED:
        return 'Published';
      case EventStatus.COMPLETED:
        return 'Completed';
      case EventStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  getSectionTypeText(type: SectionType): string {
    switch (type) {
      case SectionType.VIP: return 'VIP';
      case SectionType.PREMIUM: return 'Premium';
      case SectionType.STANDARD: return 'Standard';
      case SectionType.ECONOMY: return 'Economy';
      case SectionType.STANDING: return 'Standing';
      case SectionType.STAGE: return 'Stage';
      default: return 'Unknown';
    }
  }

  getDetailTypeText(type: DetailType): string {
    switch (type) {
      case DetailType.FAQ: return 'FAQ';
      case DetailType.POLICY: return 'POLICY';
      case DetailType.GENERAL: return 'GENERAL';
      case DetailType.IMPORTANT: return 'IMPORTANT';
      default: return 'Other';
    }
  }

  toggleFeatured() {
    if (this.event) {
      const newFeaturedStatus = !this.event.featured;
      this.eventService.toggleFeatured(this.event.id).subscribe({
        next: (success) => {
          if (success && this.event) {
            this.event.featured = newFeaturedStatus;
            const message = this.event.featured ? 'Event marked as featured' : 'Event removed from featured';
            this.snackBar.open(message, 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating featured status:', error);
          this.snackBar.open('Failed to update featured status', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Format time to display without seconds
  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  }

  // Get venue address string
  getVenueAddress(venue: EventVenueDto): string {
    if (!venue) return '';
    let address = venue.address;
    if (venue.city) address += `, ${venue.city}`;
    if (venue.country) address += `, ${venue.country}`;
    if (venue.postalCode) address += ` ${venue.postalCode}`;
    return address;
  }

  // Check if event has any additional details
  hasAdditionalDetails(): boolean {
    return !!(this.event?.additionalDetails && this.event.additionalDetails.length > 0);
  }

  // Get additional details by type
  getAdditionalDetailsByType(type: DetailType): EventAdditionalDetailDto[] {
    if (!this.event?.additionalDetails) return [];
    return this.event.additionalDetails.filter(detail => detail.type === type);
  }

  // Get FAQ details
  getFaqDetails(): EventAdditionalDetailDto[] {
    return this.getAdditionalDetailsByType(DetailType.FAQ);
  }

  // Get terms details
  getTermsDetails(): EventAdditionalDetailDto[] {
    return this.getAdditionalDetailsByType(DetailType.POLICY);
  }

  // Get refund policy details
  getRefundPolicyDetails(): EventAdditionalDetailDto[] {
    return this.getAdditionalDetailsByType(DetailType.POLICY);
  }

  // Get age restriction details
  getAgeRestrictionDetails(): EventAdditionalDetailDto[] {
    return this.getAdditionalDetailsByType(DetailType.GENERAL);
  }

  // Get dress code details
  getDressCodeDetails(): EventAdditionalDetailDto[] {
    return this.getAdditionalDetailsByType(DetailType.IMPORTANT);
  }

  // Calculate occupancy percentage
  getOccupancyPercentage(): number {
    return 0;
    // if (!this.event || this.event.totalSeats === 0) return 0;
    // return Math.round((this.event.bookedSeats / this.event.totalSeats) * 100);
  }

  // Get date range display
  getDateRange(): string {
    if (!this.event) return '';
    const startDate = this.event.startDate;
    const endDate = this.event.endDate;
    
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return this.datePipe.transform(startDate, 'fullDate') || '';
    }
    
    return `${this.datePipe.transform(startDate, 'MMM d, y')} - ${this.datePipe.transform(endDate, 'MMM d, y')}`;
  }

  // Get event status flags
  getEventFlags(): string[] {
    const flags: string[] = [];
    if (this.event?.isUpcoming) flags.push('Upcoming');
    if (this.event?.isOngoing) flags.push('Ongoing');
    if (this.event?.isPast) flags.push('Past');
    if (this.event?.hasAvailableSeats) flags.push('Seats Available');
    return flags;
  }

    handleImageError(event: any) {
    // event.target.style.display = 'none';
  }

}