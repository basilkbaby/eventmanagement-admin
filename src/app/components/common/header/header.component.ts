import { Component, Output, EventEmitter, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Add this import

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.interfaces';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule, // Add this line
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>(); // Changed from toggleSidenav
  @Input() sidebarOpen = true;
  @Input() isMobile = false; // Add this line
  // ... rest of your component code remains the same
  currentUser: User | null = null;

  
  notifications = [
    { 
      id: 1, 
      message: 'New event "Tech Conference 2024" created', 
      time: '5 min ago', 
      read: false,
      type: 'info'
    },
    { 
      id: 2, 
      message: 'Ticket sales for "Music Festival" are booming!', 
      time: '1 hour ago', 
      read: false,
      type: 'success'
    },
    { 
      id: 3, 
      message: 'Payment received for order #12345', 
      time: '2 hours ago', 
      read: true,
      type: 'success'
    },
    { 
      id: 4, 
      message: 'High traffic detected on event page', 
      time: '3 hours ago', 
      read: true,
      type: 'warning'
    }
  ];

quickActions = [
  { icon: 'add', label: 'Create Event', route: '/admin/events/create', color: 'primary' , enabled: false },
  { icon: 'qr_code_scanner', label: 'Scan Ticket', route: '/admin/tickets/scan', color: 'primary' , enabled: false },
  { icon: 'download', label: 'Export Report', route: '/admin/reports/export', color: 'primary', enabled:false }
];

  unreadNotifications = this.notifications.filter(n => !n.read).length;
  searchQuery = '';

  constructor(public authService: AuthService) {}

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

  onToggleSidenav() {
    this.toggleSidebar.emit(); // Emit the correct event name
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.unreadNotifications = 0;
  }

  logout(): void {
    this.authService.logout();
  }

  
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'info';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'success': return 'var(--success-color)';
      case 'warning': return 'var(--warning-color)';
      case 'danger': return 'var(--danger-color)';
      default: return 'var(--info-color)';
    }
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      console.log('Searching for:', this.searchQuery);
      // Implement search logic
    }
  }

  
  clearSearch() {
    this.searchQuery = '';
  }

  getAvatarInitials(): string {
    if (!this.currentUser) return '?';
    
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    const email = this.currentUser.email || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    
    return '?';
  }

  getDisplayName(): string {
    if (!this.currentUser) return 'Guest';
    
    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    } else if (this.currentUser.firstName) {
      return this.currentUser.firstName;
    } else {
      return this.currentUser.email.split('@')[0];
    }
  }

  getPrimaryRole(): string {
    if (!this.currentUser || !this.currentUser.roles.length) return 'User';
    
    const rolePriority = ['Admin', 'Organizer', 'User'];
    for (const role of rolePriority) {
      if (this.currentUser.roles.includes(role)) {
        return role;
      }
    }
    
    return this.currentUser.roles[0];
  }


}