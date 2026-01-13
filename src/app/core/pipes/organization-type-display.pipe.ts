import { Pipe, PipeTransform } from '@angular/core';
import { OrganizationType } from '../models/Enums/event.enums';

@Pipe({
  name: 'organizationTypeDisplay',
  standalone: true
})
export class OrganizationTypeDisplayPipe implements PipeTransform {
  transform(type: OrganizationType): string {
    switch(type) {
      case OrganizationType.Organizer: return 'Organizer';
      case OrganizationType.Sponsor: return 'Sponsor';
      case OrganizationType.Venue: return 'Venue';
      case OrganizationType.Partner: return 'Partner';
      case OrganizationType.MediaPartner: return 'Media Partner';
      case OrganizationType.CommunityPartner: return 'Community Partner';
      case OrganizationType.Host: return 'Host';
      case OrganizationType.Other: return 'Other';
      default: return 'Organization';
    }
  }
}