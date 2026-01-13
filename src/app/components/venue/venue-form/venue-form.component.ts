import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

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
  selector: 'app-venue-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule],
  templateUrl: './venue-form.component.html',
  styleUrls: ['./venue-form.component.scss']
})
export class VenueFormComponent implements OnInit {
  mode: 'create' | 'edit' = 'create';
  venueId: string | null = null;
  
  formData: Partial<Venue> = {
    name: '',
    address: '',
    city: '',
    capacity: 0,
    seatingPlan: '',
    contactEmail: '',
    contactPhone: '',
    amenities: [],
    status: 'active'
  };

  availableAmenities = [
    'Wheelchair Access',
    'Parking',
    'WiFi',
    'Catering',
    'Projector',
    'Sound System',
    'Stage',
    'Lighting',
    'Dressing Rooms',
    'Bar',
    'Outdoor Space',
    'Air Conditioning',
    'Heating',
    'Security',
    'First Aid'
  ];

  seatingPlanOptions = [
    'Theater Style',
    'Classroom Style',
    'Banquet Style',
    'U-Shape',
    'Boardroom',
    'Cabaret Style',
    'Stadium Seating',
    'Standing Room',
    'Mixed Seating',
    'Custom Layout'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.venueId = params['id'];
      
      if (this.venueId) {
        this.mode = 'edit';
        this.loadVenue(this.venueId);
      } else {
        this.mode = 'create';
      }
    });
  }

  private loadVenue(venueId: string) {
    // Mock data - in real app, fetch from service
    const mockVenues: Venue[] = [
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
      }
    ];

    const venue = mockVenues.find(v => v.id === venueId);
    if (venue) {
      this.formData = { ...venue };
    }
  }

  get title(): string {
    return this.mode === 'create' ? 'Create New Venue' : `Edit ${this.formData.name || 'Venue'}`;
  }

  get submitButtonText(): string {
    return this.mode === 'create' ? 'Create Venue' : 'Update Venue';
  }

  onAmenityToggle(amenity: string) {
    const amenities = this.formData.amenities || [];
    const index = amenities.indexOf(amenity);
    
    if (index > -1) {
      amenities.splice(index, 1);
    } else {
      amenities.push(amenity);
    }
    
    this.formData.amenities = amenities;
  }

  isAmenitySelected(amenity: string): boolean {
    return (this.formData.amenities || []).includes(amenity);
  }

  onSubmit() {
    if (this.isFormValid()) {
      const venueData: Venue = {
        id: this.mode === 'edit' && this.venueId ? this.venueId : this.generateId(),
        name: this.formData.name!,
        address: this.formData.address!,
        city: this.formData.city!,
        capacity: this.formData.capacity!,
        seatingPlan: this.formData.seatingPlan!,
        contactEmail: this.formData.contactEmail!,
        contactPhone: this.formData.contactPhone!,
        amenities: this.formData.amenities || [],
        status: this.formData.status!,
        lastModified: new Date(),
        createdDate: this.mode === 'edit' ? new Date() : new Date() // In real app, preserve original date
      };
      
      // Save logic here - would call a service in real app
      console.log('Saving venue:', venueData);
      
      // Navigate back to venues list
      this.router.navigate(['/admin/venues']);
    }
  }

  onCancel() {
    this.router.navigate(['/admin/venues']);
  }

  private generateId(): string {
    return Date.now().toString();
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name?.trim() &&
      this.formData.address?.trim() &&
      this.formData.city?.trim() &&
      this.formData.capacity &&
      this.formData.capacity > 0 &&
      this.formData.seatingPlan &&
      this.formData.contactEmail &&
      this.formData.contactPhone
    );
  }

  getAmenitiesCount(): number {
    return this.formData.amenities?.length || 0;
  }
}