import { Component, Input, Output, EventEmitter, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Measurement, MeasurementType } from '../../models/greenhouse.model';

@Component({
  selector: 'app-measurement-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './measurement-chart.component.html',
  styleUrl: './measurement-chart.component.css'
})
export class MeasurementChartComponent {
  @Input() measurements: Measurement[] = [];
  @Input() isEditable = false;
  @Input() lastUpdateTime: Date | null = null;
  @Output() pointClicked = new EventEmitter<Measurement>();
  @Output() measurementUpdated = new EventEmitter<Measurement>();
  @Output() timeRangeChanged = new EventEmitter<string>();

  // Сигналы состояния
  selectedType = signal<string>('all');
  selectedTimeRange = signal<string>('day');
  isEditing = signal<boolean>(false);
  editingMeasurement = signal<Measurement | null>(null);
  editValue = signal<number>(0);

  // Конфигурация временных диапазонов
  timeRanges = [
    { value: 'day', label: 'Сутки', description: 'Показать данные за последние 24 часа' },
    { value: 'week', label: 'Неделя', description: 'Показать данные за последние 7 дней' },
    { value: 'month', label: 'Месяц', description: 'Показать данные за последние 30 дней' },
    { value: 'year', label: 'Год', description: 'Показать данные за последние 365 дней' }
  ];

  // Отфильтрованные измерения
  filteredMeasurements = computed(() => {
    const type = this.selectedType();
    const range = this.selectedTimeRange();

    let filtered = this.measurements;

    // Фильтрация по типу
    if (type !== 'all') {
      filtered = filtered.filter(m => m.type === type);
    }

    // Фильтрация по времени (эмулируем для прототипа)
    const now = new Date();
    let timeLimit = new Date();

    switch (range) {
      case 'day':
        timeLimit.setDate(now.getDate() - 1);
        break;
      case 'week':
        timeLimit.setDate(now.getDate() - 7);
        break;
      case 'month':
        timeLimit.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        timeLimit.setFullYear(now.getFullYear() - 1);
        break;
    }

    return filtered.filter(m => new Date(m.timestamp) >= timeLimit);
  });

  // Часы для отображения на оси X
  displayedHours = computed(() => {
    const range = this.selectedTimeRange();
    const hours = [];

    switch (range) {
      case 'day':
        for (let i = 0; i < 24; i += 3) {
          hours.push(`${i.toString().padStart(2, '0')}:00`);
        }
        break;
      case 'week':
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          hours.push(date.toLocaleDateString('ru-RU', { weekday: 'short' }));
        }
        break;
      case 'month':
        for (let i = 0; i < 4; i++) {
          const date = new Date();
          date.setDate(date.getDate() - (28 - i * 7));
          hours.push(`Неделя ${i + 1}`);
        }
        break;
      case 'year':
        for (let i = 0; i < 12; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - i));
          hours.push(date.toLocaleDateString('ru-RU', { month: 'short' }));
        }
        break;
    }

    return hours;
  });

  // Данные для таблицы
  tableData = computed(() => {
    const data: any[] = [];
    const filtered = this.filteredMeasurements();

    // Группируем по часам для суточного графика
    if (this.selectedTimeRange() === 'day') {
      for (let hour = 0; hour < 24; hour++) {
        const hourData = filtered.filter(m =>
            new Date(m.timestamp).getHours() === hour
        );

        data.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          temperature: hourData.find(m => m.type === 'temperature')?.value,
          humidity: hourData.find(m => m.type === 'humidity')?.value,
          acidity: hourData.find(m => m.type === 'acidity')?.value
        });
      }
    }

    return data;
  });

  // Статистика
  avgTemperature = computed(() => {
    const temps = this.filteredMeasurements()
        .filter(m => m.type === 'temperature')
        .map(m => m.value);
    return temps.length > 0 ? temps.reduce((a, b) => a + b) / temps.length : 0;
  });

  avgHumidity = computed(() => {
    const hums = this.filteredMeasurements()
        .filter(m => m.type === 'humidity')
        .map(m => m.value);
    return hums.length > 0 ? hums.reduce((a, b) => a + b) / hums.length : 0;
  });

  avgAcidity = computed(() => {
    const acids = this.filteredMeasurements()
        .filter(m => m.type === 'acidity')
        .map(m => m.value);
    return acids.length > 0 ? acids.reduce((a, b) => a + b) / acids.length : 0;
  });

  // Методы
  onTypeChange() {
    // Обновляем отображение при изменении типа
  }

  selectTimeRange(range: string) {
    this.selectedTimeRange.set(range);
    this.timeRangeChanged.emit(range);
  }

  calculatePosition(measurement: Measurement): number {
    const range = this.selectedTimeRange();
    const date = new Date(measurement.timestamp);

    switch (range) {
      case 'day':
        return (date.getHours() / 24) * 600;
      case 'week':
        return (date.getDay() / 7) * 600;
      case 'month':
        return (date.getDate() / 30) * 600;
      case 'year':
        return (date.getMonth() / 12) * 600;
      default:
        return 0;
    }
  }

  calculateValuePosition(measurement: Measurement): number {
    // Нормализуем значения для отображения на графике
    let value = measurement.value;

    switch (measurement.type) {
      case 'temperature':
        // Температура: -10°C до 40°C
        return ((value + 10) / 50) * 250;
      case 'humidity':
        // Влажность: 0% до 100%
        return (value / 100) * 250;
      case 'acidity':
        // Кислотность: 0 до 14 pH
        return (value / 14) * 250;
      default:
        return 0;
    }
  }

  getPointClass(measurement: Measurement): string {
    return `data-point ${measurement.type}`;
  }

  getPointTooltip(measurement: Measurement): string {
    const date = new Date(measurement.timestamp);
    return `${this.getTypeLabel(measurement.type)}: ${measurement.value}${this.getUnit(measurement.type)}\n${date.toLocaleString('ru-RU')}`;
  }

  formatValue(measurement: Measurement): string {
    return `${measurement.value}${this.getUnit(measurement.type)}`;
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'temperature': 'Температура',
      'humidity': 'Влажность',
      'acidity': 'Кислотность почвы'
    };
    return labels[type] || type;
  }

  getUnit(type?: string): string {
    const units: Record<string, string> = {
      'temperature': '°C',
      'humidity': '%',
      'acidity': ' pH'
    };
    return type ? units[type] || '' : '';
  }

  getMinValue(): string {
    const types = this.filteredMeasurements().map(m => m.type);
    if (types.includes('temperature')) return '-10°C';
    if (types.includes('humidity')) return '0%';
    if (types.includes('acidity')) return '0 pH';
    return '0';
  }

  getMaxValue(): string {
    const types = this.filteredMeasurements().map(m => m.type);
    if (types.includes('temperature')) return '40°C';
    if (types.includes('humidity')) return '100%';
    if (types.includes('acidity')) return '14 pH';
    return '100';
  }

  getMinAllowedValue(): number {
    const type = this.editingMeasurement()?.type;
    switch (type) {
      case 'temperature': return -50;
      case 'humidity': return 0;
      case 'acidity': return 0;
      default: return 0;
    }
  }

  getMaxAllowedValue(): number {
    const type = this.editingMeasurement()?.type;
    switch (type) {
      case 'temperature': return 100;
      case 'humidity': return 100;
      case 'acidity': return 14;
      default: return 100;
    }
  }

  onPointClick(measurement: Measurement) {
    if (this.isEditable) {
      this.editingMeasurement.set(measurement);
      this.editValue.set(measurement.value);
      this.isEditing.set(true);
    } else {
      this.pointClicked.emit(measurement);
    }
  }

  saveEdit() {
    const measurement = this.editingMeasurement();
    if (measurement) {
      const updatedMeasurement: Measurement = {
        ...measurement,
        value: this.editValue()
      };
      this.measurementUpdated.emit(updatedMeasurement);
      this.isEditing.set(false);
    }
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.editingMeasurement.set(null);
  }
}
