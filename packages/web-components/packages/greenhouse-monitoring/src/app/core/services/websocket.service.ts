import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, interval, takeWhile } from 'rxjs';
import { AppStore } from '../store/app.store';
import { Greenhouse, RecalculationRequest } from '../../shared/models';

@Injectable({
    providedIn: 'root'
})
export class WebsocketService {
    private store = inject(AppStore);

    // Сигналы для WebSocket состояния
    private readonly _isConnected = signal<boolean>(false);
    readonly isConnected = this._isConnected.asReadonly();

    private readonly _recalculationStatus = signal<RecalculationRequest[]>([]);
    readonly recalculationStatus = this._recalculationStatus.asReadonly();

    // Subjects для передачи событий
    private measurementUpdateSubject = new Subject<any>();
    private statusUpdateSubject = new Subject<any>();
    private recalculationCompleteSubject = new Subject<any>();
    private errorSubject = new Subject<string>();

    // Имитация WebSocket соединения
    private mockSocket: any;
    private pollingInterval: any;

    constructor() {
        this.initializeMockWebSocket();
    }

    /**
     * Инициализация мок WebSocket соединения
     */
    private initializeMockWebSocket(): void {
        // В реальном приложении здесь было бы подключение к WebSocket серверу
        // Для прототипа эмулируем соединение с задержкой
        setTimeout(() => {
            this._isConnected.set(true);
            this.startPolling();
            console.log('Mock WebSocket connection established');
        }, 1000);
    }

    /**
     * Запуск периодического опроса для эмуляции получения данных
     */
    private startPolling(): void {
        // Остановить предыдущий интервал, если он есть
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Эмуляция получения обновлений каждые 30 секунд
        this.pollingInterval = setInterval(() => {
            this.emulateDataUpdates();
        }, 30000);

        // Немедленно получить начальные данные
        this.emulateDataUpdates();
    }

    /**
     * Эмуляция обновлений данных от сервера
     */
    private emulateDataUpdates(): void {
        if (!this._isConnected()) return;

        try {
            // Эмуляция обновления измерений
            this.emulateMeasurementUpdates();

            // Эмуляция обновления статусов теплиц
            this.emulateStatusUpdates();

            // Эмуляция завершения пересчетов
            this.emulateRecalculationCompletions();

        } catch (error) {
            this.errorSubject.next(`Ошибка при получении данных: ${error}`);
        }
    }

    /**
     * Эмуляция обновления измерений
     */
    private emulateMeasurementUpdates(): void {
        const mockUpdate = {
            type: 'measurement_update',
            timestamp: new Date(),
            greenhouseId: Math.floor(Math.random() * 4) + 1,
            measurements: [
                {
                    type: 'temperature',
                    value: 20 + Math.random() * 10,
                    timestamp: new Date()
                },
                {
                    type: 'humidity',
                    value: 50 + Math.random() * 30,
                    timestamp: new Date()
                },
                {
                    type: 'acidity',
                    value: 6 + Math.random() * 2,
                    timestamp: new Date()
                }
            ]
        };

        this.measurementUpdateSubject.next(mockUpdate);
        this.store.updateLastUpdate();
    }

    /**
     * Эмуляция обновления статусов теплиц
     */
    private emulateStatusUpdates(): void {
        // Случайное изменение статуса одной из теплиц
        if (Math.random() > 0.7) { // 30% вероятность изменения
            const greenhouseId = Math.floor(Math.random() * 4) + 1;
            const statuses: Array<'normal' | 'warning' | 'emergency'> = ['normal', 'warning', 'emergency'];
            const newStatus = statuses[Math.floor(Math.random() * 3)];

            const statusUpdate = {
                type: 'status_update',
                greenhouseId,
                newStatus,
                timestamp: new Date(),
                reason: Math.random() > 0.5 ? 'Автоматическое обновление' : 'Изменение показателей'
            };

            this.statusUpdateSubject.next(statusUpdate);
        }
    }

    /**
     * Эмуляция завершения пересчетов состояний
     */
    private emulateRecalculationCompletions(): void {
        const currentRecalculations = this._recalculationStatus();

        currentRecalculations.forEach((request, index) => {
            if (request.status === 'processing' && new Date() >= request.estimatedCompletion) {
                // Помечаем пересчет как завершенный
                const updatedRequest: RecalculationRequest = {
                    ...request,
                    status: 'completed'
                };

                const updatedRecalculations = [...currentRecalculations];
                updatedRecalculations[index] = updatedRequest;
                this._recalculationStatus.set(updatedRecalculations);

                // Отправляем событие о завершении
                this.recalculationCompleteSubject.next({
                    greenhouseId: request.greenhouseId,
                    completedAt: new Date(),
                    result: 'success'
                });
            }
        });
    }

    /**
     * Отправка запроса на дополнительный опрос теплицы
     */
    requestGreenhousePolling(greenhouseId: number): Observable<any> {
        return new Observable(observer => {
            // Эмуляция задержки сети
            setTimeout(() => {
                const response = {
                    success: true,
                    greenhouseId,
                    requestedAt: new Date(),
                    message: `Запрос на опрос теплицы ${greenhouseId} отправлен`
                };

                // Обновляем время последнего обновления
                this.store.updateLastUpdate();

                observer.next(response);
                observer.complete();
            }, 500 + Math.random() * 1000);
        });
    }

    /**
     * Запрос на пересчет состояния теплицы
     */
    requestRecalculation(greenhouseId: number): Observable<any> {
        return new Observable(observer => {
            // Эмуляция задержки сети
            setTimeout(() => {
                const estimatedCompletion = new Date();
                estimatedCompletion.setMinutes(estimatedCompletion.getMinutes() + 10 + Math.random() * 5);

                const newRequest: RecalculationRequest = {
                    greenhouseId,
                    requestedAt: new Date(),
                    estimatedCompletion,
                    status: 'processing'
                };

                // Добавляем запрос в список отслеживания
                this._recalculationStatus.update(requests => [...requests, newRequest]);

                const response = {
                    success: true,
                    requestId: Date.now(),
                    greenhouseId,
                    requestedAt: newRequest.requestedAt,
                    estimatedCompletion: newRequest.estimatedCompletion,
                    message: `Запущен пересчет состояния теплицы ${greenhouseId}. Ожидайте завершения (10-15 минут).`
                };

                observer.next(response);
                observer.complete();
            }, 1000);
        });
    }

    /**
     * Отправка комментария к истории состояния
     */
    sendStatusComment(historyId: number, comment: string): Observable<any> {
        return new Observable(observer => {
            // Эмуляция задержки сети
            setTimeout(() => {
                const response = {
                    success: true,
                    historyId,
                    updatedAt: new Date(),
                    message: 'Комментарий успешно сохранен'
                };

                observer.next(response);
                observer.complete();
            }, 300);
        });
    }

    /**
     * Редактирование измерения
     */
    updateMeasurement(measurementId: number, newValue: number, greenhouseId: number): Observable<any> {
        return new Observable(observer => {
            // Эмуляция задержки сети
            setTimeout(() => {
                const response = {
                    success: true,
                    measurementId,
                    greenhouseId,
                    newValue,
                    updatedAt: new Date(),
                    message: 'Измерение успешно обновлено'
                };

                observer.next(response);
                observer.complete();
            }, 400);
        });
    }

    /**
     * Получение Observable для обновлений измерений
     */
    getMeasurementUpdates(): Observable<any> {
        return this.measurementUpdateSubject.asObservable();
    }

    /**
     * Получение Observable для обновлений статусов
     */
    getStatusUpdates(): Observable<any> {
        return this.statusUpdateSubject.asObservable();
    }

    /**
     * Получение Observable для завершения пересчетов
     */
    getRecalculationCompletions(): Observable<any> {
        return this.recalculationCompleteSubject.asObservable();
    }

    /**
     * Получение Observable для ошибок
     */
    getErrors(): Observable<string> {
        return this.errorSubject.asObservable();
    }

    /**
     * Запрос истории измерений за период
     */
    getMeasurementHistory(greenhouseId: number, period: string): Observable<any> {
        return new Observable(observer => {
            // Эмуляция загрузки данных
            setTimeout(() => {
                const hours = period === 'сутки' ? 24 :
                    period === 'неделя' ? 168 :
                        period === 'месяц' ? 720 : 8760;

                const measurements = [];
                const now = new Date();

                for (let i = 0; i < 50; i++) { // Генерируем 50 точек данных
                    const timestamp = new Date(now.getTime() - Math.random() * hours * 60 * 60 * 1000);

                    measurements.push(
                        {
                            id: i + 1,
                            greenhouseId,
                            type: 'temperature' as const,
                            value: 18 + Math.random() * 12,
                            timestamp,
                            unit: '°C'
                        },
                        {
                            id: i + 51,
                            greenhouseId,
                            type: 'humidity' as const,
                            value: 40 + Math.random() * 40,
                            timestamp,
                            unit: '%'
                        },
                        {
                            id: i + 101,
                            greenhouseId,
                            type: 'acidity' as const,
                            value: 5.5 + Math.random() * 3,
                            timestamp,
                            unit: 'pH'
                        }
                    );
                }

                const response = {
                    greenhouseId,
                    period,
                    measurements,
                    lastUpdated: new Date()
                };

                observer.next(response);
                observer.complete();
            }, 800 + Math.random() * 1200);
        });
    }

    /**
     * Получение истории состояний теплицы
     */
    getStatusHistory(greenhouseId: number): Observable<any> {
        return new Observable(observer => {
            // Эмуляция загрузки данных
            setTimeout(() => {
                const history = [];
                const now = new Date();

                for (let i = 0; i < 8; i++) {
                    const statuses: Array<'normal' | 'warning' | 'emergency'> = ['normal', 'warning', 'emergency'];
                    const status = statuses[Math.floor(Math.random() * 3)];

                    history.push({
                        id: i + 1,
                        greenhouseId,
                        status,
                        changedAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        comment: i === 0 ? '' : `Автоматическое изменение ${i}`,
                        changedBy: i % 3 === 0 ? 'Старший специалист' : 'Система'
                    });
                }

                // Сортировка по дате (новые сверху)
                history.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());

                const response = {
                    greenhouseId,
                    history,
                    total: history.length
                };

                observer.next(response);
                observer.complete();
            }, 600);
        });
    }

    /**
     * Закрытие WebSocket соединения
     */
    disconnect(): void {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        this._isConnected.set(false);
        console.log('Mock WebSocket connection closed');
    }

    /**
     * Переподключение к WebSocket
     */
    reconnect(): void {
        this.disconnect();
        setTimeout(() => {
            this.initializeMockWebSocket();
        }, 2000);
    }

    /**
     * Проверка наличия активных пересчетов для теплицы
     */
    hasActiveRecalculation(greenhouseId: number): boolean {
        return this._recalculationStatus().some(
            request => request.greenhouseId === greenhouseId &&
                (request.status === 'pending' || request.status === 'processing')
        );
    }
}