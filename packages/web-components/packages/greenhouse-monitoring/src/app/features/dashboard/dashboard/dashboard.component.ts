import { Component, OnInit, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { AppStore } from '../../core/store/app.store';
import { ApiService } from '../../core/services/api.service';
import { TrafficLightComponent } from '../traffic-light/traffic-light.component';
import { MeasurementChartComponent } from '../../shared/components/chart/measurement-chart.component';
import { HistoryTableComponent } from '../../shared/components/history-table/history-table.component';
import { Greenhouse, Measurement } from '../../shared/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TrafficLightComponent,
    MeasurementChartComponent,
    HistoryTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private store = inject(AppStore);
  private apiService = inject(ApiService);
  private router = inject(Router);

  // Состояние компонента
  filterText = '';
  selectedTimeRange = 'сутки';
  expandedRegions = new Set<number>();
  recalculationsMap = new Map<number, any>();
  private pollingSubscription?: Subscription;
  private autoRefreshSubscription?: Subscription;

  // Сигналы состояния
  isPolling = signal(false);
  isRefreshing = signal(false);
  isRecalculating = signal(false);
  selectedGreenhouseId = signal<number | null>(null);

  // Computed значения из хранилища
  lastUpdate = computed(() => this.store.lastUpdate());
  selectedGreenhouse = computed(() => this.store.selectedGreenhouse());
  statusHistory = computed(() => this.store.statusHistory());
  totalGreenhouses = computed(() => {
    return this.store.regions().reduce((sum, region) => sum + region.greenhouses.length, 0);
  });

  // Фильтрованные измерения для выбранной теплицы
  filteredMeasurements = computed(() => {
    const greenhouse = this.selectedGreenhouse();
    if (!greenhouse) return [];

    const range = this.selectedTimeRange;
    const now = new Date();
    const cutoff = new Date();

    switch (range) {
      case 'сутки':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'неделя':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'месяц':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'год':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    // В реальном приложении здесь будет фильтрация по дате
    return greenhouse.measurements || [];
  });

  // Последние показания датчиков
  lastTemperature = computed(() => {
    const measurements = this.filteredMeasurements();
    const temp = measurements.find(m => m.type === 'temperature');
    return temp ? temp.value.toFixed(1) : '—';
  });

  lastHumidity = computed(() => {
    const measurements = this.filteredMeasurements();
    const humidity = measurements.find(m => m.type === 'humidity');
    return humidity ? humidity.value.toFixed(1) : '—';
  });

  lastAcidity = computed(() => {
    const measurements = this.filteredMeasurements();
    const acidity = measurements.find(m => m.type === 'acidity');
    return acidity ? acidity.value.toFixed(2) : '—';
  });

  // Статистика по статусам
  normalGreenhouses = computed(() => this.store.statusStats().normal);
  warningGreenhouses = computed(() => this.store.statusStats().warning);
  emergencyGreenhouses = computed(() => this.store.statusStats().emergency);

  // Уведомления
  notifications = signal<Array<{
    id: number;
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
  }>>([]);

  // Список пересчетов
  recalculations = computed(() => Array.from(this.recalculationsMap.values()));

  // Проверка роли
  isSenior = computed(() => this.store.userRole() === 'senior-specialist');

  timeRanges = ['сутки', 'неделя', 'месяц', 'год'];

  constructor() {
    // Автообновление каждые 30 секунд
    this.autoRefreshSubscription = interval(30000).subscribe(() => {
      if (this.selectedGreenhouse()) {
        this.pollGreenhouse(this.selectedGreenhouse()!.id, true);
      }
    });
  }

  ngOnInit() {
    this.store.initializeMockData();
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
    this.autoRefreshSubscription?.unsubscribe();
  }

  toggleRole() {
    const newRole = this.store.userRole() === 'specialist'
        ? 'senior-specialist'
        : 'specialist';
    this.store.setUserRole(newRole);
    this.showNotification('info', `Роль изменена на: ${newRole === 'senior-specialist' ? 'Старший специалист' : 'Специалист'}`);
  }

  toggleRegion(regionId: number) {
    if (this.expandedRegions.has(regionId)) {
      this.expandedRegions.delete(regionId);
    } else {
      this.expandedRegions.add(regionId);
    }
  }

  isRegionExpanded(regionId: number): boolean {
    return this.expandedRegions.has(regionId);
  }

  onFilterChange() {
    this.store.setFilter(this.filterText);
  }

  selectGreenhouse(greenhouse: Greenhouse) {
    this.selectedGreenhouseId.set(greenhouse.id);
    this.store.selectGreenhouse(greenhouse);

    // Загружаем данные для выбранной теплицы
    this.loadGreenhouseData(greenhouse.id);
  }

  async loadGreenhouseData(greenhouseId: number) {
    try {
      // В реальном приложении здесь будет запрос к API
      const mockMeasurements: Measurement[] = [
        { greenhouseId, type: 'temperature', value: 22.5, timestamp: new Date() },
        { greenhouseId, type: 'humidity', value: 65.2, timestamp: new Date() },
        { greenhouseId, type: 'acidity', value: 6.8, timestamp: new Date() }
      ];

      // Обновляем данные в хранилище
      // В реальном приложении здесь будет вызов store.setMeasurements()

      this.showNotification('success', `Данные для теплицы ${greenhouseId} загружены`);
    } catch (error) {
      this.showNotification('error', 'Ошибка загрузки данных');
    }
  }

  async pollGreenhouse(greenhouseId: number, silent = false) {
    if (this.isPolling()) return;

    this.isPolling.set(true);

    try {
      // Эмуляция запроса к API
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!silent) {
        this.showNotification('success', `Данные теплицы ${greenhouseId} успешно обновлены`);
      }

      this.store.updateLastUpdate();
    } catch (error) {
      this.showNotification('error', 'Ошибка при обновлении данных');
    } finally {
      this.isPolling.set(false);
    }
  }

  async recalculateStatus(greenhouseId: number) {
    if (this.isRecalculating()) return;

    this.isRecalculating.set(true);

    // Создаем запись о пересчете
    const recalc = {
      greenhouseId,
      status: 'processing' as const,
      progress: 0,
      requestedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000) // +10 минут
    };

    this.recalculationsMap.set(greenhouseId, recalc);

    // Эмуляция длительного пересчета
    const interval = setInterval(() => {
      const currentRecalc = this.recalculationsMap.get(greenhouseId);
      if (currentRecalc && currentRecalc.progress < 100) {
        currentRecalc.progress += 10;
        this.recalculationsMap.set(greenhouseId, { ...currentRecalc });

        if (currentRecalc.progress >= 100) {
          currentRecalc.status = 'completed';
          this.recalculationsMap.set(greenhouseId, { ...currentRecalc });
          clearInterval(interval);
          this.isRecalculating.set(false);
          this.showNotification('success', `Пересчет для теплицы ${greenhouseId} завершен`);
        }
      }
    }, 60000); // Обновление каждую минуту

    this.showNotification('info', `Запущен пересчет состояния теплицы ${greenhouseId}. Ожидайте 10-15 минут.`);
  }

  async refreshAllData() {
    this.isRefreshing.set(true);

    try {
      // Эмуляция обновления всех данных
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.store.updateLastUpdate();
      this.showNotification('success', 'Все данные успешно обновлены');
    } catch (error) {
      this.showNotification('error', 'Ошибка при обновлении данных');
    } finally {
      this.isRefreshing.set(false);
    }
  }

  onMeasurementEdit(measurement: Measurement) {
    if (!this.isSenior()) return;

    this.store.updateMeasurement(measurement);
    this.showNotification('success', `Измерение ${measurement.type} обновлено`);
  }

  onCommentAdded(event: { historyId: number; comment: string }) {
    // В реальном приложении здесь будет обновление комментария в API
    this.showNotification('success', 'Комментарий добавлен');
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'normal': 'Норма',
      'warning': 'Предупреждение',
      'emergency': 'Авария'
    };
    return statusMap[status] || status;
  }

  getRecalcStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидание',
      'processing': 'В процессе',
      'completed': 'Завершен',
      'failed': 'Ошибка'
    };
    return statusMap[status] || status;
  }

  showNotification(type: 'success' | 'info' | 'warning' | 'error', message: string) {
    const id = Date.now();
    this.notifications.update(notifications => [
      ...notifications,
      { id, type, message }
    ]);

    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
      this.dismissNotification(id);
    }, 5000);
  }

  dismissNotification(id: number) {
    this.notifications.update(notifications =>
        notifications.filter(n => n.id !== id)
    );
  }

  simulateAlert() {
    if (!this.isSenior()) return;

    // Эмуляция аварийной ситуации
    const emergencyGreenhouse = this.store.regions()[0]?.greenhouses[0];
    if (emergencyGreenhouse) {
      this.showNotification('warning', `Симуляция аварии в теплице ${emergencyGreenhouse.name}`);

      // В реальном приложении здесь будет обновление статуса в хранилище
    }
  }
}