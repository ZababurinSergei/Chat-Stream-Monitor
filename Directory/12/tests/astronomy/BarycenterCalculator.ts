// /10/tests/astronomy/BarycenterCalculator.ts
// Модуль для расчета барицентра Солнечной системы
// Версия 1.1.0 - Добавлены методы для обновления позиций звезд
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { Vector3 } from '@orillusion/core';

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface PlanetOrbitData {
    name: string;
    mass: number;           // масса в кг
    semiMajorAxis: number;  // большая полуось в км
    orbitalPeriod: number;  // период в днях
    eccentricity: number;   // эксцентриситет орбиты
    inclination: number;    // наклонение в градусах
    longitudeAscendingNode: number; // долгота восходящего узла
    argumentPeriapsis: number;      // аргумент перицентра
    meanAnomalyAtJ2000: number;     // средняя аномалия на J2000.0
}

export interface BarycenterConfig {
    usePreciseModel: boolean;      // использовать точную модель или упрощенную
    updateIntervalMs: number;       // интервал обновления в мс
    autoUpdate: boolean;            // автоматически обновлять по времени
    referenceDate: Date;            // опорная дата (по умолчанию J2000.0)
    includeAllPlanets: boolean;     // учитывать все планеты или только газовые гиганты
    useVSOP87: boolean;             // использовать точную модель VSOP87 (требует данных)
    debug: boolean;                 // режим отладки
}

// ============================================================================
// ДАННЫЕ ПЛАНЕТ (из JPL DE431)
// ============================================================================

const PLANET_ORBIT_DATA: Record<string, PlanetOrbitData> = {
    sun: {
        name: 'Солнце',
        mass: 1.988544e30,
        semiMajorAxis: 0,
        orbitalPeriod: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeAscendingNode: 0,
        argumentPeriapsis: 0,
        meanAnomalyAtJ2000: 0
    },
    jupiter: {
        name: 'Юпитер',
        mass: 1.8986e27,
        semiMajorAxis: 778.5e6,      // 778.5 млн км
        orbitalPeriod: 4332.59,       // дней
        eccentricity: 0.0489,
        inclination: 1.304,
        longitudeAscendingNode: 100.464,
        argumentPeriapsis: 273.867,
        meanAnomalyAtJ2000: 20.020
    },
    saturn: {
        name: 'Сатурн',
        mass: 5.6846e26,
        semiMajorAxis: 1433.5e6,     // 1.4335 млрд км
        orbitalPeriod: 10759.22,
        eccentricity: 0.0565,
        inclination: 2.485,
        longitudeAscendingNode: 113.665,
        argumentPeriapsis: 339.392,
        meanAnomalyAtJ2000: 317.521
    },
    neptune: {
        name: 'Нептун',
        mass: 1.0243e26,
        semiMajorAxis: 4495.1e6,     // 4.495 млрд км
        orbitalPeriod: 60190.0,
        eccentricity: 0.00868,
        inclination: 1.769,
        longitudeAscendingNode: 131.784,
        argumentPeriapsis: 276.336,
        meanAnomalyAtJ2000: 256.228
    },
    uranus: {
        name: 'Уран',
        mass: 8.6810e25,
        semiMajorAxis: 2872.5e6,     // 2.8725 млрд км
        orbitalPeriod: 30687.15,
        eccentricity: 0.0457,
        inclination: 0.773,
        longitudeAscendingNode: 74.006,
        argumentPeriapsis: 98.998,
        meanAnomalyAtJ2000: 142.955
    },
    earth: {
        name: 'Земля',
        mass: 5.9722e24,
        semiMajorAxis: 149.6e6,      // 149.6 млн км
        orbitalPeriod: 365.256,
        eccentricity: 0.01671,
        inclination: 0,
        longitudeAscendingNode: 0,
        argumentPeriapsis: 102.937,
        meanAnomalyAtJ2000: 357.529
    },
    venus: {
        name: 'Венера',
        mass: 4.8675e24,
        semiMajorAxis: 108.2e6,
        orbitalPeriod: 224.701,
        eccentricity: 0.00678,
        inclination: 3.394,
        longitudeAscendingNode: 76.680,
        argumentPeriapsis: 54.891,
        meanAnomalyAtJ2000: 126.525
    },
    mars: {
        name: 'Марс',
        mass: 6.4171e23,
        semiMajorAxis: 227.9e6,
        orbitalPeriod: 686.980,
        eccentricity: 0.0934,
        inclination: 1.850,
        longitudeAscendingNode: 49.578,
        argumentPeriapsis: 286.537,
        meanAnomalyAtJ2000: 355.433
    },
    mercury: {
        name: 'Меркурий',
        mass: 3.3011e23,
        semiMajorAxis: 57.91e6,
        orbitalPeriod: 87.969,
        eccentricity: 0.2056,
        inclination: 7.005,
        longitudeAscendingNode: 48.331,
        argumentPeriapsis: 29.124,
        meanAnomalyAtJ2000: 174.796
    }
};

// ============================================================================
// ИНТЕРФЕЙС ДЛЯ ОБНОВЛЕНИЯ ЗВЕЗД
// ============================================================================

export interface StarPositionUpdatable {
    id: string;
    barycentricPosition: Vector3;
    object3D: { transform: { localPosition: Vector3 } };
    onPositionUpdated?: (newPosition: Vector3) => void;
}

// ============================================================================
// ОСНОВНОЙ КЛАСС КАЛЬКУЛЯТОРА БАРИЦЕНТРА
// ============================================================================

export class BarycenterCalculator {
    private static instance: BarycenterCalculator;
    private config: BarycenterConfig;
    private currentBarycenter: Vector3 = new Vector3(0, 0, 0);
    private lastUpdateTime: number = 0;
    private updateTimer: number | null = null;
    private observers: ((barycenter: Vector3, date: Date) => void)[] = [];

    // Кэш для оптимизации
    private planetPositionsCache: Map<string, Vector3> = new Map();
    private lastCacheDate: Date | null = null;

    // ✅ НОВОЕ: кэш для звезд
    private starUpdateQueue: StarPositionUpdatable[] = [];
    private isUpdatingStars: boolean = false;

    private constructor(config?: Partial<BarycenterConfig>) {
        // Конфигурация по умолчанию
        this.config = {
            usePreciseModel: true,
            updateIntervalMs: 1000,
            autoUpdate: true,
            referenceDate: new Date('2000-01-01T12:00:00Z'),
            includeAllPlanets: false,
            useVSOP87: false,
            debug: false
        };

        if (config) {
            this.config = { ...this.config, ...config };
        }

        if (this.config.autoUpdate) {
            this.startAutoUpdate();
        }
    }

    public static getInstance(config?: Partial<BarycenterConfig>): BarycenterCalculator {
        if (!BarycenterCalculator.instance) {
            BarycenterCalculator.instance = new BarycenterCalculator(config);
        }
        return BarycenterCalculator.instance;
    }

    // ============================================================================
    // ОСНОВНЫЕ МЕТОДЫ
    // ============================================================================

    /**
     * Вычисляет позицию барицентра на заданную дату
     * @param date - дата для расчета
     * @returns позиция барицентра в км
     */
    public calculateBarycenter(date: Date): Vector3 {
        if (!this.config.usePreciseModel) {
            return this.calculateSimpleBarycenter(date);
        }

        // Используем кэш для одинаковых дат
        if (this.lastCacheDate && Math.abs(this.lastCacheDate.getTime() - date.getTime()) < 1000) {
            return this.currentBarycenter.clone();
        }

        let barycenter = new Vector3(0, 0, 0);
        let totalMass = 0;

        const planets = this.config.includeAllPlanets
            ? ['jupiter', 'saturn', 'uranus', 'neptune', 'earth', 'venus', 'mars', 'mercury']
            : ['jupiter', 'saturn', 'uranus', 'neptune'];

        // Добавляем Солнце
        const sunMass = PLANET_ORBIT_DATA.sun.mass;
        totalMass += sunMass;

        // Для каждой планеты вычисляем позицию и добавляем вклад в барицентр
        for (const planetName of planets) {
            const planetData = PLANET_ORBIT_DATA[planetName];
            if (!planetData) continue;

            const planetPos = this.calculatePlanetPosition(planetData, date);
            this.planetPositionsCache.set(planetName, planetPos.clone());

            barycenter.x += planetData.mass * planetPos.x;
            barycenter.y += planetData.mass * planetPos.y;
            barycenter.z += planetData.mass * planetPos.z;
            totalMass += planetData.mass;
        }

        // Делим на общую массу
        barycenter.x /= totalMass;
        barycenter.y /= totalMass;
        barycenter.z /= totalMass;

        this.currentBarycenter = barycenter;
        this.lastCacheDate = date;

        return barycenter.clone();
    }

    /**
     * Упрощенная модель (только для производительности, если точность не критична)
     */
    private calculateSimpleBarycenter(date: Date): Vector3 {
        const j2000 = new Date('2000-01-01T12:00:00Z');
        const yearsSinceJ2000 = (date.getTime() - j2000.getTime()) / (1000 * 3600 * 24 * 365.25);

        // Упрощенная модель: только Юпитер и Сатурн в одной плоскости
        const jupiterAngle = yearsSinceJ2000 * 2 * Math.PI / 11.86;
        const saturnAngle = yearsSinceJ2000 * 2 * Math.PI / 29.46;

        // Амплитуды смещения от центра Солнца (км)
        const JUPITER_EFFECT = 742_000;
        const SATURN_EFFECT = 450_000;

        return new Vector3(
            JUPITER_EFFECT * Math.cos(jupiterAngle) + SATURN_EFFECT * Math.cos(saturnAngle),
            JUPITER_EFFECT * Math.sin(jupiterAngle) + SATURN_EFFECT * Math.sin(saturnAngle),
            0
        );
    }

    /**
     * Вычисляет позицию планеты на эллиптической орбите
     * (упрощенная модель Кеплера, достаточная для барицентра)
     */
    private calculatePlanetPosition(planet: PlanetOrbitData, date: Date): Vector3 {
        const j2000 = this.config.referenceDate;
        const daysSinceJ2000 = (date.getTime() - j2000.getTime()) / (1000 * 3600 * 24);

        // Средняя аномалия (градусы)
        let meanAnomaly = planet.meanAnomalyAtJ2000 + 360 * daysSinceJ2000 / planet.orbitalPeriod;
        meanAnomaly = meanAnomaly % 360;

        // Преобразуем в радианы
        const M = meanAnomaly * Math.PI / 180;
        const e = planet.eccentricity;

        // Решаем уравнение Кеплера: M = E - e * sin(E)
        let E = M;
        for (let i = 0; i < 10; i++) {
            E = M + e * Math.sin(E);
        }

        // Истинная аномалия (ν)
        const nu = 2 * Math.atan2(
            Math.sqrt(1 + e) * Math.sin(E / 2),
            Math.sqrt(1 - e) * Math.cos(E / 2)
        );

        // Расстояние от Солнца
        const r = planet.semiMajorAxis * (1 - e * e) / (1 + e * Math.cos(nu));

        // Позиция в орбитальной плоскости
        const xOrbit = r * Math.cos(nu);
        const yOrbit = r * Math.sin(nu);

        // Преобразуем в эклиптическую систему координат
        const i = planet.inclination * Math.PI / 180;
        const omega = planet.longitudeAscendingNode * Math.PI / 180;
        const w = planet.argumentPeriapsis * Math.PI / 180;

        const cosOmega = Math.cos(omega);
        const sinOmega = Math.sin(omega);
        const cosW = Math.cos(w);
        const sinW = Math.sin(w);
        const cosI = Math.cos(i);
        const sinI = Math.sin(i);

        const x = (cosOmega * cosW - sinOmega * sinW * cosI) * xOrbit +
            (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrbit;

        const y = (sinOmega * cosW + cosOmega * sinW * cosI) * xOrbit +
            (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrbit;

        const z = (sinW * sinI) * xOrbit + (cosW * sinI) * yOrbit;

        return new Vector3(x, y, z);
    }

    // ============================================================================
    // МЕТОДЫ ДЛЯ КООРДИНАТ ЗВЕЗД
    // ============================================================================

    /**
     * Преобразует координаты звезды из барицентрических в гелиоцентрические
     * @param barycentricPos - позиция звезды в барицентрической системе (парсеки)
     * @param date - дата наблюдения
     * @returns позиция звезды относительно центра Солнца (парсеки)
     */
    public barycentricToHeliocentric(barycentricPos: Vector3, date: Date): Vector3 {
        const barycenterKm = this.calculateBarycenter(date);
        // Конвертируем барицентр из км в парсеки
        const KM_TO_PARSEC = 1 / 3.085677581e13;
        const barycenterPc = new Vector3(
            barycenterKm.x * KM_TO_PARSEC,
            barycenterKm.y * KM_TO_PARSEC,
            barycenterKm.z * KM_TO_PARSEC
        );

        // Гелиоцентрическая позиция = Барицентрическая - Смещение барицентра
        return new Vector3(
            barycentricPos.x - barycenterPc.x,
            barycentricPos.y - barycenterPc.y,
            barycentricPos.z - barycenterPc.z
        );
    }

    /**
     * Преобразует координаты звезды из гелиоцентрических в барицентрические
     * @param heliocentricPos - позиция звезды относительно Солнца (парсеки)
     * @param date - дата наблюдения
     * @returns позиция звезды в барицентрической системе (парсеки)
     */
    public heliocentricToBarycentric(heliocentricPos: Vector3, date: Date): Vector3 {
        const barycenterKm = this.calculateBarycenter(date);
        const KM_TO_PARSEC = 1 / 3.085677581e13;
        const barycenterPc = new Vector3(
            barycenterKm.x * KM_TO_PARSEC,
            barycenterKm.y * KM_TO_PARSEC,
            barycenterKm.z * KM_TO_PARSEC
        );

        return new Vector3(
            heliocentricPos.x + barycenterPc.x,
            heliocentricPos.y + barycenterPc.y,
            heliocentricPos.z + barycenterPc.z
        );
    }

    /**
     * Получает текущую дату в формате J2000.0 (для астрономических расчетов)
     */
    public getJ2000Date(date: Date = new Date()): number {
        const j2000 = new Date('2000-01-01T12:00:00Z');
        return (date.getTime() - j2000.getTime()) / (1000 * 3600 * 24);
    }

    // ============================================================================
    // ✅ НОВЫЕ МЕТОДЫ ДЛЯ ОБНОВЛЕНИЯ ЗВЕЗД
    // ============================================================================

    /**
     * Получает текущую гелиоцентрическую позицию звезды
     * @param barycentricPos - барицентрическая позиция (парсеки)
     * @param date - дата наблюдения (по умолчанию текущая)
     * @returns гелиоцентрическая позиция (парсеки)
     */
    public getHeliocentricPosition(barycentricPos: Vector3, date: Date = new Date()): Vector3 {
        return this.barycentricToHeliocentric(barycentricPos, date);
    }

    /**
     * Пакетное обновление позиций звезд
     * @param stars - массив звезд с барицентрическими позициями
     * @param date - дата для расчета (по умолчанию текущая)
     * @returns количество обновленных звезд
     */
    public updateStarsPositions(
        stars: StarPositionUpdatable[],
        date: Date = new Date()
    ): number {
        if (!stars || stars.length === 0) return 0;

        const startTime = performance.now();
        let updatedCount = 0;

        for (const star of stars) {
            if (!star.barycentricPosition) continue;

            // Пересчет гелиоцентрической позиции
            const heliocentricPos = this.barycentricToHeliocentric(
                star.barycentricPosition,
                date
            );

            // Обновление 3D объекта
            if (star.object3D && star.object3D.transform) {
                star.object3D.transform.localPosition = heliocentricPos;
            }

            // Вызов колбэка если есть
            if (star.onPositionUpdated) {
                star.onPositionUpdated(heliocentricPos);
            }

            updatedCount++;
        }

        const elapsed = performance.now() - startTime;
        if (this.config.debug && updatedCount > 0) {
            console.log(`🔄 [BarycenterCalculator] Обновлено ${updatedCount} звезд за ${elapsed.toFixed(2)}ms`);
        }

        return updatedCount;
    }

    /**
     * Асинхронное пакетное обновление позиций звезд
     * @param stars - массив звезд с барицентрическими позициями
     * @param date - дата для расчета
     * @param batchSize - размер пакета для асинхронной обработки
     * @returns Promise с количеством обновленных звезд
     */
    public async updateStarsPositionsAsync(
        stars: StarPositionUpdatable[],
        date: Date = new Date(),
        batchSize: number = 100
    ): Promise<number> {
        if (!stars || stars.length === 0) return 0;

        if (this.isUpdatingStars) {
            // Добавляем в очередь
            this.starUpdateQueue.push(...stars);
            if (this.config.debug) {
                console.log(`⏳ [BarycenterCalculator] Звезды добавлены в очередь (${this.starUpdateQueue.length})`);
            }
            return 0;
        }

        this.isUpdatingStars = true;
        let updatedCount = 0;

        try {
            for (let i = 0; i < stars.length; i += batchSize) {
                const batch = stars.slice(i, i + batchSize);

                // Позволяем другим задачам выполняться между пакетами
                await new Promise(resolve => setTimeout(resolve, 0));

                for (const star of batch) {
                    if (!star.barycentricPosition) continue;

                    const heliocentricPos = this.barycentricToHeliocentric(
                        star.barycentricPosition,
                        date
                    );

                    if (star.object3D && star.object3D.transform) {
                        star.object3D.transform.localPosition = heliocentricPos;
                    }

                    if (star.onPositionUpdated) {
                        star.onPositionUpdated(heliocentricPos);
                    }

                    updatedCount++;
                }

                if (this.config.debug) {
                    console.log(`📡 [BarycenterCalculator] Обработано ${Math.min(i + batchSize, stars.length)}/${stars.length} звезд`);
                }
            }

            // Обрабатываем очередь, если есть
            if (this.starUpdateQueue.length > 0) {
                const queueStars = [...this.starUpdateQueue];
                this.starUpdateQueue = [];
                const queueUpdated = await this.updateStarsPositionsAsync(queueStars, date, batchSize);
                updatedCount += queueUpdated;
            }

        } finally {
            this.isUpdatingStars = false;
        }

        if (this.config.debug) {
            console.log(`✅ [BarycenterCalculator] Обновлено ${updatedCount} звезд`);
        }

        return updatedCount;
    }

    /**
     * Добавляет звезду в очередь на обновление
     * @param star - звезда для обновления
     */
    public queueStarUpdate(star: StarPositionUpdatable): void {
        this.starUpdateQueue.push(star);
        if (this.config.debug) {
            console.log(`📌 [BarycenterCalculator] Звезда ${star.id} добавлена в очередь`);
        }
    }

    /**
     * Очищает очередь обновления звезд
     */
    public clearStarUpdateQueue(): void {
        const queueSize = this.starUpdateQueue.length;
        this.starUpdateQueue = [];
        if (this.config.debug && queueSize > 0) {
            console.log(`🗑️ [BarycenterCalculator] Очищена очередь (${queueSize} звезд)`);
        }
    }

    /**
     * Получает размер очереди обновления
     */
    public getStarUpdateQueueSize(): number {
        return this.starUpdateQueue.length;
    }

    // ============================================================================
    // НАБЛЮДАТЕЛИ И АВТООБНОВЛЕНИЕ
    // ============================================================================

    public subscribe(callback: (barycenter: Vector3, date: Date) => void): () => void {
        this.observers.push(callback);
        return () => {
            const index = this.observers.indexOf(callback);
            if (index !== -1) this.observers.splice(index, 1);
        };
    }

    private startAutoUpdate(): void {
        if (this.updateTimer) return;

        const update = () => {
            const now = new Date();
            const barycenter = this.calculateBarycenter(now);

            for (const observer of this.observers) {
                observer(barycenter, now);
            }

            this.updateTimer = window.setTimeout(update, this.config.updateIntervalMs);
        };

        update();
    }

    public stopAutoUpdate(): void {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
    }

    // ============================================================================
    // ОТЛАДКА И ИНФОРМАЦИЯ
    // ============================================================================

    public getBarycenterInfo(date: Date = new Date()): {
        positionKm: Vector3;
        positionAu: Vector3;
        distanceFromSunKm: number;
        distanceFromSunAu: number;
        isInsideSun: boolean;
    } {
        const positionKm = this.calculateBarycenter(date);
        const sunRadiusKm = 695_700;

        // Конвертируем в астрономические единицы (1 AU = 149.6 млн км)
        const KM_TO_AU = 1 / 149_597_870;
        const positionAu = new Vector3(
            positionKm.x * KM_TO_AU,
            positionKm.y * KM_TO_AU,
            positionKm.z * KM_TO_AU
        );

        const distanceFromSunKm = Math.sqrt(
            positionKm.x * positionKm.x +
            positionKm.y * positionKm.y +
            positionKm.z * positionKm.z
        );

        return {
            positionKm,
            positionAu,
            distanceFromSunKm,
            distanceFromSunAu: distanceFromSunKm * KM_TO_AU,
            isInsideSun: distanceFromSunKm < sunRadiusKm
        };
    }

    public getConfig(): BarycenterConfig {
        return { ...this.config };
    }

    public setConfig(config: Partial<BarycenterConfig>): void {
        this.config = { ...this.config, ...config };
        if (this.config.debug) {
            console.log('⚙️ [BarycenterCalculator] Конфигурация обновлена:', this.config);
        }
    }

    public debug(date: Date = new Date()): void {
        const info = this.getBarycenterInfo(date);

        console.log(`\n📡 БАРИЦЕНТР СОЛНЕЧНОЙ СИСТЕМЫ`);
        console.log(`📅 Дата: ${date.toISOString()}`);
        console.log(`📍 Позиция: (${info.positionKm.x.toFixed(0)} км, ${info.positionKm.y.toFixed(0)} км, ${info.positionKm.z.toFixed(0)} км)`);
        console.log(`📍 Позиция: (${info.positionAu.x.toFixed(6)} AU, ${info.positionAu.y.toFixed(6)} AU, ${info.positionAu.z.toFixed(6)} AU)`);
        console.log(`📏 Расстояние от центра Солнца: ${(info.distanceFromSunKm / 1000).toFixed(0)} тыс км`);
        console.log(`☀️ Внутри Солнца: ${info.isInsideSun ? 'ДА' : 'НЕТ'}`);
        console.log(`🪐 Модель: ${this.config.usePreciseModel ? 'Точная (Кеплер)' : 'Упрощенная'}`);
        console.log(`🔄 Автообновление: ${this.config.autoUpdate ? 'ВКЛ' : 'ВЫКЛ'}`);
        console.log(`📊 Очередь звезд: ${this.starUpdateQueue.length}`);

        if (this.planetPositionsCache.size > 0) {
            console.log(`\n🪐 Позиции планет (относительно Солнца):`);
            for (const [name, pos] of this.planetPositionsCache) {
                const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
                const distanceAu = distance / 149_597_870;
                console.log(`   ${name.toUpperCase()}: ${distanceAu.toFixed(2)} AU`);
            }
        }

        console.log(``);
    }

    // ============================================================================
    // СБРОС И ОЧИСТКА
    // ============================================================================

    public reset(): void {
        this.currentBarycenter = new Vector3(0, 0, 0);
        this.lastCacheDate = null;
        this.planetPositionsCache.clear();
        this.starUpdateQueue = [];
        this.isUpdatingStars = false;

        if (this.config.debug) {
            console.log('🔄 [BarycenterCalculator] Сброшен до начального состояния');
        }
    }

    public destroy(): void {
        this.stopAutoUpdate();
        this.observers = [];
        this.planetPositionsCache.clear();
        this.starUpdateQueue = [];
        this.isUpdatingStars = false;

        if (this.config.debug) {
            console.log('💀 [BarycenterCalculator] Уничтожен');
        }
    }
}

// ============================================================================
// ХЕЛПЕРЫ И УТИЛИТЫ
// ============================================================================

/**
 * Преобразует звездные координаты из Gaia в барицентрические
 * @param raDeg - прямое восхождение в градусах
 * @param decDeg - склонение в градусах
 * @param distancePc - расстояние в парсеках
 * @returns вектор позиции в барицентрической системе координат (парсеки)
 */
export function gaiaToBarycentricXYZ(raDeg: number, decDeg: number, distancePc: number): Vector3 {
    const raRad = raDeg * Math.PI / 180;
    const decRad = decDeg * Math.PI / 180;

    const cosDec = Math.cos(decRad);
    const sinDec = Math.sin(decRad);
    const cosRa = Math.cos(raRad);
    const sinRa = Math.sin(raRad);

    return new Vector3(
        distancePc * cosDec * cosRa,
        distancePc * cosDec * sinRa,
        distancePc * sinDec
    );
}

/**
 * Преобразует XYZ координаты в RA/DEC
 * @param pos - вектор позиции в парсеках
 * @returns объект с RA и DEC в градусах
 */
export function xyzToRaDec(pos: Vector3): { ra: number; dec: number } {
    const r = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
    const ra = Math.atan2(pos.y, pos.x) * 180 / Math.PI;
    const dec = Math.asin(pos.z / r) * 180 / Math.PI;

    return {
        ra: (ra + 360) % 360,
        dec: Math.max(-90, Math.min(90, dec))
    };
}

/**
 * Интерфейс для звездных данных с поддержкой барицентра
 */
export interface BarycentricStarData {
    sourceId: string;
    barycentricPosition: Vector3;  // парсеки
    heliocentricPosition: Vector3; // парсеки (зависит от даты!)
    magnitude: number;
    temperature?: number;
    spectralType?: string;
    parallax: number;
    properMotionRa: number;
    properMotionDec: number;
    radialVelocity: number;
}

/**
 * Класс для управления звездами с учетом барицентра
 */
export class BarycentricStarManager {
    private calculator: BarycenterCalculator;
    private stars: Map<string, BarycentricStarData> = new Map();
    private currentDate: Date = new Date();
    private unsubscribe: (() => void) | null = null;
    private updateInterval: number | null = null;

    constructor(calculator?: BarycenterCalculator) {
        this.calculator = calculator || BarycenterCalculator.getInstance();

        // Подписываемся на обновления барицентра
        this.unsubscribe = this.calculator.subscribe((barycenter, date) => {
            this.currentDate = date;
            this.updateAllStarPositions();
        });
    }

    /**
     * Добавляет звезду из данных Gaia
     */
    public addStarFromGaia(
        sourceId: string,
        raDeg: number,
        decDeg: number,
        parallaxMas: number,
        magnitude: number,
        teff?: number,
        spectralType?: string
    ): void {
        // Расстояние в парсеках из параллакса
        const distancePc = 1000 / parallaxMas;

        // Барицентрическая позиция (фиксированная, не зависит от времени)
        const barycentricPos = gaiaToBarycentricXYZ(raDeg, decDeg, distancePc);

        // Текущая гелиоцентрическая позиция (зависит от даты)
        const heliocentricPos = this.calculator.barycentricToHeliocentric(barycentricPos, this.currentDate);

        this.stars.set(sourceId, {
            sourceId,
            barycentricPosition: barycentricPos,
            heliocentricPosition: heliocentricPos,
            magnitude,
            temperature: teff,
            spectralType,
            parallax: parallaxMas,
            properMotionRa: 0,
            properMotionDec: 0,
            radialVelocity: 0
        });
    }

    /**
     * Обновляет позиции всех звезд с учетом текущей даты
     */
    private updateAllStarPositions(): void {
        for (const [sourceId, star] of this.stars) {
            star.heliocentricPosition = this.calculator.barycentricToHeliocentric(
                star.barycentricPosition,
                this.currentDate
            );
        }
    }

    /**
     * Получает текущую гелиоцентрическую позицию звезды (для рендеринга)
     */
    public getHeliocentricPosition(sourceId: string): Vector3 | null {
        const star = this.stars.get(sourceId);
        return star ? star.heliocentricPosition.clone() : null;
    }

    /**
     * Получает барицентрическую позицию звезды (фиксированная)
     */
    public getBarycentricPosition(sourceId: string): Vector3 | null {
        const star = this.stars.get(sourceId);
        return star ? star.barycentricPosition.clone() : null;
    }

    /**
     * Получает все звезды
     */
    public getAllStars(): BarycentricStarData[] {
        return Array.from(this.stars.values());
    }

    /**
     * Получает количество звезд
     */
    public getStarCount(): number {
        return this.stars.size;
    }

    /**
     * Удаляет звезду
     */
    public removeStar(sourceId: string): boolean {
        return this.stars.delete(sourceId);
    }

    /**
     * Очищает все звезды
     */
    public clear(): void {
        this.stars.clear();
    }

    /**
     * Запускает периодическое обновление позиций
     * @param intervalMs - интервал в миллисекундах
     */
    public startPeriodicUpdate(intervalMs: number = 60000): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = window.setInterval(() => {
            const newDate = new Date();
            this.currentDate = newDate;
            this.updateAllStarPositions();

            if (this.calculator.getConfig().debug) {
                console.log(`🔄 [StarManager] Обновлено ${this.stars.size} звезд на дату ${newDate.toISOString()}`);
            }
        }, intervalMs);
    }

    /**
     * Останавливает периодическое обновление
     */
    public stopPeriodicUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    public destroy(): void {
        this.stopPeriodicUpdate();
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.stars.clear();
    }
}

// ============================================================================
// ЭКСПОРТ СИНГЛТОНА
// ============================================================================

export const barycenterCalculator = BarycenterCalculator.getInstance({
    usePreciseModel: true,
    updateIntervalMs: 1000,
    autoUpdate: true,
    includeAllPlanets: false,
    useVSOP87: false,
    debug: false
});

export default barycenterCalculator;