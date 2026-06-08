// /10/tests/utils/shaderDataConverter.ts
// Конвертер данных Gaia DR3 в формат шейдеров из kosmos
// Версия 2.0.0 - Полная адаптация для StarfieldShader и Planet шейдеров
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { StarScientificData } from '../types/StarTypes.js';
import { Vector3 } from '@orillusion/core';

// ============================================================================
// ТИПЫ ДАННЫХ ДЛЯ ШЕЙДЕРОВ
// ============================================================================

/**
 * Формат данных звезды для StarfieldShader (kosmos)
 * Соответствует структуре StarInstance в шейдере
 */
export interface ShaderStarData {
    position: [number, number, number];     // позиция в 3D пространстве
    color: [number, number, number, number]; // RGBA цвет
    size: number;                            // размер звезды (билборда)
    magnitude: number;                       // видимая звездная величина
    viewRange: number;                       // дальность видимости (парсеки)
    parallax: number;                        // параллакс (mas)
    temperature: number;                     // эффективная температура (K)
    absoluteMagnitude: number;               // абсолютная звездная величина
    distancePc: number;                      // расстояние в парсеках
    spectralType: number;                    // спектральный класс (0-6)
}

/**
 * Формат данных планеты для Planet шейдеров (kosmos)
 * Соответствует структуре PlanetData в шейдере
 */
export interface ShaderPlanetData {
    radius: number;          // радиус (км)
    mass: number;            // масса (кг)
    temperature: number;     // температура поверхности (K)
    hasAtmosphere: number;   // наличие атмосферы (0/1)
    hasClouds: number;       // наличие облаков (0/1)
    albedo: number;          // альбедо (0-1)
}

/**
 * Данные для GPU буфера (упакованные)
 */
export interface PackedStarData {
    buffer: Float32Array;
    stride: number;
    count: number;
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const SPECTRAL_TYPE_MAP: Record<string, number> = {
    'O': 0,   // Самые горячие ( > 30000K )
    'B': 1,   // Голубые гиганты (10000-30000K)
    'A': 2,   // Белые звезды (7500-10000K)
    'F': 3,   // Желто-белые (6000-7500K)
    'G': 4,   // Желтые карлики (5200-6000K)
    'K': 5,   // Оранжевые карлики (3700-5200K)
    'M': 6    // Красные карлики ( < 3700K )
};

export const SPECTRAL_TYPE_NAMES: Record<number, string> = {
    0: 'O', 1: 'B', 2: 'A', 3: 'F', 4: 'G', 5: 'K', 6: 'M'
};

// Размер структуры звезды в байтах (16 floats * 4 = 64 байта)
export const STAR_STRIDE_BYTES = 64;
export const STAR_STRIDE_FLOATS = 16;

// ============================================================================
// ОСНОВНОЙ КЛАСС КОНВЕРТЕРА
// ============================================================================

export class ShaderDataConverter {

    // ========================================================================
    // КОНВЕРТАЦИЯ ЗВЕЗД
    // ========================================================================

    /**
     * Конвертация одной звезды из научных данных в формат шейдера
     * @param star - научные данные звезды из Gaia DR3
     * @param index - индекс звезды (для генерации уникальных ID)
     * @returns данные для шейдера
     */
    static starToShaderData(star: StarScientificData, index: number): ShaderStarData {
        // Спектральный тип в число
        const spectralType = SPECTRAL_TYPE_MAP[star.spectralType] || 4;

        // Размер звезды на основе яркости (чем ярче, тем больше)
        const size = Math.max(0.05, Math.min(0.5, (6 - star.magnitude) / 50));

        // Дальность видимости (парсеки) - чем ярче звезда, тем дальше видна
        const viewRange = Math.min(10000, Math.max(500, 5000 / Math.max(0.1, star.magnitude)));

        // Коррекция цвета на основе температуры (усиление для горячих звезд)
        let r = star.color[0];
        let g = star.color[1];
        let b = star.color[2];

        if (star.temperature > 10000) {
            // Горячие звезды - больше синего
            const factor = Math.min(1.5, star.temperature / 10000);
            r = Math.min(1, r * (1 / factor));
            g = Math.min(1, g * (0.8 + factor * 0.2));
            b = Math.min(1, b * factor);
        } else if (star.temperature < 4000) {
            // Холодные звезды - больше красного
            const factor = Math.max(0.5, star.temperature / 4000);
            r = Math.min(1, r * (1.2 / factor));
            g = Math.min(1, g * (0.7 / factor));
            b = Math.min(1, b * (0.4 / factor));
        }

        return {
            position: [star.position.x, star.position.y, star.position.z],
            color: [r, g, b, 1.0],
            size: size,
            magnitude: star.magnitude,
            viewRange: viewRange,
            parallax: star.parallax || 0,
            temperature: star.temperature,
            absoluteMagnitude: star.absoluteMagnitude,
            distancePc: star.distancePc,
            spectralType: spectralType
        };
    }

    /**
     * Пакетная конвертация звезд
     * @param stars - массив научных данных звезд
     * @returns массив данных для шейдера
     */
    static batchStarsToShaderData(stars: StarScientificData[]): ShaderStarData[] {
        console.log(`🔄 Конвертация ${stars.length} звезд в формат шейдера...`);

        const startTime = performance.now();
        const result = stars.map((star, idx) => this.starToShaderData(star, idx));

        const duration = performance.now() - startTime;
        console.log(`✅ Конвертация завершена за ${duration.toFixed(2)}ms`);

        return result;
    }

    /**
     * Упаковка данных звезд в плоский Float32Array для GPU буфера
     * @param stars - данные звезд для шейдера
     * @returns упакованные данные
     */
    static packStarsToBuffer(stars: ShaderStarData[]): PackedStarData {
        const count = stars.length;
        const buffer = new Float32Array(count * STAR_STRIDE_FLOATS);

        for (let i = 0; i < count; i++) {
            const s = stars[i];
            const offset = i * STAR_STRIDE_FLOATS;

            // Позиция (3 floats)
            buffer[offset] = s.position[0];
            buffer[offset + 1] = s.position[1];
            buffer[offset + 2] = s.position[2];

            // Цвет (4 floats)
            buffer[offset + 3] = s.color[0];
            buffer[offset + 4] = s.color[1];
            buffer[offset + 5] = s.color[2];
            buffer[offset + 6] = s.color[3];

            // Размер
            buffer[offset + 7] = s.size;

            // Звездная величина
            buffer[offset + 8] = s.magnitude;

            // Дальность видимости
            buffer[offset + 9] = s.viewRange;

            // Параллакс
            buffer[offset + 10] = s.parallax;

            // Температура
            buffer[offset + 11] = s.temperature;

            // Абсолютная звездная величина
            buffer[offset + 12] = s.absoluteMagnitude;

            // Расстояние в парсеках
            buffer[offset + 13] = s.distancePc;

            // Спектральный тип
            buffer[offset + 14] = s.spectralType;

            // Padding (выравнивание до 16 floats)
            buffer[offset + 15] = 0;
        }

        return {
            buffer: buffer,
            stride: STAR_STRIDE_FLOATS,
            count: count
        };
    }

    // ========================================================================
    // КОНВЕРТАЦИЯ ПЛАНЕТ
    // ========================================================================

    /**
     * Конвертация данных планеты в формат шейдера
     * @param radius - радиус (км)
     * @param mass - масса (кг)
     * @param temperature - температура поверхности (K)
     * @param hasAtmosphere - наличие атмосферы
     * @param hasClouds - наличие облаков
     * @param albedo - альбедо
     * @returns данные для шейдера планеты
     */
    static planetToShaderData(
        radius: number,
        mass: number,
        temperature: number,
        hasAtmosphere: boolean = false,
        hasClouds: boolean = false,
        albedo: number = 0.3
    ): ShaderPlanetData {
        return {
            radius: radius,
            mass: mass,
            temperature: temperature,
            hasAtmosphere: hasAtmosphere ? 1.0 : 0.0,
            hasClouds: hasClouds ? 1.0 : 0.0,
            albedo: albedo
        };
    }

    /**
     * Конвертация звездных данных для StarfieldShader с учетом LOD
     * @param stars - научные данные звезд
     * @param cameraPosition - позиция камеры
     * @returns данные с обновленными LOD параметрами
     */
    static starsWithLOD(
        stars: StarScientificData[],
        cameraPosition: Vector3
    ): ShaderStarData[] {
        return stars.map(star => {
            // Расчет расстояния до камеры
            const dx = star.position.x - cameraPosition.x;
            const dy = star.position.y - cameraPosition.y;
            const dz = star.position.z - cameraPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Расчет LOD фактора
            let lodFactor = 0;
            if (distance < 100) lodFactor = 0;      // LOD0 - полная детализация
            else if (distance < 500) lodFactor = 1;  // LOD1 - средняя
            else if (distance < 2000) lodFactor = 2; // LOD2 - низкая
            else lodFactor = 3;                       // LOD3 - только каталог

            // Коррекция размера на основе LOD
            const sizeCorrection = Math.max(0.3, 1.0 - lodFactor * 0.2);

            const shaderData = this.starToShaderData(star, 0);
            shaderData.size = shaderData.size * sizeCorrection;
            shaderData.viewRange = Math.min(shaderData.viewRange, 2000 / Math.max(1, lodFactor));

            return shaderData;
        });
    }

    // ========================================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ========================================================================

    /**
     * Получение RGB цвета по спектральному типу
     * @param spectralType - спектральный тип (0-6)
     * @returns RGB цвет [r, g, b]
     */
    static getColorBySpectralType(spectralType: number): [number, number, number] {
        const colors: Record<number, [number, number, number]> = {
            0: [0.6, 0.7, 1.0],   // O - голубой
            1: [0.7, 0.8, 1.0],   // B - светло-голубой
            2: [0.9, 0.9, 1.0],   // A - бело-голубой
            3: [1.0, 0.95, 0.8],  // F - желто-белый
            4: [1.0, 0.9, 0.7],   // G - желтый (Солнце)
            5: [1.0, 0.8, 0.5],   // K - оранжевый
            6: [1.0, 0.7, 0.4]    // M - красный
        };
        return colors[spectralType] || [1.0, 1.0, 1.0];
    }

    /**
     * Получение названия спектрального типа по числу
     * @param typeNumber - число (0-6)
     * @returns название спектрального типа
     */
    static getSpectralTypeName(typeNumber: number): string {
        return SPECTRAL_TYPE_NAMES[typeNumber] || 'G';
    }

    /**
     * Получение числа спектрального типа по названию
     * @param typeName - название (O, B, A, F, G, K, M)
     * @returns число (0-6)
     */
    static getSpectralTypeNumber(typeName: string): number {
        return SPECTRAL_TYPE_MAP[typeName] || 4;
    }

    /**
     * Расчет видимой звездной величины из абсолютной и расстояния
     * @param absoluteMagnitude - абсолютная звездная величина
     * @param distancePc - расстояние в парсеках
     * @returns видимая звездная величина
     */
    static calculateApparentMagnitude(absoluteMagnitude: number, distancePc: number): number {
        if (distancePc <= 0) return absoluteMagnitude;
        const distanceModulus = 5 * Math.log10(distancePc) - 5;
        return absoluteMagnitude + distanceModulus;
    }

    /**
     * Расчет физической яркости для рендеринга
     * @param absoluteMagnitude - абсолютная звездная величина
     * @param distancePc - расстояние в парсеках
     * @returns яркость для шейдера
     */
    static calculatePhysicalBrightness(absoluteMagnitude: number, distancePc: number): number {
        const apparentMagnitude = this.calculateApparentMagnitude(absoluteMagnitude, distancePc);
        return Math.pow(2.512, -apparentMagnitude);
    }

    /**
     * Валидация данных звезды перед конвертацией
     * @param star - данные звезды
     * @returns валидны ли данные
     */
    static isValidStar(star: StarScientificData): boolean {
        return star !== null &&
            star.position !== undefined &&
            star.absoluteMagnitude !== undefined &&
            !isNaN(star.absoluteMagnitude) &&
            star.magnitude > 0 &&
            star.magnitude < 30 &&
            star.distancePc > 0 &&
            star.distancePc < 10000;
    }

    /**
     * Фильтрация и конвертация только валидных звезд
     * @param stars - массив научных данных звезд
     * @returns массив валидных сконвертированных данных
     */
    static convertValidStars(stars: StarScientificData[]): ShaderStarData[] {
        const validStars = stars.filter(star => this.isValidStar(star));

        if (validStars.length !== stars.length) {
            console.warn(`⚠️ Отфильтровано ${stars.length - validStars.length} невалидных звезд`);
        }

        return this.batchStarsToShaderData(validStars);
    }

    /**
     * Получение статистики по сконвертированным данным
     * @param stars - сконвертированные данные звезд
     * @returns статистика
     */
    static getConversionStats(stars: ShaderStarData[]): {
        total: number;
        avgMagnitude: number;
        minMagnitude: number;
        maxMagnitude: number;
        avgTemperature: number;
        spectralDistribution: Record<string, number>;
        totalBufferBytes: number;
    } {
        const spectralDist: Record<string, number> = {};
        let totalMag = 0;
        let minMag = Infinity;
        let maxMag = -Infinity;
        let totalTemp = 0;

        for (const star of stars) {
            const typeName = this.getSpectralTypeName(star.spectralType);
            spectralDist[typeName] = (spectralDist[typeName] || 0) + 1;

            totalMag += star.magnitude;
            minMag = Math.min(minMag, star.magnitude);
            maxMag = Math.max(maxMag, star.magnitude);
            totalTemp += star.temperature;
        }

        return {
            total: stars.length,
            avgMagnitude: totalMag / stars.length,
            minMagnitude: minMag === Infinity ? 0 : minMag,
            maxMagnitude: maxMag === -Infinity ? 0 : maxMag,
            avgTemperature: totalTemp / stars.length,
            spectralDistribution: spectralDist,
            totalBufferBytes: stars.length * STAR_STRIDE_BYTES
        };
    }
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default ShaderDataConverter;

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('═'.repeat(60));
    console.log('🔄 ShaderDataConverter v2.0.0 загружен');
    console.log('═'.repeat(60));
    console.log('📊 Параметры конвертации:');
    console.log(`   • STAR_STRIDE_BYTES: ${STAR_STRIDE_BYTES} байт`);
    console.log(`   • STAR_STRIDE_FLOATS: ${STAR_STRIDE_FLOATS} floats`);
    console.log(`   • Спектральных классов: ${Object.keys(SPECTRAL_TYPE_MAP).length}`);
    console.log('═'.repeat(60));
}