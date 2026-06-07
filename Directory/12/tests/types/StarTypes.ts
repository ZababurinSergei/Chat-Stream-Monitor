// /10/tests/types/StarTypes.ts
// Только типы и интерфейсы - без экспорта значений!

import { Vector3 } from '@orillusion/core';

// ============================================================================
// ОСНОВНЫЕ ТИПЫ ЗВЕЗД
// ============================================================================

export interface Star {
    source_id: string | null;
    ra: number;
    dec: number;
    mag: number;
    color?: number;
    bp_rp?: number;
    pmra?: number;
    pmdec?: number;
    parallax?: number;
    radial_velocity?: number;
    teff?: number;
    logg?: number;
    metallicity?: number;
    radius?: number;
    luminosity?: number;
    mass?: number;
    distance?: number;
    spectralType?: string;
    source?: string;
    absoluteMagnitude?: number;
}

export interface StarScientificData {
    sourceId: string;
    position: Vector3;
    distancePc: number;
    magnitude: number;
    absoluteMagnitude: number;
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
    ra?: number;
    dec?: number;
    barycentricPosition?: Vector3;
    heliocentricPosition?: Vector3;
    lastUpdateDate?: Date;
}

export interface ScientificStarExtended extends StarScientificData {
    properMotionRa: number;
    properMotionDec: number;
    radialVelocity: number;
    apparentMagnitude: number;
    metallicity: number;
    logg: number;
    radiusRsun: number;
    massMsun: number;
    luminosityLsun: number;
    barycentricPosition: Vector3;
    heliocentricPosition: Vector3;
    colorRGB: [number, number, number];
    renderPriority: number;
}

export interface StarUIData {
    id: number;
    source_id: string | null;
    ra: number;
    dec: number;
    mag: number;
    position: [number, number, number];
    localPosition: [number, number, number];
    color: [number, number, number];
    size: number;
    brightness: number;
    spectralType: string;
    teff?: number | null;
    distance?: number | null;
    parallax?: number | null;
    absoluteMagnitude?: number;
}

export interface StarGPUData {
    position: [number, number, number];
    color: [number, number, number];
    size: number;
    magnitude: number;
    temperature: number;
    spectralType: number;
    brightness: number;
    parallax: number;
}

export interface StarBillboardData {
    worldPosition: [number, number, number];
    color: [number, number, number];
    billboardSize: [number, number];
    magnitude: number;
    temperature: number;
    spectralType: number;
    brightness: number;
    text: string;
}

// ============================================================================
// API ТИПЫ
// ============================================================================

export interface BestStarsParams {
    limit?: number;
    withPhysics?: boolean;
}

export interface ConeSearchParams {
    ra: number;
    dec: number;
    radius: number;
    limit?: number;
}

export interface RegionSearchParams {
    minRa: number;
    maxRa: number;
    minDec: number;
    maxDec: number;
    minParallax?: number;
    maxParallax?: number;
    limit?: number;
}

export interface StarsResponse {
    success: boolean;
    data: Star[];
    count: number;
    source?: string;
    responseTime?: number;
    totalTimeMs?: number;
    hasPhysics?: boolean;
    error?: string;
}

// ============================================================================
// ФИЛЬТРАЦИЯ И СТАТИСТИКА
// ============================================================================

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

export interface StarFilterResult {
    stars: StarScientificData[];
    total: number;
    filtered: number;
    filters: StarFilter;
}

export interface StarStatistics {
    total: number;
    avgMag: number;
    minMag: number;
    maxMag: number;
    avgTeff: number;
    minTeff: number;
    maxTeff: number;
    spectralDistribution: Record<string, number>;
    withParallax: number;
    withRadialVelocity: number;
    withTeff: number;
    withSourceId: number;
}

// ============================================================================
// РАСЧЕТЫ ЯРКОСТИ
// ============================================================================

export interface BrightnessCalculationParams {
    absoluteMagnitude: number;
    distancePc: number;
    useInverseSquare?: boolean;
    exposureCompensation?: number;
    extinction?: number;
    useExtinction?: boolean;
}

export interface BrightnessCalculationResult {
    apparentMagnitude: number;
    brightness: number;
    distanceModulus: number;
    extinctionMag: number;
}

// ============================================================================
// LOD ТИПЫ
// ============================================================================

export interface StarLODData {
    sourceId: string;
    position: Vector3;
    distancePc: number;
    magnitude: number;
    absoluteMagnitude: number;
    spectralType: string;
    temperature: number;
    color: [number, number, number];
    renderMode: string;
    currentBrightness: number;
    priority: number;
    lastUpdateFrame: number;
    lodLevel: number;
}

// ============================================================================
// КОМПОНЕНТЫ ЗВЕЗД
// ============================================================================

export interface StarComponentProps {
    sourceId: string;
    position: Vector3;
    magnitude: number;
    spectralType: string;
    temperature: number;
    color: [number, number, number];
    absoluteMagnitude?: number;
    distancePc?: number;
    radius?: number;
    luminosity?: number;
    mass?: number;
}

export interface StarComponentEvents {
    onClick?: (star: StarScientificData) => void;
    onHover?: (star: StarScientificData | null) => void;
    onSelect?: (star: StarScientificData) => void;
}

// ============================================================================
// ХРАНИЛИЩЕ ДАННЫХ
// ============================================================================

export interface StarDataStoreData {
    raw: Star[];
    scientific: StarScientificData[];
}

export interface StarDataStoreStats {
    totalRaw: number;
    totalScientific: number;
    lastUpdate: Date;
    spectralDistribution: Record<string, number>;
    distanceRange: { min: number; max: number; avg: number };
    magnitudeRange: { min: number; max: number; avg: number };
    absoluteMagnitudeRange: { min: number; max: number; avg: number };
    withAbsoluteMagnitude: number;
}

// ============================================================================
// КООРДИНАТЫ И ЦВЕТА
// ============================================================================

export interface StarCoordinates {
    ra: number;
    dec: number;
    distancePc: number;
}

export interface StarColor {
    rgb: [number, number, number];
    hex: number;
    temperature: number;
    spectralType: string;
}

// ============================================================================
// КОНВЕРТАЦИЯ
// ============================================================================

export interface StarConversionParams {
    date?: Date;
    maxDistance?: number;
    realScale?: number;
    exposureCompensation?: number;
    useExtinction?: boolean;
    extinctionValue?: number;
}

export interface StarConversionResult {
    success: boolean;
    stars: ScientificStarExtended[];
    totalProcessed: number;
    noParallaxCount: number;
    outOfRangeCount: number;
    errors: string[];
}
