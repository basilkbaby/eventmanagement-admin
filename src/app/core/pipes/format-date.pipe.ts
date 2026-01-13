import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDate',
  standalone: true // Remove this if not using standalone components
})
export class FormatDatePipe implements PipeTransform {
  transform(date: Date | string | number, format?: string): string {
    // Handle null/undefined input
    if (!date) {
      return '';
    }

    // Convert string or number to Date object
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;

    // Handle invalid dates
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // Return formatted date
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}