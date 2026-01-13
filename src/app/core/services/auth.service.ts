// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.interfaces';


export interface LoginResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
  roles: string[];
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenCheckInterval?: any;

  constructor() {
    this.loadCurrentUser();
    this.startTokenMonitoring();
  }

  // Login method (returns Observable)
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/Auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        this.storeAuthData(response);
        this.loadCurrentUser();
      }),
      catchError(error => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  // Register method
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  // Store authentication data
  private storeAuthData(authResponse: LoginResponse): void {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('token_expiration', authResponse.expiration);
    localStorage.setItem('user_id', authResponse.userId);
    localStorage.setItem('user_email', authResponse.email);
    localStorage.setItem('user_roles', JSON.stringify(authResponse.roles));
  }

  // Load current user from localStorage
  private loadCurrentUser(): void {
    const token = this.getToken();
    if (token && !this.isTokenExpired()) {
      const user: User = {
        id: localStorage.getItem('user_id') || '',
        email: localStorage.getItem('user_email') || '',
        firstName: localStorage.getItem('user_first_name') || '',
        lastName: localStorage.getItem('user_last_name') || '',
        roles: JSON.parse(localStorage.getItem('user_roles') || '[]'),
        isActive : true,
        createdAt: new Date(),
        events: []
      };
      this.currentUserSubject.next(user);
    } else {
      this.currentUserSubject.next(null);
    }
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if token is expired - ADD THIS METHOD
  isTokenExpired(): boolean {
    const expiration = localStorage.getItem('token_expiration');
    if (!expiration) return true;
    
    try {
      return new Date() > new Date(expiration);
    } catch {
      return true;
    }
  }

  // Check if user is authenticated - ADD THIS METHOD
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.roles.includes(role) : false;
  }

  // Logout
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.stopTokenMonitoring();
    this.router.navigate(['/login']);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private startTokenMonitoring(): void {
    this.tokenCheckInterval = setInterval(() => {
      if (!this.isTokenValid()) {
        this.logout();
      }
    }, 60000); // Check every minute
  }

  private stopTokenMonitoring(): void {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
  }

  // Check if token is valid (with buffer)
  isTokenValid(): boolean {
    return this.isAuthenticated();
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiration');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_first_name');
    localStorage.removeItem('user_last_name');
  }

  validateToken(): Observable<{ valid: boolean }> {
    const token = this.getToken();
    if (!token || !this.isTokenValid()) {
      return of({ valid: false });
    }

    // Call your API to validate token
    return this.http.get<{ valid: boolean }>(`${this.apiUrl}/auth/validate-token`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      catchError(() => of({ valid: false }))
    );
  }
}