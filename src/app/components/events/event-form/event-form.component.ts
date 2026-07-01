import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
import { EventService, EventGroup } from '../../../core/services/event.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { OrganizationTypeDisplayPipe } from '../../../core/pipes/organization-type-display.pipe';
import { getEnumKeysAndValues } from '../../../core/utility/enum-utils';
import { ImageUploadComponent } from '../../common/image-upload/image-upload.component';
import { AuthService } from '../../../core/services/auth.service';

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
    MatBadgeModule,
    MatDialogModule,
    ImageUploadComponent
  ],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.scss']
})
export class EventFormComponent implements OnInit, AfterViewInit {
  @ViewChild('stepper') stepper!: MatStepper;
  @ViewChild('orgDialogTpl') orgDialogTpl!: TemplateRef<any>;
  private orgDialogRef?: MatDialogRef<any>;
  @ViewChild('detailDialogTpl') detailDialogTpl!: TemplateRef<any>;
  private detailDialogRef?: MatDialogRef<any>;

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

  // Grouping (artist/tour). groupSelection: '' = none, '__new__' = create new, else an existing groupId.
  eventGroups: EventGroup[] = [];
  groupSelection: string = '';
  newGroupName: string = '';
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
  saving = false; // true while a step's save/continue request is in flight
  currentStep = 0;
  totalSteps = 4; // Basic, Organizations, Media & Links, Additional Details
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
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
    this.organizationsForm = this.createOrganizationsForm();
    this.settingsForm = this.createSettingsForm();
    this.mediaLinksForm = this.createMediaLinksForm();
    this.additionalDetailsForm = this.createAdditionalDetailsForm();
  }

  /** Direct-to-blob image upload is limited to SuperAdmins. */
  get isSuperAdmin(): boolean {
    return this.authService.hasRole('SuperAdmin');
  }

  /** Blob folder for event images — scoped under the event's id so each event's
   *  images live together (e.g. events/{id}/banners). Falls back to "new" before save. */
  imageFolder(kind: string): string {
    return `events/${this.eventId || 'new'}/${kind}`;
  }

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    // Load existing groups for the group picker.
    this.eventService.getGroups().subscribe({
      next: (groups) => this.eventGroups = groups || [],
      error: () => this.eventGroups = []
    });

    // Keep the organization form's required fields in sync with the selected type.
    this.applyOrgTypeValidators();
    this.organizationsForm.get('type')?.valueChanges.subscribe(() => this.applyOrgTypeValidators());

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

  // ── Review hero helpers (mirror the event-details hero) ──────────────────
  getStatusClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED: return 'status-published';
      case EventStatus.DRAFT: return 'status-draft';
      case EventStatus.CANCELLED: return 'status-cancelled';
      case EventStatus.COMPLETED: return 'status-completed';
      default: return 'status-draft';
    }
  }

  getStatusIcon(status: EventStatus): string {
    switch (status) {
      case EventStatus.PUBLISHED: return 'check_circle';
      case EventStatus.DRAFT: return 'edit_note';
      case EventStatus.CANCELLED: return 'cancel';
      case EventStatus.COMPLETED: return 'done_all';
      default: return 'help';
    }
  }

  getStatusText(status: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT: return 'Draft';
      case EventStatus.PUBLISHED: return 'Published';
      case EventStatus.COMPLETED: return 'Completed';
      case EventStatus.CANCELLED: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  handleImageError(event: any): void {
    // Hide broken images so the gradient fallback shows instead of a broken icon.
    if (event?.target) {
      event.target.style.display = 'none';
    }
  }

  createBasicInfoForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      type: ['', Validators.required],
      // Status, featured and cancellations are no longer editable in the UI —
      // events are always Published, Featured and allow cancellations.
      status: [EventStatus.PUBLISHED],
      description: ['', Validators.required],
      shortDescription: [''],
      featured: [true],
      isActive: [true],
      thumbnailImage: [''],
      bannerImage: [''],
      maxTicketsPerOrder: [10, [Validators.required, Validators.min(1)]],
      startingFromPrice: [''],
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
    // Settings are no longer edited in the UI — keep them all enabled in the background.
    return this.fb.group({
      maxTicketsPerOrder: [10, [Validators.required, Validators.min(1)]],
      allowCancellations: [true],
      cancellationDeadline: [24],
      requireApproval: [true],
      showRemainingTickets: [true],
      ageMin: [0],
      ageMax: [null],
      enableWaitlist: [true],
      waitlistCapacity: [100],
      sendReminders: [true],
      reminderDaysBefore: [3],
      collectAttendeeInfo: [true],
      allowTicketTransfers: [true],
      allowResales: [true],
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
      // Always Published / Featured / cancellations-allowed (no longer UI-editable).
      status: EventStatus.PUBLISHED,
      description: eventData.description,
      shortDescription: eventData.shortDescription || '',
      featured: true,
      isActive: eventData.isActive,
      thumbnailImage: eventData.thumbnailImage || '',
      bannerImage: eventData.bannerImage || '',
      maxTicketsPerOrder: eventData.maxTicketsPerOrder || 10,
      startingFromPrice: eventData.startingFromPrice || '',
      allowCancellations: true,
      startDate: this.toDateInput(eventData.startDate),
      endDate: this.toDateInput(eventData.endDate),
      startTime: this.formatTime(eventData.startTime),
      endTime: this.formatTime(eventData.endTime),
      gateOpenTime : this.formatTime(eventData.gateOpenTime),
      timezone: 'Europe/London',
    });


    // Preselect the event's group (if any) in the picker.
    this.groupSelection = (eventData as any).groupId || '';
    this.newGroupName = '';

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

  // Format a date value to 'yyyy-MM-dd' for native <input type="date">.
  toDateInput(value: string | Date | null | undefined): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // True when a control is invalid and the user has interacted with it.
  // Used to toggle the red border / error text on custom form controls.
  fieldInvalid(form: FormGroup, name: string): boolean {
    const c = form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  // Organization Management Methods
  // Takes the org object (not a list index) — the list is sorted/filtered, so an
  // index from the displayed list would point at the wrong org in this.organizations.
  editOrganization(organization: any): void {
    const index = this.organizations.indexOf(organization);
    this.organizationsForm.reset(); // clear any stale type-specific values first
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
      // These were previously dropped on edit, losing the values.
      capacity: organization.capacity ?? null,
      registrationNumber: organization.registrationNumber || '',
      isPrimary: organization.isPrimary || false
    });
    this.editingOrganizationIndex = index;
    this.openOrgDialog();
  }

  // Open the Add form in a dialog (fresh form).
  openAddOrganization(type?: OrganizationType): void {
    this.resetOrganizationForm();
    if (type != null) {
      this.organizationsForm.patchValue({ type });
    }
    this.openOrgDialog();
  }

  private openOrgDialog(): void {
    this.orgDialogRef = this.dialog.open(this.orgDialogTpl, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'org-dialog-panel'
    });
    // Reset edit state if the dialog is dismissed (backdrop / ESC) without saving.
    this.orgDialogRef.afterClosed().subscribe(() => {
      this.editingOrganizationIndex = null;
    });
  }

  cancelOrgDialog(): void {
    this.orgDialogRef?.close();
    this.resetOrganizationForm();
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
      // Send null (not '') for empty email — the API's [EmailAddress] rejects an empty string.
      organizationData.contactEmail = formData.contactEmail?.trim() || null;
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
      this.eventService.addEventOrganization(this.eventId, this.sanitizeOrg(organizationData)).subscribe({
        next: (newOrganization) => {
          this.organizations.push(newOrganization);
          this.showSuccess(`${getTypeDisplay(organizationData.type)} created successfully`);
          this.resetOrganizationForm();
          this.orgDialogRef?.close();
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
      this.showSuccess(`${getTypeDisplay(organizationData.type)} added`);
      this.resetOrganizationForm();
      this.orgDialogRef?.close();
    }
  }

  private updateOrganization(index: number, organizationData: any): void {
    const organizationId = this.organizations[index].id;
    if (organizationId && this.eventId) {
      this.eventService.updateEventOrganization(this.eventId, organizationId, this.sanitizeOrg(organizationData)).subscribe({
        next: (updatedOrganization) => {
          this.organizations[index] = {
            ...this.organizations[index],
            ...updatedOrganization,
            typeDisplay: getTypeDisplay(updatedOrganization.type),
            typeColor: getTypeColor(updatedOrganization.type),
            typeIcon: getTypeIcon(updatedOrganization.type)
          };
          this.showSuccess(`${getTypeDisplay(organizationData.type)} updated successfully`);
          this.resetOrganizationForm();
          this.orgDialogRef?.close();
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
      this.showSuccess(`${getTypeDisplay(organizationData.type)} updated`);
      this.resetOrganizationForm();
      this.orgDialogRef?.close();
    }
  }

  deleteOrganization(organization: any): void {
    const index = this.organizations.indexOf(organization);
    if (index < 0) return;
    if (organization.id && this.eventId) {
      this.eventService.deleteEventOrganization(this.eventId, organization.id).subscribe({
        next: () => {
          this.organizations.splice(index, 1);
          this.showSuccess(`${getTypeDisplay(organization.type)} deleted successfully`);
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.organizations.splice(index, 1);
      this.showSuccess(`${getTypeDisplay(organization.type)} removed`);
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

  // Display name for an organization type (the enum is numeric, so never show the raw value).
  getOrgTypeName(type: OrganizationType | 'All' | null | undefined): string {
    if (type === 'All' || type == null) return 'Organization';
    return getTypeDisplay(type);
  }

  // Filter organizations by type. Returns a sorted COPY so we never mutate the source array.
  getFilteredOrganizations(): EventSponsorDto[] {
    const list = this.organizationFilter === 'All'
      ? [...this.organizations]
      : this.organizations.filter(org => org.type === this.organizationFilter);
    return list.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  // Get count by type
  getOrganizationCount(type: OrganizationType | 'All'): number {
    if (type === 'All') return this.organizations.length;
    return this.organizations.filter(org => org.type === type).length;
  }

  // Check if form should show location fields
  // Type helpers (coerce to number — the select value can arrive as a string).
  isVenue(): boolean {
    return Number(this.organizationsForm.get('type')?.value) === OrganizationType.Venue;
  }
  isOrganizer(): boolean {
    return Number(this.organizationsForm.get('type')?.value) === OrganizationType.Organizer;
  }

  // Location details apply to a Venue. Contact details apply to a Venue or an Organizer.
  showLocationFields(): boolean {
    return this.isVenue();
  }
  showContactFields(): boolean {
    return this.isVenue() || this.isOrganizer();
  }

  // Apply validators that depend on the selected organization type. Called whenever
  // the type changes (and on reset/edit), so the form's required fields match the type.
  applyOrgTypeValidators(): void {
    const f = this.organizationsForm;
    const setV = (ctrl: string, validators: any[]) => {
      const c = f.get(ctrl);
      c?.setValidators(validators);
      c?.updateValueAndValidity({ emitEvent: false });
    };

    setV('name', [Validators.required]);                                   // always required
    setV('city', this.isVenue() ? [Validators.required] : []);            // a venue needs a location
    // Only an organizer must supply a contact email. A venue's contact details are fully optional.
    setV('contactEmail', this.isOrganizer() ? [Validators.required, Validators.email] : []);
  }

  // Additional Details Management (keep existing)
  editAdditionalDetail(index: number): void {
    const detail = this.additionalDetails[index];
    this.additionalDetailsForm.reset();
    this.additionalDetailsForm.patchValue({
      id: detail.id,
      title: detail.title,
      content: detail.content,
      type: detail.type || 'General',
      displayOrder: detail.displayOrder,
      isVisible: detail.isVisible
    });
    this.editingDetailIndex = index;
    this.openDetailDialog();
  }

  openAddDetail(): void {
    this.resetAdditionalDetailForm();
    this.openDetailDialog();
  }

  private openDetailDialog(): void {
    this.detailDialogRef = this.dialog.open(this.detailDialogTpl, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'org-dialog-panel'
    });
    this.detailDialogRef.afterClosed().subscribe(() => {
      this.editingDetailIndex = null;
    });
  }

  cancelDetailDialog(): void {
    this.detailDialogRef?.close();
    this.resetAdditionalDetailForm();
  }

  // Final step: finish editing and return to the event details (no separate review step).
  finishEvent(): void {
    this.saving = true;
    this.showSuccess('Event saved successfully');
    if (this.isEditMode && this.eventId) {
      this.router.navigate(['/admin/events', this.eventId]);
    } else {
      this.router.navigate(['/admin/events']);
    }
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
          this.detailDialogRef?.close();
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
      this.showSuccess('Detail added');
      this.resetAdditionalDetailForm();
      this.detailDialogRef?.close();
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
          this.detailDialogRef?.close();
        },
        error: (error) => {
          this.handleApiError(error);
        }
      });
    } else {
      this.additionalDetails[index] = { ...this.additionalDetails[index], ...detailData };
      this.showSuccess('Detail updated');
      this.resetAdditionalDetailForm();
      this.detailDialogRef?.close();
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
      'Media & Links',
      'Additional Details'
    ];
    return titles[step] || 'Unknown Step';
  }

  // Back button: return to the event's details in edit mode, otherwise the events list.
  goBack(): void {
    if (this.isEditMode && this.eventId) {
      this.router.navigate(['/admin/events', this.eventId]);
    } else {
      this.router.navigate(['/admin/events']);
    }
  }

  // Builds the event payload from the basic-info form. Images live here too
  // (their inputs are rendered in the Media & Links step but bound to basicInfoForm).
  private buildEventDto(): any {
    const formData = this.basicInfoForm.value;
    const group = this.resolveGroup();
    return {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.shortDescription,
      type: formData.type,
      // Always Published / Featured / cancellations-allowed (no longer UI-editable).
      status: EventStatus.PUBLISHED,
      isActive: formData.isActive,
      featured: true,
      // Send null (not '') for empty URLs: the API's [Url] validation rejects empty strings with a 400.
      thumbnailImage: formData.thumbnailImage?.trim() || null,
      bannerImage: formData.bannerImage?.trim() || null,
      maxTicketsPerOrder: formData.maxTicketsPerOrder,
      allowCancellations: true,
      groupId: group.groupId,
      groupName: group.groupName,
      startingFromPrice: formData.startingFromPrice?.trim() || null,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : new Date(formData.startDate),
      startTime: this.convertToTimeSpan(formData.startTime),
      endTime: this.convertToTimeSpan(formData.endTime),
      gateOpenTime: this.convertToTimeSpan(formData.gateOpenTime)
    };
  }

  // Resolve the chosen group into { groupId, groupName }.
  private resolveGroup(): { groupId: string | null; groupName: string | null } {
    if (this.groupSelection === '__new__') {
      const name = (this.newGroupName || '').trim();
      if (!name) return { groupId: null, groupName: null };
      // A brand-new group gets a fresh id.
      const id = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : this.fallbackUuid();
      return { groupId: id, groupName: name };
    }
    if (this.groupSelection) {
      const existing = this.eventGroups.find(g => g.groupId === this.groupSelection);
      return { groupId: this.groupSelection, groupName: existing?.groupName || null };
    }
    return { groupId: null, groupName: null };
  }

  private fallbackUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Builds the settings payload. Settings are no longer edited in the UI — they're
  // kept enabled by default in the background — but Tags (which IS used) ride along here.
  private buildSettingsDto(): any {
    const formData = this.settingsForm.value;
    return {
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
  }

  // Media & Links step: persists the images (on the event) and the tags/settings,
  // then advances. Replaces the old separate Settings step.
  saveMediaStep(): void {
    if (!this.isEditMode || !this.eventId) {
      this.stepper.next();
      return;
    }

    this.clearErrors();
    this.saving = true;
    this.eventService.updateEvent(this.eventId, this.buildEventDto()).subscribe({
      next: () => {
        this.eventService.updateEventSettings(this.eventId!, this.buildSettingsDto()).subscribe({
          next: () => {
            this.saving = false;
            this.showSuccess('Media & tags saved successfully');
            this.stepper.next();
          },
          error: (error) => { this.saving = false; this.handleApiError(error); }
        });
      },
      error: (error) => { this.saving = false; this.handleApiError(error); }
    });
  }

  // Save Step 1: Basic Info
  saveBasicInfo(): void {
    if (this.basicInfoForm.invalid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }

    this.clearErrors();
    const eventDto = this.buildEventDto();
    this.saving = true;

    if (this.isEditMode) {
      this.eventService.updateEvent(this.eventId!, eventDto).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Basic information saved successfully');
          this.stepper.next();
        },
        error: (error) => {
          this.saving = false;
          this.handleApiError(error);
        }
      });
    } else {
      this.eventService.createEvent(eventDto).subscribe({
        next: (eventId) => {
          this.saving = false;
          this.eventId = eventId;
          this.isEditMode = true;
          this.showSuccess('Event created successfully');
          this.stepper.next();
        },
        error: (error) => {
          this.saving = false;
          this.handleApiError(error);
        }
      });
    }
  }

  // Normalise an org before sending: empty email/URL fields must be null, since the API's
  // [EmailAddress] and [Url] validators reject an empty string ('').
  private sanitizeOrg(org: any): any {
    const blankToNull = (v: any) => (typeof v === 'string' && v.trim() === '') ? null : v;
    return {
      ...org,
      contactEmail: blankToNull(org.contactEmail),
      website: blankToNull(org.website),
      logoUrl: blankToNull(org.logoUrl),
      mapUrl: blankToNull(org.mapUrl)
    };
  }

  // Save Organizations
  saveOrganizations(): void {
    if (this.isEditMode && this.eventId) {
      this.saving = true;
      // Save all organizations to API
      const organizationPromises = this.organizations.map(org => {
        const payload = this.sanitizeOrg(org);
        if (org.id) {
          return this.eventService.updateEventOrganization(this.eventId!, org.id, payload).toPromise();
        } else {
          return this.eventService.addEventOrganization(this.eventId!, payload).toPromise();
        }
      });

      Promise.all(organizationPromises).then(() => {
        this.saving = false;
        this.showSuccess('Organizations saved successfully');
        this.stepper.next();
      }).catch(error => {
        this.saving = false;
        this.handleApiError(error);
      });
    } else {
      // For new events, just proceed
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

addGalleryImageInput(input: HTMLInputElement): void {
  const value = (input.value || '').trim();
  if (value && !this.galleryArray.includes(value)) {
    this.galleryArray.push(value);
  }
  input.value = '';
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

addKeywordInput(input: HTMLInputElement): void {
  const value = (input.value || '').trim();
  if (value && !this.keywordsArray.includes(value)) {
    this.keywordsArray.push(value);
  }
  input.value = '';
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

// Add a tag from a native text input (custom tags control).
addTagInput(input: HTMLInputElement): void {
  const value = (input.value || '').trim();
  if (value && !this.tagsArray.includes(value)) {
    this.tagsArray.push(value);
  }
  input.value = '';
}

}