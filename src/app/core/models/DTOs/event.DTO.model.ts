import { DetailType, EventStatus, EventType, OrganizationType, SeatStatus, SeatType, SectionType, SponsorLevel } from "../Enums/event.enums";

export interface EventDto
{
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    type: EventType;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
    gateOpenTime: string;
    isActive: boolean;
    featured: boolean;
    organizerId: string;
    organizerName: string | null;
    maxTicketsPerOrder: number;
    allowCancellations: boolean;
    thumbnailImage: string;
    bannerImage: string;
    totalSections: number;
    totalSeats: number;
    availableSeats: number;
    sponsorCount: number;
    couponCount: number;
    hasAvailableSeats: boolean;
    isUpcoming: boolean;
    isOngoing: boolean;
    isPast: boolean;
    createdBy : string;
    updatedBy : string;
    createdAt: Date; 
    updatedAt: Date;
}


export interface EventDetailDto extends EventDto {
  // Nested DTOs
  venue: EventVenueDto;
  settings: EventSettingsDto;
  additionalDetails: EventAdditionalDetailDto[];
  sponsors: EventSponsorDto[];
  sections: EventSectionDto[];
  coupons: EventCouponDto[];

  // Summary statistics
  lowestTicketPrice: number;
  highestTicketPrice: number;
  averageTicketPrice: number;
  totalRevenue: number;
  totalTicketsSold: number;
  totalAttendees: number;
}

export interface EventSectionDto {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  description: string;
  type: SectionType;
  basePrice: number;
  totalSeats: number;

  // Layout
  rows: number;
  columns: number;
  rowLabels: string;
  disabledSeats: string;
  reservedSeats: string;

  // Availability
  availableSeats: number;
  bookedSeats: number;
  blockedSeats: number;

  // Helper properties (these would be computed in Angular component/services)
  isAvailable: boolean;
  occupancyRate: number;
  typeDisplay: string;
  rowLabelList: string[];
  disabledSeatList: string[];
  reservedSeatList: string[];

  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface EventSectionSeatDto {
  id: string;
  sectionId: string;
  sectionName: string;
  seatNumber: string;
  rowLabel: string;
  rowIndex: number;
  columnIndex: number;
  status: SeatStatus;
  seatType: SeatType;
  price: number;
  blockedUntil?: Date | string;
  blockedBy: string;
  ticketId?: string;
  orderId?: string;

  // Helper properties
  isAvailable: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isUnavailable: boolean;
  isReserved: boolean;
  statusDisplay: string;
  typeDisplay: string;
  hasTicket: boolean;
  isBlockedExpired: boolean;

  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface EventSettingsDto {
  id: string;
  eventId: string;
  ageMin: number;
  ageMax?: number;
  tags: string;
  enableWaitlist: boolean;
  waitlistCapacity: number;
  sendReminders: boolean;
  reminderDaysBefore: number;
  collectAttendeeInfo: boolean;
  requireApproval: boolean;
  allowTicketTransfers: boolean;
  allowResales: boolean;
  requiredFields: string;
  cancellationDeadline: string;

  // Helper properties (these would be computed in Angular component/services)
  tagList: string[];
  requiredFieldList: string[];
  hasAgeRestriction: boolean;
  ageRestrictionDisplay: string;

  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface EventSponsorDto {
  id: string;
  eventId: string;
  eventTitle: string;
  
  // Organization type
  type: OrganizationType;
  
  // Basic info (common for all types)
  name: string;
  logoUrl: string;
  website: string;
  displayOrder: number;
  description: string;
  
  // Contact details (for Organizer/Venue)
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  
  // Location details (for Venue/Organizer)
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  mapUrl: string;
  
  // Flags
  isPrimary: boolean;
  
  // Helper properties
  typeDisplay: string;
  typeColor: string;
  typeIcon: string;
  hasLogo: boolean;
  hasWebsite: boolean;
  hasContactInfo: boolean;
  hasLocation: boolean;
  
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EventVenueDto {
  id: string;
  eventId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  mapUrl: string;
  contactPhone: string;
  contactEmail: string;

  // Full address for display (computed property)
  fullAddress: string;
  capacity : string;

  createdAt: Date | string;
  updatedAt?: Date | string;
}


export interface EventAdditionalDetailDto {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  content: string;
  type: DetailType;
  displayOrder: number;
  isVisible: boolean;

  // Helper properties
  typeDisplay: string;
  isPolicy: boolean;
  shortContent: string;

  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface EventCouponDto {
  id: string;
  eventId: string;
  eventTitle: string;
  couponId: string;
  couponCode: string;
  couponName: string;
  description: string;
  discountAmount: number;
  discountPercentage: number;
  validFrom: Date | string;
  validUntil: Date | string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;

  // Helper properties
  isValid: boolean;
  hasPercentageDiscount: boolean;
  hasFixedDiscount: boolean;
  discountDisplay: string;
  isUnlimited: boolean;
  remainingUses: number;
  isExpired: boolean;
  isUpcoming: boolean;
  usageRate: number;

  createdAt: Date | string;
  updatedAt?: Date | string;
}


// Helper functions for the interface
export function getTypeDisplay(type: OrganizationType): string {
  switch(type) {
    case OrganizationType.Organizer: return 'Organizer';
    case OrganizationType.Sponsor: return 'Sponsor';
    case OrganizationType.Venue: return 'Venue';
    case OrganizationType.Partner: return 'Partner';
    case OrganizationType.MediaPartner: return 'Media Partner';
    case OrganizationType.CommunityPartner: return 'Community Partner';
    case OrganizationType.Host: return 'Host';
    default: return 'Other';
  }
}

export function getTypeColor(type: OrganizationType): string {
  switch(type) {
    case OrganizationType.Organizer: return 'primary';
    case OrganizationType.Venue: return 'accent';
    case OrganizationType.Sponsor: return 'warn';
    case OrganizationType.Partner: return 'success';
    case OrganizationType.MediaPartner: return 'info';
    case OrganizationType.CommunityPartner: return 'success';
    case OrganizationType.Host: return 'secondary';
    default: return 'default';
  }
}

export function getTypeIcon(type: OrganizationType): string {
  switch(type) {
    case OrganizationType.Organizer: return '🏢';
    case OrganizationType.Venue: return '🏟️';
    case OrganizationType.Sponsor: return '💰';
    case OrganizationType.Partner: return '🤝';
    case OrganizationType.MediaPartner: return '📺';
    case OrganizationType.CommunityPartner: return '👥';
    case OrganizationType.Host: return '🏨';
    default: return '🏷️';
  }
}