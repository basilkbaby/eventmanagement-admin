// src/app/core/guards/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // Check for required roles if specified
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles && requiredRoles.length > 0) {
        const user = this.authService.getCurrentUser();
        if (!user || !this.hasRequiredRoles(user, requiredRoles)) {
          this.router.navigate(['/unauthorized']);
          return false;
        }
      }
      return true;
    }

    // User is not authenticated, redirect to login
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  private hasRequiredRoles(user: any, requiredRoles: string[]): boolean {
    return requiredRoles.some(role => user.roles.includes(role));
  }
}