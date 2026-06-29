import { Component, OnInit, ViewChild, TemplateRef, inject, DestroyRef } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, debounceTime } from 'rxjs';
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

export interface PreviewCell {
  color: string;
  type: string;
  price?: number;
}

export interface PreviewRow {
  label: string;
  cells: PreviewCell[];
}

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
    MatChipsModule
  ],
  templateUrl: './seat-section-manager.component.html',
  styleUrls: ['./seat-section-manager.component.scss']
})
export class SeatSectionManagerComponent implements OnInit {
  @ViewChild('sectionDialog')   sectionDialog!:   TemplateRef<any>;
  @ViewChild('rowConfigDialog') rowConfigDialog!: TemplateRef<any>;
  @ViewChild('deleteDialog')    deleteDialog!:    TemplateRef<any>;
  @ViewChild('previewDialog')   previewDialog!:   TemplateRef<any>;

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

  // Full-screen preview
  previewSection: SectionDto | null = null;
  previewRows:    PreviewRow[]      = [];

  // Live preview inside the section form dialog
  livePreviewRows: PreviewRow[] = [];

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

    // Rebuild live preview whenever relevant form fields change
    this.sectionForm.valueChanges
      .pipe(debounceTime(120))
      .subscribe(() => this.buildLivePreview());

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
        // Rows are stored 0-based in the backend but shown 1-based in the admin,
        // so the first row reads as "1" instead of "0".
        (s || []).forEach(sec => {
          (sec.rowConfigs || []).forEach(rc => {
            rc.fromRow = rc.fromRow + 1;
            rc.toRow = rc.toRow + 1;
          });
          // Show row configs left-to-right (by their starting column, ascending).
          sec.rowConfigs = (sec.rowConfigs || []).sort((a, b) => (a.fromColumn ?? 0) - (b.fromColumn ?? 0));
        });
        // Show sections top-to-bottom (by their y position, ascending).
        this.sections = (s || []).sort((a, b) => (a.y ?? 0) - (b.y ?? 0));
        this.isLoading = false;
      },
      error: () => { this.showError('Failed to load sections'); this.isLoading = false; }
    });
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

    this.buildLivePreview();

    this.dialog.open(this.sectionDialog, {
      width:     '1100px',
      maxWidth:  '98vw',
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

  // ── Full Preview ──────────────────────────────────────────────────────────

  openFullPreview(section: SectionDto): void {
    this.previewSection = section;
    this.previewRows    = this.buildRowsFor(section.rows, section.seatsPerRow, section.rowConfigs,
                            (section.skipRowLetters || []).join(','), section.rowOffset || 0);
    this.dialog.open(this.previewDialog, {
      width:      '95vw',
      maxWidth:   '1300px',
      maxHeight:  '90vh',
      panelClass: 'full-preview-dialog'
    });
  }

  // Returns every-5th column-number label for the preview header row
  getColLabels(seatsPerRow: number): (number | null)[] {
    return Array.from({ length: seatsPerRow }, (_, i) => {
      const n = i + 1;
      return (n === 1 || n % 5 === 0 || n === seatsPerRow) ? n : null;
    });
  }

  // ── Live Preview (form dialog) ────────────────────────────────────────────

  buildLivePreview(): void {
    const fv    = this.sectionForm.value;
    const rows  = Math.max(1, Math.min(+fv.rows  || 1, 80));
    const cols  = Math.max(1, Math.min(+fv.seatsPerRow || 1, 80));
    const skip  = fv.skipRowLetters || '';
    const off   = +fv.rowOffset || 0;
    const cfgs  = (this.isEditSectionMode && this.selectedSection)
                    ? this.selectedSection.rowConfigs
                    : [];

    this.livePreviewRows = this.buildRowsFor(rows, cols, cfgs, skip, off);
  }

  // ── Shared preview builder ────────────────────────────────────────────────

  buildRowsFor(
    rows: number,
    cols: number,
    configs: RowConfigDto[],
    skipLettersStr: string,
    rowOffset: number
  ): PreviewRow[] {
    const labels = this.computeRowLabels(rows, skipLettersStr, rowOffset);
    return labels.map((label, ri) => ({
      label,
      cells: Array.from({ length: cols }, (_, ci) => {
        const cfg = configs.find(rc =>
          (ri + 1) >= rc.fromRow && (ri + 1) <= rc.toRow &&
          (ci + 1) >= rc.fromColumn && (ci + 1) <= rc.toColumn
        );
        return { color: cfg?.color ?? '#e8eaed', type: cfg?.type ?? '', price: cfg?.customPrice };
      })
    }));
  }

  computeRowLabels(rows: number, skipLettersStr: string, offset: number): string[] {
    const skip   = new Set((skipLettersStr || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
    const labels: string[] = [];
    let code     = 65; // 'A'
    let advanced = 0;

    // skip `offset` usable letters at the start
    while (advanced < offset && code <= 90) {
      if (!skip.has(String.fromCharCode(code))) advanced++;
      code++;
    }

    for (let r = 0; r < rows; r++) {
      while (code <= 90 && skip.has(String.fromCharCode(code))) code++;
      labels.push(code <= 90 ? String.fromCharCode(code) : `R${r + 1}`);
      code++;
    }
    return labels;
  }

  // ── UI Helpers ────────────────────────────────────────────────────────────

  // ── Venue canvas (right-side overview) ───────────────────────────────────

  selectSection(section: SectionDto): void {
    this.activeSectionId = this.activeSectionId === section.id ? null : section.id;
  }

  // GAP=26 matches seat-map-admin: cx = section.x + columnPosition*26, cy = section.y + globalRow*26
  private readonly SEAT_GAP = 26;

  /** Right/bottom edges always derived from GAP=26, matching the seat map renderer exactly. */
  private sectionRight(s: SectionDto):  number { return s.x + s.seatsPerRow * this.SEAT_GAP; }
  private sectionBottom(s: SectionDto): number { return s.y + s.rows        * this.SEAT_GAP; }

  get canvasBounds(): { minX: number; minY: number; width: number; height: number } {
    if (!this.sections.length) return { minX: 0, minY: 0, width: 500, height: 400 };
    const minX  = Math.min(...this.sections.map(s => s.x));
    const minY  = Math.min(...this.sections.map(s => s.y));
    const maxMX = Math.max(...this.sections.map(s => this.sectionRight(s)));
    const maxMY = Math.max(...this.sections.map(s => this.sectionBottom(s)));
    const pad   = this.SEAT_GAP * 2;
    return {
      minX:   minX - pad,
      minY:   minY - pad,
      width:  (maxMX - minX) + pad * 2 || 500,
      height: (maxMY - minY) + pad * 2 || 400
    };
  }

  /** Percentage-based position/size for each section block inside the venue canvas. */
  getSectionCanvasStyle(section: SectionDto): Record<string, string> {
    const b = this.canvasBounds;
    return {
      left:   `${((section.x                              - b.minX) / b.width  * 100).toFixed(3)}%`,
      top:    `${((section.y                              - b.minY) / b.height * 100).toFixed(3)}%`,
      width:  `${(section.seatsPerRow * this.SEAT_GAP               / b.width  * 100).toFixed(3)}%`,
      height: `${(section.rows        * this.SEAT_GAP               / b.height * 100).toFixed(3)}%`
    };
  }

  /** Background for a venue canvas block — proportional gradient matching row tier heights. */
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

  getSectionTierBands(s: SectionDto): { color: string; flex: number; label: string }[] {
    const sorted = [...s.rowConfigs].sort((a, b) => a.fromRow - b.fromRow);
    const bands: { color: string; flex: number; label: string }[] = [];
    let cursor = 1;
    for (const rc of sorted) {
      if (rc.fromRow > cursor) {
        bands.push({ color: '#dde1e7', flex: rc.fromRow - cursor, label: '' });
      }
      bands.push({ color: rc.color, flex: rc.toRow - rc.fromRow + 1, label: rc.type });
      cursor = rc.toRow + 1;
    }
    if (cursor <= s.rows) {
      bands.push({ color: '#dde1e7', flex: s.rows - cursor + 1, label: '' });
    }
    return bands;
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
