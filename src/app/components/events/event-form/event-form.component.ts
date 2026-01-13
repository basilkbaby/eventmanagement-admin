import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectChange } from '@angular/material/select';

// Import your models and enums
import { EventDto, EventSponsorDto, EventDetailDto , getTypeDisplay, getTypeColor, getTypeIcon } from '../../../core/models/DTOs/event.DTO.model';
import { EventType, EventStatus, OrganizationType, DetailType} from '../../../core/models/Enums/event.enums';
import { EventService } from '../../../core/services/event.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrganizationTypeDisplayPipe } from '../../../core/pipes/organization-type-display.pipe';
import { getEnumKeysAndValues } from '../../../core/utility/enum-utils';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTabsModule,
    MatRadioModule,
    MatBadgeModule,
    OrganizationTypeDisplayPipe,
    MatBadgeModule
  ],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Form groups
  basicInfoForm: FormGroup;
  organizationsForm: FormGroup; // Combined form for all organization types
  settingsForm: FormGroup;
  mediaLinksForm: FormGroup;
  additionalDetailsForm: FormGroup;

  // Enums
  OrganizationType = OrganizationType;
  EventType = EventType;
  EventStatus = EventStatus;

  // Data arrays
  tagsArray: string[] = [];
  galleryArray: string[] = [];
  keywordsArray: string[] = [];
  organizations: EventSponsorDto[] = []; // Combined array for all types
  additionalDetails: any[] = [];
  coupons: any[] = [];

  // Configuration
eventTypes = getEnumKeysAndValues(EventType);
eventStatuses = getEnumKeysAndValues(EventStatus);
organizationTypes = getEnumKeysAndValues(OrganizationType);
detailType = getEnumKeysAndValues(DetailType)
  timezones = [
    'Europe/London',
    'Europe/Paris',
    'America/New_York',
    'America/Los_Angeles',
    'Asia/Kolkata',
    'Asia/Tokyo'
  ];

  // State
  isEditMode = false;
  isSubmitting = false;
  currentStep = 0;
  totalSteps = 6; // Reduced steps
  eventId: string | null = null;
  editingOrganizationIndex: number | null = null;
  editingDetailIndex: number | null = null;

  // Filter for organizations list
  organizationFilter: OrganizationType | 'All' = 'All';

  formErrors: string[] = [];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
    this.organizationsForm = this.createOrganizationsForm();
    this.settingsForm = this.createSettingsForm();
    this.mediaLinksForm = this.createMediaLinksForm();
    this.additionalDetailsForm = this.createAdditionalDetailsForm();
  }

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    if (this.isEditMode && this.eventId) {
      this.loadEventForEditing();
    }
  }

  ngAfterViewInit() {
    if (this.stepper) {
      this.stepper.selectionChange.subscribe((event: any) => {
        this.currentStep = event.selectedIndex;
      });
    }
  }

  createBasicInfoForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      status: [EventStatus.DRAFT],
      description: ['', Validators.required],
      shortDescription: [''],
      featured: [false],
      isActive: [true],
      thumbnailImage: [''],
      bannerImage: [''],
      maxTicketsPerOrder: [10, [Validators.required, Validators.min(1)]],
      allowCancellations: [true],
      startDate: ['', Validators.required],
      endDate: [''],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      gateOpenTime : ['', Validators.required],
      timezone: ['Europe/London'],
    });
  }

  createOrganizationsForm(): FormGroup {
    return this.fb.group({
      id: [''],
      type: [OrganizationType.Sponsor, Validators.required],
      name: [''],
      logoUrl: [''],
      website: [''],
      description: [''],
      displayOrder: [0],
      
      // Contact details
      contactPerson: [''],
      contactEmail: [''],
      contactPhone: [''],
      
      // Location details
      address: [''],
      city: [''],
      state: [''],
      country: [''],
      postalCode: [''],
      mapUrl: [''],
      
      // Flags
      isPrimary: [false],
      
      // Additional fields for specific types
      capacity: [null], // For venues
      registrationNumber: [''], // For organizers
    });
  }

  createSettingsForm(): FormGroup {
    return this.fb.group({
      maxTicketsPerOrder: [10, [Validators.required, Validators.min(1)]],
      allowCancellations: [true],
      cancellationDeadline: [24],
      requireApproval: [false],
      showRemainingTickets: [true],
      ageMin: [0],
      ageMax: [null],
      enableWaitlist: [false],
      waitlistCapacity: [100],
      sendReminders: [true],
      reminderDaysBefore: [3],
      collectAttendeeInfo: [true],
      allowTicketTransfers: [true],
      allowResales: [false],
      requiredFields: ['FullName,Email'],
      dressCode: [''],
      termsAndConditions: [''],
      refundPolicy: ['']
    });
  }

  createMediaLinksForm(): FormGroup {
    return this.fb.group({
      bannerImage: [''],
      thumbnailImage: [''],
      website: [''],
      facebook: [''],
      instagram: [''],
      twitter: [''],
      seoDescription: ['']
    });
  }

  createAdditionalDetailsForm(): FormGroup {
    return this.fb.group({
      id: [''],
      title: [''],
      content: [''],
      type: ['General'],
      displayOrder: [0],
      isVisible: [true]
    });
  }

  loadEventForEditing() {
    if (this.eventId) {
      this.eventService.getEventDetails(this.eventId).subscribe({
        next: (response) => {
          this.populateForms(response);
        },
        error: (error) => {
          console.error('Error loading event:', error);
          this.showError('Failed to load event data');
          this.handleApiError(error);
        }
      });
    }
  }

  populateForms(response: EventDetailDto) {
    const eventData = response;

    // Populate basic info form
    this.basicInfoForm.patchValue({
      title: eventData.title,
      type: eventData.type,
      status: eventData.status,
      description: eventData.description,
      shortDescription: eventData.shortDescription || '',
      featured: eventData.featured || false,
      isActive: eventData.isActive,
      thumbnailImage: eventData.thumbnailImage || '',
      bannerImage: eventData.bannerImage || '',
      maxTicketsPerOrder: eventData.maxTicketsPerOrder || 10,
      allowCancellations: eventData.allowCancellations || true,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      startTime: this.formatTime(eventData.startTime),
      endTime: this.formatTime(eventData.endTime),
      gateOpenTime : this.formatTime(eventData.gateOpenTime),
      timezone: 'Europe/London',
    });


    // Populate organizations (all types combined)
    this.organizations = response.sponsors || [];

    // Populate settings form
    if (response.settings) {

      // Populate tags
      if (response.settings.tags) {
        this.tagsArray = response.settings.tags.split(',').filter((tag: string) => tag.trim() !== '');
      }

      this.settingsForm.patchValue({
        maxTicketsPerOrder: eventData.maxTicketsPerOrder || 10,
        allowCancellations: eventData.allowCancellations || true,
        cancellationDeadline: response.settings.cancellationDeadline || 24,
        requireApproval: response.settings.requireApproval || false,
        ageMin: response.settings.ageMin || 0,
        ageMax: response.settings.ageMax || null,
        enableWaitlist: response.settings.enableWaitlist || false,
        waitlistCapacity: response.settings.waitlistCapacity || 100,
        sendReminders: response.settings.sendReminders || true,
        reminderDaysBefore: response.settings.reminderDaysBefore || 3,
        collectAttendeeInfo: response.settings.collectAttendeeInfo || true,
        allowTicketTransfers: response.settings.allowTicketTransfers || true,
        allowResales: response.settings.allowResales || false,
        requiredFields: response.settings.requiredFields || 'FullName,Email',
        tags : this.tagsArray
      });
    }

    // Populate media form
    this.mediaLinksForm.patchValue({
      bannerImage: eventData.bannerImage || '',
      thumbnailImage: eventData.thumbnailImage || '',
    });

    // Populate other arrays
    this.additionalDetails = response.additionalDetails || [];
    this.coupons = response.coupons || [];
  }

  // Helper methods
  formatTime(time: string): string {
    if (!time) return '';
    return time.split(':').slice(0, 2).join(':');
  }

  // Organization Management Methods
  editOrganization(index: number): void {
    const organization = this.organizations[index];
    this.organizationsForm.patchValue({
      id: organization.id,
      type: organization.type,
      name: organization.name,
      logoUrl: organization.logoUrl || '',
      website: organization.website || '',
      description: organization.description || '',
      displayOrder: organization.displayOrder || 0,
      contactPerson: organization.contactPerson || '',
      contactEmail: organization.contactEmail || '',
      contactPhone: organization.contactPhone || '',
      address: organization.address || '',
      city: organization.city || '',
      state: organization.state || '',
      country: organization.country || '',
      postalCode: organization.postalCode || '',
      mapUrl: organization.mapUrl || '',
      isPrimary: organization.isPrimary || false
    });
    this.editingOrganizationIndex = index;
  }

  saveOrganization(): void {
    if (this.organizationsForm.invalid) {
      this.organizationsForm.markAllAsTouched();
      return;
    }

    this.clearErrors();
    const formData = this.organizationsForm.value;
    const type: OrganizationType = formData.type;

    // Create organization data based on type
    const organizationData: any = {
      type: type,
      name: formData.name,
      logoUrl: formData.logoUrl || '',
      website: formData.website || '',
      description: formData.description || '',
      displayOrder: formData.displayOrder || 0,
      isPrimary: formData.isPrimary || false
    };

    // Add contact info for Organizer and Venue types
    if (type === OrganizationType.Organizer || type === OrganizationType.Venue) {
      organizationData.contactPerson = formData.contactPerson || '';
      organizationData.contactEmail = formData.contactEmail || '';
      organizationData.contactPhone = formData.contactPhone || '';
      organizationData.address = formData.address || '';
      organizationData.city = formData.city || '';
      organizationData.state = formData.state || '';
      organizationData.country = formData.country || '';
      organizationData.postalCode = formData.postalCode || '';
    }

    // Add mapUrl specifically for Venue
    if (type === OrganizationType.Venue) {
      organizationData.mapUrl = formData.mapUrl || '';
      organizationData.capacity = formData.capacity || null;
    }

    // Add registration number for Organizer
    if (type === OrganizationType.Organizer) {
      organizationData.registrationNumber = formData.registrationNumber || '';
    }

    if (this.editingOrganizationIndex !== null) {
      this.updateOrganization(this.editingOrganizationIndex, organizationData);
    } else {
      this.createOrganization(organizationData);
    }
  }

  private createOrganization(organizationData: any): void {
    if (this.isEditMode && this.eventId) {
      this.eventService.addEventOrganization(this.eventId, organizationData).subscribe({
        next: (newOrganization) => {
          this.organizations.push(newOrganization);
          this.showSuccess(`${organizationData.type} created successfully`);
          this.resetOrganizationForm();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      const newOrganization: EventSponsorDto = {
        ...organizationData,
        id: '',
        eventId: this.eventId || '',
        eventTitle: '',
        typeDisplay: getTypeDisplay(organizationData.type),
        typeColor: getTypeColor(organizationData.type),
        typeIcon: getTypeIcon(organizationData.type),
        hasLogo: !!organizationData.logoUrl,
        hasWebsite: !!organizationData.website,
        hasContactInfo: !!(organizationData.contactEmail || organizationData.contactPhone),
        hasLocation: !!(organizationData.address || organizationData.city || organizationData.country)
      };
      this.organizations.push(newOrganization);
      this.showSuccess(`${organizationData.type} added locally`);
      this.resetOrganizationForm();
    }
  }

  private updateOrganization(index: number, organizationData: any): void {
    const organizationId = this.organizations[index].id;
    if (organizationId && this.eventId) {
      this.eventService.updateEventOrganization(this.eventId, organizationId, organizationData).subscribe({
        next: (updatedOrganization) => {
          this.organizations[index] = {
            ...this.organizations[index],
            ...updatedOrganization,
            typeDisplay: getTypeDisplay(updatedOrganization.type),
            typeColor: getTypeColor(updatedOrganization.type),
            typeIcon: getTypeIcon(updatedOrganization.type)
          };
          this.showSuccess(`${organizationData.type} updated successfully`);
          this.resetOrganizationForm();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.organizations[index] = {
        ...this.organizations[index],
        ...organizationData,
        typeDisplay: getTypeDisplay(organizationData.type),
        typeColor: getTypeColor(organizationData.type),
        typeIcon: getTypeIcon(organizationData.type)
      };
      this.showSuccess(`${organizationData.type} updated locally`);
      this.resetOrganizationForm();
    }
  }

  deleteOrganization(index: number): void {
    const organization = this.organizations[index];
    if (organization.id && this.eventId) {
      this.eventService.deleteEventOrganization(this.eventId, organization.id).subscribe({
        next: () => {
          this.organizations.splice(index, 1);
          this.showSuccess(`${organization.type} deleted successfully`);
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.organizations.splice(index, 1);
      this.showSuccess(`${organization.type} removed locally`);
    }
  }

  resetOrganizationForm(): void {
    this.organizationsForm.reset({
      id: '',
      type: OrganizationType.Sponsor,
      name: '',
      logoUrl: '',
      website: '',
      description: '',
      displayOrder: 0,
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      mapUrl: '',
      isPrimary: false,
      capacity: null,
      registrationNumber: ''
    });
    this.editingOrganizationIndex = null;
  }

  // Filter organizations by type
  getFilteredOrganizations(): EventSponsorDto[] {
    if (this.organizationFilter === 'All') {
      return this.organizations.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    return this.organizations
      .filter(org => org.type === this.organizationFilter)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  // Get count by type
  getOrganizationCount(type: OrganizationType | 'All'): number {
    if (type === 'All') return this.organizations.length;
    return this.organizations.filter(org => org.type === type).length;
  }

  // Check if form should show location fields
  showLocationFields(): boolean {
    const type = this.organizationsForm.get('type')?.value;
    return type === OrganizationType.Venue || type === OrganizationType.Organizer;
  }

  // Check if form should show contact fields
  showContactFields(): boolean {
    const type = this.organizationsForm.get('type')?.value;
    return type === OrganizationType.Venue || type === OrganizationType.Organizer;
  }

  // Additional Details Management (keep existing)
  editAdditionalDetail(index: number): void {
    const detail = this.additionalDetails[index];
    this.additionalDetailsForm.patchValue({
      id: detail.id,
      title: detail.title,
      content: detail.content,
      type: detail.type || 'General',
      displayOrder: detail.displayOrder,
      isVisible: detail.isVisible
    });
    this.editingDetailIndex = index;
  }

  saveAdditionalDetail(): void {
    if (this.additionalDetailsForm.invalid) {
      this.additionalDetailsForm.markAllAsTouched();
      return;
    }

    this.clearErrors();
    const formData = this.additionalDetailsForm.value;
    const detailData: any = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      displayOrder: formData.displayOrder,
      isVisible: formData.isVisible
    };

    if (this.editingDetailIndex !== null) {
      this.updateAdditionalDetail(this.editingDetailIndex, detailData);
    } else {
      this.createAdditionalDetail(detailData);
    }
  }

  private createAdditionalDetail(detailData: any): void {
    if (this.isEditMode && this.eventId) {
      this.eventService.addAdditionalDetail(this.eventId, detailData).subscribe({
        next: (newDetail) => {
          this.additionalDetails.push(newDetail);
          this.showSuccess('Detail created successfully');
          this.resetAdditionalDetailForm();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      const newDetail = {
        ...detailData,
        id: '',
        eventId: this.eventId || ''
      };
      this.additionalDetails.push(newDetail);
      this.showSuccess('Detail added locally');
      this.resetAdditionalDetailForm();
    }
  }

  private updateAdditionalDetail(index: number, detailData: any): void {
    const detailId = this.additionalDetails[index].id;
    if (detailId && this.eventId) {
      this.eventService.updateAdditionalDetail(this.eventId, detailId, detailData).subscribe({
        next: (updatedDetail) => {
          this.additionalDetails[index] = updatedDetail;
          this.showSuccess('Detail updated successfully');
          this.resetAdditionalDetailForm();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.additionalDetails[index] = { ...this.additionalDetails[index], ...detailData };
      this.showSuccess('Detail updated locally');
      this.resetAdditionalDetailForm();
    }
  }

  deleteAdditionalDetail(index: number): void {
    const detail = this.additionalDetails[index];
    if (detail.id && this.eventId) {
      this.eventService.deleteAdditionalDetail(this.eventId, detail.id).subscribe({
        next: () => {
          this.additionalDetails.splice(index, 1);
          this.showSuccess('Detail deleted successfully');
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.additionalDetails.splice(index, 1);
      this.showSuccess('Detail removed locally');
    }
  }

  resetAdditionalDetailForm(): void {
    this.additionalDetailsForm.reset({
      id: '',
      title: '',
      content: '',
      type: 'General',
      displayOrder: 0,
      isVisible: true
    });
    this.editingDetailIndex = null;
  }

  // Step Navigation Methods
  getStepTitle(step: number): string {
    const titles = [
      'Basic Information',
      'Organizations', // Combined step
      'Settings',
      'Media & Links',
      'Additional Details',
      'Review & Submit'
    ];
    return titles[step] || 'Unknown Step';
  }

  // Save Step 1: Basic Info
  saveBasicInfo(): void {
    if (this.basicInfoForm.invalid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }

    this.clearErrors();
    const formData = this.basicInfoForm.value;
    const eventDto: any = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.shortDescription,
      type: formData.type,
      status: formData.status,
      isActive: formData.isActive,
      featured: formData.featured,
      thumbnailImage: formData.thumbnailImage,
      bannerImage: formData.bannerImage,
      maxTicketsPerOrder: formData.maxTicketsPerOrder,
      allowCancellations: formData.allowCancellations,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : new Date(formData.startDate),
      startTime: this.convertToTimeSpan(formData.startTime),
      endTime: this.convertToTimeSpan(formData.endTime),
      gateOpenTime: this.convertToTimeSpan(formData.gateOpenTime)
    };

    if (this.isEditMode) {
      this.eventService.updateEvent(this.eventId!, eventDto).subscribe({
        next: () => {
          this.showSuccess('Basic information saved successfully');
          this.stepper.next();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.eventService.createEvent(eventDto).subscribe({
        next: (eventId) => {
          this.eventId = eventId;
          this.isEditMode = true;
          this.showSuccess('Event created successfully');
          this.stepper.next();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    }
  }

  // Save Organizations
  saveOrganizations(): void {
    if (this.isEditMode && this.eventId) {
      // Save all organizations to API
      const organizationPromises = this.organizations.map(org => {
        if (org.id) {
          return this.eventService.updateEventOrganization(this.eventId!, org.id, org).toPromise();
        } else {
          return this.eventService.addEventOrganization(this.eventId!, org).toPromise();
        }
      });

      Promise.all(organizationPromises).then(() => {
        this.showSuccess('Organizations saved successfully');
        this.stepper.next();
      }).catch(error => {
        this.handleApiError(error);
      });
    } else {
      // For new events, just proceed
      this.showSuccess('Organizations saved locally');
      this.stepper.next();
    }
  }

  // Save Step 3: Settings
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.clearErrors();
    const formData = this.settingsForm.value;
    const settingsDto: any = {
      ageMin: formData.ageMin || 0,
      ageMax: formData.ageMax || null,
      tags: this.tagsArray.join(','),
      enableWaitlist: formData.enableWaitlist,
      waitlistCapacity: formData.waitlistCapacity,
      sendReminders: formData.sendReminders,
      reminderDaysBefore: formData.reminderDaysBefore,
      collectAttendeeInfo: formData.collectAttendeeInfo,
      requireApproval: formData.requireApproval,
      allowTicketTransfers: formData.allowTicketTransfers,
      allowResales: formData.allowResales,
      requiredFields: formData.requiredFields,
      cancellationDeadline: formData.cancellationDeadline,
      showRemainingTickets: formData.showRemainingTickets
    };

    this.eventService.updateEventSettings(this.eventId!, settingsDto).subscribe({
      next: () => {
        this.showSuccess('Settings saved successfully');
        this.stepper.next();
      },
      error: (error) => {
        this.handleApiError(error);
      }
    });
  }

  // Save Step 6: Final Submit
  submitEvent(): void {
    this.isSubmitting = true;

    if (this.basicInfoForm.get('status')?.value === EventStatus.DRAFT) {
      this.eventService.publishEvent(this.eventId!).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showSuccess('Event published successfully!');
          this.router.navigate(['/admin/events', this.eventId]);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.handleApiError(error);
        }
      });
    } else {
      this.isSubmitting = false;
      this.showSuccess('Event updated successfully!');
      this.router.navigate(['/admin/events', this.eventId]);
    }
  }

  // Helper Methods
  private convertToTimeSpan(timeString: string): string {
    if (!timeString) return '00:00:00';
    return `${timeString}:00`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private handleApiError(error: any): void {
    console.error('API Error:', error);
    
    if (error.status === 400 && error.error?.errors) {
      const errors = error.error.errors;
      this.formErrors = [];
      
      Object.keys(errors).forEach(field => {
        errors[field].forEach((errorMsg: string) => {
          this.formErrors.push(`${field}: ${errorMsg}`);
        });
      });
      
      if (this.formErrors.length > 0) {
        this.showError(this.formErrors[0]);
      }
    } else {
      this.formErrors = [error.error?.message || 'An error occurred. Please try again.'];
      this.showError(this.formErrors[0]);
    }
  }

  private clearErrors(): void {
    this.formErrors = [];
  }

  getVenues(): EventSponsorDto[] {
  return this.organizations.filter(o => o.type === OrganizationType.Venue);
}

getOrganizers(): EventSponsorDto[] {
  return this.organizations.filter(o => o.type === OrganizationType.Organizer);
}

getSponsors(): EventSponsorDto[] {
  return this.organizations.filter(o => o.type === OrganizationType.Sponsor);
}

getPartners(): EventSponsorDto[] {
  return this.organizations.filter(o => o.type === OrganizationType.Partner);
}

// Add these methods to your component class

// Gallery Image Management
addGalleryImage(event: any): void {
  const value = (event.value || '').trim();
  if (value && !this.galleryArray.includes(value)) {
    this.galleryArray.push(value);
  }
  if (event.chipInput) {
    event.chipInput.clear();
  }
}

removeGalleryImage(index: number): void {
  this.galleryArray.splice(index, 1);
}

// Keyword Management
addKeyword(event: any): void {
  const value = (event.value || '').trim();
  if (value && !this.keywordsArray.includes(value)) {
    this.keywordsArray.push(value);
  }
  if (event.chipInput) {
    event.chipInput.clear();
  }
}

removeKeyword(index: number): void {
  this.keywordsArray.splice(index, 1);
}

// Tag Management (if not already there)
addTag(event: any): void {
  const value = (event.value || '').trim();
  if (value && !this.tagsArray.includes(value)) {
    this.tagsArray.push(value);
  }
  if (event.chipInput) {
    event.chipInput.clear();
  }
}

removeTag(tag: string): void {
  const index = this.tagsArray.indexOf(tag);
  if (index >= 0) {
    this.tagsArray.splice(index, 1);
  }
}

}