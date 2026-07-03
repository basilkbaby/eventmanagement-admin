import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { EventContextService } from '../../../core/services/event-context.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavigationItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
  seatsLink?: boolean; // dynamic link that targets the selected event's seatmap
  detailsLink?: boolean; // dynamic link that targets the selected event's details/edit page
  superAdminOnly?: boolean; // only shown to SuperAdmins
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

  readonly eventContext = inject(EventContextService);
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly currentYear = new Date().getFullYear();

  readonly navigationItems: NavigationItem[] = [
    { path: '/admin/dashboard',         icon: 'dashboard',           label: 'Dashboard' },
    { path: '',                          icon: 'info',                label: 'Event Details', detailsLink: true },
    { path: '',                          icon: 'event_seat',          label: 'Seats', seatsLink: true },
    { path: '/admin/sections',          icon: 'grid_view',           label: 'Seating Layout', superAdminOnly: true },
    { path: '/admin/event-users',       icon: 'group',               label: 'Event Users', superAdminOnly: true },
    { path: '/admin/orders',            icon: 'confirmation_number', label: 'Ticket Sales' },
    { path: '/admin/coupons',           icon: 'local_offer',         label: 'Coupons' },
    { path: '/admin/discounts',         icon: 'sell',                label: 'Discounts' },
    // { path: '/admin/users',          icon: 'people',              label: 'Users' },
    // { path: '/admin/reports',        icon: 'assessment',          label: 'Reports' },
    // { path: '/admin/settings',       icon: 'settings',            label: 'Settings' }
  ];

  /** Nav items filtered by role — SuperAdmin-only items are hidden from everyone else. */
  get visibleNavigationItems(): NavigationItem[] {
    const isSuperAdmin = this.authService.hasRole('SuperAdmin');
    return this.navigationItems.filter(item => !item.superAdminOnly || isSuperAdmin);
  }

  /** Returns the router link for a nav item.
   *  Seats: points to the seatmap of the currently selected event.
   *  Returns null when no event is selected (disables the anchor). */
  getNavLink(item: NavigationItem): string[] | null {
    if (item.seatsLink) {
      const eventId = this.eventContext.selectedEventId();
      return eventId ? ['/admin/events/seatmap', eventId] : null;
    }
    if (item.detailsLink) {
      const eventId = this.eventContext.selectedEventId();
      return eventId ? ['/admin/events', eventId] : null;
    }
    return [item.path];
  }

  /** Items that depend on a selected event are disabled until one is chosen. */
  isNavDisabled(item: NavigationItem): boolean {
    return !!(item.seatsLink || item.detailsLink) && !this.eventContext.selectedEventId();
  }

  /** Custom active-state check so Seats is highlighted on any seatmap URL,
   *  not just the exact seatmap URL of the currently selected event. */
  isNavActive(item: NavigationItem): boolean {
    const url = this.router.url;
    if (item.seatsLink) return url.includes('/seatmap');
    if (item.detailsLink) {
      const eventId = this.eventContext.selectedEventId();
      return !!eventId && url.startsWith(`/admin/events/${eventId}`);
    }
    if (item.path === '/admin/dashboard') return url === '/admin/dashboard' || url.startsWith('/admin/dashboard?');
    return url.startsWith(item.path);
  }

  /** Tooltip shown when the link is disabled (no event selected yet). */
  getNavTooltip(item: NavigationItem): string {
    if (this.isNavDisabled(item)) {
      return 'Select an event from the top bar first';
    }
    return !this.isOpen ? item.label : '';
  }
}
