import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

interface NavigationItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
  isActive?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatRippleModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() isOpen = true;
  @Input() isMobile = false;
  currentYear: number;

  constructor() {
    this.currentYear = new Date().getFullYear();
  }

  navigationItems: NavigationItem[] = [
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', isActive: true },
    { path: '/admin/events', icon: 'event', label: 'Events' }, //, badge: 3
    //{ path: '/admin/orders', icon: 'confirmation_number', label: 'Ticket Sales' }, //, badge: 12
    // { path: '/admin/venues', icon: 'location_on', label: 'Venues' }, //, badge: 3
    //{ path: '/admin/users', icon: 'people', label: 'Users' }, //badge: 5
    //{ path: '/admin/coupons', icon: 'local_offer', label: 'Coupons' },
    // { path: '/admin/reports', icon: 'assessment', label: 'Reports' },
    //{ path: '/admin/settings', icon: 'settings', label: 'Settings' }
  ];

  getNavItemClass(item: NavigationItem): string {
    return item.isActive ? 'nav-item active' : 'nav-item';
  }
}