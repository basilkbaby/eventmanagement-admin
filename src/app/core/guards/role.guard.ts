// src/app/core/guards/role.guard.ts
import { Injectable, inject } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const hasRole = requiredRoles.some(role => this.authService.hasRole(role));
    
    if (!hasRole) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}