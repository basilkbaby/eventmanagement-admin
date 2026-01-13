import { EventStatus, EventType } from "./Enums/event.enums";

// event.model.ts
export enum UserRole {
  ADMIN = 'Admin',
  ORGANIZER = 'Organizer',
  ATTENDEE = 'Attendee'
}



// Main Event interface based on backend structure
export interface Event {
  // Core properties
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
  isActive: boolean;
  featured: boolean;
  organizerId: string;
  organizerName: string | null;
  maxTicketsPerOrder: number;
  allowCancellations: boolean;
  thumbnailImage: string;
  bannerImage: string;
  
  // Calculated properties from backend
  totalSections: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  sponsorCount: number;
  couponCount: number;
  hasAvailableSeats: boolean;
  isUpcoming: boolean;
  isOngoing: boolean;
  isPast: boolean;
  
  // Audit properties
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  
  // Navigation properties (might not be in basic API response)
  venue?: EventVenue;
  sections?: EventSection[];
  sponsors?: EventSponsor[];
  additionalDetails?: EventAdditionalDetail[];
  settings?: EventSettings;
}

// Related entities from backend
export interface EventVenue {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface EventSettings {
  id: string;
  eventId: string;
  ageMin?: number;
  ageMax?: number;
  tags?: string;
  enableWaitlist: boolean;
  waitlistCapacity: number;
  sendReminders: boolean;
  reminderDaysBefore: number;
  collectAttendeeInfo: boolean;
  requireApproval: boolean;
  allowTicketTransfers: boolean;
  allowResales: boolean;
  requiredFields?: string;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface EventSection {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  type: SectionType;
  basePrice: number;
  rows: number;
  columns: number;
  startRow: number;
  endRow: number;
  startColumn: number;
  endColumn: number;
  color?: string;
  icon?: string;
  capacity?: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  blockedSeats: number;
  seatMap?: string;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
  
  // Navigation properties
  seats?: EventSectionSeat[];
}

export enum SectionType {
  VIP = 1,
  PREMIUM = 2,
  STANDARD = 3,
  ECONOMY = 4,
  STANDING = 5,
  STAGE = 6,
  COMPANION = 7
}

export interface EventSectionSeat {
  id: string;
  sectionId: string;
  seatNumber: string;
  row: number;
  column: number;
  rowLabel: string;
  type: SeatType;
  price: number;
  isAvailable: boolean;
  isBlocked: boolean;
  isSold: boolean;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
}

export enum SeatType {
  REGULAR = 1,
  PREMIUM = 2,
  COMPANION = 3,
  WHEELCHAIR = 4,
  AISLE = 5
}

export interface EventSponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string;
  website?: string;
  level: SponsorLevel;
  displayOrder: number;
  description?: string;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
}

export enum SponsorLevel {
  PLATINUM = 1,
  GOLD = 2,
  SILVER = 3,
  BRONZE = 4
}

export interface EventAdditionalDetail {
  id: string;
  eventId: string;
  title: string;
  content: string;
  type: DetailType;
  displayOrder: number;
  isVisible: boolean;
  isDeleted: boolean;
  createdAt: Date;
  createdBy: string;
}

export enum DetailType {
  FAQ = 1,
  TERMS = 2,
  REFUND_POLICY = 3,
  AGE_RESTRICTION = 4,
  DRESS_CODE = 5,
  OTHER = 6
}

// DTOs for API operations
export interface EventCreateDto {
  title: string;
  description: string;
  shortDescription?: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  organizerId: string;
  maxTicketsPerOrder?: number;
  allowCancellations?: boolean;
  thumbnailImage?: string;
  bannerImage?: string;
  featured?: boolean;
  
  // Optional related data
  venue?: Partial<EventVenue>;
  settings?: Partial<EventSettings>;
}

export interface EventUpdateDto {
  title?: string;
  description?: string;
  shortDescription?: string;
  type?: EventType;
  status?: EventStatus;
  startDate?: Date;
  endDate?: Date;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  featured?: boolean;
  maxTicketsPerOrder?: number;
  allowCancellations?: boolean;
  thumbnailImage?: string;
  bannerImage?: string;
  
  // Optional related data
  venue?: Partial<EventVenue>;
  settings?: Partial<EventSettings>;
}

// Response interfaces
export interface EventListResponse {
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
  bookedSeats: number;
  sponsorCount: number;
  couponCount: number;
  hasAvailableSeats: boolean;
  isUpcoming: boolean;
  isOngoing: boolean;
  isPast: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventDetailResponse extends EventListResponse {
  venue?: EventVenue;
  sections?: EventSection[];
  sponsors?: EventSponsor[];
  additionalDetails?: EventAdditionalDetail[];
  settings?: EventSettings;
}