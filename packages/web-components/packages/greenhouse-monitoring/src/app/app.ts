import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppStore } from './core/store/app.store';
import { TrafficLightComponent } from './features/traffic-light/traffic-light.component';
import { RegionsComponent } from './features/regions/regions.component';
import { MeasurementChartComponent } from './shared/components/chart/measurement-chart.component';
import { Measurement, StatusHistory } from './shared/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    FormsModule,
    TrafficLightComponent,
    RegionsComponent,
    MeasurementChartComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  private store = inject(AppStore);

  selectedRole: 'specialist' | 'senior-specialist' = 'specialist';
  selectedTimeRange = '24h';
  currentTime = new Date();

  // Мок-данные для демонстрации
  mockMeasurements: Measurement[] = [
    { greenhouseId: 1, type: 'temperature', value: 22.5, timestamp: new Date(), unit: '°C' },
    { greenhouseId: 1, type: 'temperature', value: 23.1, timestamp: new Date(Date.now() - 3600000), unit: '°C' },
    { greenhouseId: 1, type: 'humidity', value: 65, timestamp: new Date(), unit: '%' },
    { greenhouseId: 1, type: 'humidity', value: 67, timestamp: new Date(Date.now() - 3600000), unit: '%' },
    { greenhouseId: 1, type: 'acidity', value: 6.8, timestamp: new Date(), unit: 'pH' },
    { greenhouseId: 1, type: 'acidity', value: 6.9, timestamp: new Date(Date.now() - 3600000), unit: 'pH' }
  ];

  mockHistory: StatusHistory[] = [
    { id: 1, greenhouseId: 1, status: 'normal', changedAt: new Date(), comment: 'Автоматическая проверка', changedBy: 'Система' },
    { id: 2, greenhouseId: 1, status: 'warning', changedAt: new Date(Date.now() - 86400000), comment: 'Повышенная температура', changedBy: 'Иванов И.И.' },
    { id: 3, greenhouseId: 1, status: 'normal', changedAt: new Date(Date.now() - 172800000), comment: 'Проблема устранена', changedBy: 'Петров П.П.' }
  ];

  // Компьютед свойства
  userRole = this.store.userRole;
  selectedGreenhouse = this.store.selectedGreenhouse;
  lastUpdate = this.store.lastUpdate;

  // Сигналы для состояния
  isRefreshing = signal(false);

  constructor() {
    // Инициализация мок-данных
    this.store.initializeMockData();

    // Обновление времени каждую секунду
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Эффект для логирования изменений
    effect(() => {
      console.log('Текущая роль:', this.userRole());
      console.log('Выбранная теплица:', this.selectedGreenhouse());
    });
  }

  ngOnInit() {
    this.selectedRole = this.userRole();
  }

  onRoleChange() {
    this.store.setUserRole(this.selectedRole);
  }

  isSeniorSpecialist(): boolean {
    return this.userRole() === 'senior-specialist';
  }

  refreshData() {
    this.isRefreshing.set(true);
    this.store.updateLastUpdate();

    // Имитация загрузки данных
    setTimeout(() => {
      this.isRefreshing.set(false);
      alert('Данные успешно обновлены!');
    }, 1000);
  }

  recalculateStatus() {
    if (!this.selectedGreenhouse()) return;

    const greenhouse = this.selectedGreenhouse();
    if (confirm(`Инициировать пересчёт состояния для теплицы "${greenhouse?.name}"? Процесс займет 10-15 минут.`)) {
      alert('Запрос на пересчёт отправлен. Результат будет доступен через 10-15 минут.');
      // Здесь будет вызов API
    }
  }

  requestPolling() {
    if (!this.selectedGreenhouse()) return;

    const greenhouse = this.selectedGreenhouse();
    if (confirm(`Запросить дополнительный опрос датчиков для теплицы "${greenhouse?.name}"?`)) {
      this.store.updateLastUpdate();
      alert('Запрос на опрос датчиков отправлен. Данные обновятся через несколько минут.');
      // Здесь будет вызов API
    }
  }

  onMeasurementPointClick(measurement: Measurement) {
    if (this.isSeniorSpecialist()) {
      this.store.updateMeasurement(measurement);
      alert(`Измерение ${measurement.type} обновлено: ${measurement.value} ${measurement.unit}`);
    }
  }

  updateComment(history: StatusHistory, event: Event) {
    const input = event.target as HTMLInputElement;
    const updatedHistory = { ...history, comment: input.value };
    // Здесь будет обновление в хранилище
    console.log('Обновлён комментарий:', updatedHistory);
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'normal': 'Норма',
      'warning': 'Предупреждение',
      'emergency': 'Авария'
    };
    return statusMap[status] || status;
  }

  logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
      // Здесь будет логика выхода
      alert('Вы вышли из системы');
      // В реальном приложении здесь был бы редирект на страницу входа
    }
  }
}