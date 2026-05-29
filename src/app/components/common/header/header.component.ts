import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { EventContextService } from '../../../core/services/event-context.service';
import { User } from '../../../core/models/user.interfaces';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  @Input() sidebarOpen = true;
  @Input() isMobile = false;

  currentUser: User | null = null;

  // ── Event Switcher dropdown state ─────────────────────────────────────────
  switcherOpen = false;

  toggleSwitcher(event: Event): void {
    event.stopPropagation();
    this.profileOpen = false;
    this.switcherOpen = !this.switcherOpen;
  }

  closeSwitcher(): void { this.switcherOpen = false; }

  selectEvent(id: string): void {
    this.onEventChange(id);
    this.switcherOpen = false;
  }

  // ── Profile dropdown state ────────────────────────────────────────────────
  profileOpen = false;

  toggleProfile(event: Event): void {
    event.stopPropagation();
    this.switcherOpen = false;
    this.profileOpen = !this.profileOpen;
  }

  closeProfile(): void { this.profileOpen = false; }

  logoutAndClose(): void {
    this.closeProfile();
    this.logout();
  }

  // ── Quick actions (all currently disabled) ────────────────────────────────
  quickActions = [
    { icon: 'add',          label: 'Create Event',   route: '/admin/events/create',  color: 'primary', enabled: false },
    { icon: 'qr_code_scanner', label: 'Scan Ticket', route: '/admin/tickets/scan',   color: 'primary', enabled: false },
    { icon: 'download',     label: 'Export Report',  route: '/admin/reports/export', color: 'primary', enabled: false }
  ];

  constructor(
    public authService: AuthService,
    public eventContext: EventContextService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          roles: user.roles,
          isActive: user.isActive !== false,
          createdAt: user.createdAt,
          events: []
        };
      } else {
        this.currentUser = null;
      }
    });
  }

  onToggleSidenav(): void { this.toggleSidebar.emit(); }

  onEventChange(eventId: string): void { this.eventContext.setSelectedEvent(eventId); }

  logout(): void { this.authService.logout(); }

  getAvatarInitials(): string {
    if (!this.currentUser) return '?';
    const { firstName = '', lastName = '', email = '' } = this.currentUser;
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    return email ? email[0].toUpperCase() : '?';
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Guest';
    const { firstName, lastName, email } = this.currentUser;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    return firstName || email.split('@')[0];
  }

  getPrimaryRole(): string {
    if (!this.currentUser?.roles?.length) return 'User';
    for (const role of ['SuperAdmin', 'Admin', 'Organizer', 'User']) {
      if (this.currentUser.roles.includes(role)) return role;
    }
    return this.currentUser.roles[0];
  }
}
