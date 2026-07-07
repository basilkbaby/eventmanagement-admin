import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum SeatSectionType { SEAT = 0, STANDING = 1, FOH = 2 }
export enum RowNumberingType { PERSECTION = 0, CONTINUOUS = 1 }

export interface SectionDto {
  id: string;
  eventId: string;
  name: string;
  x: number;
  y: number;
  mx: number;
  my: number;
  rows: number;
  seatsPerRow: number;
  sectionLabel: string;
  numberingDirection: string;
  seatSectionType: SeatSectionType;
  rowNumberingType: RowNumberingType;
  skipRowLetters: string[] | null;
  hasColumnGap: boolean;
  gapAfterColumn: number | null;
  gapSize: number | null;
  gapColumns: string | null;
  rowOffset: number | null;
  curveStrength: number;
  rotation: number;
  rowWidthStep: number;
  isActive: boolean;
  rowConfigs: RowConfigDto[];
}

export interface RowConfigDto {
  id: string;
  fromRow: number;
  toRow: number;
  fromColumn: number;
  toColumn: number;
  type: string;
  customPrice: number;
  color: string;
  blockLetter: string;
  numberingDirection: string;
  rowNumberingType: RowNumberingType;
  skipRowLetters: string[] | null;
  hasColumnGap: boolean;
  gapAfterColumn: number | null;
  gapSize: number | null;
  gapColumns: string | null;
}

export interface CreateSectionRequest {
  eventId: string;
  name: string;
  x: number;
  mx: number;
  y: number;
  my: number;
  rows: number;
  seatsPerRow: number;
  sectionLabel: string;
  rowOffset: number | null;
  curveStrength: number;
  rotation: number;
  rowWidthStep: number;
  seatSectionType: SeatSectionType;
  numberingDirection: string;
  rowNumberingType: RowNumberingType;
  skipRowLetters: string;
  hasColumnGap: boolean;
  gapAfterColumn: number;
  gapSize: number;
  gapColumns: string;
  rowConfigs: CreateRowConfigRequest[];
}

export interface UpdateSectionRequest {
  eventId: string;
  name: string;
  x: number;
  y: number;
  mx: number;
  my: number;
  rows: number;
  seatsPerRow: number;
  sectionLabel: string;
  rowOffset: number | null;
  curveStrength: number;
  rotation: number;
  rowWidthStep: number;
}

export interface CreateRowConfigRequest {
  fromRow: number;
  toRow: number;
  fromColumn: number;
  toColumn: number;
  type: string;
  customPrice: number;
  color: string;
  blockLetter: string;
  numberingDirection: string;
  rowNumberingType: RowNumberingType;
  skipRowLetters: string;
  hasColumnGap: boolean;
  gapAfterColumn: number | null;
  gapSize: number | null;
  gapColumns: string;
}

export interface UpdateRowConfigRequest {
  fromRow: number;
  toRow: number;
  fromColumn: number;
  toColumn: number;
  type: string;
  customPrice: number;
  color: string;
  blockLetter: string;
  numberingDirection: string;
  rowNumberingType: RowNumberingType;
  skipRowLetters: string;
  hasColumnGap: boolean;
  gapAfterColumn: number | null;
  gapSize: number | null;
  gapColumns: string;
}

@Injectable({ providedIn: 'root' })
export class SeatSectionService {
  private base = `${environment.apiUrl}/admin/adminseat`;

  constructor(private http: HttpClient) {}

  getSections(eventId: string): Observable<SectionDto[]> {
    return this.http.get<SectionDto[]>(`${this.base}/events/${eventId}/sections`);
  }

  createSection(dto: CreateSectionRequest): Observable<SectionDto> {
    return this.http.post<SectionDto>(`${this.base}/sections`, dto);
  }

  updateSection(sectionId: string, dto: UpdateSectionRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/sections/${sectionId}`, dto);
  }

  setSectionActive(sectionId: string, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/sections/${sectionId}/active`, { isActive });
  }

  deleteSection(sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/sections/${sectionId}`);
  }

  addRowConfig(sectionId: string, dto: CreateRowConfigRequest): Observable<RowConfigDto> {
    return this.http.post<RowConfigDto>(`${this.base}/sections/${sectionId}/rowconfigs`, dto);
  }

  updateRowConfig(rowConfigId: string, dto: UpdateRowConfigRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/rowconfigs/${rowConfigId}`, dto);
  }

  deleteRowConfig(rowConfigId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/rowconfigs/${rowConfigId}`);
  }
}
