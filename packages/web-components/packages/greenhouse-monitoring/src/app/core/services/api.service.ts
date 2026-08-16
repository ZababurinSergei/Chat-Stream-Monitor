import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Region,
  Greenhouse,
  Measurement,
  StatusHistory,
  RecalculationRequest
} from '../../shared/models';
import { AppStore } from '../store/app.store';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private store = inject(AppStore);

  private readonly apiBaseUrl = 'api/v1';
  private readonly mockDelay = 500; // Имитация задержки сети

  // Сигналы для отслеживания состояния операций
  private readonly _isPolling = signal<boolean>(false);
  readonly isPolling = this._isPolling.asReadonly();

  private readonly _isRecalculating = signal<boolean>(false);
  readonly isRecalculating = this._isRecalculating.asReadonly();

  // Мок-данные
  private mockMeasurements: Measurement[] = this.generateMockMeasurements();
  private mockStatusHistory: StatusHistory[] = this.generateMockStatusHistory();

  /**
   * Получить список регионов с теплицами
   */
  getRegions(): Observable<Region[]> {
    return of(this.generateMockRegions()).pipe(
        delay(this.mockDelay),
        tap(regions => {
          console.log('API: Получены регионы', regions);
          this.store.initializeMockData(); // Инициализируем store с мок-данными
        }),
        catchError(error => {
          console.error('API Error getRegions:', error);
          return throwError(() => new Error('Не удалось загрузить данные регионов'));
        })
    );
  }

  /**
   * Получить измерения для теплицы за период
   */
  getMeasurements(
      greenhouseId: number,
      startDate: Date,
      endDate: Date,
      type?: 'temperature' | 'humidity' | 'acidity'
  ): Observable<Measurement[]> {
    const filteredMeasurements = this.mockMeasurements.filter(m =>
        m.greenhouseId === greenhouseId &&
        m.timestamp >= startDate &&
        m.timestamp <= endDate &&
        (!type || m.type === type)
    );

    return of(filteredMeasurements).pipe(
        delay(this.mockDelay),
        tap(measurements => {
          console.log(`API: Получены измерения для теплицы ${greenhouseId}`, measurements);
        }),
        catchError(error => {
          console.error('API Error getMeasurements:', error);
          return throwError(() => new Error('Не удалось загрузить измерения'));
        })
    );
  }

  /**
   * Обновить значение измерения (только для старшего специалиста)
   */
  updateMeasurement(measurement: Measurement): Observable<Measurement> {
    const userRole = this.store.userRole();

    if (userRole !== 'senior-specialist') {
      return throwError(() => new Error('Недостаточно прав для редактирования измерений'));
    }

    // Находим и обновляем измерение
    const index = this.mockMeasurements.findIndex(m =>
        m.id === measurement.id ||
        (m.greenhouseId === measurement.greenhouseId &&
            m.timestamp.getTime() === measurement.timestamp.getTime() &&
            m.type === measurement.type)
    );

    if (index >= 0) {
      this.mockMeasurements[index] = {
        ...this.mockMeasurements[index],
        value: measurement.value,
        timestamp: new Date() // Обновляем время изменения
      };
    } else {
      this.mockMeasurements.push({
        ...measurement,
        id: this.mockMeasurements.length + 1
      });
    }

    return of(measurement).pipe(
        delay(this.mockDelay),
        tap(updated => {
          console.log('API: Измерение обновлено', updated);
          this.store.updateMeasurement(updated);
        }),
        catchError(error => {
          console.error('API Error updateMeasurement:', error);
          return throwError(() => new Error('Не удалось обновить измерение'));
        })
    );
  }

  /**
   * Инициировать дополнительный опрос теплицы
   */
  pollGreenhouse(greenhouseId: number): Observable<{ success: boolean; timestamp: Date }> {
    this._isPolling.set(true);

    // Имитация обновления данных
    const newMeasurements = this.generateNewMeasurements(greenhouseId, 24); // 24 новых измерения

    return of({ success: true, timestamp: new Date() }).pipe(
        delay(2000), // Имитация времени опроса
        tap(response => {
          console.log(`API: Опрос теплицы ${greenhouseId} завершен`, response);
          this.mockMeasurements = [...this.mockMeasurements, ...newMeasurements];
          this.store.updateLastUpdate();
          this._isPolling.set(false);
        }),
        catchError(error => {
          console.error('API Error pollGreenhouse:', error);
          this._isPolling.set(false);
          return throwError(() => new Error('Не удалось выполнить опрос теплицы'));
        })
    );
  }

  /**
   * Инициировать пересчёт состояний теплицы
   */
  recalculateStatus(greenhouseId: number): Observable<RecalculationRequest> {
    this._isRecalculating.set(true);

    const request: RecalculationRequest = {
      greenhouseId,
      requestedAt: new Date(),
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000), // +10 минут
      status: 'processing'
    };

    return of(request).pipe(
        delay(3000), // Имитация начала пересчёта
        tap(recRequest => {
          console.log(`API: Начат пересчёт для теплицы ${greenhouseId}`, recRequest);

          // Имитация завершения пересчёта через 10-15 минут
          setTimeout(() => {
            this.completeRecalculation(greenhouseId);
          }, 600000); // 10 минут в миллисекундах
        }),
        catchError(error => {
          console.error('API Error recalculateStatus:', error);
          this._isRecalculating.set(false);
          return throwError(() => new Error('Не удалось инициировать пересчёт'));
        })
    );
  }

  /**
   * Получить историю изменений статусов
   */
  getStatusHistory(greenhouseId: number): Observable<StatusHistory[]> {
    const filteredHistory = this.mockStatusHistory.filter(
        h => h.greenhouseId === greenhouseId
    );

    return of(filteredHistory).pipe(
        delay(this.mockDelay),
        tap(history => {
          console.log(`API: Получена история для теплицы ${greenhouseId}`, history);
        }),
        catchError(error => {
          console.error('API Error getStatusHistory:', error);
          return throwError(() => new Error('Не удалось загрузить историю'));
        })
    );
  }

  /**
   * Добавить комментарий к записи истории
   */
  addHistoryComment(
      historyId: number,
      comment: string
  ): Observable<StatusHistory> {
    const history = this.mockStatusHistory.find(h => h.id === historyId);

    if (!history) {
      return throwError(() => new Error('Запись истории не найдена'));
    }

    const updatedHistory = {
      ...history,
      comment
    };

    const index = this.mockStatusHistory.findIndex(h => h.id === historyId);
    this.mockStatusHistory[index] = updatedHistory;

    return of(updatedHistory).pipe(
        delay(this.mockDelay),
        tap(updated => {
          console.log('API: Комментарий добавлен', updated);
        }),
        catchError(error => {
          console.error('API Error addHistoryComment:', error);
          return throwError(() => new Error('Не удалось добавить комментарий'));
        })
    );
  }

  /**
   * Получить статистику по статусам
   */
  getStatusStats(): Observable<{
    normal: number;
    warning: number;
    emergency: number;
  }> {
    const regions = this.generateMockRegions();
    const allGreenhouses = regions.flatMap(r => r.greenhouses);

    const stats = {
      normal: allGreenhouses.filter(g => g.status === 'normal').length,
      warning: allGreenhouses.filter(g => g.status === 'warning').length,
      emergency: allGreenhouses.filter(g => g.status === 'emergency').length
    };

    return of(stats).pipe(
        delay(this.mockDelay),
        catchError(error => {
          console.error('API Error getStatusStats:', error);
          return throwError(() => new Error('Не удалось получить статистику'));
        })
    );
  }

  // Приватные методы для работы с мок-данными

  private generateMockRegions(): Region[] {
    return [
      {
        id: 1,
        name: 'Московская область',
        greenhouses: [
          {
            id: 1,
            name: 'Теплица "Северная"',
            status: 'normal',
            lastUpdated: new Date('2024-01-20T10:30:00')
          },
          {
            id: 2,
            name: 'Теплица "Южная"',
            status: 'warning',
            lastUpdated: new Date('2024-01-19T15:45:00')
          },
          {
            id: 3,
            name: 'Теплица "Центральная"',
            status: 'normal',
            lastUpdated: new Date('2024-01-20T09:15:00')
          }
        ]
      },
      {
        id: 2,
        name: 'Ленинградская область',
        greenhouses: [
          {
            id: 4,
            name: 'Теплица "Нева"',
            status: 'emergency',
            lastUpdated: new Date('2024-01-18T22:10:00')
          },
          {
            id: 5,
            name: 'Теплица "Ладога"',
            status: 'normal',
            lastUpdated: new Date('2024-01-20T11:20:00')
          }
        ]
      },
      {
        id: 3,
        name: 'Краснодарский край',
        greenhouses: [
          {
            id: 6,
            name: 'Теплица "Кубань"',
            status: 'warning',
            lastUpdated: new Date('2024-01-20T08:40:00')
          },
          {
            id: 7,
            name: 'Теплица "Азов"',
            status: 'normal',
            lastUpdated: new Date('2024-01-19T16:25:00')
          },
          {
            id: 8,
            name: 'Теплица "Черное море"',
            status: 'normal',
            lastUpdated: new Date('2024-01-20T12:00:00')
          }
        ]
      }
    ];
  }

  private generateMockMeasurements(): Measurement[] {
    const measurements: Measurement[] = [];
    const now = new Date();

    // Генерируем данные за последние 30 дней
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Для каждой теплицы
      for (let greenhouseId = 1; greenhouseId <= 8; greenhouseId++) {
        // Температура (24 измерения в день)
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(date);
          timestamp.setHours(hour, Math.floor(Math.random() * 60));

          measurements.push({
            id: measurements.length + 1,
            greenhouseId,
            type: 'temperature',
            value: 18 + Math.random() * 12 + (hour - 12) * 0.5, // 18-30°C с дневными колебаниями
            timestamp,
            unit: '°C'
          });

          // Влажность
          measurements.push({
            id: measurements.length + 1,
            greenhouseId,
            type: 'humidity',
            value: 40 + Math.random() * 40, // 40-80%
            timestamp: new Date(timestamp.getTime() + 1000),
            unit: '%'
          });

          // Кислотность почвы (реже)
          if (hour % 6 === 0) {
            measurements.push({
              id: measurements.length + 1,
              greenhouseId,
              type: 'acidity',
              value: 5.5 + Math.random() * 2, // 5.5-7.5 pH
              timestamp: new Date(timestamp.getTime() + 2000),
              unit: 'pH'
            });
          }
        }
      }
    }

    return measurements;
  }

  private generateMockStatusHistory(): StatusHistory[] {
    const history: StatusHistory[] = [];
    const now = new Date();

    const statuses: Array<'normal' | 'warning' | 'emergency'> = ['normal', 'warning', 'emergency'];
    const users = ['Иванов А.И.', 'Петров С.В.', 'Сидорова М.К.', 'Козлов Д.П.'];
    const comments = [
      'Плановое обслуживание',
      'Ремонт системы вентиляции',
      'Замена датчиков температуры',
      'Корректировка режима полива',
      'Профилактические работы',
      'Внеплановая проверка',
      ''
    ];

    // Генерируем историю для каждой теплицы
    for (let greenhouseId = 1; greenhouseId <= 8; greenhouseId++) {
      let currentDate = new Date(now);
      let currentStatus = 'normal' as const;

      // Создаем 5-10 записей истории на теплицу
      const entriesCount = 5 + Math.floor(Math.random() * 6);

      for (let i = 0; i < entriesCount; i++) {
        currentDate.setDate(currentDate.getDate() - Math.floor(Math.random() * 30) - 1);

        // Случайно меняем статус
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

        history.push({
          id: history.length + 1,
          greenhouseId,
          status: newStatus,
          changedAt: new Date(currentDate),
          comment: comments[Math.floor(Math.random() * comments.length)],
          changedBy: users[Math.floor(Math.random() * users.length)]
        });

        currentStatus = newStatus;
      }
    }

    // Сортируем по дате
    return history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  }

  private generateNewMeasurements(greenhouseId: number, count: number): Measurement[] {
    const newMeasurements: Measurement[] = [];
    const now = new Date();
    const lastId = this.mockMeasurements.length;

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now);
      timestamp.setMinutes(timestamp.getMinutes() - i * 5); // Каждые 5 минут

      newMeasurements.push({
        id: lastId + i * 3 + 1,
        greenhouseId,
        type: 'temperature',
        value: 20 + Math.random() * 10,
        timestamp,
        unit: '°C'
      });

      newMeasurements.push({
        id: lastId + i * 3 + 2,
        greenhouseId,
        type: 'humidity',
        value: 50 + Math.random() * 30,
        timestamp: new Date(timestamp.getTime() + 1000),
        unit: '%'
      });

      if (i % 3 === 0) {
        newMeasurements.push({
          id: lastId + i * 3 + 3,
          greenhouseId,
          type: 'acidity',
          value: 6 + Math.random() * 1.5,
          timestamp: new Date(timestamp.getTime() + 2000),
          unit: 'pH'
        });
      }
    }

    return newMeasurements;
  }

  private completeRecalculation(greenhouseId: number): void {
    console.log(`API: Пересчёт для теплицы ${greenhouseId} завершен`);

    // Обновляем статус теплицы (случайно)
    const newStatus = ['normal', 'warning', 'emergency'][Math.floor(Math.random() * 3)] as
        'normal' | 'warning' | 'emergency';

    // Добавляем запись в историю
    const newHistory: StatusHistory = {
      id: this.mockStatusHistory.length + 1,
      greenhouseId,
      status: newStatus,
      changedAt: new Date(),
      comment: 'Автоматический пересчёт состояния',
      changedBy: 'Система'
    };

    this.mockStatusHistory.unshift(newHistory);
    this._isRecalculating.set(false);

    // Можно добавить уведомление через сервис уведомлений
    console.log(`Теплица ${greenhouseId} получила новый статус: ${newStatus}`);
  }
}