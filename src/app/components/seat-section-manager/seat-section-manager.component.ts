import { Component, OnInit, ViewChild, TemplateRef, inject, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import { EventContextService } from '../../core/services/event-context.service';
import {
  SeatSectionService,
  SectionDto,
  RowConfigDto,
  SeatSectionType,
  RowNumberingType,
  CreateSectionRequest,
  UpdateSectionRequest,
  CreateRowConfigRequest,
  UpdateRowConfigRequest
} from '../../core/services/seat-section.service';
import { SeatMapVisualComponent } from '../seat-map-admin/seat-map-visual/seat-map-visual.component';
import { VenueData, VenueSection, Seat } from '../../core/models/DTOs/seats.DTO.model';
import { generateVenueSeats, SeatRowLabel } from '../../core/utils/seat-generation.util';

@Component({
  selector: 'app-seat-section-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatCardModule,
    MatExpansionModule,
    MatDividerModule,
    MatChipsModule,
    SeatMapVisualComponent
  ],
  templateUrl: './seat-section-manager.component.html',
  styleUrls: ['./seat-section-manager.component.scss']
})
export class SeatSectionManagerComponent implements OnInit {
  @ViewChild('sectionDialog')   sectionDialog!:   TemplateRef<any>;
  @ViewChild('rowConfigDialog') rowConfigDialog!: TemplateRef<any>;
  @ViewChild('deleteDialog')    deleteDialog!:    TemplateRef<any>;

  readonly SeatSectionType  = SeatSectionType;
  readonly RowNumberingType = RowNumberingType;

  sections:        SectionDto[] = [];
  isLoading      = false;
  isSaving       = false;
  activeSectionId: string | null = null;

  isEditSectionMode    = false;
  isEditRowConfigMode  = false;
  selectedSection:   SectionDto   | null = null;
  selectedRowConfig: RowConfigDto | null = null;
  deleteTarget: 'section' | 'rowconfig' = 'section';

  // Venue preview — rendered with the same canvas + geometry as the live seat map
  venueData:        VenueData | null = null;
  previewSeats:     Seat[]           = [];
  previewRowLabels: SeatRowLabel[]   = [];

  sectionForm:   FormGroup;
  rowConfigForm: FormGroup;

  readonly sectionTypes = [
    { value: SeatSectionType.SEAT,     label: 'Seated' },
    { value: SeatSectionType.STANDING, label: 'Standing' },
    { value: SeatSectionType.FOH,      label: 'Front of House' }
  ];

  readonly rowNumberingTypes = [
    { value: RowNumberingType.PERSECTION, label: 'Per Section' },
    { value: RowNumberingType.CONTINUOUS, label: 'Continuous'  }
  ];

  readonly numberingDirections = [
    { value: 'left',  label: 'Left' },
    { value: 'right', label: 'Right' }
  ];

  constructor(
    private seatSectionService: SeatSectionService,
    readonly eventContext: EventContextService,
    private fb:      FormBuilder,
    private dialog:  MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.sectionForm = this.fb.group({
      name:               ['', [Validators.required, Validators.maxLength(100)]],
      sectionLabel:       ['',  Validators.maxLength(200)],
      seatSectionType:    [SeatSectionType.SEAT, Validators.required],
      rows:               [10,  [Validators.required, Validators.min(1)]],
      seatsPerRow:        [20,  [Validators.required, Validators.min(1)]],
      x:                  [0,   Validators.required],
      y:                  [0,   Validators.required],
      rowOffset:          [null],
      numberingDirection: ['left'],
      rowNumberingType:   [RowNumberingType.PERSECTION],
      skipRowLetters:     [''],
      hasColumnGap:       [false],
      gapAfterColumn:     [null],
      gapSize:            [null],
      gapColumns:         ['']
    });

    this.rowConfigForm = this.fb.group({
      fromRow:            [1,          [Validators.required, Validators.min(1)]],
      toRow:              [1,          [Validators.required, Validators.min(1)]],
      fromColumn:         [1,          [Validators.required, Validators.min(1)]],
      toColumn:           [1,          [Validators.required, Validators.min(1)]],
      type:               ['STANDARD', [Validators.required, Validators.maxLength(50)]],
      customPrice:        [0,          [Validators.required, Validators.min(0)]],
      color:              ['#4caf50',   Validators.required],
      blockLetter:        [''],
      numberingDirection: ['left'],
      rowNumberingType:   [RowNumberingType.PERSECTION],
      skipRowLetters:     [''],
      hasColumnGap:       [false],
      gapAfterColumn:     [null],
      gapSize:            [null],
      gapColumns:         ['']
    });

    const destroyRef = inject(DestroyRef);
    toObservable(this.eventContext.selectedEventId)
      .pipe(filter(id => !!id), takeUntilDestroyed(destroyRef))
      .subscribe(() => this.loadSections());
  }

  ngOnInit(): void {}

  // ── Data ──────────────────────────────────────────────────────────────────

  loadSections(): void {
    const eventId = this.eventContext.selectedEventId();
    if (!eventId) return;
    this.isLoading = true;
    this.seatSectionService.getSections(eventId).subscribe({
      next:  (s) => {
        const raw = s || [];
        // Build the venue preview from the raw 0-based data so it matches the live
        // seat map exactly (must run before the 1-based display adjustment below).
        this.buildVenuePreview(raw);

        // Rows are stored 0-based in the backend but shown 1-based in the admin,
        // so the first row reads as "1" instead of "0".
        raw.forEach(sec => {
          (sec.rowConfigs || []).forEach(rc => {
            rc.fromRow = rc.fromRow + 1;
            rc.toRow = rc.toRow + 1;
          });
          // Show row configs left-to-right (by their starting column, ascending).
          sec.rowConfigs = (sec.rowConfigs || []).sort((a, b) => (a.fromColumn ?? 0) - (b.fromColumn ?? 0));
        });
        // Show sections top-to-bottom (by their y position, ascending).
        this.sections = raw.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
        this.isLoading = false;
      },
      error: () => { this.showError('Failed to load sections'); this.isLoading = false; }
    });
  }

  // Build the venue preview (same renderer + geometry as the live seat map).
  private buildVenuePreview(sections: SectionDto[]): void {
    // Clone sections so recentering doesn't mutate the data shown in the cards / edit form.
    const venueSections = (sections as unknown as VenueSection[]).map(s => ({ ...s }));
    const { seats, rowLabels } = generateVenueSeats(venueSections);

    // The renderer draws the stage at a fixed canvas centre (1400 / 2). Shift the whole
    // layout so its horizontal midpoint sits under the stage, keeping the stage centered.
    const STAGE_CENTRE = 700;
    if (venueSections.length) {
      let minX = Infinity, maxX = -Infinity;
      for (const seat of seats) { minX = Math.min(minX, seat.cx); maxX = Math.max(maxX, seat.cx); }
      for (const s of venueSections) {
        minX = Math.min(minX, s.x);
        maxX = Math.max(maxX, s.x + s.seatsPerRow * 26);
      }
      const dx = STAGE_CENTRE - (minX + maxX) / 2;
      if (isFinite(dx) && dx !== 0) {
        venueSections.forEach(s => s.x += dx);
        seats.forEach(seat => seat.cx += dx);
        rowLabels.forEach(l => l.x += dx);
      }
    }

    this.previewSeats     = seats;
    this.previewRowLabels = rowLabels;
    this.venueData = {
      eventName: '',
      eventDate: new Date(),
      sections: venueSections,
      seatManagement: { reservedSeats: [], blockedSeats: [], soldSeats: [], unavailableSeats: [] }
    };
  }

  // ── Section Dialog ────────────────────────────────────────────────────────

  openSectionDialog(section?: SectionDto): void {
    this.isEditSectionMode = !!section;
    this.selectedSection   = section || null;

    if (section) {
      this.sectionForm.patchValue({
        name:               section.name,
        sectionLabel:       section.sectionLabel,
        seatSectionType:    section.seatSectionType,
        rows:               section.rows,
        seatsPerRow:        section.seatsPerRow,
        x:                  section.x,
        y:                  section.y,
        rowOffset:          section.rowOffset,
        numberingDirection: this.normalizeDirection(section.numberingDirection),
        rowNumberingType:   section.rowNumberingType,
        skipRowLetters:     (section.skipRowLetters || []).join(','),
        hasColumnGap:       section.hasColumnGap,
        gapAfterColumn:     section.gapAfterColumn,
        gapSize:            section.gapSize,
        gapColumns:         section.gapColumns || ''
      });
    } else {
      this.sectionForm.reset({
        name: '', sectionLabel: '', seatSectionType: SeatSectionType.SEAT,
        rows: 10, seatsPerRow: 20, x: 0, y: 0,
        rowOffset: null, numberingDirection: 'left',
        rowNumberingType: RowNumberingType.PERSECTION,
        skipRowLetters: '', hasColumnGap: false,
        gapAfterColumn: null, gapSize: null, gapColumns: ''
      });
    }

    this.dialog.open(this.sectionDialog, {
      width:     '640px',
      maxWidth:  '96vw',
      maxHeight: '92vh',
      panelClass: 'section-form-dialog'
    });
  }

  onSectionSubmit(): void {
    if (this.sectionForm.invalid) { this.markAllTouched(this.sectionForm); return; }

    const fv      = this.sectionForm.value;
    const eventId = this.eventContext.selectedEventId()!;
    const x       = +fv.x;
    const y       = +fv.y;
    const rows    = +fv.rows;
    const cols    = +fv.seatsPerRow;
    // GAP=26px matches the seat map renderer (columnPosition * 26, globalRow * 26)
    const mx = x + cols * 26;
    const my = y + rows * 26;

    this.isSaving = true;

    if (this.isEditSectionMode && this.selectedSection) {
      const payload: UpdateSectionRequest = {
        eventId, name: fv.name,
        x, y, mx, my, rows, seatsPerRow: cols,
        sectionLabel: fv.sectionLabel || fv.name,
        rowOffset: fv.rowOffset != null ? +fv.rowOffset : null
      };
      this.seatSectionService.updateSection(this.selectedSection.id, payload).subscribe({
        next:  () => { this.showSuccess('Section updated'); this.loadSections(); this.dialog.closeAll(); this.isSaving = false; },
        error: (e) => { this.showError(e?.error?.error || 'Failed to update section'); this.isSaving = false; }
      });
    } else {
      const payload: CreateSectionRequest = {
        eventId, name: fv.name,
        x, mx, y, my, rows, seatsPerRow: cols,
        sectionLabel: fv.sectionLabel || fv.name,
        rowOffset: fv.rowOffset != null ? +fv.rowOffset : null,
        seatSectionType:    fv.seatSectionType,
        numberingDirection: fv.numberingDirection || 'left',
        rowNumberingType:   fv.rowNumberingType,
        skipRowLetters:     fv.skipRowLetters || '',
        hasColumnGap:       !!fv.hasColumnGap,
        gapAfterColumn: fv.hasColumnGap ? (+fv.gapAfterColumn || 0) : 0,
        gapSize:        fv.hasColumnGap ? (+fv.gapSize        || 0) : 0,
        gapColumns:     fv.hasColumnGap ? (fv.gapColumns      || '') : '',
        rowConfigs: []
      };
      this.seatSectionService.createSection(payload).subscribe({
        next:  () => { this.showSuccess('Section created'); this.loadSections(); this.dialog.closeAll(); this.isSaving = false; },
        error: (e) => { this.showError(e?.error?.error || 'Failed to create section'); this.isSaving = false; }
      });
    }
  }

  // ── Row Config Dialog ─────────────────────────────────────────────────────

  openRowConfigDialog(section: SectionDto, rowConfig?: RowConfigDto): void {
    this.isEditRowConfigMode = !!rowConfig;
    this.selectedSection     = section;
    this.selectedRowConfig   = rowConfig || null;

    if (rowConfig) {
      this.rowConfigForm.patchValue({
        fromRow: rowConfig.fromRow, toRow: rowConfig.toRow,
        fromColumn: rowConfig.fromColumn, toColumn: rowConfig.toColumn,
        type: rowConfig.type, customPrice: rowConfig.customPrice, color: rowConfig.color,
        blockLetter: rowConfig.blockLetter || '',
        numberingDirection: this.normalizeDirection(rowConfig.numberingDirection),
        rowNumberingType:   rowConfig.rowNumberingType,
        skipRowLetters:     (rowConfig.skipRowLetters || []).join(','),
        hasColumnGap: rowConfig.hasColumnGap,
        gapAfterColumn: rowConfig.gapAfterColumn,
        gapSize: rowConfig.gapSize,
        gapColumns: rowConfig.gapColumns || ''
      });
    } else {
      this.rowConfigForm.reset({
        fromRow: 1, toRow: section.rows, fromColumn: 1, toColumn: section.seatsPerRow,
        type: 'STANDARD', customPrice: 0, color: '#4caf50', blockLetter: '',
        numberingDirection: 'left', rowNumberingType: RowNumberingType.PERSECTION,
        skipRowLetters: '', hasColumnGap: false,
        gapAfterColumn: null, gapSize: null, gapColumns: ''
      });
    }

    this.dialog.open(this.rowConfigDialog, { width: '680px', maxWidth: '96vw', maxHeight: '92vh' });
  }

  onRowConfigSubmit(): void {
    if (this.rowConfigForm.invalid) { this.markAllTouched(this.rowConfigForm); return; }

    const fv = this.rowConfigForm.value;
    this.isSaving = true;

    if (this.isEditRowConfigMode && this.selectedRowConfig) {
      const payload: UpdateRowConfigRequest = {
        // Admin enters 1-based rows; the backend stores them 0-based.
        fromRow: +fv.fromRow - 1, toRow: +fv.toRow - 1,
        fromColumn: +fv.fromColumn, toColumn: +fv.toColumn,
        type: fv.type, customPrice: +fv.customPrice, color: fv.color,
        blockLetter: fv.blockLetter || '',
        numberingDirection: fv.numberingDirection || 'left',
        rowNumberingType: fv.rowNumberingType,
        skipRowLetters: fv.skipRowLetters || '',
        hasColumnGap: !!fv.hasColumnGap,
        gapAfterColumn: fv.hasColumnGap && fv.gapAfterColumn != null && fv.gapAfterColumn !== '' ? +fv.gapAfterColumn : null,
        gapSize:        fv.hasColumnGap && fv.gapSize        != null && fv.gapSize        !== '' ? +fv.gapSize        : null,
        gapColumns:     fv.hasColumnGap ? (fv.gapColumns      || '') : ''
      };
      this.seatSectionService.updateRowConfig(this.selectedRowConfig.id, payload).subscribe({
        next:  () => { this.showSuccess('Row config updated'); this.loadSections(); this.dialog.closeAll(); this.isSaving = false; },
        error: (e) => { this.showError(e?.error?.error || 'Failed to update row config'); this.isSaving = false; }
      });
    } else {
      const payload: CreateRowConfigRequest = {
        // Admin enters 1-based rows; the backend stores them 0-based.
        fromRow: +fv.fromRow - 1, toRow: +fv.toRow - 1,
        fromColumn: +fv.fromColumn, toColumn: +fv.toColumn,
        type: fv.type, customPrice: +fv.customPrice, color: fv.color,
        blockLetter: fv.blockLetter || '',
        numberingDirection: fv.numberingDirection || 'left',
        rowNumberingType: fv.rowNumberingType,
        skipRowLetters: fv.skipRowLetters || '',
        hasColumnGap: !!fv.hasColumnGap,
        gapAfterColumn: fv.hasColumnGap && fv.gapAfterColumn != null && fv.gapAfterColumn !== '' ? +fv.gapAfterColumn : null,
        gapSize:        fv.hasColumnGap && fv.gapSize        != null && fv.gapSize        !== '' ? +fv.gapSize        : null,
        gapColumns:     fv.hasColumnGap ? (fv.gapColumns      || '') : ''
      };
      this.seatSectionService.addRowConfig(this.selectedSection!.id, payload).subscribe({
        next:  () => { this.showSuccess('Row config added'); this.loadSections(); this.dialog.closeAll(); this.isSaving = false; },
        error: (e) => { this.showError(e?.error?.error || 'Failed to add row config'); this.isSaving = false; }
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  openDeleteSectionDialog(section: SectionDto): void {
    this.selectedSection = section;
    this.deleteTarget    = 'section';
    this.dialog.open(this.deleteDialog, { width: '420px' });
  }

  openDeleteRowConfigDialog(section: SectionDto, rowConfig: RowConfigDto): void {
    this.selectedSection   = section;
    this.selectedRowConfig = rowConfig;
    this.deleteTarget      = 'rowconfig';
    this.dialog.open(this.deleteDialog, { width: '420px' });
  }

  confirmDelete(): void {
    this.isSaving = true;
    if (this.deleteTarget === 'section' && this.selectedSection) {
      this.seatSectionService.deleteSection(this.selectedSection.id).subscribe({
        next: () => {
          this.showSuccess('Section deleted');
          this.sections = this.sections.filter(s => s.id !== this.selectedSection!.id);
          this.dialog.closeAll();
          this.isSaving = false;
          this.selectedSection = null;
        },
        error: () => { this.showError('Failed to delete section'); this.isSaving = false; }
      });
    } else if (this.deleteTarget === 'rowconfig' && this.selectedRowConfig) {
      this.seatSectionService.deleteRowConfig(this.selectedRowConfig.id).subscribe({
        next: () => {
          this.showSuccess('Row config deleted');
          this.loadSections();
          this.dialog.closeAll();
          this.isSaving = false;
          this.selectedRowConfig = null;
        },
        error: () => { this.showError('Failed to delete row config'); this.isSaving = false; }
      });
    }
  }

  // ── Section list / legend ────────────────────────────────────────────────

  // Expand/collapse a section card to reveal its row-config details.
  selectSection(section: SectionDto): void {
    this.activeSectionId = this.activeSectionId === section.id ? null : section.id;
  }

  /** Swatch colour for a section's legend entry when it has no row configs. */
  getSectionBg(section: SectionDto): string {
    const cfgs = section.rowConfigs;
    if (!cfgs.length) {
      if (section.seatSectionType === SeatSectionType.STANDING) return '#66bb6a';
      if (section.seatSectionType === SeatSectionType.FOH)      return '#ffa726';
      return '#90caf9';
    }
    if (cfgs.length === 1) return cfgs[0].color;
    // Build hard-stop gradient so each tier occupies its exact row proportion
    const total = section.rows;
    const stops: string[] = [];
    cfgs.forEach(rc => {
      const from = ((rc.fromRow - 1) / total * 100).toFixed(1);
      const to   = (rc.toRow         / total * 100).toFixed(1);
      stops.push(`${rc.color} ${from}%`, `${rc.color} ${to}%`);
    });
    return `linear-gradient(180deg, ${stops.join(', ')})`;
  }

  // ─────────────────────────────────────────────────────────────────────────

  getSectionTypeLabel(type: SeatSectionType): string {
    switch (type) {
      case SeatSectionType.SEAT:     return 'Seated';
      case SeatSectionType.STANDING: return 'Standing';
      case SeatSectionType.FOH:      return 'Front of House';
      default:                        return 'Unknown';
    }
  }

  // Actual seats come from the row configs (each config = a block of rows × columns),
  // not the full section grid. rowConfigs here are 1-based, so toX - fromX + 1.
  getTotalSeats(s: SectionDto): number {
    const configs = s.rowConfigs || [];
    return configs.reduce((sum, rc) =>
      sum + (rc.toRow - rc.fromRow + 1) * (rc.toColumn - rc.fromColumn + 1), 0);
  }

  // Rows / columns actually covered by the row configs (the used extent), not the grid.
  getRowCount(s: SectionDto): number {
    const c = s.rowConfigs || [];
    if (!c.length) return 0;
    return Math.max(...c.map(rc => rc.toRow)) - Math.min(...c.map(rc => rc.fromRow)) + 1;
  }
  getColCount(s: SectionDto): number {
    const c = s.rowConfigs || [];
    if (!c.length) return 0;
    return Math.max(...c.map(rc => rc.toColumn)) - Math.min(...c.map(rc => rc.fromColumn)) + 1;
  }

  get sectionHasColumnGap(): boolean { return !!this.sectionForm.get('hasColumnGap')?.value; }
  get rowConfigHasGap():     boolean { return !!this.rowConfigForm.get('hasColumnGap')?.value; }

  // Map any stored value (incl. legacy 'LTR'/'RTL') to the 'left' | 'right' the renderer uses.
  private normalizeDirection(dir?: string | null): 'left' | 'right' {
    return (dir || '').toLowerCase().startsWith('r') ? 'right' : 'left';
  }

  private markAllTouched(fg: FormGroup): void {
    Object.values(fg.controls).forEach(c => c.markAsTouched());
  }

  private showSuccess(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3500, panelClass: ['snackbar-success'], horizontalPosition: 'end', verticalPosition: 'top' });
  }

  private showError(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['snackbar-error'], horizontalPosition: 'end', verticalPosition: 'top' });
  }
}
