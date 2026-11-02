import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TicketTypeService, TicketType, TicketTypePayload, GaPurchaseRequest } from '../../../core/services/ticket-type.service';
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

  // ── Shared event access code (unlocks access-code-gated categories) ──────────
  accessCode = '';
  accessCodeSaving = false;
  accessCodeSaved = false;

  // ── Admin offline "Sell tickets" panel ─────────────────────────────────────
  showSell = false;
  sellSaving = false;
  sellError = '';
  sellQuantities: Record<string, number> = {};
  sellDiscount = 0;
  sellPaymentCollected = false;
  sellCustomer = { name: '', email: '', phone: '', postCode: '', transactionRef: '' };

  private readonly eventContext = inject(EventContextService);
  private readonly destroyRef = inject(DestroyRef);

  constructor(private route: ActivatedRoute, private service: TicketTypeService) {}

  ngOnInit(): void {
    // React to :eventId changes so switching events from the header (which reuses this
    // component and only changes the URL) reloads for the newly selected event.
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.eventId = params.get('eventId') || '';
        this.cancelEdit();
        this.closeSell();
        this.load();
        this.loadAccessCode();
      });
  }

  loadAccessCode(): void {
    if (!this.eventId) return;
    this.service.getAccessCode(this.eventId).subscribe({
      next: (code) => { this.accessCode = code ?? ''; },
      error: () => { /* non-fatal */ }
    });
  }

  saveAccessCode(): void {
    this.accessCodeSaving = true;
    this.accessCodeSaved = false;
    this.service.setAccessCode(this.eventId, this.accessCode?.trim() || null).subscribe({
      next: () => { this.accessCodeSaving = false; this.accessCodeSaved = true; setTimeout(() => this.accessCodeSaved = false, 2500); },
      error: () => { this.accessCodeSaving = false; this.error = 'Failed to save access code'; }
    });
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
      hideWhenSoldOut: false,
      serviceFee: 0,
      requiresAccessCode: false
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
      hideWhenSoldOut: t.hideWhenSoldOut,
      serviceFee: t.serviceFee ?? 0,
      requiresAccessCode: t.requiresAccessCode ?? false
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

  // ── Admin offline "Sell tickets" ────────────────────────────────────────────

  /** Active categories buyers/admin can actually sell. */
  get sellableTypes(): TicketType[] {
    return this.ticketTypes.filter(t => t.isActive);
  }

  openSell(): void {
    this.sellError = '';
    this.sellDiscount = 0;
    this.sellPaymentCollected = false;
    this.sellCustomer = { name: '', email: '', phone: '', postCode: '', transactionRef: '' };
    this.sellQuantities = {};
    for (const t of this.sellableTypes) this.sellQuantities[t.id] = 0;
    this.showSell = true;
  }

  closeSell(): void {
    this.showSell = false;
    this.sellError = '';
  }

  sellQty(id: string): number {
    const n = Number(this.sellQuantities[id]);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  get sellSubtotal(): number {
    return this.sellableTypes.reduce((s, t) => s + this.sellQty(t.id) * (t.price || 0), 0);
  }

  get sellFees(): number {
    return this.sellableTypes.reduce((s, t) => s + this.sellQty(t.id) * (t.serviceFee || 0), 0);
  }

  get sellUnitCount(): number {
    return this.sellableTypes.reduce((s, t) => s + this.sellQty(t.id), 0);
  }

  get sellTotal(): number {
    const d = Number(this.sellDiscount) > 0 ? Number(this.sellDiscount) : 0;
    return Math.max(0, this.sellSubtotal + this.sellFees - d);
  }

  submitSell(): void {
    if (this.sellUnitCount < 1) { this.sellError = 'Select at least one ticket.'; return; }
    if (!this.sellCustomer.name?.trim()) { this.sellError = 'Customer name is required.'; return; }

    const tickets = this.sellableTypes
      .map(t => ({ ticketTypeId: t.id, quantity: this.sellQty(t.id) }))
      .filter(l => l.quantity > 0);

    const request: GaPurchaseRequest = {
      eventId: this.eventId,
      customerName: this.sellCustomer.name.trim(),
      customerEmail: this.sellCustomer.email?.trim() || '',
      customerPhone: this.sellCustomer.phone?.trim() || '',
      customerPostCode: this.sellCustomer.postCode?.trim() || '',
      transactionRef: this.sellCustomer.transactionRef?.trim() || '',
      discount: Number(this.sellDiscount) > 0 ? Number(this.sellDiscount) : 0,
      paymentCollected: this.sellPaymentCollected,
      tickets
    };

    this.sellSaving = true;
    this.sellError = '';
    this.service.purchaseGa(request).subscribe({
      next: (r) => {
        this.sellSaving = false;
        if (r.success) { this.closeSell(); this.load(); }
        else { this.sellError = r.error || 'Purchase failed'; }
      },
      error: (e) => { this.sellSaving = false; this.sellError = e?.error?.error || 'Purchase failed'; }
    });
  }
}
