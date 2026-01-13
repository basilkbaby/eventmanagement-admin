import { Component, ElementRef, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, ScanResult } from '../../../core/models/ticket.interface';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ticket-scan',
  standalone: true,
  imports: [    
      CommonModule,
      RouterModule,
      MatCardModule,
      MatButtonModule,
      MatIconModule,
      MatChipsModule,
      MatMenuModule,
      MatDialogModule,
      MatDividerModule,
      MatTooltipModule,
      MatProgressSpinnerModule
  ],
  templateUrl: './ticket-scan.component.html',
  styleUrls: ['./ticket-scan.component.scss']
})
export class TicketScanComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  // Scanner state
  isScanning: boolean = false;
  isCameraActive: boolean = false;
  scanResult: ScanResult | null = null;

  // Ticket data
  lastScannedTicket: Ticket | null = null;
  recentScans: Ticket[] = [];

  // Stats properties
  totalScansCount: number = 0;
  successfulScansCount: number = 0;
  failedScansCount: number = 0;

  private stream: MediaStream | null = null;
  private scanInterval: any;

  constructor(
    private ticketService: TicketService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeScanner();
    this.loadRecentScans();
    this.loadScanStats();
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  initializeScanner(): void {
    this.checkCameraAvailability();
  }

  async checkCameraAvailability(): Promise<void> {
    try {
      if (navigator.mediaDevices) {
        this.isCameraActive = true;
      } else {
        this.isCameraActive = false;
      }
    } catch (error) {
      console.error('Camera check failed:', error);
      this.isCameraActive = false;
    }
  }

  async startScanning(): Promise<void> {
    try {
      this.scanResult = null;
      this.isScanning = true;

      // Access camera
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      this.videoElement.nativeElement.srcObject = this.stream;

      // Start QR code scanning interval
      this.scanInterval = setInterval(() => {
        this.scanQRCode();
      }, 1000);

    } catch (error) {
      console.error('Error starting scanner:', error);
      this.isScanning = false;
      this.isCameraActive = false;
      this.showError('Unable to access camera. Please check permissions.');
    }
  }

  stopScanning(): void {
    this.isScanning = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }

  scanQRCode(): void {
    if (!this.isScanning || !this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code scanning
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Simulate QR code scanning
    this.simulateQRScanning(imageData);
  }

  private simulateQRScanning(imageData: ImageData): void {
    // Simulate QR code detection
    const qrCodeDetected = Math.random() > 0.7;

    if (qrCodeDetected) {
      // Simulate different ticket numbers
      const ticketNumbers = ['TKT-123456', 'TKT-789012', 'TKT-345678', 'TKT-901234'];
      const randomTicket = ticketNumbers[Math.floor(Math.random() * ticketNumbers.length)];
      this.processScannedQRCode(randomTicket);
    }
  }

  private processScannedQRCode(ticketNumber: string): void {
    this.stopScanning();

    // Validate ticket with service
    this.ticketService.validateTicket(ticketNumber).subscribe({
      next: (result) => {
        if (result.success && result.ticket) {
          this.handleSuccessfulScan(result.ticket);
        } else {
          this.handleFailedScan(result.message);
        }
      },
      error: (error) => {
        this.handleFailedScan('Error validating ticket');
      }
    });
  }

  private handleSuccessfulScan(ticket: Ticket): void {
    // Update ticket status to used
    this.ticketService.scanTicket(ticket.id, 'scanner').subscribe({
      next: (updatedTicket) => {
        this.scanResult = {
          success: true,
          message: `Ticket validated for ${updatedTicket.attendee.name}`,
          ticket: updatedTicket
        };

        this.lastScannedTicket = updatedTicket;
        this.recentScans.unshift(updatedTicket);
        
        // Update stats
        this.totalScansCount++;
        this.successfulScansCount++;

        // Play success sound
        this.playScanSound(true);

        this.showSuccess('Ticket validated successfully!');
      },
      error: (error) => {
        this.handleFailedScan(error.message);
      }
    });
  }

  private handleFailedScan(message: string): void {
    this.scanResult = {
      success: false,
      message: message
    };

    this.totalScansCount++;
    this.failedScansCount++;

    this.playScanSound(false);
    this.showError(message);
  }

  scanAgain(): void {
    this.scanResult = null;
    this.startScanning();
  }

  manualTicketEntry(): void {
    // Implement manual entry dialog
    this.showInfo('Manual entry feature coming soon!');
  }

  viewTicketDetails(ticket: Ticket): void {
    this.router.navigate(['/admin/orders', ticket.id]);
  }

  // Status helper methods
  getStatusClass(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE: return 'status-active';
      case TicketStatus.USED: return 'status-used';
      case TicketStatus.CANCELLED: return 'status-cancelled';
      case TicketStatus.REFUNDED: return 'status-refunded';
      case TicketStatus.EXPIRED: return 'status-expired';
      default: return 'status-unknown';
    }
  }

  getStatusText(status: TicketStatus): string {
    switch (status) {
      case TicketStatus.ACTIVE: return 'Active';
      case TicketStatus.USED: return 'Used';
      case TicketStatus.CANCELLED: return 'Cancelled';
      case TicketStatus.REFUNDED: return 'Refunded';
      case TicketStatus.EXPIRED: return 'Expired';
      default: return 'Unknown';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString();
  }

  private loadRecentScans(): void {
    // Load recent used tickets
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        this.recentScans = tickets
          .filter(t => t.status === TicketStatus.USED && t.scannedAt)
          .sort((a, b) => new Date(b.scannedAt!).getTime() - new Date(a.scannedAt!).getTime())
          .slice(0, 5);
      },
      error: (error) => {
        console.error('Error loading recent scans:', error);
      }
    });
  }

  private loadScanStats(): void {
    // Calculate stats from tickets
    this.ticketService.getTickets().subscribe({
      next: (tickets) => {
        const usedTickets = tickets.filter(t => t.status === TicketStatus.USED);
        this.totalScansCount = usedTickets.length;
        this.successfulScansCount = usedTickets.length;
        this.failedScansCount = 0; // This would need to be tracked separately
      },
      error: (error) => {
        console.error('Error loading scan stats:', error);
      }
    });
  }

  private playScanSound(success: boolean): void {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = success ? 800 : 400;
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio context not supported');
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showInfo(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
  }
}