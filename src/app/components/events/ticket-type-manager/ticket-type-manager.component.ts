import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TicketTypeService, TicketType, TicketTypePayload } from '../../../core/services/ticket-type.service';
import { EventContextService } from '../../../core/services/event-context.service';

@Component({
  selector: 'app-ticket-type-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ticket-type-manager.component.html',
  styleUrls: ['./ticket-type-manager.component.scss']
})
export class TicketTypeManagerComponent implements OnInit {
  eventId = '';
  ticketTypes: TicketType[] = [];
  loading = false;
  saving = false;
  error = '';

  editingId: string | null = null;
  form: TicketTypePayload = this.blankForm();
  /** Drives the editor panel: null = hidden, otherwise create/edit mode. */
  showForm = false;

  private readonly eventContext = inject(EventContextService);

  constructor(private route: ActivatedRoute, private service: TicketTypeService) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('eventId') || '';
    this.load();
  }

  /** Title of the event these categories belong to (from the shared selection), if known. */
  get eventTitle(): string {
    const ev = this.eventContext.events().find(e => e.id === this.eventId);
    return ev?.title ?? '';
  }

  // ── Summary stats for the header tiles ─────────────────────────────────────
  get totalCapacity(): number {
    return this.ticketTypes.reduce((sum, t) => sum + (t.capacity || 0), 0);
  }

  get totalSold(): number {
    return this.ticketTypes.reduce((sum, t) => sum + (t.quantitySold || 0), 0);
  }

  get totalRevenue(): number {
    return this.ticketTypes.reduce((sum, t) => sum + (t.quantitySold || 0) * (t.price || 0), 0);
  }

  get activeCount(): number {
    return this.ticketTypes.filter(t => t.isActive).length;
  }

  /** Percent of a category's capacity that has been sold (0–100, clamped). */
  soldPercent(t: TicketType): number {
    if (!t.capacity) return 0;
    return Math.min(100, Math.round((t.quantitySold / t.capacity) * 100));
  }

  private blankForm(): TicketTypePayload {
    return {
      eventId: this.eventId,
      name: '',
      description: '',
      price: 0,
      capacity: 100,
      salesStart: null,
      salesEnd: null,
      minPerOrder: 1,
      maxPerOrder: 10,
      sortOrder: 0,
      isActive: true,
      hideWhenSoldOut: false
    };
  }

  load(): void {
    this.loading = true;
    this.service.getByEvent(this.eventId).subscribe({
      next: (items) => { this.ticketTypes = items; this.loading = false; },
      error: () => { this.error = 'Failed to load ticket types'; this.loading = false; }
    });
  }

  startCreate(): void {
    this.editingId = null;
    this.error = '';
    this.form = this.blankForm();
    this.form.eventId = this.eventId;
    this.showForm = true;
  }

  startEdit(t: TicketType): void {
    this.editingId = t.id;
    this.error = '';
    this.showForm = true;
    this.form = {
      eventId: this.eventId,
      name: t.name,
      description: t.description ?? '',
      price: t.price,
      capacity: t.capacity,
      salesStart: t.salesStart ? t.salesStart.substring(0, 16) : null,
      salesEnd: t.salesEnd ? t.salesEnd.substring(0, 16) : null,
      minPerOrder: t.minPerOrder,
      maxPerOrder: t.maxPerOrder,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      hideWhenSoldOut: t.hideWhenSoldOut
    };
  }

  cancelEdit(): void {
    this.editingId = null;
    this.showForm = false;
    this.error = '';
    this.form = this.blankForm();
  }

  save(): void {
    if (!this.form.name?.trim()) { this.error = 'Name is required'; return; }
    this.error = '';
    this.saving = true;
    this.form.eventId = this.eventId;

    const done = () => { this.saving = false; this.cancelEdit(); this.load(); };
    const fail = (e: any) => { this.saving = false; this.error = e?.error?.error || 'Save failed'; };

    if (this.editingId) {
      this.service.update(this.editingId, this.form).subscribe({ next: done, error: fail });
    } else {
      this.service.create(this.form).subscribe({ next: done, error: fail });
    }
  }

  remove(t: TicketType): void {
    if (!confirm(`Delete ticket type "${t.name}"?`)) return;
    this.service.delete(t.id).subscribe({ next: () => this.load(), error: () => this.error = 'Delete failed' });
  }
}
