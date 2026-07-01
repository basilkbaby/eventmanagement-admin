import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    FormsModule,
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

  // Clone dialog state
  showCloneModal = false;
  cloneName = '';
  isCloning = false;

  OrganizationType = OrganizationType;
  private destroyRef = inject(DestroyRef);
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    // React to :id changes so switching events (which navigates to a new id while
    // reusing this component) reloads the page instead of keeping the old event.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => this.loadEvent(params.get('id')));
  }

  loadEvent(eventId: string | null = this.route.snapshot.paramMap.get('id')) {
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

  getStatusIcon(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'check_circle';
      case EventStatus.DRAFT:
        return 'edit_note';
      case EventStatus.CANCELLED:
        return 'cancel';
      case EventStatus.COMPLETED:
        return 'done_all';
      default:
        return 'help';
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

  // Show / hide the event on the public site via its active flag.
  toggleActive() {
    if (this.event) {
      const newActiveStatus = !this.event.isActive;
      this.eventService.toggleActive(this.event.id).subscribe({
        next: (response) => {
          if (response && this.event) {
            this.event.isActive = newActiveStatus;
            const message = this.event.isActive
              ? 'Event is now visible on the site'
              : 'Event is now hidden from the site';
            this.snackBar.open(message, 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error updating visibility:', error);
          this.snackBar.open('Failed to update visibility', 'Close', { duration: 3000 });
        }
      });
    }
  }

  // ── Clone event ────────────────────────────────────────────────────────────
  openCloneModal() {
    if (!this.event) return;
    this.cloneName = `Copy of ${this.event.title}`;
    this.showCloneModal = true;
  }

  cancelClone() {
    if (this.isCloning) return;
    this.showCloneModal = false;
  }

  confirmClone() {
    if (!this.event || this.isCloning) return;
    this.isCloning = true;
    this.eventService.cloneEvent(this.event.id, this.cloneName).subscribe({
      next: (newId) => {
        this.isCloning = false;
        this.showCloneModal = false;
        this.snackBar.open('Event cloned as a draft', 'Close', { duration: 3000 });
        // Open the new clone (a draft) straight in the editor
        this.router.navigate(['/admin/events', newId, 'edit']);
      },
      error: (error) => {
        console.error('Error cloning event:', error);
        this.isCloning = false;
        this.snackBar.open('Failed to clone event', 'Close', { duration: 3000 });
      }
    });
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
    // Hide broken images so the gradient hero / placeholder shows instead of a broken icon.
    if (event?.target) {
      event.target.style.display = 'none';
    }
  }

}