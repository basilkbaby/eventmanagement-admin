import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input'; // ADD THIS
import { MatFormFieldModule } from '@angular/material/form-field'; // ADD THIS

// Correct Chart.js imports
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { ReportFilter, SalesReport, AttendanceReport, RevenueReport, UtilizationReport } from '../../../core/models/report.interfaces';

// Register all Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatIconModule,
    MatInputModule, // ADD THIS
    MatFormFieldModule, // ADD THIS
    BaseChartDirective
  ],
  templateUrl: './reports-dashboard.component.html',
  styleUrls: ['./reports-dashboard.component.scss']
})
export class ReportsDashboardComponent implements OnInit {
  // ... rest of the component code remains the same
  filter: ReportFilter = {
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    },
    reportType: 'sales'
  };

  salesReport: SalesReport[] = [];
  attendanceReport: AttendanceReport[] = [];
  revenueReport: RevenueReport[] = [];
  utilizationReport: UtilizationReport[] = [];

  // Chart configurations
  salesChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  revenueChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  utilizationChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: []
  };

  attendanceChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    }
  };

  events = [
    { id: '1', name: 'All Events' },
    { id: '2', name: 'Summer Concert' },
    { id: '3', name: 'Winter Festival' }
  ];

  reportTypes = [
    { value: 'sales', label: 'Sales Report' },
    { value: 'attendance', label: 'Attendance Report' },
    { value: 'revenue', label: 'Revenue Report' },
    { value: 'utilization', label: 'Seat Utilization' }
  ];

  ngOnInit() {
    this.loadReports();
    this.generateChartData();
  }

  loadReports() {
    // Mock data - replace with API calls
    this.salesReport = [
      {
        period: 'Jan 2024',
        totalSales: 125000,
        ticketCount: 1250,
        averageTicketPrice: 100,
        growth: 12.5
      },
      {
        period: 'Feb 2024',
        totalSales: 145000,
        ticketCount: 1350,
        averageTicketPrice: 107,
        growth: 16.0
      },
      {
        period: 'Mar 2024',
        totalSales: 138000,
        ticketCount: 1280,
        averageTicketPrice: 108,
        growth: -4.8
      }
    ];

    this.attendanceReport = [
      {
        eventName: 'Summer Concert',
        date: new Date('2024-06-15'),
        totalCapacity: 2000,
        bookedSeats: 1850,
        attendanceRate: 92.5,
        revenue: 185000
      },
      {
        eventName: 'Winter Festival',
        date: new Date('2024-12-20'),
        totalCapacity: 1500,
        bookedSeats: 1420,
        attendanceRate: 94.7,
        revenue: 142000
      }
    ];

    this.revenueReport = [
      {
        period: 'Q1 2024',
        revenue: 408000,
        expenses: 185000,
        profit: 223000,
        margin: 54.7
      },
      {
        period: 'Q2 2024',
        revenue: 525000,
        expenses: 210000,
        profit: 315000,
        margin: 60.0
      }
    ];

    this.utilizationReport = [
      {
        sectionName: 'VIP',
        totalSeats: 200,
        bookedSeats: 185,
        utilizationRate: 92.5,
        revenue: 92500
      },
      {
        sectionName: 'Premium',
        totalSeats: 500,
        bookedSeats: 420,
        utilizationRate: 84.0,
        revenue: 126000
      },
      {
        sectionName: 'General',
        totalSeats: 1000,
        bookedSeats: 780,
        utilizationRate: 78.0,
        revenue: 156000
      }
    ];
  }

  generateChartData() {
    // Sales Chart
    this.salesChartData = {
      labels: this.salesReport.map(r => r.period),
      datasets: [
        {
          label: 'Total Sales (£)',
          data: this.salesReport.map(r => r.totalSales / 1000), // Convert to thousands
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y'
        }
      ]
    };

    // Revenue Chart
    this.revenueChartData = {
      labels: this.revenueReport.map(r => r.period),
      datasets: [
        {
          label: 'Revenue (£)',
          data: this.revenueReport.map(r => r.revenue / 1000),
          backgroundColor: '#4CAF50'
        },
        {
          label: 'Expenses (£)',
          data: this.revenueReport.map(r => r.expenses / 1000),
          backgroundColor: '#F44336'
        },
        {
          label: 'Profit (£)',
          data: this.revenueReport.map(r => r.profit / 1000),
          backgroundColor: '#2196F3'
        }
      ]
    };

    // Utilization Chart
    this.utilizationChartData = {
      labels: this.utilizationReport.map(r => r.sectionName),
      datasets: [
        {
          label: 'Utilization Rate (%)',
          data: this.utilizationReport.map(r => r.utilizationRate),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderWidth: 2
        }
      ]
    };

    // Attendance Chart
    this.attendanceChartData = {
      labels: this.attendanceReport.map(r => r.eventName),
      datasets: [
        {
          label: 'Attendance Rate (%)',
          data: this.attendanceReport.map(r => r.attendanceRate),
          borderColor: '#9C27B0',
          backgroundColor: 'rgba(156, 39, 176, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  onFilterChange() {
    this.loadReports();
    this.generateChartData();
  }

  exportReport() {
    // Implement export functionality
    console.log('Exporting report with filter:', this.filter);
    // You can implement CSV/PDF export here
    this.exportToCSV();
  }

  exportToCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add headers based on current report type
    switch (this.filter.reportType) {
      case 'sales':
        csvContent += 'Period,Total Sales,Ticket Count,Average Price,Growth\n';
        this.salesReport.forEach(report => {
          csvContent += `${report.period},${report.totalSales},${report.ticketCount},${report.averageTicketPrice},${report.growth}\n`;
        });
        break;
      case 'revenue':
        csvContent += 'Period,Revenue,Expenses,Profit,Margin\n';
        this.revenueReport.forEach(report => {
          csvContent += `${report.period},${report.revenue},${report.expenses},${report.profit},${report.margin}\n`;
        });
        break;
      case 'utilization':
        csvContent += 'Section,Total Seats,Booked Seats,Utilization Rate,Revenue\n';
        this.utilizationReport.forEach(report => {
          csvContent += `${report.sectionName},${report.totalSeats},${report.bookedSeats},${report.utilizationRate},${report.revenue}\n`;
        });
        break;
      case 'attendance':
        csvContent += 'Event,Date,Capacity,Booked,Attendance Rate,Revenue\n';
        this.attendanceReport.forEach(report => {
          csvContent += `${report.eventName},${report.date.toISOString().split('T')[0]},${report.totalCapacity},${report.bookedSeats},${report.attendanceRate},${report.revenue}\n`;
        });
        break;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${this.filter.reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getTotalSales(): number {
    return this.salesReport.reduce((sum, report) => sum + report.totalSales, 0);
  }

  getTotalTickets(): number {
    return this.salesReport.reduce((sum, report) => sum + report.ticketCount, 0);
  }

  getAverageUtilization(): number {
    const total = this.utilizationReport.reduce((sum, report) => sum + report.utilizationRate, 0);
    return total / this.utilizationReport.length;
  }

  getTotalProfit(): number {
    return this.revenueReport.reduce((sum, report) => sum + report.profit, 0);
  }

  // Format numbers for display
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-UK').format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('en-UK', {
      style: 'percent',
      minimumFractionDigits: 1
    }).format(value / 100);
  }
}