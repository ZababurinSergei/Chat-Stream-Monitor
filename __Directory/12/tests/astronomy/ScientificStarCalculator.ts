// /10/tests/astronomy/ScientificStarCalculator.ts
// Версия 1.0.0 - Вынесенный модуль для астрономических расчётов
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ
// Единый источник истины для всех научных вычислений

/**
 * Научный калькулятор звёздных характеристик
 * Используется для:
 * - Расчёта видимых и абсолютных звёздных величин
 * - Преобразования температуры в цвет
 * - Определения спектрального класса
 * - Расчёта физических параметров звёзд
 *
 * @module ScientificStarCalculator
 * @version 1.0.0
 */

export class ScientificStarCalculator {
    /**
     * Рассчитывает абсолютную звёздную величину (M) из видимой (m) и расстояния
     * Формула: M = m - 5 * log10(d) + 5
     *
     * @param apparentMag - видимая звёздная величина (m)
     * @param distancePc - расстояние в парсеках (пк)
     * @returns абсолютная звёздная величина (M)
     */
    static calculateAbsoluteMagnitude(apparentMag: number, distancePc: number): number {
        if (distancePc <= 0) return apparentMag;
        const distanceModulus = 5 * Math.log10(distancePc) - 5;
        return apparentMag - distanceModulus;
    }

    /**
     * Рассчитывает видимую звёздную величину (m) из абсолютной (M) и расстояния
     * Формула: m = M + 5 * log10(d) - 5
     *
     * @param absoluteMag - абсолютная звёздная величина (M)
     * @param distancePc - расстояние в парсеках (пк)
     * @returns видимая звёздная величина (m)
     */
    static calculateApparentMagnitude(absoluteMag: number, distancePc: number): number {
        if (distancePc <= 0) return absoluteMag;
        const distanceModulus = 5 * Math.log10(distancePc) - 5;
        return absoluteMag + distanceModulus;
    }

    /**
     * Рассчитывает яркость для рендеринга на основе физических параметров
     * Учитывает:
     * - Закон обратных квадратов (I ∝ 1/r²)
     * - Межзвёздное поглощение (экстинкцию)
     * - Экспозиционную компенсацию
     *
     * @param absoluteMagnitude - абсолютная звёздная величина (M)
     * @param distancePc - расстояние в парсеках (пк)
     * @param useInverseSquare - использовать ли закон обратных квадратов (по умолчанию true)
     * @param exposureCompensation - компенсация экспозиции (по умолчанию 1.5)
     * @param extinction - межзвёздное поглощение в mag/kpc (по умолчанию 0)
     * @returns яркость для рендеринга в диапазоне [0.001, 2.0]
     */
    static calculateRenderBrightness(
        absoluteMagnitude: number,
        distancePc: number,
        useInverseSquare: boolean = true,
        exposureCompensation: number = 1.5,
        extinction: number = 0
    ): number {
        if (distancePc <= 0) return 0;

        // Расчёт видимой величины с учётом расстояния
        let apparentMagnitude = this.calculateApparentMagnitude(absoluteMagnitude, distancePc);

        // Учёт межзвёздного поглощения
        if (extinction > 0) {
            const extinctionMag = extinction * distancePc / 1000;
            apparentMagnitude += extinctionMag;
        }

        // Преобразование звёздной величины в линейную яркость
        // Формула Погсона: I2/I1 = 2.512^(m1-m2)
        let brightness = Math.pow(2.512, -apparentMagnitude);

        // Применение экспозиционной компенсации
        brightness *= exposureCompensation;

        // Клипирование в разумные пределы
        return Math.min(2.0, Math.max(0.001, brightness));
    }

    /**
     * Рассчитывает радиус звезды в радиусах Солнца (R☉)
     *
     * @param luminosityLsun - светимость в солнечных светимостях (L☉)
     * @param temperature - эффективная температура в Кельвинах (K)
     * @returns радиус в радиусах Солнца (R☉)
     */
    static calculateRadius(luminosityLsun: number, temperature: number): number {
        const solarTemp = 5778;
        // L ∝ R² * T⁴ → R = sqrt(L) * (T☉/T)²
        return Math.sqrt(luminosityLsun) * Math.pow(solarTemp / temperature, 2);
    }

    /**
     * Оценивает массу звезды по спектральному классу
     * Эмпирические значения для главной последовательности
     *
     * @param spectralType - спектральный класс (O, B, A, F, G, K, M)
     * @returns масса в массах Солнца (M☉)
     */
    static estimateMass(spectralType: string): number {
        const masses: Record<string, number> = {
            'O': 20.0,   // Голубые сверхгиганты
            'B': 8.0,    // Голубые гиганты
            'A': 2.1,    // Белые звёзды
            'F': 1.4,    // Жёлто-белые звёзды
            'G': 1.0,    // Жёлтые карлики (как Солнце)
            'K': 0.7,    // Оранжевые карлики
            'M': 0.3     // Красные карлики
        };
        return masses[spectralType] || 1.0;
    }

    /**
     * Рассчитывает научный приоритет для LOD отображения
     * Учитывает:
     * - Яркость звезды (40% веса)
     * - Расстояние до звезды (30% веса)
     * - Спектральный класс (до 20% веса)
     * - Наличие экзопланет (10% веса)
     *
     * @param magnitude - видимая звёздная величина (m)
     * @param distancePc - расстояние в парсеках (пк)
     * @param spectralType - спектральный класс
     * @param hasExoplanets - наличие подтверждённых экзопланет
     * @returns приоритет в диапазоне [0, 100]
     */
    static calculateScientificPriority(
        magnitude: number,
        distancePc: number,
        spectralType: string,
        hasExoplanets: boolean = false
    ): number {
        let priority = 0;

        // Яркость звезды (чем ярче, тем выше приоритет)
        const brightnessScore = Math.max(0, (6 - magnitude)) * 6.66;
        priority += Math.min(40, brightnessScore);

        // Близость к Земле (чем ближе, тем выше приоритет)
        const distanceScore = Math.max(0, (100 - distancePc) / 100) * 30;
        priority += Math.min(30, distanceScore);

        // Научная значимость спектрального класса
        const scienceScore: Record<string, number> = {
            'O': 20,   // Редкие массивные звёзды
            'B': 15,   // Важные для понимания эволюции
            'A': 10,   // Интересные для изучения
            'F': 8,    // Умеренный интерес
            'G': 12,   // Солнцеподобные звёзды (высокий интерес)
            'K': 15,   // Кандидаты на обитаемость
            'M': 18    // Самые распространённые, потенциальные экзопланеты
        };
        priority += scienceScore[spectralType] || 10;

        // Бонус за экзопланеты
        if (hasExoplanets) priority += 10;

        return Math.min(100, Math.max(0, priority));
    }

    /**
     * Преобразует эффективную температуру в RGB цвет
     * Использует приближение чёрнотельного излучения
     *
     * @param temperature - эффективная температура в Кельвинах (K)
     * @returns RGB цвет в формате [r, g, b] где каждый канал в диапазоне [0, 1]
     */
    static getScientificColor(temperature: number): [number, number, number] {
        let t = temperature / 100;
        let r: number, g: number, b: number;

        // Алгоритм на основе температуры (1000K - 40000K)
        if (t <= 66) {
            r = 1.0;
            g = Math.min(1.0, Math.max(0, 0.390081578769019 * Math.log(t) - 0.631841443782627));
            b = t <= 19 ? 0 : Math.min(1.0, Math.max(0, 0.543206789110196 * Math.log(t - 10) - 1.196254089142308));
        } else {
            r = Math.min(1.0, Math.max(0, 1.292936186062745 * Math.pow(t - 60, -0.1332047592)));
            g = Math.min(1.0, Math.max(0, 1.129890860895294 * Math.pow(t - 60, -0.0755148492)));
            b = 1.0;
        }

        // Коррекция для очень горячих звёзд (O класс, >30000K)
        if (temperature > 30000) {
            r *= 0.7;
            g *= 0.85;
            b *= 1.3;
        }
        // Коррекция для холодных звёзд (M класс, <4000K)
        else if (temperature < 4000) {
            r *= 1.3;
            g *= 0.65;
            b *= 0.4;
        }

        return [Math.min(1, r), Math.min(1, g), Math.min(1, b)];
    }

    /**
     * Определяет спектральный класс по эффективной температуре
     * Классификация Моргана-Кинана (MK система)
     *
     * @param temperature - эффективная температура в Кельвинах (K)
     * @returns спектральный класс (O, B, A, F, G, K, M)
     */
    static getSpectralType(temperature: number): string {
        if (temperature > 30000) return 'O';
        if (temperature > 10000) return 'B';
        if (temperature > 7500) return 'A';
        if (temperature > 6000) return 'F';
        if (temperature > 5200) return 'G';
        if (temperature > 3700) return 'K';
        return 'M';
    }

    /**
     * Рассчитывает максимальное расстояние видимости звезды
     * с учётом минимальной яркости детектора
     *
     * @param absoluteMagnitude - абсолютная звёздная величина (M)
     * @param minBrightness - минимальная детектируемая яркость (по умолчанию 0.005)
     * @param extinction - межзвёздное поглощение в mag/kpc (по умолчанию 0)
     * @returns максимальное расстояние в парсеках (пк)
     */
    static getMaxVisibleDistance(
        absoluteMagnitude: number,
        minBrightness: number = 0.005,
        extinction: number = 0
    ): number {
        const minApparentMagnitude = -Math.log10(minBrightness) / Math.log10(2.512);
        let logDistance = (minApparentMagnitude - absoluteMagnitude + 5) / 5;
        let maxDistance = Math.pow(10, logDistance);

        // Учёт поглощения (итеративное уточнение)
        if (extinction > 0 && maxDistance > 0) {
            for (let i = 0; i < 5; i++) {
                const extinctionMag = extinction * maxDistance / 1000;
                const adjustedMag = minApparentMagnitude - extinctionMag;
                const newLogDistance = (adjustedMag - absoluteMagnitude + 5) / 5;
                maxDistance = Math.pow(10, newLogDistance);
            }
        }

        return Math.min(maxDistance, 15000);
    }

    /**
     * Сравнивает две звезды по яркости для сортировки
     *
     * @param a - первая звезда с полем currentBrightness
     * @param b - вторая звезда с полем currentBrightness
     * @returns отрицательное число если a ярче, положительное если b ярче
     */
    static compareBrightness(a: { currentBrightness: number }, b: { currentBrightness: number }): number {
        return b.currentBrightness - a.currentBrightness;
    }

    /**
     * Преобразует цветовой индекс Gaia BP-RP в приблизительную температуру
     *
     * @param bpRp - цветовой индекс Gaia (BP-RP)
     * @returns приблизительная температура в Кельвинах
     */
    static bpRpToTemperature(bpRp: number): number {
        let temp: number;
        if (bpRp < 0) {
            temp = 30000;
        } else if (bpRp < 0.5) {
            temp = 8000 - bpRp * 4000;
        } else if (bpRp < 1.0) {
            temp = 6000 - (bpRp - 0.5) * 2000;
        } else if (bpRp < 1.5) {
            temp = 5000 - (bpRp - 1.0) * 2000;
        } else {
            temp = 4000 - (bpRp - 1.5) * 1000;
        }
        return Math.max(2000, Math.min(30000, temp));
    }

    /**
     * Преобразует температуру в приблизительный цветовой индекс
     *
     * @param temperature - эффективная температура в Кельвинах
     * @returns приблизительный цветовой индекс BP-RP
     */
    static temperatureToBpRp(temperature: number): number {
        let t = temperature;
        if (t >= 30000) return -0.3;
        if (t >= 10000) return 0.0;
        if (t >= 7500) return 0.2;
        if (t >= 6000) return 0.5;
        if (t >= 5200) return 0.8;
        if (t >= 3700) return 1.2;
        return 1.8;
    }
}

/**
 * Константы для астрономических расчётов
 */
export const ASTRONOMY_CONSTANTS = {
    SOLAR_LUMINOSITY_W: 3.828e26,        // Светимость Солнца в ваттах
    SOLAR_RADIUS_M: 6.957e8,             // Радиус Солнца в метрах
    SOLAR_MASS_KG: 1.9885e30,            // Масса Солнца в кг
    SOLAR_TEMPERATURE_K: 5778,           // Эффективная температура Солнца в K
    PARSEC_TO_KM: 3.0857e13,             // Парсек в километрах
    PARSEC_TO_LY: 3.2616,                // Парсек в световых годах
    LY_TO_KM: 9.461e12,                  // Световой год в километрах
    AU_TO_KM: 1.495978707e8,             // Астрономическая единица в км
    MAGNITUDE_ZERO_POINT: 2.512,         // Основание шкалы звёздных величин
};

/**
 * Спектральные классы с их характеристиками
 */
export const SPECTRAL_CLASSES = {
    O: { temperature: [30000, 50000], color: [0.6, 0.7, 1.0], mass: 16, radius: 6.6, luminosity: 30000 },
    B: { temperature: [10000, 30000], color: [0.7, 0.8, 1.0], mass: 8, radius: 3.2, luminosity: 130 },
    A: { temperature: [7500, 10000], color: [0.9, 0.9, 1.0], mass: 2.1, radius: 1.7, luminosity: 24 },
    F: { temperature: [6000, 7500], color: [1.0, 0.95, 0.8], mass: 1.4, radius: 1.3, luminosity: 3.5 },
    G: { temperature: [5200, 6000], color: [1.0, 0.9, 0.7], mass: 1.0, radius: 1.0, luminosity: 1.0 },
    K: { temperature: [3700, 5200], color: [1.0, 0.8, 0.5], mass: 0.7, radius: 0.8, luminosity: 0.4 },
    M: { temperature: [2400, 3700], color: [1.0, 0.7, 0.4], mass: 0.3, radius: 0.5, luminosity: 0.04 }
} as const;

/**
 * Тип для спектрального класса
 */
export type SpectralType = keyof typeof SPECTRAL_CLASSES;

export default ScientificStarCalculator;