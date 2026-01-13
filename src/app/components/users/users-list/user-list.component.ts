// user-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { User, AccessLevel, UserEvent, UserEventDetails } from '../../../core/models/user.interfaces';
import { AdminUserService } from '../../../core/services/adminuser.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatChipsModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  // Data
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  
  // Filters
  filter = {
    search: '',
    status: 'all',
    role: 'all'
  };
  
  // Roles for filter dropdown
  roles = ['SuperAdmin', 'Admin', 'Manager', 'User'];
  
  // Table columns
  displayedColumns = ['name', 'roles', 'access', 'created', 'status', 'actions'];
  
  // Event assignment
  selectedUser: User | null = null;
  showEventPanel = false;
  userEvents: UserEvent[] = [];
  availableEvents: UserEventDetails[] = [];
  selectedEventIds: string[] = [];
  selectedAccessLevel: AccessLevel = AccessLevel.Viewer;
  panelLoading = false;
  accessLevels = [
    { value: AccessLevel.Viewer, label: 'Viewer' },
    { value: AccessLevel.Contributor, label: 'Contributor' },
    { value: AccessLevel.Editor, label: 'Editor' },
    { value: AccessLevel.Admin, label: 'Admin' }
  ] as const;
  constructor(private snackBar: MatSnackBar, private userService: AdminUserService) {

  }
  ngOnInit(): void {
    this.loadUsers();

  }

  // Load users
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(1, 50).subscribe({
      next: (response) => {
        this.users = response.items;
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        this.showMessage('Failed to load users', 'error');
      }
    });
  }

  // Apply filters
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Search filter
      const searchMatch = !this.filter.search || 
        user.firstName.toLowerCase().includes(this.filter.search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(this.filter.search.toLowerCase()) ||
        user.email.toLowerCase().includes(this.filter.search.toLowerCase());
      
      // Status filter
      const statusMatch = this.filter.status === 'all' || 
        (this.filter.status === 'active' && user.isActive) ||
        (this.filter.status === 'inactive' && !user.isActive);
      
      // Role filter
      const roleMatch = this.filter.role === 'all' || 
        user.roles.includes(this.filter.role);
      
      return searchMatch && statusMatch && roleMatch;
    });
  }

  // Clear all filters
  clearFilters(): void {
    this.filter = {
      search: '',
      status: 'all',
      role: 'all'
    };
    this.filteredUsers = [...this.users];
  }

  // Toggle user status
  toggleUserStatus(user: User): void {
    const action = user.isActive ? 'deactivate' : 'activate';
    const message = `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`;
    
    if (confirm(message)) {
      this.userService.toggleUserStatus(user.id, !user.isActive).subscribe({
        next: () => {
          user.isActive = !user.isActive;
          this.showMessage(`User ${action}d successfully`, 'success');
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.showMessage('Failed to update user status', 'error');
        }
      });
    }
  }

  // Show event assignment panel
  async showAssignEvents(user: User): Promise<void> {
    this.selectedUser = user;
    this.showEventPanel = true;
    this.panelLoading = true;
    this.selectedEventIds = [];
    this.selectedAccessLevel = AccessLevel.Viewer;
    
    try {
      // Load user's current events
      this.userEvents = await this.userService.getUserEvents(user.id).toPromise() || [];
      
      // Load available events
      this.availableEvents = await this.userService.getAvailableEvents(user.id).toPromise() || [];
      
      this.panelLoading = false;
    } catch (error) {
      console.error('Error loading event data:', error);
      this.showMessage('Failed to load event data', 'error');
      this.panelLoading = false;
    }
  }

  // Toggle event selection
  toggleEventSelection(eventId: string): void {
    const index = this.selectedEventIds.indexOf(eventId);
    if (index > -1) {
      this.selectedEventIds.splice(index, 1);
    } else {
      this.selectedEventIds.push(eventId);
    }
  }

  // Check if event is selected
  isEventSelected(eventId: string): boolean {
    return this.selectedEventIds.includes(eventId);
  }

  // Assign selected events
  assignEvents(): void {
    if (!this.selectedUser || this.selectedEventIds.length === 0) {
      this.showMessage('Please select at least one event', 'error');
      return;
    }
    
    const eventsToAssign = this.selectedEventIds.map(eventId => ({
      eventId,
      accessLevel: this.selectedAccessLevel
    }));
    
    this.userService.assignEvents(this.selectedUser.id, eventsToAssign).subscribe({
      next: () => {
        this.showMessage('Events assigned successfully', 'success');
        this.refreshUserData();
        this.selectedEventIds = [];
      },
      error: (error) => {
        console.error('Error assigning events:', error);
        this.showMessage('Failed to assign events', 'error');
      }
    });
  }

  // Update access level for existing event
  updateAccessLevel(eventId: string, accessLevel: AccessLevel): void {
    if (!this.selectedUser) return;
    
    this.userService.updateAccessLevel(this.selectedUser.id, eventId, accessLevel).subscribe({
      next: () => {
        this.showMessage('Access level updated', 'success');
        this.refreshUserData();
      },
      error: (error) => {
        console.error('Error updating access level:', error);
        this.showMessage('Failed to update access level', 'error');
      }
    });
  }

  // Remove event from user
  removeEvent(eventId: string): void {
    if (!this.selectedUser) return;
    
    if (confirm('Are you sure you want to remove this event access?')) {
      this.userService.removeEvents(this.selectedUser.id, [eventId]).subscribe({
        next: () => {
          this.showMessage('Event access removed', 'success');
          this.refreshUserData();
        },
        error: (error) => {
          console.error('Error removing event:', error);
          this.showMessage('Failed to remove event access', 'error');
        }
      });
    }
  }

  // Refresh user data after changes
  refreshUserData(): void {
    if (!this.selectedUser) return;
    
    // Reload user events
    this.userService.getUserEvents(this.selectedUser.id).subscribe(events => {
      this.userEvents = events;
    });
    
    // Reload available events
    this.userService.getAvailableEvents(this.selectedUser.id).subscribe(events => {
      this.availableEvents = events;
    });
    
    // Update the user in the main list
    const userIndex = this.users.findIndex(u => u.id === this.selectedUser!.id);
    if (userIndex > -1) {
      this.userService.getUser(this.selectedUser.id).subscribe(updatedUser => {
        this.users[userIndex] = updatedUser;
        this.filteredUsers = [...this.users];
      });
    }
  }

  // Close event panel
  closeEventPanel(): void {
    this.showEventPanel = false;
    this.selectedUser = null;
    this.userEvents = [];
    this.availableEvents = [];
    this.selectedEventIds = [];
    this.selectedAccessLevel = AccessLevel.Viewer;
  }

  // Get event count
  getEventCount(user: User): number {
    return user.events?.length || 0;
  }

  // Get access level label
  getAccessLevelLabel(level: AccessLevel): string {
    const levelObj = this.accessLevels.find(al => al.value === level);
    return levelObj ? levelObj.label : 'Unknown';
  }

  // Get time since joined
  getTimeSince(date: Date): string {
    const now = new Date();
    const created = new Date(date);
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  }

  // Get role CSS class
  getRoleClass(role: string): string {
    const classes: {[key: string]: string} = {
      'SuperAdmin': 'super-admin-chip',
      'Admin': 'admin-chip',
      'Manager': 'manager-chip',
      'User': 'user-chip'
    };
    return classes[role] || 'default-chip';
  }

  // Get status CSS class
  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  // Simple message display
  showMessage(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const panelClass = type === 'success' ? 'success-snackbar' : 
                      type === 'error' ? 'error-snackbar' : 'info-snackbar';
    
    this.snackBar.open(message, 'Close', { 
      duration: 3000,
      panelClass: [panelClass]
    });
  }

  // Placeholder methods for menu actions
  viewUserDetails(user: User): void {
    this.showMessage(`Viewing details for ${user.firstName} ${user.lastName}`, 'info');
  }

  sendResetPassword(user: User): void {
    if (confirm(`Send password reset email to ${user.email}?`)) {
      this.showMessage('Password reset email sent', 'success');
    }
  }

hasActiveFilters(): boolean {
  // Convert everything to strings for comparison
  const search = String(this.filter.search || '');
  const status = String(this.filter.status || '');
  const role = String(this.filter.role || '');
  
  return (
    (search.length > 0) ||
    (status !== 'all') ||
    (role !== 'all')
  );
}

// Clear specific filter
clearFilter(filterName: string): void {
  if (filterName === 'search') {
    this.filter.search = '';
  } else if (filterName === 'status') {
    this.filter.status = 'all';
  } else if (filterName === 'role') {
    this.filter.role = 'all';
  }
  this.applyFilters();
}

// Clear search only
clearSearch(): void {
  this.filter.search = '';
  this.applyFilters();
}

// Get role icon
getRoleIcon(role: string): string {
  const roleIcons: { [key: string]: string } = {
    'admin': 'admin_panel_settings',
    'manager': 'manage_accounts',
    'editor': 'edit',
    'viewer': 'visibility',
    'user': 'person'
  };
  return roleIcons[role.toLowerCase()] || 'person';
}
}