// models/user.model.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  roles: string[];
  events: UserEvent[];
}

export interface UserEvent {
  eventId: string;
  eventName: string;
  eventCode?: string;
  accessLevel: AccessLevel;
  accessLevelName: string;
  grantedAt: Date;
}

export enum AccessLevel {
  Viewer = 0,
  Contributor = 1,
  Editor = 2,
  Admin = 3
}

export interface PaginatedUsers {
  items: User[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface AssignEvent {
  eventId: string;
  accessLevel: AccessLevel;
}

export interface UpdateStatusRequest {
  isActive: boolean;
}

export interface UserEventDetails {
  id: string;
  title: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface AssignEventsRequest {
  userId: string;
  eventIds: string[];
}