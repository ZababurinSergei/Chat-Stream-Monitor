// /10/tests/core/StarDataStore.ts
// Центральное хранилище всех звездных данных для проекта
// Версия 1.3.0 - Добавлены методы для работы с UI подпиской
// - Добавлен метод subscribe() для UI компонентов
// - Улучшена обработка absoluteMagnitude
// - Добавлена валидация данных перед сохранением
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { Vector3 } from '@orillusion/core';
import { Star } from '../star-api.js';

interface StarScientificData {
    sourceId: string;
    position: Vector3;
    distancePc: number;
    magnitude: number;
    absoluteMagnitude: number;      // Абсолютная звездная величина
    spectralType: string;
    temperature: number;
    color: [number, number, number];
    radius?: number;
    luminosity?: number;
    mass?: number;
    parallax?: number;
    properMotionRa?: number;
    properMotionDec?: number;
    radialVelocity?: number;
    metallicity?: number;
    currentBrightness?: number;
    lastUpdateDate?: Date;          // Дата последнего обновления
    ra?: number;
    dec?: number;
    barycentricPosition?: Vector3;
    heliocentricPosition?: Vector3;
}

class StarDataStore {
    private static instance: StarDataStore;

    // ЕДИНСТВЕННЫЙ источник данных
    private _rawStars: Star[] = [];                       // Исходные данные из API
    private _scientificStars: StarScientificData[] = []; // Научные данные
    private _lastUpdateTime: number = 0;
    private _listeners: Set<(data: { raw: Star[], scientific: StarScientificData[] }) => void> = new Set();

    private constructor() {}

    static getInstance(): StarDataStore {
        if (!StarDataStore.instance) {
            StarDataStore.instance = new StarDataStore();
        }
        return StarDataStore.instance;
    }

    // ============================================================
    // УСТАНОВКА ДАННЫХ
    // ============================================================

    setRawStars(stars: Star[]): void {
        this._rawStars = stars;
        this._lastUpdateTime = Date.now();
        this.notifyListeners();
        console.log(`📡 [StarDataStore] Установлено ${stars.length} исходных звезд`);
    }

    setScientificStars(stars: StarScientificData[]): void {
        // Фильтрация: проверяем наличие absoluteMagnitude
        const validStars = stars.filter(star =>
            star.absoluteMagnitude !== undefined &&
            star.absoluteMagnitude !== null &&
            !isNaN(star.absoluteMagnitude) &&
            star.magnitude > 0 &&
            star.magnitude < 30 &&
            star.distancePc > 0 &&
            star.distancePc < 10000
        );

        // Добавляем дату обновления для каждой звезды
        const now = new Date();
        const starsWithDate = validStars.map(star => ({
            ...star,
            lastUpdateDate: now
        }));

        if (validStars.length !== stars.length) {
            console.warn(`⚠️ [StarDataStore] Отфильтровано ${stars.length - validStars.length} звезд без absoluteMagnitude`);
        }

        this._scientificStars = starsWithDate;
        this._lastUpdateTime = Date.now();
        this.notifyListeners();
        console.log(`🔭 [StarDataStore] Установлено ${validStars.length} научных звезд`);
    }

    // ============================================================
    // ПОЛУЧЕНИЕ ДАННЫХ
    // ============================================================

    getRawStars(): Star[] {
        return this._rawStars;
    }

    getScientificStars(): StarScientificData[] {
        return this._scientificStars;
    }

    getStarById(sourceId: string): StarScientificData | null {
        return this._scientificStars.find(s => s.sourceId === sourceId) || null;
    }

    getStarByIndex(index: number): StarScientificData | null {
        return this._scientificStars[index] || null;
    }

    getStarCount(): number {
        return this._scientificStars.length;
    }

    getLastUpdateTime(): number {
        return this._lastUpdateTime;
    }

    // ============================================================
    // ПОДПИСКА ДЛЯ UI КОМПОНЕНТОВ (НОВЫЙ МЕТОД)
    // ============================================================

    /**
     * Подписка на изменения данных
     * @param callback - функция, вызываемая при изменении данных
     * @returns функция для отписки
     */
    subscribe(callback: (data: { raw: Star[], scientific: StarScientificData[] }) => void): () => void {
        this._listeners.add(callback);
        // Сразу вызываем с текущими данными
        callback({ raw: this._rawStars, scientific: this._scientificStars });
        return () => this._listeners.delete(callback);
    }

    private notifyListeners(): void {
        const data = { raw: this._rawStars, scientific: this._scientificStars };
        this._listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('❌ [StarDataStore] Ошибка в callback подписки:', error);
            }
        });
    }

    // ============================================================
    // ФИЛЬТРАЦИЯ И ПОИСК
    // ============================================================

    getStarsBySpectralType(spectralType: string): StarScientificData[] {
        return this._scientificStars.filter(s => s.spectralType === spectralType);
    }

    getStarsByMagnitude(minMag: number, maxMag: number): StarScientificData[] {
        return this._scientificStars.filter(s => s.magnitude >= minMag && s.magnitude <= maxMag);
    }

    getStarsByAbsoluteMagnitude(minAbsMag: number, maxAbsMag: number): StarScientificData[] {
        return this._scientificStars.filter(s => s.absoluteMagnitude >= minAbsMag && s.absoluteMagnitude <= maxAbsMag);
    }

    getNearestStars(limit: number = 10): StarScientificData[] {
        return [...this._scientificStars]
            .sort((a, b) => a.distancePc - b.distancePc)
            .slice(0, limit);
    }

    getBrightestStars(limit: number = 10): StarScientificData[] {
        return [...this._scientificStars]
            .sort((a, b) => a.magnitude - b.magnitude)
            .slice(0, limit);
    }

    getMostLuminousStars(limit: number = 10): StarScientificData[] {
        return [...this._scientificStars]
            .filter(s => s.luminosity !== undefined)
            .sort((a, b) => (b.luminosity || 0) - (a.luminosity || 0))
            .slice(0, limit);
    }

    // ============================================================
    // ОЧИСТКА
    // ============================================================

    clear(): void {
        this._rawStars = [];
        this._scientificStars = [];
        this._lastUpdateTime = 0;
        this.notifyListeners();
        console.log(`🗑️ [StarDataStore] Данные очищены`);
    }

    // ============================================================
    // СТАТИСТИКА (ОБНОВЛЕНА)
    // ============================================================

    getStats(): {
        totalRaw: number;
        totalScientific: number;
        lastUpdate: Date;
        spectralDistribution: Record<string, number>;
        distanceRange: { min: number; max: number; avg: number };
        magnitudeRange: { min: number; max: number; avg: number };
        absoluteMagnitudeRange: { min: number; max: number; avg: number };
        withAbsoluteMagnitude: number;
        withTeff: number;
        withParallax: number;
    } {
        const stars = this._scientificStars;
        const spectralDist: Record<string, number> = {};

        let totalDistance = 0;
        let totalMagnitude = 0;
        let totalAbsoluteMagnitude = 0;
        let minDistance = Infinity;
        let maxDistance = -Infinity;
        let minMagnitude = Infinity;
        let maxMagnitude = -Infinity;
        let minAbsoluteMagnitude = Infinity;
        let maxAbsoluteMagnitude = -Infinity;
        let withAbsoluteMagnitude = 0;
        let withTeff = 0;
        let withParallax = 0;

        for (const star of stars) {
            // Спектральное распределение
            spectralDist[star.spectralType] = (spectralDist[star.spectralType] || 0) + 1;

            // Расстояние
            totalDistance += star.distancePc;
            minDistance = Math.min(minDistance, star.distancePc);
            maxDistance = Math.max(maxDistance, star.distancePc);

            // Видимая яркость
            totalMagnitude += star.magnitude;
            minMagnitude = Math.min(minMagnitude, star.magnitude);
            maxMagnitude = Math.max(maxMagnitude, star.magnitude);

            // Абсолютная яркость
            if (star.absoluteMagnitude !== undefined && !isNaN(star.absoluteMagnitude)) {
                totalAbsoluteMagnitude += star.absoluteMagnitude;
                minAbsoluteMagnitude = Math.min(minAbsoluteMagnitude, star.absoluteMagnitude);
                maxAbsoluteMagnitude = Math.max(maxAbsoluteMagnitude, star.absoluteMagnitude);
                withAbsoluteMagnitude++;
            }

            // Дополнительные параметры
            if (star.temperature > 0) withTeff++;
            if (star.parallax && star.parallax > 0) withParallax++;
        }

        const count = stars.length;
        return {
            totalRaw: this._rawStars.length,
            totalScientific: count,
            lastUpdate: new Date(this._lastUpdateTime),
            spectralDistribution: spectralDist,
            distanceRange: {
                min: minDistance === Infinity ? 0 : minDistance,
                max: maxDistance === -Infinity ? 0 : maxDistance,
                avg: count ? totalDistance / count : 0
            },
            magnitudeRange: {
                min: minMagnitude === Infinity ? 0 : minMagnitude,
                max: maxMagnitude === -Infinity ? 0 : maxMagnitude,
                avg: count ? totalMagnitude / count : 0
            },
            absoluteMagnitudeRange: {
                min: minAbsoluteMagnitude === Infinity ? 0 : minAbsoluteMagnitude,
                max: maxAbsoluteMagnitude === -Infinity ? 0 : maxAbsoluteMagnitude,
                avg: withAbsoluteMagnitude ? totalAbsoluteMagnitude / withAbsoluteMagnitude : 0
            },
            withAbsoluteMagnitude,
            withTeff,
            withParallax
        };
    }

    // ============================================================
    // ЭКСПОРТ/ИМПОРТ ДАННЫХ
    // ============================================================

    exportToJSON(): string {
        const exportData = {
            version: '1.3.0',
            timestamp: new Date().toISOString(),
            rawStarsCount: this._rawStars.length,
            scientificStarsCount: this._scientificStars.length,
            scientificStars: this._scientificStars.map(star => ({
                sourceId: star.sourceId,
                position: { x: star.position.x, y: star.position.y, z: star.position.z },
                distancePc: star.distancePc,
                magnitude: star.magnitude,
                absoluteMagnitude: star.absoluteMagnitude,
                spectralType: star.spectralType,
                temperature: star.temperature,
                color: star.color,
                radius: star.radius,
                luminosity: star.luminosity,
                mass: star.mass,
                parallax: star.parallax,
                properMotionRa: star.properMotionRa,
                properMotionDec: star.properMotionDec,
                radialVelocity: star.radialVelocity,
                metallicity: star.metallicity,
                lastUpdateDate: star.lastUpdateDate?.toISOString(),
                ra: star.ra,
                dec: star.dec
            }))
        };
        return JSON.stringify(exportData, null, 2);
    }

    importFromJSON(json: string): boolean {
        try {
            const data = JSON.parse(json);
            if (data.version !== '1.3.0' && data.version !== '1.2.0' && data.version !== '1.1.0') {
                console.warn(`⚠️ Неизвестная версия: ${data.version}`);
            }

            const importedStars: StarScientificData[] = data.scientificStars.map((star: any) => ({
                sourceId: star.sourceId,
                position: new Vector3(star.position.x, star.position.y, star.position.z),
                distancePc: star.distancePc,
                magnitude: star.magnitude,
                absoluteMagnitude: star.absoluteMagnitude || this.calculateAbsoluteMagnitude(star.magnitude, star.distancePc),
                spectralType: star.spectralType,
                temperature: star.temperature,
                color: star.color,
                radius: star.radius,
                luminosity: star.luminosity,
                mass: star.mass,
                parallax: star.parallax,
                properMotionRa: star.properMotionRa,
                properMotionDec: star.properMotionDec,
                radialVelocity: star.radialVelocity,
                metallicity: star.metallicity,
                lastUpdateDate: star.lastUpdateDate ? new Date(star.lastUpdateDate) : new Date(),
                ra: star.ra,
                dec: star.dec
            }));

            this.setScientificStars(importedStars);
            console.log(`📥 Импортировано ${importedStars.length} звезд`);
            return true;
        } catch (error) {
            console.error('Ошибка импорта:', error);
            return false;
        }
    }

    private calculateAbsoluteMagnitude(apparentMag: number, distancePc: number): number {
        if (distancePc <= 0) return apparentMag;
        const distanceModulus = 5 * Math.log10(distancePc) - 5;
        return apparentMag - distanceModulus;
    }

    // ============================================================
    // ОБНОВЛЕНИЕ ДАННЫХ
    // ============================================================

    updateStarPosition(sourceId: string, newPosition: Vector3): boolean {
        const star = this._scientificStars.find(s => s.sourceId === sourceId);
        if (star) {
            star.position = newPosition;
            star.lastUpdateDate = new Date();
            this.notifyListeners();
            return true;
        }
        return false;
    }

    updateStarBrightness(sourceId: string, newBrightness: number): boolean {
        const star = this._scientificStars.find(s => s.sourceId === sourceId);
        if (star) {
            star.currentBrightness = newBrightness;
            star.lastUpdateDate = new Date();
            this.notifyListeners();
            return true;
        }
        return false;
    }

    // ============================================================
    // ОТЛАДКА
    // ============================================================

    debug(): void {
        const stats = this.getStats();
        console.log('\n' + '═'.repeat(70));
        console.log('📡 [StarDataStore] ОТЛАДКА ХРАНИЛИЩА v1.3.0');
        console.log('═'.repeat(70));
        console.log(`📊 Исходных звезд: ${stats.totalRaw}`);
        console.log(`🔭 Научных звезд: ${stats.totalScientific}`);
        console.log(`⭐ С абсолютной величиной: ${stats.withAbsoluteMagnitude} (${(stats.withAbsoluteMagnitude / stats.totalScientific * 100).toFixed(1)}%)`);
        console.log(`🌡️ С температурой: ${stats.withTeff} (${(stats.withTeff / stats.totalScientific * 100).toFixed(1)}%)`);
        console.log(`📍 С параллаксом: ${stats.withParallax} (${(stats.withParallax / stats.totalScientific * 100).toFixed(1)}%)`);
        console.log(`🕐 Последнее обновление: ${stats.lastUpdate.toLocaleTimeString()}`);

        console.log(`\n⭐ Спектральное распределение:`);
        for (const [type, count] of Object.entries(stats.spectralDistribution).sort()) {
            const percent = (count / (stats.totalScientific || 1) * 100).toFixed(1);
            console.log(`   ${type}: ${count} звезд (${percent}%)`);
        }

        console.log(`\n📏 Расстояния (пк): мин=${stats.distanceRange.min.toFixed(1)}, макс=${stats.distanceRange.max.toFixed(1)}, ср=${stats.distanceRange.avg.toFixed(1)}`);
        console.log(`💡 Видимая яркость (mag): мин=${stats.magnitudeRange.min.toFixed(2)}, макс=${stats.magnitudeRange.max.toFixed(2)}, ср=${stats.magnitudeRange.avg.toFixed(2)}`);
        console.log(`💫 Абсолютная яркость (M): мин=${stats.absoluteMagnitudeRange.min.toFixed(2)}, макс=${stats.absoluteMagnitudeRange.max.toFixed(2)}, ср=${stats.absoluteMagnitudeRange.avg.toFixed(2)}`);
        console.log(`👥 Подписчиков: ${this._listeners.size}`);
        console.log('═'.repeat(70) + '\n');
    }

    // ============================================================
    // ПОЛУЧЕНИЕ КОЛИЧЕСТВА ПОДПИСЧИКОВ
    // ============================================================

    getListenerCount(): number {
        return this._listeners.size;
    }

    // ============================================================
    // ПРОВЕРКА НАЛИЧИЯ ДАННЫХ
    // ============================================================

    hasData(): boolean {
        return this._scientificStars.length > 0;
    }

    isEmpty(): boolean {
        return this._scientificStars.length === 0;
    }
}

// ============================================================================
// ЭКСПОРТ СИНГЛТОНА
// ============================================================================

export const starDataStore = StarDataStore.getInstance();

// Для доступа из консоли
if (typeof window !== 'undefined') {
    (window as any).__starDataStore = starDataStore;
    console.log('✅ [StarDataStore] Глобальный доступ: __starDataStore');
}

// ============================================================================
// ЭКСПОРТ ТИПОВ
// ============================================================================

export type { StarScientificData };

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default starDataStore;

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

console.log('═'.repeat(70));
console.log('📡 [StarDataStore] МОДУЛЬ ЗАГРУЖЕН v1.3.0');
console.log('   • Центральное хранилище звездных данных');
console.log('   • Поддержка подписки для UI компонентов');
console.log('   • Автоматическая фильтрация звезд без absoluteMagnitude');
console.log('   • Статистика и отладка через __starDataStore');
console.log('   • Методы: getStats(), debug(), subscribe(), clear()');
console.log('═'.repeat(70));