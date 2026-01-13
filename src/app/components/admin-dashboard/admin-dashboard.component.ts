import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatDividerModule } from '@angular/material/divider';
import {  DashboardStats,DashboardEvent } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatGridListModule,
    MatDividerModule
  ],
  //providers: [DashboardService],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  selectedEvent: string = 'all';
  isLoading: boolean = true;
  events: DashboardEvent[] = [];
  overallStats: DashboardStats | null = null;
  currentStats: DashboardStats | null = null;
  // Add Math to the component class to fix the error
  Math = Math;

  //constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboardData();

  }

  onEventChange() {
    this.updateStats();
  }


  loadDashboardData() {
    this.isLoading = true;
    
    // Load events and stats in parallel
    // this.dashboardService.getEvents().subscribe(events => {
    //   this.events = events;
    // });

    // this.dashboardService.getOverallStats().subscribe(stats => {
    //   this.overallStats = stats;
    //   this.currentStats = stats;
    //   this.isLoading = false;
    // });
  }

  updateStats() {
    if (this.selectedEvent === 'all') {
      this.currentStats = this.overallStats;
    } else {
      // this.isLoading = true;
      // this.dashboardService.getEventStats(this.selectedEvent).subscribe(stats => {
      //   this.currentStats = stats;
      //   this.isLoading = false;
      // });
    }
  }

  getEventProgress(event: DashboardEvent): number {
    return (event.soldTickets / event.totalTickets) * 100;
  }

  getRevenueGrowthClass(growth: number): string {
    return growth >= 0 ? 'positive' : 'negative';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-UK').format(num);
  }

  // Helper method to get absolute value for growth display
  getAbsoluteGrowth(growth: number): number {
    return Math.abs(growth);
  }
}