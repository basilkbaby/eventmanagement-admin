// src/app/core/services/user-context.service.ts
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserContextService {
  private authService = inject(AuthService);

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  getUserEmail(): string | null {
    return this.authService.getCurrentUser()?.email || null;
  }

  getUserRoles(): string[] {
    return this.authService.getCurrentUser()?.roles || [];
  }

  getUserDisplayName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'Unknown User';
    
    return `${user.firstName} ${user.lastName}`.trim() || user.email;
  }

  // For audit logs - get user context for API calls
  getUserContext(): { userId: string | null; userEmail: string | null } {
    return {
      userId: this.getUserId(),
      userEmail: this.getUserEmail()
    };
  }
}