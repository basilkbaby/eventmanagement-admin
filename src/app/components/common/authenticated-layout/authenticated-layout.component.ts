import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { AdminDashboardComponent } from '../../admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-authenticated-layout',
  standalone: true,
  imports: [    CommonModule,
      RouterModule,
      RouterOutlet,
      HeaderComponent,
      SidebarComponent,
      AdminDashboardComponent],
  templateUrl: './authenticated-layout.component.html',
  styleUrl: './authenticated-layout.component.scss'
})
export class AuthenticatedLayoutComponent {
isSidebarOpen = true;
  isMobile = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768;
    
    // Auto-close sidebar on mobile
    if (this.isMobile) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
  }

  onSidebarToggle() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
