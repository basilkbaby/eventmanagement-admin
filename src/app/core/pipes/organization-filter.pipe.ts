// organization-filter.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { EventSponsorDto } from '../models/DTOs/event.DTO.model';
import { OrganizationType } from '../models/Enums/event.enums';

@Pipe({
  name: 'organizationFilter',
  standalone: true
})
export class OrganizationFilterPipe implements PipeTransform {
  transform(
    organizations: EventSponsorDto[], 
    type: OrganizationType | 'all',
    sortBy: 'displayOrder' | 'name' = 'displayOrder'
  ): EventSponsorDto[] {
    if (!organizations) return [];
    
    let filtered = organizations;
    
    if (type !== 'all') {
      filtered = organizations.filter(org => org.type === type);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'displayOrder') {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });
  }
}