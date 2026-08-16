import { Component, computed, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.store';
import { MeasurementChartComponent } from '../../shared/components/chart/measurement-chart.component';
import { Greenhouse, Measurement, StatusHistory } from '../../shared/models';

@Component({
  selector: 'app-greenhouse-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MeasurementChartComponent],
  templateUrl: './greenhouse-detail.component.html',
  styleUrl: './greenhouse-detail.component.css'
})
export class GreenhouseDetailComponent implements OnInit, OnDestroy {
  private store = inject(AppStore);
  private router = inject(Router);

  // Сигналы компонента
  selectedTimeRange = signal('1d');
  isUpdating = signal(false);
  isRecalculating = signal(false);
  recalculationProgress = signal(0);
  estimatedCompletionTime = signal(new Date());
  newComment = signal('');

  // Компьютеды на основе хранилища
  selectedGreenhouse = computed(() => this.store.selectedGreenhouse());
  measurements = computed(() => this.store.measurements());
  statusHistory = computed(() => this.store.statusHistory());

  private recalculationInterval: any = null;
  private progressInterval: any = null;

  ngOnInit() {
    // Если теплица не выбрана, перенаправляем на список
    if (!this.selectedGreenhouse()) {
      this.router.navigate(['/regions']);
    }

    // Загружаем данные для выбранной теплицы
    this.loadGreenhouseData();
  }

  ngOnDestroy() {
    this.clearIntervals();
  }

  private loadGreenhouseData() {
    // Здесь будет загрузка данных из API
    // В прототипе используем мок-данные
    if (this.selectedGreenhouse()) {
      const mockMeasurements: Measurement[] = this.generateMockMeasurements();
      this.store.updateLastUpdate();
    }
  }

  private generateMockMeasurements(): Measurement[] {
    const measurements: Measurement[] = [];
    const now = new Date();
    const greenhouseId = this.selectedGreenhouse()?.id || 0;

    // Генерация данных за последние 24 часа
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

      measurements.push(
          {
            greenhouseId,
            type: 'temperature',
            value: 20 + Math.random() * 10, // 20-30°C
            timestamp,
            unit: '°C'
          },
          {
            greenhouseId,
            type: 'humidity',
            value: 50 + Math.random() * 30, // 50-80%
            timestamp,
            unit: '%'
          },
          {
            greenhouseId,
            type: 'acidity',
            value: 6.0 + Math.random() * 1.5, // 6.0-7.5 pH
            timestamp,
            unit: 'pH'
          }
      );
    }

    return measurements;
  }

  goBack() {
    this.router.navigate(['/regions']);
  }

  requestUpdate() {
    this.isUpdating.set(true);

    // Эмуляция запроса к API
    setTimeout(() => {
      this.store.updateLastUpdate();
      this.isUpdating.set(false);

      // Показываем уведомление об успешном обновлении
      alert('Данные успешно обновлены');
    }, 1500);
  }

  initiateRecalculation() {
    if (!this.selectedGreenhouse() || this.isRecalculating()) {
      return;
    }

    const confirmed = confirm('Инициировать пересчёт состояния теплицы? Это может занять 10-15 минут.');
    if (!confirmed) {
      return;
    }

    this.isRecalculating.set(true);
    this.recalculationProgress.set(0);
    this.estimatedCompletionTime.set(new Date(Date.now() + 15 * 60 * 1000));

    // Эмуляция процесса пересчёта
    this.progressInterval = setInterval(() => {
      if (this.recalculationProgress() < 100) {
        const increment = Math.random() * 5; // 0-5% за шаг
        this.recalculationProgress.update(progress =>
            Math.min(100, progress + increment)
        );
      } else {
        this.clearIntervals();
        this.isRecalculating.set(false);

        // Показываем уведомление об успешном завершении
        alert('Пересчёт состояния завершён');
      }
    }, 2000);
  }

  cancelRecalculation() {
    const confirmed = confirm('Отменить пересчёт состояния?');
    if (confirmed) {
      this.clearIntervals();
      this.isRecalculating.set(false);
      this.recalculationProgress.set(0);
    }
  }

  private clearIntervals() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  onMeasurementEdit(measurement: Measurement) {
    if (this.store.userRole() === 'senior-specialist') {
      this.store.updateMeasurement(measurement);

      // Показываем уведомление об успешном сохранении
      alert(`Значение ${measurement.type} успешно обновлено: ${measurement.value} ${measurement.unit || ''}`);
    }
  }

  editComment(history: StatusHistory) {
    const newComment = prompt('Введите новый комментарий:', history.comment);
    if (newComment !== null && newComment !== history.comment) {
      // Здесь будет вызов API для обновления комментария
      alert('Комментарий успешно обновлён (в реальном приложении будет сохранено в БД)');
    }
  }

  addComment() {
    const comment = this.newComment().trim();
    if (!comment || !this.selectedGreenhouse()) {
      return;
    }

    const newHistory: StatusHistory = {
      id: Date.now(),
      greenhouseId: this.selectedGreenhouse()!.id,
      status: this.selectedGreenhouse()!.status,
      changedAt: new Date(),
      comment: comment,
      changedBy: this.store.userRole() === 'senior-specialist' ? 'Старший специалист' : 'Специалист'
    };

    this.store.addStatusHistory(newHistory);
    this.newComment.set('');

    alert('Комментарий успешно добавлен');
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      'normal': 'Норма',
      'warning': 'Предупреждение',
      'emergency': 'Авария'
    };
    return statusMap[status] || status;
  }
}