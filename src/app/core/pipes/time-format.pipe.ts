// time-format.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime',
  standalone: true
})
export class FormatTimePipe implements PipeTransform {
  transform(timeString: string | null | undefined): string {
    if (!timeString) return '';
    
    // Handle different time formats
    if (timeString.includes(':')) {
      // Format: "HH:mm:ss" or "HH:mm"
      const parts = timeString.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`; // Returns "HH:mm"
      }
    }
    
    // Return as-is if can't parse
    return timeString;
  }
}