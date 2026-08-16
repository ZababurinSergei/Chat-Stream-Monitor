import { signal, computed, effect, untracked } from '@angular/core';
import { Injectable } from '@angular/core';
import {
    Greenhouse,
    Measurement,
    StatusHistory,
    RecalculationRequest,
    GreenhouseMetrics,
    Alert
} from '../../shared/models/greenhouse.model';

@Injectable({ providedIn: 'root' })
export class GreenhouseStore {
    // Текущие измерения по теплицам
    private readonly _measurements = signal<Map<number, Measurement[]>>(new Map());

    // История состояний теплиц
    private readonly _statusHistory = signal<Map<number, StatusHistory[]>>(new Map());

    // Запросы на пересчёт
    private readonly _recalculationRequests = signal<RecalculationRequest[]>([]);

    // Активные алерты
    private readonly _activeAlerts = signal<Alert[]>([]);

    // Время последнего опроса по каждой теплице
    private readonly _lastPollTime = signal<Map<number, Date>>(new Map());

    // Период отображения данных на графике
    private readonly _displayPeriod = signal<'day' | 'week' | 'month' | 'year'>('day');

    // Экспортируемые сигналы (readonly)
    readonly measurements = computed(() => this._measurements());
    readonly statusHistory = computed(() => this._statusHistory());
    readonly recalculationRequests = computed(() => this._recalculationRequests());
    readonly activeAlerts = computed(() => this._activeAlerts());
    readonly lastPollTime = computed(() => this._lastPollTime());
    readonly displayPeriod = this._displayPeriod.asReadonly();

    // Метрики по теплице
    readonly greenhouseMetrics = computed(() => {
        const metrics = new Map<number, GreenhouseMetrics>();
        const measurementsMap = this._measurements();

        measurementsMap.forEach((measurements, greenhouseId) => {
            if (measurements.length === 0) return;

            // Фильтруем измерения по выбранному периоду
            const filtered = this.filterByPeriod(measurements, this._displayPeriod());

            if (filtered.length === 0) return;

            // Вычисляем статистику
            const tempValues = filtered.filter(m => m.type === 'temperature').map(m => m.value);
            const humidityValues = filtered.filter(m => m.type === 'humidity').map(m => m.value);
            const acidityValues = filtered.filter(m => m.type === 'acidity').map(m => m.value);

            metrics.set(greenhouseId, {
                greenhouseId,
                avgTemperature: this.calculateAverage(tempValues),
                avgHumidity: this.calculateAverage(humidityValues),
                avgAcidity: this.calculateAverage(acidityValues),
                minTemperature: Math.min(...tempValues),
                maxTemperature: Math.max(...tempValues),
                temperatureTrend: this.calculateTrend(tempValues),
                humidityTrend: this.calculateTrend(humidityValues),
                acidityTrend: this.calculateTrend(acidityValues),
                lastMeasurement: filtered[filtered.length - 1],
                measurementCount: filtered.length,
                period: this._displayPeriod()
            });
        });

        return metrics;
    });

    // Измерения для текущего периода
    readonly currentPeriodMeasurements = computed(() => {
        const measurementsMap = this._measurements();
        const period = this._displayPeriod();
        const filteredMap = new Map<number, Measurement[]>();

        measurementsMap.forEach((measurements, greenhouseId) => {
            filteredMap.set(greenhouseId, this.filterByPeriod(measurements, period));
        });

        return filteredMap;
    });

    // Теплицы, требующие внимания (предупреждение или авария)
    readonly attentionRequired = computed(() => {
        const alerts = this._activeAlerts();
        const greenhouseIds = new Set<number>();

        alerts.forEach(alert => {
            if (alert.severity === 'warning' || alert.severity === 'emergency') {
                greenhouseIds.add(alert.greenhouseId);
            }
        });

        return Array.from(greenhouseIds);
    });

    // Статусы пересчётов
    readonly recalculationStatuses = computed(() => {
        const requests = this._recalculationRequests();
        const statuses = new Map<number, string>();

        requests.forEach(request => {
            statuses.set(request.greenhouseId, request.status);
        });

        return statuses;
    });

    // Методы для обновления состояния

    setDisplayPeriod(period: 'day' | 'week' | 'month' | 'year') {
        this._displayPeriod.set(period);
    }

    addMeasurement(greenhouseId: number, measurement: Measurement) {
        this._measurements.update(map => {
            const newMap = new Map(map);
            const existing = newMap.get(greenhouseId) || [];
            newMap.set(greenhouseId, [...existing, measurement].sort((a, b) =>
                a.timestamp.getTime() - b.timestamp.getTime()
            ));
            return newMap;
        });
    }

    updateMeasurement(greenhouseId: number, updatedMeasurement: Measurement) {
        this._measurements.update(map => {
            const newMap = new Map(map);
            const measurements = newMap.get(greenhouseId) || [];
            const index = measurements.findIndex(m =>
                m.timestamp.getTime() === updatedMeasurement.timestamp.getTime() &&
                m.type === updatedMeasurement.type
            );

            if (index >= 0) {
                const updated = [...measurements];
                updated[index] = updatedMeasurement;
                newMap.set(greenhouseId, updated);
            }

            return newMap;
        });
    }

    addStatusHistory(greenhouseId: number, history: StatusHistory) {
        this._statusHistory.update(map => {
            const newMap = new Map(map);
            const existing = newMap.get(greenhouseId) || [];
            newMap.set(greenhouseId, [...existing, history].sort((a, b) =>
                b.changedAt.getTime() - a.changedAt.getTime()
            ));
            return newMap;
        });
    }

    addCommentToHistory(greenhouseId: number, historyId: number, comment: string) {
        this._statusHistory.update(map => {
            const newMap = new Map(map);
            const history = newMap.get(greenhouseId) || [];
            const index = history.findIndex(h => h.id === historyId);

            if (index >= 0) {
                const updated = [...history];
                updated[index] = { ...updated[index], comment };
                newMap.set(greenhouseId, updated);
            }

            return newMap;
        });
    }

    initiatePoll(greenhouseId: number) {
        const now = new Date();
        this._lastPollTime.update(map => {
            const newMap = new Map(map);
            newMap.set(greenhouseId, now);
            return newMap;
        });

        // Эмуляция получения новых данных через 2 секунды
        setTimeout(() => {
            this.generateMockMeasurements(greenhouseId, now);
        }, 2000);
    }

    initiateRecalculation(greenhouseId: number) {
        const request: RecalculationRequest = {
            greenhouseId,
            requestedAt: new Date(),
            estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000), // +10 минут
            status: 'pending'
        };

        this._recalculationRequests.update(requests => [...requests, request]);

        // Эмуляция процесса пересчёта
        setTimeout(() => {
            this.updateRecalculationStatus(request, 'processing');
        }, 2000);

        setTimeout(() => {
            this.updateRecalculationStatus(request, 'completed');

            // Добавляем новую запись в историю статусов
            this.addStatusHistory(greenhouseId, {
                id: Date.now(),
                greenhouseId,
                status: 'normal', // После пересчёта статус улучшается
                changedAt: new Date(),
                comment: 'Статус пересчитан системой',
                changedBy: 'system'
            });

            // Убираем запрос из списка через некоторое время
            setTimeout(() => {
                this.removeRecalculationRequest(request);
            }, 30000);
        }, 60000); // 1 минута вместо 10-15 для демонстрации
    }

    addAlert(alert: Alert) {
        this._activeAlerts.update(alerts => [...alerts, alert]);
    }

    dismissAlert(alertId: number) {
        this._activeAlerts.update(alerts => alerts.filter(a => a.id !== alertId));
    }

    // Вспомогательные методы

    private filterByPeriod(measurements: Measurement[], period: 'day' | 'week' | 'month' | 'year'): Measurement[] {
        const now = new Date();
        let cutoffDate: Date;

        switch (period) {
            case 'day':
                cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'year':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoffDate = new Date(0);
        }

        return measurements.filter(m => m.timestamp >= cutoffDate);
    }

    private calculateAverage(values: number[]): number {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const avgFirst = this.calculateAverage(firstHalf);
        const avgSecond = this.calculateAverage(secondHalf);

        const difference = avgSecond - avgFirst;

        if (Math.abs(difference) < 0.1) return 'stable';
        return difference > 0 ? 'up' : 'down';
    }

    private updateRecalculationStatus(request: RecalculationRequest, status: RecalculationRequest['status']) {
        this._recalculationRequests.update(requests =>
            requests.map(r => r === request ? { ...r, status } : r)
        );
    }

    private removeRecalculationRequest(request: RecalculationRequest) {
        this._recalculationRequests.update(requests =>
            requests.filter(r => r !== request)
        );
    }

    private generateMockMeasurements(greenhouseId: number, timestamp: Date) {
        // Генерация моковых данных для трёх типов измерений
        const types: Measurement['type'][] = ['temperature', 'humidity', 'acidity'];

        types.forEach(type => {
            const measurement: Measurement = {
                greenhouseId,
                type,
                value: this.generateRandomValue(type),
                timestamp: new Date(timestamp.getTime() + Math.random() * 1000),
                unit: this.getUnitForType(type)
            };

            this.addMeasurement(greenhouseId, measurement);
        });

        // 30% шанс на создание алерта
        if (Math.random() < 0.3) {
            const severities: Alert['severity'][] = ['info', 'warning', 'emergency'];
            const severity = severities[Math.floor(Math.random() * severities.length)];

            const alert: Alert = {
                id: Date.now(),
                greenhouseId,
                severity,
                message: this.getAlertMessage(type, severity),
                timestamp: new Date(),
                acknowledged: false
            };

            this.addAlert(alert);
        }
    }

    private generateRandomValue(type: Measurement['type']): number {
        switch (type) {
            case 'temperature':
                return 15 + Math.random() * 20; // 15-35°C
            case 'humidity':
                return 40 + Math.random() * 40; // 40-80%
            case 'acidity':
                return 5.5 + Math.random() * 2.5; // 5.5-8.0 pH
            default:
                return 0;
        }
    }

    private getUnitForType(type: Measurement['type']): string {
        switch (type) {
            case 'temperature': return '°C';
            case 'humidity': return '%';
            case 'acidity': return 'pH';
            default: return '';
        }
    }

    private getAlertMessage(type: Measurement['type'], severity: Alert['severity']): string {
        const messages = {
            info: 'Показатели в норме',
            warning: `Внимание: ${type} приближается к критическим значениям`,
            emergency: `ТРЕВОГА: Критическое значение ${type}!`
        };

        return messages[severity] || 'Неизвестное состояние';
    }

    // Инициализация мок-данных
    initializeMockData() {
        // Инициализируем моковые данные для 4 теплиц
        for (let i = 1; i <= 4; i++) {
            this._lastPollTime.update(map => {
                const newMap = new Map(map);
                newMap.set(i, new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000));
                return newMap;
            });

            // Генерируем исторические данные
            for (let j = 0; j < 24 * 7; j++) { // Данные за неделю
                const timestamp = new Date(Date.now() - (j * 60 * 60 * 1000));

                ['temperature', 'humidity', 'acidity'].forEach(type => {
                    const measurement: Measurement = {
                        greenhouseId: i,
                        type: type as Measurement['type'],
                        value: this.generateRandomValue(type as Measurement['type']),
                        timestamp,
                        unit: this.getUnitForType(type as Measurement['type'])
                    };

                    this.addMeasurement(i, measurement);
                });
            }

            // Генерируем историю статусов
            for (let j = 0; j < 5; j++) {
                const statuses: Greenhouse['status'][] = ['normal', 'warning', 'emergency'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];

                const history: StatusHistory = {
                    id: Date.now() + j,
                    greenhouseId: i,
                    status,
                    changedAt: new Date(Date.now() - (j * 24 * 60 * 60 * 1000)),
                    comment: `Автоматическое изменение статуса ${j + 1}`,
                    changedBy: 'system'
                };

                this.addStatusHistory(i, history);
            }
        }
    }

    // Очистка старых данных
    cleanupOldData(daysToKeep: number = 30) {
        const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

        this._measurements.update(map => {
            const newMap = new Map();
            map.forEach((measurements, greenhouseId) => {
                const filtered = measurements.filter(m => m.timestamp >= cutoff);
                if (filtered.length > 0) {
                    newMap.set(greenhouseId, filtered);
                }
            });
            return newMap;
        });
    }
}