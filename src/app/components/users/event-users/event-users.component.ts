import { Component, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { EventContextService } from '../../../core/services/event-context.service';
import { AdminUserService } from '../../../core/services/adminuser.service';
import { User } from '../../../core/models/user.interfaces';

@Component({
  selector: 'app-event-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './event-users.component.html',
  styleUrls: ['./event-users.component.scss']
})
export class EventUsersComponent {
  readonly eventContext = inject(EventContextService);
  private adminUserService = inject(AdminUserService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  users: User[] = [];
  isLoading = false;

  showAddModal = false;
  newUser = { name: '', email: '', password: '' };
  isSaving = false;

  constructor() {
    // Reload whenever the selected event changes (top-bar event switcher).
    // toObservable must run inside an injection context (the constructor).
    toObservable(this.eventContext.selectedEventId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(id => { if (id) this.loadUsers(); else this.users = []; });
  }

  loadUsers(): void {
    const eventId = this.eventContext.selectedEventId();
    if (!eventId) return;
    this.isLoading = true;
    this.adminUserService.getEventUsers(eventId).subscribe({
      next: (users) => { this.users = users || []; this.isLoading = false; },
      error: () => { this.isLoading = false; this.snackBar.open('Failed to load users', 'Close', { duration: 3000 }); }
    });
  }

  openAdd(): void { this.newUser = { name: '', email: '', password: '' }; this.showAddModal = true; }
  cancelAdd(): void { if (!this.isSaving) this.showAddModal = false; }

  confirmAdd(): void {
    const eventId = this.eventContext.selectedEventId();
    if (!eventId || this.isSaving) return;
    const u = this.newUser;
    if (!u.name.trim() || !u.email.trim() || !u.password.trim()) return;

    this.isSaving = true;
    this.adminUserService.createEventUser(eventId, {
      name: u.name.trim(), email: u.email.trim(), password: u.password
    }).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showAddModal = false;
        this.snackBar.open(res?.message || 'User added to this event', 'Close', { duration: 4000 });
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err?.error?.errors?.[0] || err?.error?.error || 'Failed to add user';
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      }
    });
  }

  userName(u: User): string {
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
  }
}
