import { signal, computed, effect } from '@angular/core';
import { Injectable } from '@angular/core';
import { Region, Greenhouse, Measurement, StatusHistory } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AppStore {
  // Роль пользователя
  private readonly _userRole = signal<'specialist' | 'senior-specialist'>('specialist');
  readonly userRole = this._userRole.asReadonly();

  // Регионы и теплицы
  private readonly _regions = signal<Region[]>([]);
  readonly regions = this._regions.asReadonly();

  // Фильтр
  private readonly _filter = signal<string>('');
  readonly filter = this._filter.asReadonly();

  // Выбранная теплица
  private readonly _selectedGreenhouse = signal<Greenhouse | null>(null);
  readonly selectedGreenhouse = this._selectedGreenhouse.asReadonly();

  // Измерения
  private readonly _measurements = signal<Measurement[]>([]);
  readonly measurements = this._measurements.asReadonly();

  // История состояний
  private readonly _statusHistory = signal<StatusHistory[]>([]);
  readonly statusHistory = this._statusHistory.asReadonly();

  // Время последнего обновления
  private readonly _lastUpdate = signal<Date | null>(null);
  readonly lastUpdate = this._lastUpdate.asReadonly();

  // Пересчет состояний
  private readonly _recalculationStatus = signal<Map<number, RecalculationRequest>>(new Map());
  readonly recalculationStatus = this._recalculationStatus.asReadonly();

  // Статистика по статусам (для светофора)
  readonly statusStats = computed(() => {
    const allGreenhouses = this._regions().flatMap(r => r.greenhouses);
    return {
      normal: allGreenhouses.filter(g => g.status === 'normal').length,
      warning: allGreenhouses.filter(g => g.status === 'warning').length,
      emergency: allGreenhouses.filter(g => g.status === 'emergency').length
    };
  });

  // Отфильтрованные регионы
  readonly filteredRegions = computed(() => {
    const filter = this._filter().toLowerCase();
    if (!filter) return this._regions();

    return this._regions().map(region => ({
      ...region,
      greenhouses: region.greenhouses.filter(g =>
          g.name.toLowerCase().includes(filter) ||
          g.id.toString().includes(filter) ||
          region.name.toLowerCase().includes(filter)
      )
    })).filter(region => region.greenhouses.length > 0);
  });

  // Измерения для выбранной теплицы
  readonly selectedGreenhouseMeasurements = computed(() => {
    const selected = this._selectedGreenhouse();
    if (!selected) return [];

    return this._measurements().filter(m => m.greenhouseId === selected.id);
  });

  // История для выбранной теплицы
  readonly selectedGreenhouseHistory = computed(() => {
    const selected = this._selectedGreenhouse();
    if (!selected) return [];

    return this._statusHistory().filter(h => h.greenhouseId === selected.id)
        .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  });

  // Автоматические эффекты
  constructor() {
    // Инициализация мок-данных при создании хранилища
    effect(() => {
      if (this._regions().length === 0) {
        this.initializeMockData();
      }
    });

    // Логирование изменений выбранной теплицы
    effect(() => {
      const selected = this._selectedGreenhouse();
      if (selected) {
        console.log(`Выбрана теплица: ${selected.name} (ID: ${selected.id})`);
        this.loadGreenhouseData(selected.id);
      }
    });
  }

  // Методы для обновления состояния
  setUserRole(role: 'specialist' | 'senior-specialist') {
    this._userRole.set(role);
  }

  setFilter(filter: string) {
    this._filter.set(filter);
  }

  selectGreenhouse(greenhouse: Greenhouse) {
    this._selectedGreenhouse.set(greenhouse);
  }

  updateMeasurement(measurement: Measurement) {
    const current = this._measurements();
    const index = current.findIndex(m =>
        m.timestamp.getTime() === measurement.timestamp.getTime() &&
        m.type === measurement.type &&
        m.greenhouseId === measurement.greenhouseId
    );

    if (index >= 0) {
      const updated = [...current];
      updated[index] = measurement;
      this._measurements.set(updated);
    } else {
      this._measurements.update(measurements => [...measurements, measurement]);
    }

    // Обновляем время последнего обновления
    this.updateLastUpdate();
  }

  addStatusHistory(history: StatusHistory) {
    this._statusHistory.update(historyList => [history, ...historyList]);
  }

  updateStatusHistoryComment(historyId: number, comment: string) {
    this._statusHistory.update(historyList =>
        historyList.map(item =>
            item.id === historyId ? { ...item, comment } : item
        )
    );
  }

  updateLastUpdate() {
    this._lastUpdate.set(new Date());
  }

  // Инициировать опрос теплицы
  initiatePolling(greenhouseId: number) {
    console.log(`Инициирован опрос теплицы ID: ${greenhouseId}`);

    // Эмуляция API запроса
    setTimeout(() => {
      this.updateLastUpdate();
      this.generateNewMeasurements(greenhouseId);

      // Обновляем статус теплицы
      this._regions.update(regions =>
          regions.map(region => ({
            ...region,
            greenhouses: region.greenhouses.map(g =>
                g.id === greenhouseId ? {
                  ...g,
                  lastUpdated: new Date(),
                  // Случайное обновление статуса
                  status: Math.random() > 0.7 ? 'warning' :
                      Math.random() > 0.9 ? 'emergency' : 'normal'
                } : g
            )
          }))
      );
    }, 1000);
  }

  // Инициировать пересчет состояний
  initiateRecalculation(greenhouseId: number) {
    console.log(`Инициирован пересчет для теплицы ID: ${greenhouseId}`);

    const request: RecalculationRequest = {
      greenhouseId,
      requestedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000), // +10 минут
      status: 'processing'
    };

    this._recalculationStatus.update(statusMap =>
        new Map(statusMap.set(greenhouseId, request))
    );

    // Эмуляция длительного пересчета
    setTimeout(() => {
      this._recalculationStatus.update(statusMap => {
        const updatedMap = new Map(statusMap);
        const current = updatedMap.get(greenhouseId);
        if (current) {
          updatedMap.set(greenhouseId, { ...current, status: 'completed' });
        }
        return updatedMap;
      });

      // Обновляем статус теплицы
      this._regions.update(regions =>
          regions.map(region => ({
            ...region,
            greenhouses: region.greenhouses.map(g =>
                g.id === greenhouseId ? {
                  ...g,
                  status: Math.random() > 0.8 ? 'warning' : 'normal'
                } : g
            )
          }))
      );
    }, 15000); // 15 секунд для демонстрации (вместо 15 минут)
  }

  // Инициализация мок-данных
  initializeMockData() {
    const mockRegions: Region[] = [
      {
        id: 1,
        name: 'Московская область',
        greenhouses: [
          { id: 1, name: 'Теплица "Северная"', status: 'normal', lastUpdated: new Date('2024-01-15T10:30:00') },
          { id: 2, name: 'Теплица "Южная"', status: 'warning', lastUpdated: new Date('2024-01-14T14:20:00') },
          { id: 3, name: 'Теплица "Центральная"', status: 'normal', lastUpdated: new Date('2024-01-15T08:45:00') }
        ]
      },
      {
        id: 2,
        name: 'Ленинградская область',
        greenhouses: [
          { id: 4, name: 'Теплица "Невская"', status: 'emergency', lastUpdated: new Date('2024-01-13T22:10:00') },
          { id: 5, name: 'Теплица "Ладожская"', status: 'normal', lastUpdated: new Date('2024-01-15T09:15:00') },
          { id: 6, name: 'Теплица "Финская"', status: 'warning', lastUpdated: new Date('2024-01-14T16:40:00') }
        ]
      },
      {
        id: 3,
        name: 'Краснодарский край',
        greenhouses: [
          { id: 7, name: 'Теплица "Кубань"', status: 'normal', lastUpdated: new Date('2024-01-15T11:00:00') },
          { id: 8, name: 'Теплица "Азов"', status: 'normal', lastUpdated: new Date('2024-01-15T10:00:00') },
          { id: 9, name: 'Теплица "Черноморская"', status: 'normal', lastUpdated: new Date('2024-01-15T12:30:00') }
        ]
      }
    ];

    const mockMeasurements: Measurement[] = [];
    const mockHistory: StatusHistory[] = [];

    // Генерация мок-измерений
    for (const region of mockRegions) {
      for (const greenhouse of region.greenhouses) {
        // Измерения за последние 24 часа
        for (let i = 0; i < 24; i++) {
          const timestamp = new Date(Date.now() - i * 60 * 60 * 1000);

          mockMeasurements.push({
            greenhouseId: greenhouse.id,
            type: 'temperature',
            value: 20 + Math.random() * 10 - 5, // 15-25°C
            timestamp,
            unit: '°C'
          });

          mockMeasurements.push({
            greenhouseId: greenhouse.id,
            type: 'humidity',
            value: 50 + Math.random() * 30 - 15, // 35-65%
            timestamp,
            unit: '%'
          });

          mockMeasurements.push({
            greenhouseId: greenhouse.id,
            type: 'acidity',
            value: 6.0 + Math.random() * 2 - 1, // 5.0-7.0 pH
            timestamp,
            unit: 'pH'
          });
        }

        // История статусов
        for (let i = 0; i < 5; i++) {
          const statuses: ('normal' | 'warning' | 'emergency')[] = ['normal', 'warning', 'emergency'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];

          mockHistory.push({
            id: greenhouse.id * 100 + i,
            greenhouseId: greenhouse.id,
            status,
            changedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            comment: i === 0 ? 'Автоматическое обновление' : 'Ручная корректировка',
            changedBy: i === 0 ? 'Система' : 'Старший специалист'
          });
        }
      }
    }

    this._regions.set(mockRegions);
    this._measurements.set(mockMeasurements);
    this._statusHistory.set(mockHistory);
    this._lastUpdate.set(new Date());
  }

  // Загрузка данных для теплицы
  private loadGreenhouseData(greenhouseId: number) {
    // В реальном приложении здесь был бы API запрос
    console.log(`Загрузка данных для теплицы ID: ${greenhouseId}`);
  }

  // Генерация новых измерений
  private generateNewMeasurements(greenhouseId: number) {
    const timestamp = new Date();
    const newMeasurements: Measurement[] = [
      {
        greenhouseId,
        type: 'temperature',
        value: 18 + Math.random() * 8, // 18-26°C
        timestamp,
        unit: '°C'
      },
      {
        greenhouseId,
        type: 'humidity',
        value: 45 + Math.random() * 25, // 45-70%
        timestamp,
        unit: '%'
      },
      {
        greenhouseId,
        type: 'acidity',
        value: 5.5 + Math.random() * 1.5, // 5.5-7.0 pH
        timestamp,
        unit: 'pH'
      }
    ];

    this._measurements.update(measurements => [...newMeasurements, ...measurements]);
  }
}

// Интерфейс для запроса пересчета
interface RecalculationRequest {
  greenhouseId: number;
  requestedAt: Date;
  estimatedCompletion: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}