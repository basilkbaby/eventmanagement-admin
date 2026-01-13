// services/user.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  User, PaginatedUsers, 
  AssignEvent, UpdateStatusRequest, 
  UserEvent, UserEventDetails, AccessLevel 
} from '../models/user.interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private apiUrl = environment.apiUrl + '/AdminUsers';
  private http = inject(HttpClient);

  // Get paginated users with search[citation:6]
  getUsers(pageNumber: number = 1, pageSize: number = 10, search?: string): Observable<PaginatedUsers> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedUsers>(this.apiUrl, { params });
  }

  // Get single user details
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // Toggle user status
  toggleUserStatus(id: string, isActive: boolean): Observable<void> {
    const request: UpdateStatusRequest = { isActive };
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, request);
  }

  // Assign events to user
  assignEvents(userId: string, events: AssignEvent[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/events`, events);
  }

  // Remove events from user
  removeEvents(userId: string, eventIds: string[]): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/events`, { 
      body: eventIds 
    });
  }

  // Get user's events
  getUserEvents(userId: string): Observable<UserEvent[]> {
    return this.http.get<UserEvent[]>(`${this.apiUrl}/${userId}/events`);
  }

  // Get available events for user
  getAvailableEvents(userId: string, search?: string): Observable<UserEventDetails[]> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<UserEventDetails[]>(`${this.apiUrl}/${userId}/available-events`, { params });
  }

  // Update access level for a specific event
  updateAccessLevel(userId: string, eventId: string, accessLevel: AccessLevel): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/events/${eventId}/access-level`, { accessLevel });
  }

  // Helper method to get AccessLevel options
  getAccessLevels(): { value: AccessLevel, label: string }[] {
    return [
      { value: AccessLevel.Viewer, label: 'Viewer' },
      { value: AccessLevel.Contributor, label: 'Contributor' },
      { value: AccessLevel.Editor, label: 'Editor' },
      { value: AccessLevel.Admin, label: 'Admin' }
    ];
  }
}