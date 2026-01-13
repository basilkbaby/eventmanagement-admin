import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

// Components
import { HeaderComponent } from './components/common/header/header.component';
import { SidebarComponent } from './components/common/sidebar/sidebar.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    AdminDashboardComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
}