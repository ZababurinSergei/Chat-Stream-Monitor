import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface QuickFilter {
  status: string | null;
  onlyWithAlerts: boolean;
  lastUpdated: 'all' | 'day' | 'week' | 'month';
}

@Component({
  selector: 'app-quick-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quick-filter.component.html',
  styleUrl: './quick-filter.component.css',
})
export class QuickFilterComponent {
  @Output() filterChanged = new EventEmitter<QuickFilter>();

  statuses = [
    { value: 'normal', label: 'Норма', icon: '✅' },
    { value: 'warning', label: 'Предупреждение', icon: '⚠️' },
    { value: 'emergency', label: 'Авария', icon: '🚨' }
  ];

  filter = signal<QuickFilter>({
    status: null,
    onlyWithAlerts: false,
    lastUpdated: 'all'
  });

  toggleAlertsFilter() {
    this.filter.update(f => ({
      ...f,
      onlyWithAlerts: !f.onlyWithAlerts
    }));
    this.emitFilter();
  }

  toggleStatusFilter(status: string) {
    this.filter.update(f => ({
      ...f,
      status: f.status === status ? null : status
    }));
    this.emitFilter();
  }

  onTimeFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.filter.update(f => ({
      ...f,
      lastUpdated: select.value as QuickFilter['lastUpdated']
    }));
    this.emitFilter();
  }

  clearAll() {
    this.filter.set({
      status: null,
      onlyWithAlerts: false,
      lastUpdated: 'all'
    });
    this.emitFilter();
  }

  hasActiveFilters(): boolean {
    const f = this.filter();
    return f.status !== null || f.onlyWithAlerts || f.lastUpdated !== 'all';
  }

  private emitFilter() {
    this.filterChanged.emit(this.filter());
  }
}
