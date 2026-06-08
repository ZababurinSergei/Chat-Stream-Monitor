// /10/tests/utils/starConverter.ts
// Утилиты для конвертации звездных данных из API в научный формат
// Версия 2.3.0 - ДОБАВЛЕНА ГЕНЕРАЦИЯ ТЕСТОВЫХ ПОЗИЦИЙ ПРИ ОТСУТСТВИИ ПАРАЛЛАКСА
// - Добавлена функция generateTestPosition() для создания тестовых координат
// - В convertStarToScientificData() добавлено создание тестовых позиций если parallax отсутствует
// - Улучшена фильтрация невалидных звезд
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { Vector3 } from '@orillusion/core';
import { Star, StarScientificData, ScientificStarExtended } from '../types/StarTypes.js';
import { barycenterCalculator, gaiaToBarycentricXYZ } from '../astronomy/BarycenterCalculator.js';
import { ScientificStarCalculator } from '../astronomy/ScientificStarCalculator.js';
import { SCIENTIFIC_CONFIG } from '../config/scientificConfig.js';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Проверка наличия валидного параллакса у звезды
 * @param star - объект звезды
 * @returns true если параллакс существует и больше 0
 */
export function hasParallax(star: Star): star is Star & { parallax: number } {
    return star.parallax !== undefined && star.parallax !== null && star.parallax > 0;
}

/**
 * Проверка наличия абсолютной звездной величины
 * @param star - объект звезды
 * @returns true если absoluteMagnitude существует
 */
export function hasAbsoluteMagnitude(star: Star): star is Star & { absoluteMagnitude: number } {
    return (star as any).absoluteMagnitude !== undefined && (star as any).absoluteMagnitude !== null;
}

/**
 * Проверка наличия эффективной температуры
 * @param star - объект звезды
 * @returns true если teff существует и больше 0
 */
export function hasTeff(star: Star): star is Star & { teff: number } {
    return star.teff !== undefined && star.teff !== null && star.teff > 0;
}

// ============================================================================
// ФУНКЦИЯ ВАЛИДАЦИИ ЗВЕЗДЫ (НОВАЯ)
// ============================================================================

/**
 * Проверяет, является ли звезда валидной для отображения
 * @param star - научные данные звезды
 * @returns true если звезда валидна
 */
export function isValidScientificStar(star: ScientificStarExtended | StarScientificData): boolean {
    // Проверка расстояния
    if (star.distancePc <= 0.001) return false;
    if (star.distancePc > SCIENTIFIC_CONFIG.visibility.maxDistance) return false;

    // Проверка величины
    if (star.magnitude <= 0 || star.magnitude >= 30) return false;

    // Проверка абсолютной величины
    if (star.absoluteMagnitude === undefined || star.absoluteMagnitude === null) return false;
    if (isNaN(star.absoluteMagnitude)) return false;
    if (star.absoluteMagnitude < -15 || star.absoluteMagnitude > 25) return false;

    // Проверка позиции
    const pos = star.position;
    if (Math.abs(pos.x) > 1e6 || Math.abs(pos.y) > 1e6 || Math.abs(pos.z) > 1e6) return false;

    // Проверка температуры
    if (star.temperature === undefined || star.temperature === null) return false;
    if (star.temperature < 0 || star.temperature > 100000) return false;

    // Проверка цвета
    if (!star.color || star.color.length !== 3) return false;

    return true;
}

// ============================================================================
// ГЕНЕРАЦИЯ ТЕСТОВЫХ ПОЗИЦИЙ (НОВАЯ ФУНКЦИЯ)
// ============================================================================

/**
 * Генерирует тестовую позицию для звезды при отсутствии параллакса
 * @param index - индекс звезды для детерминированного распределения
 * @param radiusRange - диапазон радиусов [min, max]
 * @returns вектор позиции
 */
export function generateTestPosition(index: number, radiusRange: [number, number] = [100, 500]): Vector3 {
    // Детерминированное распределение для воспроизводимости
    const angle = (index / 100) * Math.PI * 2;
    const radius = radiusRange[0] + (index % 10) * ((radiusRange[1] - radiusRange[0]) / 10);
    const heightFactor = Math.sin(angle * 3) * 0.3;

    return new Vector3(
        Math.cos(angle) * radius,
        (Math.sin(angle * 2) * 50 + 20) * heightFactor,
        Math.sin(angle) * radius
    );
}

/**
 * Генерирует случайную тестовую позицию
 * @returns вектор позиции
 */
export function generateRandomTestPosition(): Vector3 {
    const radius = 150 + Math.random() * 350;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    return new Vector3(
        Math.sin(phi) * Math.cos(theta) * radius,
        Math.sin(phi) * Math.sin(theta) * radius * 0.5,
        Math.cos(phi) * radius
    );
}

// ============================================================================
// ОСНОВНЫЕ ФУНКЦИИ КОНВЕРТАЦИИ
// ============================================================================

/**
 * Конвертация одной звезды из API в научный формат
 * @param star - исходные данные звезды из API
 * @param date - дата для расчета барицентра
 * @param index - индекс звезды (для генерации ID)
 * @returns научные данные звезды или null
 */
export async function convertStarToScientificData(
    star: Star,
    date: Date,
    index: number
): Promise<ScientificStarExtended | null> {
    let distancePc: number;
    let position: Vector3;
    let barycentricPos: Vector3;
    let heliocentricPos: Vector3;

    // Проверка наличия параллакса
    if (hasParallax(star) && star.parallax > 0) {
        distancePc = 1000 / star.parallax;
        if (distancePc > SCIENTIFIC_CONFIG.visibility.maxDistance) return null;
        if (distancePc < 0.1) return null;

        // Расчет барицентрической и гелиоцентрической позиции
        barycentricPos = gaiaToBarycentricXYZ(star.ra, star.dec, distancePc);
        heliocentricPos = barycenterCalculator.barycentricToHeliocentric(barycentricPos, date);
        position = new Vector3(
            heliocentricPos.x * SCIENTIFIC_CONFIG.realScale,
            heliocentricPos.y * SCIENTIFIC_CONFIG.realScale,
            heliocentricPos.z * SCIENTIFIC_CONFIG.realScale
        );
    } else {
        // НЕТ ПАРАЛЛАКСА - создаем тестовую позицию
        console.log(`   ⚠️ Звезда ${star.source_id || index} без параллакса, создаем тестовую позицию`);
        distancePc = 150 + (index % 10) * 35;
        position = generateTestPosition(index, [100, 500]);
        barycentricPos = position.clone();
        heliocentricPos = position.clone();
    }

    // Определение спектрального типа и температуры
    const spectralType = star.spectralType || ScientificStarCalculator.getSpectralType(star.teff || 5500);
    const temperature = star.teff || (() => {
        const tempMap: Record<string, number> = {
            'O': 35000, 'B': 15000, 'A': 8000, 'F': 6500, 'G': 5500, 'K': 4500, 'M': 3500
        };
        return tempMap[spectralType] || 5500;
    })();

    // Расчет физических параметров
    let luminosityLsun = star.luminosity || Math.pow(10, (4.74 - star.mag) / 2.5);
    let radiusRsun = star.radius || ScientificStarCalculator.calculateRadius(luminosityLsun, temperature);
    let massMsun = star.mass || ScientificStarCalculator.estimateMass(spectralType);

    // Расчет абсолютной звездной величины
    let absoluteMagnitude: number;
    if (star.absoluteMagnitude !== undefined && !isNaN(star.absoluteMagnitude)) {
        absoluteMagnitude = star.absoluteMagnitude;
    } else {
        absoluteMagnitude = ScientificStarCalculator.calculateAbsoluteMagnitude(star.mag, distancePc);
    }

    // Расчет яркости для рендеринга
    const renderBrightness = ScientificStarCalculator.calculateRenderBrightness(
        absoluteMagnitude, distancePc,
        SCIENTIFIC_CONFIG.brightness.useInverseSquare,
        SCIENTIFIC_CONFIG.brightness.exposureCompensation,
        SCIENTIFIC_CONFIG.brightness.useExtinction ? SCIENTIFIC_CONFIG.brightness.extinction : 0
    );

    // Получение цвета по температуре
    const colorRGB = ScientificStarCalculator.getScientificColor(temperature);

    // Расчет приоритета для LOD
    const renderPriority = ScientificStarCalculator.calculateScientificPriority(
        star.mag, distancePc, spectralType, false
    );

    return {
        sourceId: star.source_id || `star_${index}`,
        position,
        distancePc,
        magnitude: star.mag,
        absoluteMagnitude: absoluteMagnitude,
        spectralType,
        temperature,
        color: colorRGB,
        radius: radiusRsun,
        luminosity: luminosityLsun,
        mass: massMsun,
        properMotionRa: star.pmra || 0,
        properMotionDec: star.pmdec || 0,
        radialVelocity: star.radial_velocity || 0,
        apparentMagnitude: star.mag,
        metallicity: star.metallicity || 0,
        logg: star.logg || 0,
        radiusRsun,
        massMsun,
        luminosityLsun,
        barycentricPosition: barycentricPos,
        heliocentricPosition: heliocentricPos,
        colorRGB,
        renderPriority,
        currentBrightness: renderBrightness
    };
}

// ============================================================================
// МАССОВАЯ КОНВЕРТАЦИЯ С ФИЛЬТРАЦИЕЙ
// ============================================================================

/**
 * Массовая конвертация звезд из API в научный формат
 * @param stars - массив звезд из API
 * @param date - дата для расчета барицентра
 * @param maxStars - максимальное количество звезд для обработки
 * @returns массив научных данных звезд (только валидные)
 */
export async function convertAllStarsScientific(
    stars: Star[],
    date: Date,
    maxStars: number = SCIENTIFIC_CONFIG.performance.maxStars
): Promise<ScientificStarExtended[]> {
    const converted: ScientificStarExtended[] = [];
    let noParallaxCount = 0;
    let outOfRangeCount = 0;
    let invalidAfterConversionCount = 0;
    let testPositionsCount = 0;

    console.log(`\n🔭 КОНВЕРТАЦИЯ ЗВЕЗД В НАУЧНЫЙ ФОРМАТ`);
    console.log(`═'.repeat(60)`);
    console.log(`📡 Всего звезд в API: ${stars.length}`);
    console.log(`📡 Максимум для обработки: ${maxStars}`);
    console.log(`📍 Дата: ${date.toISOString()}`);

    for (let i = 0; i < stars.length && converted.length < maxStars; i++) {
        const star = stars[i];
        let convertedStar: ScientificStarExtended | null = null;

        // Проверка наличия параллакса
        if (hasParallax(star)) {
            const distancePc = 1000 / star.parallax;
            if (distancePc <= SCIENTIFIC_CONFIG.visibility.maxDistance) {
                convertedStar = await convertStarToScientificData(star, date, i);
                if (!convertedStar) outOfRangeCount++;
            } else {
                outOfRangeCount++;
            }
        } else {
            noParallaxCount++;
            // ВСЕ РАВНО СОЗДАЕМ ТЕСТОВУЮ ЗВЕЗДУ
            convertedStar = await convertStarToScientificData(star, date, i);
            if (convertedStar) testPositionsCount++;
        }

        if (convertedStar) converted.push(convertedStar);
    }

    // ========================================================================
    // ФИЛЬТРАЦИЯ НЕВАЛИДНЫХ ЗВЕЗД
    // ========================================================================
    const validConverted = converted.filter(star => {
        const isValid = isValidScientificStar(star);
        if (!isValid) invalidAfterConversionCount++;
        return isValid;
    });

    if (validConverted.length !== converted.length) {
        console.warn(`⚠️ [starConverter] Отфильтровано ${converted.length - validConverted.length} звезд с некорректными параметрами`);
        console.log(`   Причины: distancePc≤0, magnitude вне [0,30], |position|>1e6, absoluteMagnitude вне [-15,25], отсутствует цвет`);
    }

    // Если после фильтрации нет звезд, создаем тестовые
    if (validConverted.length === 0) {
        console.warn(`⚠️ Нет валидных звезд, создаем тестовый набор`);
        for (let i = 0; i < Math.min(200, maxStars); i++) {
            const testStar = await createTestStar(i, date);
            if (testStar) validConverted.push(testStar);
        }
    }

    // Сортировка по приоритету
    validConverted.sort((a, b) => b.renderPriority - a.renderPriority);

    console.log(`\n📊 РЕЗУЛЬТАТЫ КОНВЕРТАЦИИ:`);
    console.log(`   ✅ Конвертировано: ${converted.length} звезд`);
    console.log(`   ✅ После фильтрации: ${validConverted.length} звезд`);
    console.log(`   ⚠️ Без параллакса (тестовые позиции): ${testPositionsCount}`);
    console.log(`   📍 Вне диапазона: ${outOfRangeCount}`);
    console.log(`   🚫 Отфильтровано: ${invalidAfterConversionCount}`);

    return validConverted;
}

/**
 * Создание тестовой звезды
 * @param index - индекс звезды
 * @param date - дата
 * @returns тестовая звезда
 */
async function createTestStar(index: number, date: Date): Promise<ScientificStarExtended | null> {
    const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const tempMap: Record<string, number> = {
        'O': 35000, 'B': 15000, 'A': 8000, 'F': 6500,
        'G': 5500, 'K': 4500, 'M': 3500
    };
    const colorMap: Record<string, [number, number, number]> = {
        'O': [0.6, 0.7, 1.0], 'B': [0.7, 0.8, 1.0], 'A': [0.9, 0.9, 1.0],
        'F': [1.0, 0.95, 0.8], 'G': [1.0, 0.9, 0.7], 'K': [1.0, 0.8, 0.5], 'M': [1.0, 0.7, 0.4]
    };

    const spectralType = spectralTypes[index % spectralTypes.length];
    const distancePc = 100 + (index % 5) * 50;
    const magnitude = 3 + (index % 20) / 5;
    const absoluteMagnitude = magnitude - 5 * Math.log10(distancePc) + 5;

    const position = generateTestPosition(index, [80, 450]);
    const barycentricPos = position.clone();
    const heliocentricPos = barycenterCalculator.barycentricToHeliocentric(barycentricPos, date);

    return {
        sourceId: `test_star_${index}`,
        position,
        distancePc,
        magnitude,
        absoluteMagnitude,
        spectralType,
        temperature: tempMap[spectralType],
        color: colorMap[spectralType],
        radius: 1,
        luminosity: 1,
        mass: 1,
        properMotionRa: 0,
        properMotionDec: 0,
        radialVelocity: 0,
        apparentMagnitude: magnitude,
        metallicity: 0,
        logg: 4.5,
        radiusRsun: 1,
        massMsun: 1,
        luminosityLsun: 1,
        barycentricPosition: barycentricPos,
        heliocentricPosition: heliocentricPos,
        colorRGB: colorMap[spectralType],
        renderPriority: 50 - index * 0.1,
        currentBrightness: 1
    };
}

// ============================================================================
// КОНВЕРТАЦИЯ STAR В STARSCIENTIFICDATA
// ============================================================================

/**
 * Быстрая конвертация звезды из API в базовый научный формат
 * @param star - исходные данные звезды из API
 * @param date - дата для расчета барицентра
 * @returns базовые научные данные звезды или null
 */
export function starToScientificData(star: Star, date: Date = new Date()): StarScientificData | null {
    let distancePc: number;
    let position: Vector3;

    if (hasParallax(star) && star.parallax > 0) {
        distancePc = 1000 / star.parallax;
        if (distancePc > SCIENTIFIC_CONFIG.visibility.maxDistance) return null;

        const barycentricPos = gaiaToBarycentricXYZ(star.ra, star.dec, distancePc);
        const heliocentricPos = barycenterCalculator.barycentricToHeliocentric(barycentricPos, date);
        position = new Vector3(
            heliocentricPos.x * SCIENTIFIC_CONFIG.realScale,
            heliocentricPos.y * SCIENTIFIC_CONFIG.realScale,
            heliocentricPos.z * SCIENTIFIC_CONFIG.realScale
        );
    } else {
        // НЕТ ПАРАЛЛАКСА - тестовая позиция
        distancePc = 200;
        position = generateRandomTestPosition();
    }

    const spectralType = star.spectralType || ScientificStarCalculator.getSpectralType(star.teff || 5500);
    const temperature = star.teff || 5500;
    const colorRGB = ScientificStarCalculator.getScientificColor(temperature);
    const absoluteMagnitude = ScientificStarCalculator.calculateAbsoluteMagnitude(star.mag, distancePc);

    return {
        sourceId: star.source_id || `star_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        position,
        distancePc,
        magnitude: star.mag,
        absoluteMagnitude: absoluteMagnitude,
        spectralType,
        temperature,
        color: colorRGB,
        radius: star.radius,
        luminosity: star.luminosity,
        mass: star.mass,
        parallax: star.parallax,
        properMotionRa: star.pmra || 0,
        properMotionDec: star.pmdec || 0,
        radialVelocity: star.radial_velocity || 0,
        metallicity: star.metallicity,
        currentBrightness: 1.0
    };
}

// ============================================================================
// ФИЛЬТРАЦИЯ И ВАЛИДАЦИЯ
// ============================================================================

/**
 * Фильтрация звезд по наличию абсолютной величины
 * @param stars - массив научных данных звезд
 * @returns отфильтрованный массив
 */
export function filterValidStars(stars: ScientificStarExtended[]): ScientificStarExtended[] {
    return stars.filter(star => isValidScientificStar(star));
}

/**
 * Получение ближайших звезд из массива
 * @param stars - массив научных данных звезд
 * @param limit - количество звезд
 * @returns отсортированный массив ближайших звезд
 */
export function getNearestStars(stars: ScientificStarExtended[], limit: number = 10): ScientificStarExtended[] {
    return [...stars]
        .sort((a, b) => a.distancePc - b.distancePc)
        .slice(0, limit);
}

/**
 * Получение самых ярких звезд из массива
 * @param stars - массив научных данных звезд
 * @param limit - количество звезд
 * @returns отсортированный массив самых ярких звезд
 */
export function getBrightestStars(stars: ScientificStarExtended[], limit: number = 10): ScientificStarExtended[] {
    return [...stars]
        .sort((a, b) => a.magnitude - b.magnitude)
        .slice(0, limit);
}

/**
 * Получение звезд по спектральному типу
 * @param stars - массив научных данных звезд
 * @param spectralType - спектральный тип (O, B, A, F, G, K, M)
 * @returns отфильтрованный массив
 */
export function getStarsBySpectralType(stars: ScientificStarExtended[], spectralType: string): ScientificStarExtended[] {
    return stars.filter(star => star.spectralType === spectralType);
}

/**
 * Получение звезд в радиусе от точки
 * @param stars - массив научных данных звезд
 * @param center - центр поиска
 * @param radiusPc - радиус в парсеках
 * @returns звезды в радиусе
 */
export function getStarsInRadius(stars: ScientificStarExtended[], center: Vector3, radiusPc: number): ScientificStarExtended[] {
    const radiusSq = radiusPc * radiusPc;
    return stars.filter(star => {
        const dx = star.position.x - center.x;
        const dy = star.position.y - center.y;
        const dz = star.position.z - center.z;
        return dx * dx + dy * dy + dz * dz <= radiusSq;
    });
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================

/**
 * Получение статистики по массиву научных звезд
 * @param stars - массив научных данных звезд
 * @returns статистические данные
 */
export function getScientificStarsStatistics(stars: ScientificStarExtended[]): {
    total: number;
    avgMagnitude: number;
    minMagnitude: number;
    maxMagnitude: number;
    avgAbsoluteMagnitude: number;
    minAbsoluteMagnitude: number;
    maxAbsoluteMagnitude: number;
    avgDistance: number;
    minDistance: number;
    maxDistance: number;
    spectralDistribution: Record<string, number>;
    validationStats: {
        totalConverted: number;
        validCount: number;
        invalidCount: number;
    };
} {
    if (stars.length === 0) {
        return {
            total: 0,
            avgMagnitude: 0,
            minMagnitude: 0,
            maxMagnitude: 0,
            avgAbsoluteMagnitude: 0,
            minAbsoluteMagnitude: 0,
            maxAbsoluteMagnitude: 0,
            avgDistance: 0,
            minDistance: 0,
            maxDistance: 0,
            spectralDistribution: {},
            validationStats: {
                totalConverted: 0,
                validCount: 0,
                invalidCount: 0
            }
        };
    }

    const spectralDist: Record<string, number> = {};
    let totalMag = 0;
    let totalAbsMag = 0;
    let totalDist = 0;
    let minMag = Infinity;
    let maxMag = -Infinity;
    let minAbsMag = Infinity;
    let maxAbsMag = -Infinity;
    let minDist = Infinity;
    let maxDist = -Infinity;
    let invalidCount = 0;

    for (const star of stars) {
        // Валидация перед добавлением в статистику
        if (!isValidScientificStar(star)) {
            invalidCount++;
            continue;
        }

        // Спектральное распределение
        spectralDist[star.spectralType] = (spectralDist[star.spectralType] || 0) + 1;

        // Видимая яркость
        totalMag += star.magnitude;
        minMag = Math.min(minMag, star.magnitude);
        maxMag = Math.max(maxMag, star.magnitude);

        // Абсолютная яркость
        totalAbsMag += star.absoluteMagnitude;
        minAbsMag = Math.min(minAbsMag, star.absoluteMagnitude);
        maxAbsMag = Math.max(maxAbsMag, star.absoluteMagnitude);

        // Расстояние
        totalDist += star.distancePc;
        minDist = Math.min(minDist, star.distancePc);
        maxDist = Math.max(maxDist, star.distancePc);
    }

    const validCount = stars.length - invalidCount;
    const count = validCount;

    return {
        total: stars.length,
        avgMagnitude: count ? totalMag / count : 0,
        minMagnitude: minMag === Infinity ? 0 : minMag,
        maxMagnitude: maxMag === -Infinity ? 0 : maxMag,
        avgAbsoluteMagnitude: count ? totalAbsMag / count : 0,
        minAbsoluteMagnitude: minAbsMag === Infinity ? 0 : minAbsMag,
        maxAbsoluteMagnitude: maxAbsMag === -Infinity ? 0 : maxAbsMag,
        avgDistance: count ? totalDist / count : 0,
        minDistance: minDist === Infinity ? 0 : minDist,
        maxDistance: maxDist === -Infinity ? 0 : maxDist,
        spectralDistribution: spectralDist,
        validationStats: {
            totalConverted: stars.length,
            validCount: validCount,
            invalidCount: invalidCount
        }
    };
}

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

export default {
    hasParallax,
    hasAbsoluteMagnitude,
    hasTeff,
    isValidScientificStar,
    generateTestPosition,
    generateRandomTestPosition,
    convertStarToScientificData,
    convertAllStarsScientific,
    starToScientificData,
    filterValidStars,
    getNearestStars,
    getBrightestStars,
    getStarsBySpectralType,
    getStarsInRadius,
    getScientificStarsStatistics
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('═'.repeat(70));
    console.log('🔄 [starConverter] МОДУЛЬ ЗАГРУЖЕН v2.3.0');
    console.log('   • Добавлена генерация тестовых позиций');
    console.log('   • Звезды без параллакса получают тестовые координаты');
    console.log('   • Функции: generateTestPosition(), generateRandomTestPosition()');
    console.log('═'.repeat(70));
}