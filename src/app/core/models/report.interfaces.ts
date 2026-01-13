export interface ReportFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  eventId?: string;
  sectionId?: string;
  reportType: 'sales' | 'attendance' | 'revenue' | 'utilization';
}

export interface SalesReport {
  period: string;
  totalSales: number;
  ticketCount: number;
  averageTicketPrice: number;
  growth: number;
}

export interface AttendanceReport {
  eventName: string;
  date: Date;
  totalCapacity: number;
  bookedSeats: number;
  attendanceRate: number;
  revenue: number;
}

export interface RevenueReport {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface UtilizationReport {
  sectionName: string;
  totalSeats: number;
  bookedSeats: number;
  utilizationRate: number;
  revenue: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
}