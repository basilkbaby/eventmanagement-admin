export enum EventType {
  MUSIC = 1,
  CONFERENCE = 2,
  WORKSHOP = 3,
  SEMINAR = 4,
  NETWORKING = 5,
  SOCIAL = 6,
  OTHER = 7
}

export enum EventStatus 
{ 
    DRAFT = 1, 
    PUBLISHED= 2, 
    COMPLETED =3, 
    CANCELLED=4, 
    POSTPONED=5 
}

export enum DetailType
{
    GENERAL =1,
    POLICY= 2,
    FAQ=3,
    IMPORTANT=4,
    NOTE=5
}

export enum SponsorLevel 
{ 
    PLATINUM=1, 
    GOLD=2, 
    SILVER=3, 
    BRONZE=4, 
    PARTNER=5 
}

export enum SectionType 
{ 
    GENERAL=1, 
    VIP=2, 
    PREMIUM=3, 
    BALCONY=4, 
    STANDING=5, 
    STANDARD=6, 
    ECONOMY=7, 
    STAGE=8, 
    FOH=9 
}

export enum SeatStatus 
{ 
    AVAILABLE=1, 
    BOOKED=2, 
    BLOCKED=3, 
    UNAVAILABLE=4, 
    RESERVED=5 
}

export enum SeatType 
{ 
    REGULAR=1, 
    ACCESSIBLE=2, 
    COMPANION=3, 
    PREMIUM=4 
}

export enum OrganizationType{
    Organizer = 1,      // Event organizer
    Sponsor = 2,        // Event sponsor
    Partner = 3,        // Event partner
    Host = 4,           // Event host
    Venue = 5,          // Venue provider
    MediaPartner = 6,   // Media partner
    CommunityPartner = 7, // Community partner
    Other = 8           // Other type
}

