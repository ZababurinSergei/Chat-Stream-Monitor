// /10/tests/core/ModuleAPI.ts
// Базовый API для модулей UniversalSystem
// Версия 1.0.0 - Полная версия
// Обеспечивает типизированное общение между модулями без EventBus

import { Vector3, Color, Object3D } from '@orillusion/core';

// ============================================================================
// БАЗОВЫЕ ТИПЫ ДЛЯ ВСЕХ МОДУЛЕЙ
// ============================================================================

/**
 * Базовый интерфейс API для всех модулей
 * Каждый модуль должен реализовать этот интерфейс
 */
export interface IModuleAPI {
    /** Уникальное имя модуля */
    readonly moduleName: string;

    /** Версия модуля */
    readonly version: string;

    /** Инициализация модуля (вызывается после создания) */
    init?(system: UniversalSystemType): Promise<void>;

    /** Старт модуля (вызывается после init всех модулей) */
    start?(): void;

    /** Обновление каждый кадр */
    update?(deltaTime: number): void;

    /** Уничтожение модуля */
    destroy?(): void;

    /** Установка ссылок на другие модули (вызывается после регистрации всех модулей) */
    setModuleReferences?(modules: Map<string, IModuleAPI>): void;
}

// ============================================================================
// ТИПЫ ДАННЫХ ДЛЯ ОБМЕНА МЕЖДУ МОДУЛЯМИ
// ============================================================================

/**
 * Данные звезды для обмена между модулями
 */
export interface StarData {
    /** Уникальный идентификатор звезды (Gaia source_id) */
    sourceId: string;

    /** Позиция в пространстве (парсеки) */
    position: Vector3;

    /** Видимая звездная величина (m) */
    magnitude: number;

    /** Абсолютная звездная величина (M) */
    absoluteMagnitude: number;

    /** Спектральный тип (O, B, A, F, G, K, M) */
    spectralType: string;

    /** Эффективная температура (K) */
    temperature: number;

    /** RGB цвет (0-1) */
    color: [number, number, number];

    /** Расстояние до звезды (парсеки) */
    distancePc: number;

    /** Название звезды (если есть) */
    name?: string;

    /** Радиус в радиусах Солнца */
    radiusRsun?: number;

    /** Масса в массах Солнца */
    massMsun?: number;

    /** Светимость в светимостях Солнца */
    luminosityLsun?: number;

    /** Прямое восхождение (градусы) */
    ra?: number;

    /** Склонение (градусы) */
    dec?: number;

    /** Собственное движение по RA (mas/год) */
    properMotionRa?: number;

    /** Собственное движение по Dec (mas/год) */
    properMotionDec?: number;

    /** Лучевая скорость (км/с) */
    radialVelocity?: number;

    /** Металличность [Fe/H] */
    metallicity?: number;

    /** Приоритет рендера (0-100) */
    priority?: number;

    /** Текущий LOD уровень */
    lodLevel?: number;

    /** Текущая яркость для рендера */
    currentBrightness?: number;
}

/**
 * Данные планеты для обмена между модулями
 */
export interface PlanetData {
    /** Уникальный идентификатор планеты */
    id: string;

    /** Название планеты */
    name: string;

    /** Позиция в пространстве (парсеки) */
    position: Vector3;

    /** Радиус планеты (парсеки) */
    radius: number;

    /** Спектральный тип родительской звезды */
    spectralType: string;

    /** Эффективная температура (K) */
    temperature: number;

    /** Наличие атмосферы */
    hasAtmosphere: boolean;

    /** Наличие облаков */
    hasClouds?: boolean;

    /** Покрытие облаками (0-1) */
    cloudCoverage?: number;

    /** ID родительской звезды */
    parentStarId?: string;

    /** Радиус орбиты (парсеки) */
    orbitRadius?: number;

    /** Скорость орбиты (рад/с) */
    orbitSpeed?: number;

    /** Текущий угол орбиты (рад) */
    orbitAngle?: number;

    /** RGB цвет планеты */
    color?: [number, number, number];

    /** Наличие колец */
    hasRings?: boolean;

    /** Радиус колец */
    ringRadius?: number;

    /** Текущий LOD уровень */
    lodLevel?: number;
}

/**
 * Данные корабля для обмена между модулями
 */
export interface ShipStateData {
    /** Позиция корабля */
    position: Vector3;

    /** Скорость (у.е./с) */
    speed: number;

    /** Скорость в км/ч */
    speedKmh: number;

    /** Углы поворота */
    angles: {
        yaw: number;    // рыскание (градусы)
        pitch: number;  // тангаж (градусы)
        roll: number;   // крен (градусы)
    };

    /** Уровень буста (0-100) */
    boostLevel: number;

    /** Активен ли буст */
    isBoosting: boolean;

    /** Перегрузка (G) */
    gForce: number;

    /** Движется ли корабль */
    isMoving: boolean;

    /** Режим реверса */
    isReverseMode: boolean;

    /** Автопилот включён */
    isAutopilotEnabled: boolean;

    /** Расстояние от Земли (км) */
    distanceFromEarthKm: number;

    /** Расстояние от Земли (св.лет) */
    distanceFromEarthLy: number;
}

/**
 * Информация о камере
 */
export interface CameraData {
    /** Позиция камеры */
    position: Vector3;

    /** Направление взгляда */
    forward: Vector3;

    /** Верхнее направление */
    up: Vector3;

    /** Правое направление */
    right: Vector3;

    /** Far plane */
    far: number;

    /** Near plane */
    near: number;

    /** FOV (градусы) */
    fov: number;

    /** Aspect ratio */
    aspect: number;
}

/**
 * Информация о сцене
 */
export interface SceneData {
    /** Все объекты на сцене */
    objects: Object3D[];

    /** Количество объектов */
    objectCount: number;

    /** Текущий фрейм */
    frame: number;

    /** Время с начала работы (мс) */
    time: number;

    /** Дельта времени (мс) */
    deltaTime: number;
}

/**
 * Результат raycast (пикинг)
 */
export interface RaycastResult {
    /** Попадание */
    hit: boolean;

    /** Точка попадания */
    point: Vector3;

    /** Нормаль в точке попадания */
    normal: Vector3;

    /** Расстояние от начала луча */
    distance: number;

    /** Объект, в который попали */
    object: Object3D | null;

    /** ID звезды (если попали в звезду) */
    starId?: string;

    /** ID планеты (если попали в планету) */
    planetId?: string;

    /** UV координаты */
    uv?: Vector3;
}

// ============================================================================
// API ИНТЕРФЕЙСЫ ДЛЯ КОНКРЕТНЫХ МОДУЛЕЙ
// ============================================================================

/**
 * API модуля звездного поля
 */
export interface IStarfieldAPI extends IModuleAPI {
    // ----- ПОЛУЧЕНИЕ ДАННЫХ -----

    /** Получить все звезды */
    getAllStars(): StarData[];

    /** Получить звезду по ID */
    getStarById(id: string): StarData | null;

    /** Получить N ближайших звезд */
    getNearestStars(limit: number): StarData[];

    /** Получить N самых ярких звезд */
    getBrightestStars(limit: number): StarData[];

    /** Получить звезды по спектральному типу */
    getStarsBySpectralType(type: string): StarData[];

    /** Получить звезды в радиусе от точки */
    getStarsInRadius(center: Vector3, radiusPc: number): StarData[];

    // ----- УПРАВЛЕНИЕ ВИЗУАЛИЗАЦИЕЙ -----

    /** Подсветить звезду */
    highlightStar(starId: string, color?: [number, number, number]): void;

    /** Сбросить подсветку всех звёзд */
    clearHighlight(): void;

    /** Обновить яркость звезды */
    setStarBrightness(starId: string, brightness: number): void;

    /** Принудительно обновить все звезды */
    forceUpdateAll(): void;

    // ----- ПОИСК И НАВИГАЦИЯ -----

    /** Найти ближайшую звезду к позиции */
    findNearestStar(position: Vector3): StarData | null;

    /** Найти звезду по имени */
    findStarByName(name: string): StarData | null;

    /** Получить расстояние до звезды */
    getDistanceToStar(starId: string, fromPosition: Vector3): number;

    // ----- СОБЫТИЯ (callback-based) -----

    /** Подписка на выбор звезды */
    onStarSelected(callback: (star: StarData) => void): () => void;

    /** Подписка на клик по звезде */
    onStarClicked(callback: (star: StarData) => void): () => void;

    /** Подписка на наведение на звезду */
    onStarHover(callback: (star: StarData | null) => void): () => void;
}

/**
 * API модуля планет
 */
export interface IPlanetAPI extends IModuleAPI {
    // ----- ПОЛУЧЕНИЕ ДАННЫХ -----

    /** Получить все планеты */
    getAllPlanets(): PlanetData[];

    /** Получить планету по ID */
    getPlanetById(id: string): PlanetData | null;

    /** Получить планеты в радиусе */
    getPlanetsInRadius(center: Vector3, radius: number): PlanetData[];

    /** Получить планеты вокруг звезды */
    getPlanetsByStar(starId: string): PlanetData[];

    // ----- СОЗДАНИЕ И УПРАВЛЕНИЕ -----

    /** Добавить планету */
    addPlanet(data: PlanetData): void;

    /** Удалить планету */
    removePlanet(id: string): void;

    /** Обновить позицию планеты */
    updatePlanetPosition(planetId: string, position: Vector3): void;

    /** Установить орбиту планеты */
    setPlanetOrbit(planetId: string, center: Vector3, radius: number, speed: number): void;

    /** Установить родительскую звезду */
    setOrbitingStar(planetId: string, starId: string): void;

    // ----- ВЗАИМОДЕЙСТВИЕ -----

    /** Получить звезду, вокруг которой вращается планета */
    getOrbitingStar(planetId: string): StarData | null;

    /** Подсветить планету */
    highlightPlanet(planetId: string, color?: [number, number, number]): void;

    /** Сбросить подсветку */
    clearPlanetHighlight(): void;

    // ----- СОБЫТИЯ -----

    /** Подписка на выбор планеты */
    onPlanetSelected(callback: (planet: PlanetData) => void): () => void;
}

/**
 * API модуля корабля
 */
export interface IShipAPI extends IModuleAPI {
    // ----- УПРАВЛЕНИЕ ДВИЖЕНИЕМ -----

    /** Установить скорость (0-1) */
    setSpeed(speed: number, reverseMode?: boolean): void;

    /** Получить текущую скорость */
    getSpeed(): number;

    /** Получить команду скорости (0-1) */
    getSpeedCommand(): number;

    /** Остановить корабль */
    stop(): void;

    /** Активировать/деактивировать буст */
    setBoost(active: boolean): void;

    /** Активировать тормоз */
    brake(): void;

    // ----- НАВИГАЦИЯ -----

    /** Полёт к точке */
    flyTo(target: Vector3, duration?: number): Promise<void>;

    /** Полёт к звезде */
    flyToStar(starId: string, duration?: number): Promise<void>;

    /** Полёт к планете */
    flyToPlanet(planetId: string, duration?: number): Promise<void>;

    /** Телепортация к точке */
    teleportTo(position: Vector3): void;

    /** Телепортация к звезде */
    teleportToStar(starId: string): void;

    /** Телепортация к планете */
    teleportToPlanet(planetId: string): void;

    /** Сброс позиции в центр */
    resetPosition(): void;

    // ----- ПОЛУЧЕНИЕ СОСТОЯНИЯ -----

    /** Получить позицию корабля */
    getPosition(): Vector3;

    /** Получить углы поворота */
    getAngles(): { yaw: number; pitch: number; roll: number };

    /** Получить направление вперёд */
    getForward(): Vector3;

    /** Получить направление вверх */
    getUp(): Vector3;

    /** Получить направление вправо */
    getRight(): Vector3;

    /** Получить полное состояние корабля */
    getShipState(): ShipStateData;

    /** Получить уровень буста (0-100) */
    getBoostLevel(): number;

    /** Получить перегрузку (G) */
    getGForce(): number;

    // ----- УПРАВЛЕНИЕ ПОВОРОТОМ -----

    /** Установить поворот */
    setRotation(yawDeg: number, pitchDeg: number, rollDeg?: number): void;

    /** Повернуть корабль */
    rotate(yawDeg: number, pitchDeg: number, rollDeg?: number): void;

    /** Тестовый поворот (для отладки) */
    testRotate(yawDeg: number, pitchDeg: number): void;

    // ----- АВТОПИЛОТ -----

    /** Включить/выключить автопилот */
    setAutopilot(enabled: boolean): void;

    /** Проверить, включён ли автопилот */
    isAutopilotEnabled(): boolean;

    // ----- НАВИГАЦИОННЫЕ РАСЧЁТЫ -----

    /** Расстояние до точки */
    getDistanceTo(target: Vector3): number;

    /** Расстояние до звезды */
    getDistanceToStar(starId: string): number;

    /** Расстояние до планеты */
    getDistanceToPlanet(planetId: string): number;

    /** Расстояние от Земли (км) */
    getDistanceFromEarthKm(): number;

    /** Расстояние от Земли (св.лет) */
    getDistanceFromEarthLy(): number;

    // ----- СОБЫТИЯ -----

    /** Подписка на прибытие к цели */
    onArrival(callback: (target: Vector3, targetId?: string, targetType?: 'star' | 'planet') => void): () => void;

    /** Подписка на изменение скорости */
    onSpeedChange(callback: (speed: number) => void): () => void;

    /** Подписка на изменение позиции */
    onPositionChange(callback: (position: Vector3) => void): () => void;
}

/**
 * API модуля камеры
 */
export interface ICameraAPI extends IModuleAPI {
    /** Получить позицию камеры */
    getPosition(): Vector3;

    /** Установить позицию камеры */
    setPosition(position: Vector3): void;

    /** Направить камеру на цель */
    lookAt(target: Vector3): void;

    /** Направить камеру на звезду */
    lookAtStar(starId: string): void;

    /** Направить камеру на планету */
    lookAtPlanet(planetId: string): void;

    /** Следовать за кораблём */
    followShip(distance?: number, height?: number): void;

    /** Получить данные камеры */
    getCameraData(): CameraData;

    /** Установить FOV */
    setFOV(fov: number): void;

    /** Установить far plane */
    setFarPlane(far: number): void;
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================================================

/**
 * Тип для универсальной ссылки на UniversalSystem
 * Используется для избежания циклических зависимостей
 */
export interface IUniversalSystemRef {
    getModule<T extends IModuleAPI>(name: string): T | null;
    getAllModules(): Map<string, IModuleAPI>;
    getScene(): any;
    getCamera(): any;
}

/**
 * Результат операции
 */
export interface OperationResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Фильтр для поиска звёзд
 */
export interface StarFilter {
    minMagnitude?: number;
    maxMagnitude?: number;
    minDistance?: number;
    maxDistance?: number;
    spectralTypes?: string[];
    minTemperature?: number;
    maxTemperature?: number;
    limit?: number;
}

/**
 * Фильтр для поиска планет
 */
export interface PlanetFilter {
    minRadius?: number;
    maxRadius?: number;
    hasAtmosphere?: boolean;
    hasClouds?: boolean;
    parentStarId?: string;
    limit?: number;
}

// ============================================================================
// КЛАСС-ПОМОЩНИК ДЛЯ УПРАВЛЕНИЯ МОДУЛЯМИ
// ============================================================================

/**
 * Менеджер модулей - хелпер для регистрации и получения модулей
 */
export class ModuleManager {
    private modules: Map<string, IModuleAPI> = new Map();
    private systemRef: IUniversalSystemRef | null = null;

    constructor(systemRef?: IUniversalSystemRef) {
        this.systemRef = systemRef || null;
    }

    /**
     * Регистрация модуля
     */
    register<T extends IModuleAPI>(module: T): T {
        this.modules.set(module.moduleName, module);

        // Устанавливаем ссылки на другие модули
        if (module.setModuleReferences) {
            module.setModuleReferences(this.modules);
        }

        console.log(`📦 [ModuleManager] Зарегистрирован: ${module.moduleName} v${module.version}`);
        return module;
    }

    /**
     * Получение модуля по имени
     */
    get<T extends IModuleAPI>(name: string): T | null {
        return (this.modules.get(name) as T) || null;
    }

    /**
     * Проверка существования модуля
     */
    has(name: string): boolean {
        return this.modules.has(name);
    }

    /**
     * Получение всех модулей
     */
    getAll(): Map<string, IModuleAPI> {
        return this.modules;
    }

    /**
     * Инициализация всех модулей
     */
    async initAll(): Promise<void> {
        for (const module of this.modules.values()) {
            if (module.init) {
                await module.init(this.systemRef as any);
            }
        }

        for (const module of this.modules.values()) {
            if (module.start) {
                module.start();
            }
        }

        console.log(`✅ [ModuleManager] Инициализировано ${this.modules.size} модулей`);
    }

    /**
     * Обновление всех модулей
     */
    updateAll(deltaTime: number): void {
        for (const module of this.modules.values()) {
            if (module.update) {
                module.update(deltaTime);
            }
        }
    }

    /**
     * Уничтожение всех модулей
     */
    destroyAll(): void {
        for (const module of this.modules.values()) {
            if (module.destroy) {
                module.destroy();
            }
        }
        this.modules.clear();
    }

    /**
     * Получить статистику модулей
     */
    getStats(): { count: number; modules: { name: string; version: string }[] } {
        const modules = Array.from(this.modules.values()).map(m => ({
            name: m.moduleName,
            version: m.version
        }));

        return {
            count: this.modules.size,
            modules
        };
    }
}

// ============================================================================
// ЭКСПОРТ ТИПОВ ДЛЯ ИСПОЛЬЗОВАНИЯ В ДРУГИХ МОДУЛЯХ
// ============================================================================

// Импорт UniversalSystem для типа (только для TypeScript)
import { UniversalSystem } from './UniversalSystem.js';

// Тип для системы (используется в методах init)
export type UniversalSystemType = UniversalSystem;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ - ТОЛЬКО КЛАССЫ, НЕ ТИПЫ
// ============================================================================

// Для удобства импорта из консоли
if (typeof window !== 'undefined') {
    (window as any).__ModuleAPI = {
        version: '1.0.0',
        types: {
            StarData: 'StarData',
            PlanetData: 'PlanetData',
            ShipStateData: 'ShipStateData'
        }
    };
    console.log('✅ [ModuleAPI] Загружен v1.0.0');
}