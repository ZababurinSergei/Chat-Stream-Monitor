// /10/tests/core/Movement/core/FloatingOrigin.ts
// Система плавающего начала координат для бесконечных путешествий
// Версия 2.4.0 - ДОБАВЛЕНЫ МЕТОДЫ ДЛЯ ОТСЛЕЖИВАНИЯ СМЕНЫ ВОКСЕЛЯ
// - Добавлен метод getOriginHash() для получения хэша текущего origin
// - Добавлен метод getOriginCopy() для получения копии origin
// - Добавлена синхронизация позиций всех объектов
// - Добавлен метод syncAllObjectsPositions() для синхронизации после сдвига
// - Добавлен метод syncObjectPosition() для синхронизации отдельного объекта
// - Исправлено обновление позиций звезд при сдвиге origin

import { Vector3, Object3D, Camera3D } from '@orillusion/core';

// ============================================================================
// КОНФИГУРАЦИЯ
// ============================================================================

export interface FloatingOriginConfig {
    /** Порог сдвига в километрах (по умолчанию 10_000_000 км) */
    shiftThresholdKm: number;

    /** Множитель: 1 игровая единица = X километров */
    unitsPerKm: number;

    /** Включить отладку */
    debug: boolean;

    /** Максимальное количество объектов за кадр при сдвиге */
    maxObjectsPerFrame: number;

    /** Ключ для сохранения в localStorage */
    saveKey: string;

    /** Автоматически сохранять позицию */
    autoSave: boolean;

    /** Интервал автосохранения в секундах */
    autoSaveInterval: number;
}

const DEFAULT_CONFIG: FloatingOriginConfig = {
    shiftThresholdKm: 10_000_000,
    unitsPerKm: 1.0,
    debug: true,
    maxObjectsPerFrame: 500,
    saveKey: 'floating_origin_save',
    autoSave: true,
    autoSaveInterval: 30,
};

// ============================================================================
// ГЛОБАЛЬНЫЙ ТРАНСФОРМ (64-битные координаты)
// ============================================================================

export class GlobalTransform {
    public x: number = 0;
    public y: number = 0;
    public z: number = 0;

    constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    clone(): GlobalTransform {
        return new GlobalTransform(this.x, this.y, this.z);
    }

    add(other: GlobalTransform): GlobalTransform {
        return new GlobalTransform(
            this.x + other.x,
            this.y + other.y,
            this.z + other.z
        );
    }

    subtract(other: GlobalTransform): GlobalTransform {
        return new GlobalTransform(
            this.x - other.x,
            this.y - other.y,
            this.z - other.z
        );
    }

    distanceTo(other: GlobalTransform): number {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    toVector3(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    static fromVector3(v: Vector3): GlobalTransform {
        return new GlobalTransform(v.x, v.y, v.z);
    }

    /**
     * Возвращает хэш для отслеживания смены вокселя
     */
    getHash(): string {
        return `${this.x},${this.y},${this.z}`;
    }
}

// ============================================================================
// ИНТЕРФЕЙС ДЛЯ ОБЪЕКТОВ С ПОДДЕРЖКОЙ ГЛОБАЛЬНЫХ КООРДИНАТ
// ============================================================================

export interface IGlobalObject {
    readonly id: string;
    globalTransform: GlobalTransform;
    localPosition: Vector3;
    object3D: Object3D | null;

    onOriginShift(delta: GlobalTransform): void;
}

// ============================================================================
// ДАННЫЕ ДЛЯ СОХРАНЕНИЯ
// ============================================================================

export interface FloatingOriginSaveData {
    version: number;
    timestamp: number;
    origin: { x: number; y: number; z: number };
    totalDistanceKm: number;
    shiftsCount: number;
    shipGlobalPosition: { x: number; y: number; z: number };
}

// ============================================================================
// СОБЫТИЯ ДЛЯ UI
// ============================================================================

export interface FloatingOriginEvent {
    type: 'shift' | 'progress' | 'threshold_reached';
    delta?: GlobalTransform;
    localDistanceKm?: number;
    thresholdKm?: number;
    progressPercent?: number;
    shiftsCount?: number;
}

export type FloatingOriginEventListener = (event: FloatingOriginEvent) => void;

// ============================================================================
// ОСНОВНОЙ КЛАСС FLOATING ORIGIN
// ============================================================================

export class FloatingOrigin {
    private config: FloatingOriginConfig;

    /** Текущий центр координат (глобальный) */
    private origin: GlobalTransform = new GlobalTransform(0, 0, 0);

    /** Все объекты с поддержкой глобальных координат */
    private objects: Map<string, IGlobalObject> = new Map();

    /** Позиция корабля в локальных координатах */
    private shipLocalPosition: Vector3 = new Vector3(0, 0, 0);

    /** Глобальная позиция корабля */
    private shipGlobalPosition: GlobalTransform = new GlobalTransform(0, 0, 0);

    /** Скорость корабля в км/ч */
    private shipSpeedKmh: number = 0;

    /** Ссылка на камеру */
    private camera: Camera3D | null = null;

    /** Флаг сдвига */
    private isShifting: boolean = false;

    /** Очередь для отложенного сдвига */
    private pendingShiftDelta: GlobalTransform | null = null;
    private objectsToShift: IGlobalObject[] = [];

    /** Таймер автосохранения */
    private autoSaveTimer: number | null = null;

    /** Слушатели событий для UI */
    private eventListeners: FloatingOriginEventListener[] = [];

    /** Статистика */
    public stats = {
        shiftsCount: 0,
        totalDistanceKm: 0,
        lastShiftDistanceKm: 0,
        objectsShifted: 0,
        lastSaveTime: 0,
    };

    constructor(config?: Partial<FloatingOriginConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };

        if (this.config.debug) {
            console.log('🌍 Floating Origin инициализирован');
            console.log(`   Порог сдвига: ${(this.config.shiftThresholdKm / 1_000_000).toFixed(0)} млн км`);
        }

        this.loadFromStorage();

        if (this.config.autoSave) {
            this.startAutoSave();
        }
    }

    // ============================================================================
    // СОБЫТИЯ ДЛЯ UI
    // ============================================================================

    public addEventListener(listener: FloatingOriginEventListener): void {
        this.eventListeners.push(listener);
    }

    public removeEventListener(listener: FloatingOriginEventListener): void {
        const index = this.eventListeners.indexOf(listener);
        if (index >= 0) this.eventListeners.splice(index, 1);
    }

    private dispatchEvent(event: FloatingOriginEvent): void {
        for (const listener of this.eventListeners) {
            try {
                listener(event);
            } catch (error) {
                console.warn('⚠️ Ошибка в обработчике события FloatingOrigin:', error);
            }
        }
    }

    // ============================================================================
    // СОХРАНЕНИЕ И ЗАГРУЗКА
    // ============================================================================

    saveToStorage(): void {
        try {
            const saveData: FloatingOriginSaveData = {
                version: 1,
                timestamp: Date.now(),
                origin: { x: this.origin.x, y: this.origin.y, z: this.origin.z },
                totalDistanceKm: this.stats.totalDistanceKm,
                shiftsCount: this.stats.shiftsCount,
                shipGlobalPosition: {
                    x: this.shipGlobalPosition.x,
                    y: this.shipGlobalPosition.y,
                    z: this.shipGlobalPosition.z,
                },
            };

            localStorage.setItem(this.config.saveKey, JSON.stringify(saveData));
            this.stats.lastSaveTime = Date.now();

            if (this.config.debug) {
                const distLy = this.getDistanceFromEarthLy();
                console.log(`💾 [FloatingOrigin] Сохранено: ${distLy.toFixed(6)} св. лет от Земли`);
            }
        } catch (error) {
            console.warn('⚠️ [FloatingOrigin] Ошибка сохранения:', error);
        }
    }

    loadFromStorage(): boolean {
        try {
            const saved = localStorage.getItem(this.config.saveKey);
            if (!saved) {
                if (this.config.debug) {
                    console.log('💾 [FloatingOrigin] Сохранений не найдено, начинаем с Земли');
                }
                return false;
            }

            const saveData: FloatingOriginSaveData = JSON.parse(saved);

            if (saveData.version !== 1) {
                console.warn('⚠️ [FloatingOrigin] Неизвестная версия сохранения');
                return false;
            }

            this.origin = new GlobalTransform(
                saveData.origin.x,
                saveData.origin.y,
                saveData.origin.z
            );
            this.shipGlobalPosition = new GlobalTransform(
                saveData.shipGlobalPosition.x,
                saveData.shipGlobalPosition.y,
                saveData.shipGlobalPosition.z
            );
            this.stats.totalDistanceKm = saveData.totalDistanceKm;
            this.stats.shiftsCount = saveData.shiftsCount;
            this.shipLocalPosition.set(0, 0, 0);

            if (this.config.debug) {
                const distLy = this.getDistanceFromEarthLy();
                console.log(`💾 [FloatingOrigin] Загружено: ${distLy.toFixed(6)} св. лет от Земли`);
                console.log(`   Всего сдвигов: ${this.stats.shiftsCount}`);
                console.log(`   Пройдено: ${(this.stats.totalDistanceKm / 1e9).toFixed(2)} млрд км`);
            }

            return true;

        } catch (error) {
            console.warn('⚠️ [FloatingOrigin] Ошибка загрузки:', error);
            return false;
        }
    }

    private startAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = window.setInterval(() => {
            this.saveToStorage();
        }, this.config.autoSaveInterval * 1000);
    }

    stopAutoSave(): void {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    resetToEarth(): void {
        const delta = new GlobalTransform(-this.origin.x, -this.origin.y, -this.origin.z);

        this.origin = new GlobalTransform(0, 0, 0);
        this.shipGlobalPosition = new GlobalTransform(0, 0, 0);
        this.shipLocalPosition.set(0, 0, 0);

        for (const obj of this.objects.values()) {
            obj.onOriginShift(delta);
        }

        if (this.config.debug) {
            console.log(`🌍 [FloatingOrigin] Сброс на Землю`);
        }

        this.dispatchEvent({
            type: 'shift',
            delta: delta,
            shiftsCount: this.stats.shiftsCount
        });

        this.saveToStorage();
    }

    // ============================================================================
    // РЕГИСТРАЦИЯ
    // ============================================================================

    registerObject(obj: IGlobalObject): void {
        if (this.objects.has(obj.id)) {
            console.warn(`[FloatingOrigin] Объект ${obj.id} уже зарегистрирован`);
            return;
        }
        this.objects.set(obj.id, obj);

        obj.globalTransform = this.localToGlobal(obj.localPosition);

        // if (this.config.debug) {
        //     console.log(`[FloatingOrigin] 📦 Зарегистрирован: ${obj.id}`);
        // }
    }

    unregisterObject(id: string): boolean {
        const removed = this.objects.delete(id);
        if (removed && this.config.debug) {
            console.log(`[FloatingOrigin] 🗑️ Удалён: ${id}`);
        }
        return removed;
    }

    setCamera(camera: Camera3D): void {
        this.camera = camera;
        if (this.config.debug) {
            console.log(`[FloatingOrigin] 📷 Камера установлена`);
        }
    }

    // ============================================================================
    // НОВЫЕ МЕТОДЫ ДЛЯ ОТСЛЕЖИВАНИЯ СМЕНЫ ВОКСЕЛЯ
    // ============================================================================

    /**
     * Возвращает хэш текущего origin для отслеживания смены вокселя
     */
    public getOriginHash(): string {
        return this.origin.getHash();
    }

    /**
     * Возвращает копию текущего origin
     */
    public getOriginCopy(): GlobalTransform {
        return this.origin.clone();
    }

    /**
     * Синхронизирует позиции всех зарегистрированных объектов
     * Должен вызываться после сдвига origin
     */
    public syncAllObjectsPositions(): void {
        if (this.config.debug) {
            console.log(`[FloatingOrigin] 🔄 Синхронизация ${this.objects.size} объектов...`);
        }

        for (const obj of this.objects.values()) {
            this.syncObjectPosition(obj);
        }
    }

    /**
     * Синхронизирует позицию отдельного объекта
     * @param obj объект для синхронизации
     */
    public syncObjectPosition(obj: IGlobalObject): void {
        if (!obj.object3D) return;

        const newLocal = this.globalToLocal(obj.globalTransform);
        obj.localPosition.copyFrom(newLocal);
        obj.object3D.transform.localPosition = newLocal;
        obj.object3D.transform.updateWorldMatrix(true);
    }

    /**
     * Синхронизирует позицию по ID объекта
     * @param id идентификатор объекта
     */
    public syncObjectPositionById(id: string): boolean {
        const obj = this.objects.get(id);
        if (!obj) return false;

        this.syncObjectPosition(obj);
        return true;
    }

    // ============================================================================
    // ОСНОВНАЯ ЛОГИКА
    // ============================================================================

    update(speedKmh: number, deltaTime: number, direction?: Vector3): Vector3 {
        this.shipSpeedKmh = speedKmh;

        if (this.isShifting) {
            this.processPendingShift();
            return this.shipLocalPosition;
        }

        // Обновляем локальную позицию корабля на основе скорости и направления
        const deltaKm = (speedKmh / 3600) * deltaTime;

        if (direction) {
            // Если передано направление, обновляем по всем осям
            this.shipLocalPosition.x += direction.x * deltaKm;
            this.shipLocalPosition.y += direction.y * deltaKm;
            this.shipLocalPosition.z += direction.z * deltaKm;
        } else {
            // По умолчанию обновляем по оси X (для обратной совместимости)
            this.shipLocalPosition.x += deltaKm;
        }

        this.stats.totalDistanceKm += Math.abs(deltaKm);

        this.shipGlobalPosition = this.localToGlobal(this.shipLocalPosition);

        // Отправляем событие прогресса для UI
        const localDistanceKm = this.getShipLocalDistanceKm();
        const progressPercent = (localDistanceKm / this.config.shiftThresholdKm) * 100;

        this.dispatchEvent({
            type: 'progress',
            localDistanceKm: localDistanceKm,
            thresholdKm: this.config.shiftThresholdKm,
            progressPercent: Math.min(100, Math.max(0, progressPercent))
        });

        if (this.shouldShift()) {
            this.initiateShift();
        }

        return this.shipLocalPosition.clone();
    }

    /**
     * Синхронизация позиции корабля извне
     * Обновляет внутреннее состояние FloatingOrigin на основе реальной позиции корабля
     */
    public syncShipPosition(shipLocalPosition: Vector3): void {
        if (!shipLocalPosition) return;

        // Вычисляем пройденное расстояние с момента последней синхронизации
        const deltaX = shipLocalPosition.x - this.shipLocalPosition.x;
        const deltaY = shipLocalPosition.y - this.shipLocalPosition.y;
        const deltaZ = shipLocalPosition.z - this.shipLocalPosition.z;

        const deltaKm = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
        if (deltaKm > 0) {
            this.stats.totalDistanceKm += deltaKm;
        }

        // Обновляем локальную позицию корабля
        this.shipLocalPosition.copyFrom(shipLocalPosition);

        // Обновляем глобальную позицию
        this.shipGlobalPosition = this.localToGlobal(this.shipLocalPosition);

        // Проверяем необходимость сдвига
        if (this.shouldShift()) {
            this.initiateShift();
        }

        if (this.config.debug && deltaKm > 1000) {
            console.log(`🔄 [FloatingOrigin] Синхронизация: +${(deltaKm/1e6).toFixed(2)} млн км, всего: ${(this.stats.totalDistanceKm/1e9).toFixed(2)} млрд км`);
        }
    }

    private shouldShift(): boolean {
        const threshold = this.config.shiftThresholdKm;
        return Math.abs(this.shipLocalPosition.x) > threshold ||
            Math.abs(this.shipLocalPosition.y) > threshold ||
            Math.abs(this.shipLocalPosition.z) > threshold;
    }

    private initiateShift(): void {
        const delta = new GlobalTransform(
            -this.shipLocalPosition.x,
            -this.shipLocalPosition.y,
            -this.shipLocalPosition.z
        );

        this.stats.shiftsCount++;
        this.stats.lastShiftDistanceKm = Math.sqrt(
            delta.x * delta.x + delta.y * delta.y + delta.z * delta.z
        );

        if (this.config.debug) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🌍 [FloatingOrigin] СДВИГ #${this.stats.shiftsCount}`);
            console.log(`   Дельта: ${(delta.x / 1e6).toFixed(2)} млн км, ${(delta.y / 1e6).toFixed(2)} млн км, ${(delta.z / 1e6).toFixed(2)} млн км`);
            console.log(`   Расстояние от Земли: ${this.getDistanceFromEarthLy().toFixed(6)} св. лет`);
            console.log(`   Всего объектов: ${this.objects.size}`);
            console.log(`${'='.repeat(60)}`);
        }

        // Отправляем событие о достижении порога
        this.dispatchEvent({
            type: 'threshold_reached',
            localDistanceKm: this.getShipLocalDistanceKm(),
            thresholdKm: this.config.shiftThresholdKm,
            progressPercent: 100,
            shiftsCount: this.stats.shiftsCount
        });

        this.origin = this.origin.add(delta);
        this.shiftAllObjects(delta);
        this.shipLocalPosition.set(0, 0, 0);
        this.updateCamera();

        // Синхронизируем все объекты после сдвига
        this.syncAllObjectsPositions();

        // Отправляем событие о сдвиге
        this.dispatchEvent({
            type: 'shift',
            delta: delta,
            shiftsCount: this.stats.shiftsCount
        });

        if (this.config.autoSave) {
            this.saveToStorage();
        }
    }

    private shiftAllObjects(delta: GlobalTransform): void {
        console.log('-------------- shiftAllObjects -----------------')
        if (this.objects.size > this.config.maxObjectsPerFrame) {
            this.pendingShiftDelta = delta;
            this.objectsToShift = Array.from(this.objects.values());
            this.isShifting = true;

            if (this.config.debug) {
                console.log(`   ⏳ Отложенный сдвиг: ${this.objectsToShift.length} объектов`);
            }
            return;
        }

        for (const obj of this.objects.values()) {
            obj.onOriginShift(delta);
        }
        this.stats.objectsShifted += this.objects.size;

        if (this.config.debug) {
            console.log(`   ✅ Сдвиг завершён (синхронно)`);
        }
    }

    private processPendingShift(): void {
        if (!this.pendingShiftDelta || this.objectsToShift.length === 0) {
            this.isShifting = false;
            this.pendingShiftDelta = null;
            return;
        }

        const toProcess = this.objectsToShift.splice(0, this.config.maxObjectsPerFrame);

        for (const obj of toProcess) {
            obj.onOriginShift(this.pendingShiftDelta);
        }

        this.stats.objectsShifted += toProcess.length;

        if (this.config.debug && this.objectsToShift.length === 0) {
            console.log(`   ✅ Сдвиг завершён (асинхронно, ${toProcess.length} за кадр)`);
        }

        if (this.objectsToShift.length === 0) {
            this.isShifting = false;
            this.pendingShiftDelta = null;
        }
    }

    private updateCamera(): void {
        if (!this.camera) return;

        this.camera.object3D.transform.updateWorldMatrix(true);
        this.camera.updateProjection();

        if (this.camera.frustum) {
            this.camera.frustum.update(this.camera.pvMatrix);
        }
    }

    // ============================================================================
    // КОНВЕРТАЦИЯ КООРДИНАТ
    // ============================================================================

    globalToLocal(global: GlobalTransform): Vector3 {
        return new Vector3(
            global.x - this.origin.x,
            global.y - this.origin.y,
            global.z - this.origin.z
        );
    }

    localToGlobal(local: Vector3): GlobalTransform {
        return new GlobalTransform(
            local.x + this.origin.x,
            local.y + this.origin.y,
            local.z + this.origin.z
        );
    }

    // ============================================================================
    // МЕТОДЫ ДЛЯ UI
    // ============================================================================

    /**
     * Получение локального расстояния корабля от origin в километрах
     * Используется для шкалы прогресса смены вокселя
     */
    public getShipLocalDistanceKm(): number {
        return Math.sqrt(
            this.shipLocalPosition.x * this.shipLocalPosition.x +
            this.shipLocalPosition.y * this.shipLocalPosition.y +
            this.shipLocalPosition.z * this.shipLocalPosition.z
        );
    }

    /**
     * Получение текущей локальной позиции корабля
     */
    public getShipLocalPositionKm(): Vector3 {
        return this.shipLocalPosition.clone();
    }

    /**
     * Получение прогресса до следующего сдвига origin (0-100%)
     */
    public getShiftProgressPercent(): number {
        const localDistance = this.getShipLocalDistanceKm();
        const percent = (localDistance / this.config.shiftThresholdKm) * 100;
        return Math.min(100, Math.max(0, percent));
    }

    /**
     * Получение порога сдвига в км
     */
    public getShiftThresholdKm(): number {
        return this.config.shiftThresholdKm;
    }

    // ============================================================================
    // ГЕТТЕРЫ
    // ============================================================================

    getOrigin(): GlobalTransform {
        return this.origin.clone();
    }

    getShipLocalPosition(): Vector3 {
        return this.shipLocalPosition.clone();
    }

    getShipGlobalPosition(): GlobalTransform {
        return this.shipGlobalPosition.clone();
    }

    getShipSpeedKmh(): number {
        return this.shipSpeedKmh;
    }

    getTotalDistanceKm(): number {
        return this.stats.totalDistanceKm;
    }

    getDistanceFromEarthKm(): number {
        return Math.sqrt(
            this.origin.x * this.origin.x +
            this.origin.y * this.origin.y +
            this.origin.z * this.origin.z
        );
    }

    getDistanceFromEarthLy(): number {
        return this.getDistanceFromEarthKm() / 9_461_000_000_000;
    }

    getStats(): typeof this.stats {
        return { ...this.stats };
    }

    getObjectsCount(): number {
        return this.objects.size;
    }

    getDebugInfo(): any {
        return {
            origin: { x: this.origin.x, y: this.origin.y, z: this.origin.z },
            originLy: this.getDistanceFromEarthLy(),
            shipLocal: { x: this.shipLocalPosition.x, y: this.shipLocalPosition.y, z: this.shipLocalPosition.z },
            shipLocalDistanceKm: this.getShipLocalDistanceKm(),
            shiftProgressPercent: this.getShiftProgressPercent(),
            shiftThresholdKm: this.config.shiftThresholdKm,
            shipGlobal: { x: this.shipGlobalPosition.x, y: this.shipGlobalPosition.y, z: this.shipGlobalPosition.z },
            shipSpeedKmh: this.shipSpeedKmh,
            objectsCount: this.objects.size,
            isShifting: this.isShifting,
            stats: this.stats,
        };
    }

    // ============================================================================
    // ОЧИСТКА
    // ============================================================================

    destroy(): void {
        this.stopAutoSave();
        this.objects.clear();
        this.objectsToShift = [];
        this.pendingShiftDelta = null;
        this.isShifting = false;
        this.eventListeners = [];
    }
}

// ============================================================================
// ЭКСПОРТ СИНГЛТОНА
// ============================================================================

export const floatingOrigin = new FloatingOrigin({
    shiftThresholdKm: 10_000_000,
    unitsPerKm: 1.0,
    debug: true,
    maxObjectsPerFrame: 500,
    saveKey: 'floating_origin_save',
    autoSave: true,
    autoSaveInterval: 30,
});

export default floatingOrigin;