// src/app/core/services/auto-login.service.ts
import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AutoLoginService {
  private authService = inject(AuthService);
 private router = inject(Router);
 
  initializeApp(): Promise<void> {
    return new Promise((resolve) => {
      // Check if we have a valid token on app startup
      if (this.authService.isTokenValid()) {
        // Do a server validation on app start
        this.authService.validateToken().subscribe({
          next: (response) => {
            if (response.valid) {
              console.log('✅ Auto-login successful, navigating to dashboard');
              //this.router.navigate(['/admin/dashboard']);
            } else {
              console.log('❌ Token invalid, logging out');
              this.authService.logout();
              this.router.navigate(['/auth/login']);
            }
            resolve();
          },
          error: () => {
            this.authService.logout();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}