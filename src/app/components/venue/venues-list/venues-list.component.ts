import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  capacity: number;
  seatingPlan: string;
  contactEmail: string;
  contactPhone: string;
  amenities: string[];
  status: 'active' | 'inactive' | 'maintenance';
  lastModified: Date;
  createdDate: Date;
}

@Component({
  selector: 'app-venues-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, RouterModule],
  templateUrl: './venues-list.component.html',
  styleUrls: ['./venues-list.component.scss']
})
export class VenuesListComponent implements OnInit {
  searchTerm: string = '';
  selectedStatus: string = 'all';
  sortBy: string = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  venues: Venue[] = [
    {
      id: '1',
      name: 'Grand Theater Hall',
      address: '123 Main Street',
      city: 'New York',
      capacity: 1500,
      seatingPlan: 'Theater Style',
      contactEmail: 'info@grandtheater.com',
      contactPhone: '+1 (555) 123-4567',
      amenities: ['Wheelchair Access', 'Catering', 'Parking', 'WiFi'],
      status: 'active',
      lastModified: new Date('2024-01-15'),
      createdDate: new Date('2023-05-10')
    },
    {
      id: '2',
      name: 'Conference Center A',
      address: '456 Business Avenue',
      city: 'San Francisco',
      capacity: 800,
      seatingPlan: 'Classroom Style',
      contactEmail: 'events@confcenter.com',
      contactPhone: '+1 (555) 987-6543',
      amenities: ['Projector', 'Whiteboards', 'Catering', 'WiFi'],
      status: 'active',
      lastModified: new Date('2024-01-10'),
      createdDate: new Date('2023-06-15')
    },
    {
      id: '3',
      name: 'Sports Arena Main',
      address: '789 Stadium Road',
      city: 'Chicago',
      capacity: 5000,
      seatingPlan: 'Stadium Seating',
      contactEmail: 'bookings@sportsarena.com',
      contactPhone: '+1 (555) 456-7890',
      amenities: ['Concessions', 'Parking', 'Locker Rooms', 'First Aid'],
      status: 'maintenance',
      lastModified: new Date('2024-01-08'),
      createdDate: new Date('2023-03-20')
    }
  ];

  statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'capacity', label: 'Capacity' },
    { value: 'lastModified', label: 'Last Modified' },
    { value: 'createdDate', label: 'Date Created' }
  ];

  constructor(private router: Router) {}

  ngOnInit() {}

  get filteredVenues(): Venue[] {
    let filtered = this.venues.filter(venue => {
      const matchesSearch = !this.searchTerm || 
        venue.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        venue.address.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        venue.city.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.selectedStatus === 'all' || venue.status === this.selectedStatus;
      
      return matchesSearch && matchesStatus;
    });

    // Sort venues
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'capacity':
          aValue = a.capacity;
          bValue = b.capacity;
          break;
        case 'lastModified':
          aValue = a.lastModified;
          bValue = b.lastModified;
          break;
        case 'createdDate':
          aValue = a.createdDate;
          bValue = b.createdDate;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }

  get totalCapacity(): number {
    return this.venues.reduce((sum, venue) => sum + venue.capacity, 0);
  }

  get activeVenuesCount(): number {
    return this.venues.filter(venue => venue.status === 'active').length;
  }

  createVenue() {
    this.router.navigate(['/admin/venues/create']);
  }

  editVenue(venue: Venue) {
    this.router.navigate(['/admin/venues/edit', venue.id]);
  }

  manageSeating(venue: Venue) {
    this.router.navigate(['/admin/venues/seating', venue.id]);
  }

  deleteVenue(venue: Venue) {
    if (confirm(`Are you sure you want to delete "${venue.name}"? This action cannot be undone.`)) {
      this.venues = this.venues.filter(v => v.id !== venue.id);
    }
  }

  toggleVenueStatus(venue: Venue) {
    venue.status = venue.status === 'active' ? 'inactive' : 'active';
    venue.lastModified = new Date();
  }

  exportReport() {
    console.log('Export venues report');
    // Implement export functionality
  }

  onSortChange() {
    // Trigger re-sort
    this.filteredVenues;
  }

  toggleSortOrder() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'maintenance': return 'status-maintenance';
      default: return 'status-unknown';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '⏸️';
      case 'maintenance': return '🔧';
      default: return '❓';
    }
  }
}