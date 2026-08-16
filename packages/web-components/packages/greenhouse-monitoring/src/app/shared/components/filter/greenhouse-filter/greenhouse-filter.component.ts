import { Component, EventEmitter, Output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOptions {
  searchText: string;
  status: 'all' | 'normal' | 'warning' | 'emergency';
  regionId: number | 'all';
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  sortBy: 'name' | 'id' | 'status' | 'lastUpdated';
  sortDirection: 'asc' | 'desc';
}

@Component({
  selector: 'app-greenhouse-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './greenhouse-filter.component.html',
  styleUrl: './greenhouse-filter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GreenhouseFilterComponent {
  @Output() filterChanged = new EventEmitter<FilterOptions>();
  @Output() filterStatsChange = new EventEmitter<{ found: number; visible: number }>();
  @Output() exportRequested = new EventEmitter<FilterOptions>();

  readonly statusOptions = [
    { value: 'all' as const, label: 'Все', icon: '🌐' },
    { value: 'normal' as const, label: 'Норма', icon: '✅' },
    { value: 'warning' as const, label: 'Предупреждение', icon: '⚠️' },
    { value: 'emergency' as const, label: 'Авария', icon: '🚨' }
  ];

  readonly regions = signal([
    { id: 1, name: 'Московская область', greenhouseCount: 24 },
    { id: 2, name: 'Ленинградская область', greenhouseCount: 18 },
    { id: 3, name: 'Краснодарский край', greenhouseCount: 32 },
    { id: 4, name: 'Ростовская область', greenhouseCount: 15 },
    { id: 5, name: 'Татарстан', greenhouseCount: 21 },
    { id: 6, name: 'Башкортостан', greenhouseCount: 12 },
    { id: 7, name: 'Ставропольский край', greenhouseCount: 28 },
    { id: 8, name: 'Белгородская область', greenhouseCount: 14 }
  ]);

  readonly filterModel = signal<FilterOptions>({
    searchText: '',
    status: 'all',
    regionId: 'all',
    dateRange: {
      from: null,
      to: null
    },
    sortBy: 'name',
    sortDirection: 'asc'
  });

  readonly activeFiltersCount = computed(() => {
    const filter = this.filterModel();
    let count = 0;

    if (filter.searchText.trim().length > 0) count++;
    if (filter.status !== 'all') count++;
    if (filter.regionId !== 'all') count++;
    if (filter.dateRange.from !== null) count++;
    if (filter.dateRange.to !== null) count++;

    return count;
  });

  readonly filterStats = signal<{ found: number; visible: number } | null>(null);

  private activePreset = signal<string | null>(null);

  constructor() {
    // Эмуляция начальной статистики
    setTimeout(() => {
      this.filterStats.set({ found: 164, visible: 164 });
    }, 100);
  }

  onFilterChange(field: keyof FilterOptions) {
    this.activePreset.set(null);
    this.emitFilterChange();
  }

  onStatusChange(status: FilterOptions['status']) {
    this.filterModel.update(f => ({ ...f, status }));
    this.activePreset.set(null);
    this.emitFilterChange();
  }

  onDateChange(type: 'from' | 'to', event: Event) {
    const input = event.target as HTMLInputElement;
    const date = input.value ? new Date(input.value) : null;

    this.filterModel.update(f => ({
      ...f,
      dateRange: {
        ...f.dateRange,
        [type]: date
      }
    }));

    this.activePreset.set(null);
    this.emitFilterChange();
  }

  toggleSortDirection() {
    this.filterModel.update(f => ({
      ...f,
      sortDirection: f.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
    this.emitFilterChange();
  }

  applyPresetFilter(preset: 'today' | 'warning' | 'emergency' | 'week') {
    const today = new Date();

    switch (preset) {
      case 'today':
        this.filterModel.set({
          ...this.filterModel(),
          dateRange: { from: today, to: today },
          status: 'all'
        });
        break;

      case 'warning':
        this.filterModel.set({
          ...this.filterModel(),
          status: 'warning',
          dateRange: { from: null, to: null }
        });
        break;

      case 'emergency':
        this.filterModel.set({
          ...this.filterModel(),
          status: 'emergency',
          dateRange: { from: null, to: null }
        });
        break;

      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        this.filterModel.set({
          ...this.filterModel(),
          dateRange: { from: weekAgo, to: today },
          status: 'all'
        });
        break;
    }

    this.activePreset.set(preset);
    this.emitFilterChange();
  }

  isPresetActive(preset: string): boolean {
    return this.activePreset() === preset;
  }

  resetFilters() {
    this.filterModel.set({
      searchText: '',
      status: 'all',
      regionId: 'all',
      dateRange: { from: null, to: null },
      sortBy: 'name',
      sortDirection: 'asc'
    });

    this.activePreset.set(null);
    this.emitFilterChange();
  }

  applyFilters() {
    this.emitFilterChange();
  }

  exportFilteredData() {
    this.exportRequested.emit(this.filterModel());
  }

  private emitFilterChange() {
    this.filterChanged.emit(this.filterModel());
  }

  getSelectedRegionName(): string {
    const regionId = this.filterModel().regionId;
    if (regionId === 'all') return 'Выбраны все регионы';

    const region = this.regions().find(r => r.id === regionId);
    return region ? `Выбран регион: ${region.name}` : 'Регион не найден';
  }

  getDateString(date: Date | null): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  getDateRangeHint(): string {
    const { from, to } = this.filterModel().dateRange;

    if (!from && !to) return 'Диапазон дат не задан';
    if (from && !to) return `С ${from.toLocaleDateString('ru-RU')} по настоящее время`;
    if (!from && to) return `По ${to.toLocaleDateString('ru-RU')}`;
    if (from && to) {
      const diffTime = Math.abs(to.getTime() - from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Выбран диапазон ${diffDays} ${this.getDayWord(diffDays)}`;
    }

    return '';
  }

  private getDayWord(days: number): string {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
    return 'дней';
  }

  getSortLabel(): string {
    const { sortBy, sortDirection } = this.filterModel();
    const sortLabels: Record<string, string> = {
      name: 'Название',
      id: 'ID',
      status: 'Статус',
      lastUpdated: 'Дата обновления'
    };

    const direction = sortDirection === 'asc' ? 'по возрастанию' : 'по убыванию';
    return `${sortLabels[sortBy]} (${direction})`;
  }
}