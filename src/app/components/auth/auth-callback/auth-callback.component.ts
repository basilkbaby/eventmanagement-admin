// src/app/auth/auth-callback/auth-callback.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner></mat-spinner>
      <p>Completing login...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
    }
  `]
})
export class AuthCallbackComponent {
  private router = inject(Router);

  ngOnInit() {
    // The actual token handling is done in AuthService constructor
    // This component just shows loading and will be redirected
    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 1000);
  }
}