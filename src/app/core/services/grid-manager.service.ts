// grid-manager.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface GridCell {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sectionId?: string;
  occupied: boolean;
  type?: 'stage' | 'seated' | 'standing' | 'aisle' | 'empty';
}

export interface GridConfig {
  rows: number;
  columns: number;
  cellWidth: number;
  cellHeight: number;
  gap: number;
}

@Injectable({
  providedIn: 'root'
})
export class GridManagerService {
  private gridConfig: GridConfig = {
    rows: 8,
    columns: 12,
    cellWidth: 100,
    cellHeight: 100,
    gap: 5
  };

  private gridCells: GridCell[] = [];
  private gridSubject = new BehaviorSubject<GridCell[]>([]);
  grid$ = this.gridSubject.asObservable();

  constructor() {
    this.initializeGrid();
  }

  private initializeGrid(): void {
    const cells: GridCell[] = [];
    const { rows, columns, cellWidth, cellHeight, gap } = this.gridConfig;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        cells.push({
          id: `cell-${row}-${col}`,
          x: col * (cellWidth + gap),
          y: row * (cellHeight + gap),
          width: cellWidth,
          height: cellHeight,
          occupied: false,
          type: 'empty'
        });
      }
    }
    this.gridCells = cells;
    this.gridSubject.next(cells);
  }

  updateGridConfig(config: Partial<GridConfig>): void {
    this.gridConfig = { ...this.gridConfig, ...config };
    this.initializeGrid();
  }

  getGridConfig(): GridConfig {
    return { ...this.gridConfig };
  }

  getCellById(id: string): GridCell | undefined {
    return this.gridCells.find(cell => cell.id === id);
  }

  getCellsBySection(sectionId: string): GridCell[] {
    return this.gridCells.filter(cell => cell.sectionId === sectionId);
  }

  occupyCells(sectionId: string, cellIds: string[], type: GridCell['type']): void {
    this.gridCells.forEach(cell => {
      if (cellIds.includes(cell.id)) {
        cell.occupied = true;
        cell.sectionId = sectionId;
        cell.type = type;
      }
    });
    this.gridSubject.next([...this.gridCells]);
  }

  clearSection(sectionId: string): void {
    this.gridCells.forEach(cell => {
      if (cell.sectionId === sectionId) {
        cell.occupied = false;
        cell.sectionId = undefined;
        cell.type = 'empty';
      }
    });
    this.gridSubject.next([...this.gridCells]);
  }

  exportLayout(): any {
    return {
      config: this.gridConfig,
      cells: this.gridCells
    };
  }

  importLayout(layout: any): void {
    if (layout.config) {
      this.gridConfig = layout.config;
    }
    if (layout.cells) {
      this.gridCells = layout.cells;
      this.gridSubject.next([...this.gridCells]);
    }
  }
}