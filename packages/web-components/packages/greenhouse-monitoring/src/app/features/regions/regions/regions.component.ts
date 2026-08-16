import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppStore } from '../../core/store/app.store';
import { Greenhouse } from '../../shared/models/greenhouse.model';

@Component({
  selector: 'app-regions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './regions.component.html',
  styleUrl: './regions.component.css'
})
export class RegionsComponent implements OnInit {
  filterValue = signal('');
  expandedRegions = signal<Record<number, boolean>>({});
  selectedGreenhouseId = signal<number | null>(null);

  filteredRegions = computed(() => this.store.filteredRegions());
  lastUpdate = computed(() => this.store.lastUpdate());

  regionsCount = computed(() => this.filteredRegions().length);
  greenhousesCount = computed(() =>
      this.filteredRegions().reduce((sum, region) => sum + region.greenhouses.length, 0)
  );

  constructor(private store: AppStore) {}

  ngOnInit() {
    // Инициализация: раскрываем первый регион
    if (this.filteredRegions().length > 0) {
      const firstRegionId = this.filteredRegions()[0].id;
      this.expandedRegions.set({ [firstRegionId]: true });
    }
  }

  onFilterChange() {
    this.store.setFilter(this.filterValue());

    // Автоматически раскрываем регионы с результатами
    const newExpanded: Record<number, boolean> = {};
    this.filteredRegions().forEach(region => {
      if (region.greenhouses.length > 0) {
        newExpanded[region.id] = true;
      }
    });
    this.expandedRegions.set(newExpanded);
  }

  clearFilter() {
    this.filterValue.set('');
    this.onFilterChange();
  }

  toggleRegion(regionId: number) {
    this.expandedRegions.update(state => ({
      ...state,
      [regionId]: !state[regionId]
    }));
  }

  selectGreenhouse(greenhouse: Greenhouse) {
    this.selectedGreenhouseId.set(greenhouse.id);
    this.store.selectGreenhouse(greenhouse);
  }

  requestUpdate(greenhouseId: number) {
    // Эмуляция запроса обновления данных
    console.log(`Запрос обновления данных для теплицы ${greenhouseId}`);

    // Обновляем время последнего обновления
    this.store.updateLastUpdate();

    // Показываем уведомление (в реальном приложении - через сервис уведомлений)
    alert(`Запрос на обновление данных для теплицы ${greenhouseId} отправлен`);
  }

  requestRecalculation(greenhouseId: number) {
    // Эмуляция запроса пересчёта состояния
    console.log(`Запрос пересчёта состояния для теплицы ${greenhouseId}`);

    // Предупреждаем о длительном выполнении
    const confirmRecalc = confirm(
        'Пересчёт состояния может занять 10-15 минут. Продолжить?'
    );

    if (confirmRecalc) {
      this.store.updateLastUpdate();
      alert(`Пересчёт состояния для теплицы ${greenhouseId} запущен. Результат будет через 10-15 минут.`);
    }
  }

  refreshAll() {
    // Эмуляция обновления всех данных
    console.log('Обновление всех данных');
    this.store.updateLastUpdate();
    alert('Запрос на обновление данных всех теплиц отправлен');
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'normal': 'Норма',
      'warning': 'Предупреждение',
      'emergency': 'Авария'
    };
    return statusMap[status] || status;
  }

  getLatestUpdate(region: any): Date {
    if (!region.greenhouses || region.greenhouses.length === 0) {
      return new Date();
    }

    return region.greenhouses.reduce((latest: Date, greenhouse: Greenhouse) => {
      return greenhouse.lastUpdated > latest ? greenhouse.lastUpdated : latest;
    }, region.greenhouses[0].lastUpdated);
  }
}