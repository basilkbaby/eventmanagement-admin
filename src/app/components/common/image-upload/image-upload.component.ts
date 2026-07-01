import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MediaService } from '../../../core/services/media.service';

/**
 * Reusable image uploader. Uploads the chosen file to Azure Blob (via AdminMedia,
 * SuperAdmin only) and emits the resulting public URL. Supports [(value)] binding.
 *
 *   <app-image-upload [(value)]="form.controls.banner.value" folder="event-banners">
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  /** Blob sub-folder to store the image under. */
  @Input() folder = 'event-images';
  @Input() accept = 'image/png,image/jpeg,image/webp,image/gif';

  uploading = false;
  error = '';

  private readonly maxBytes = 5 * 1024 * 1024;

  constructor(private media: MediaService) {}

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-selecting the same file
    if (!file) return;

    this.error = '';
    if (!file.type.startsWith('image/')) { this.error = 'Please choose an image file.'; return; }
    if (file.size > this.maxBytes)       { this.error = 'Image must be 5MB or smaller.'; return; }

    this.uploading = true;
    this.media.uploadImage(file, this.folder).subscribe({
      next: (res) => {
        this.uploading = false;
        this.value = res.url;
        this.valueChange.emit(res.url);
      },
      error: (err) => {
        this.uploading = false;
        this.error = err?.error?.error || 'Upload failed. Please try again.';
      }
    });
  }

  clear(): void {
    this.value = '';
    this.valueChange.emit('');
  }
}
