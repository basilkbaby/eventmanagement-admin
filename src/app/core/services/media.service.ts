import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private base = `${environment.apiUrl}/AdminMedia`;

  constructor(private http: HttpClient) {}

  /** Uploads an image to Azure Blob (SuperAdmin only) and returns its public URL. */
  uploadImage(file: File, folder?: string): Observable<{ url: string }> {
    const form = new FormData();
    form.append('file', file);
    if (folder) form.append('folder', folder);
    return this.http.post<{ url: string }>(`${this.base}/upload-image`, form);
  }
}
