// /10/tests/config/debugConfig.ts
// Конфигурация для отладки звезд - ОТКЛЮЧАЕТ ВСЕ ОГРАНИЧЕНИЯ
// Версия 1.1.0 - ДОБАВЛЕНА РАБОТА С SHADER INTENSITY
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { LODConfig } from '../core/ScientificLOD.js';

// ============================================================================
// ОТЛАДОЧНАЯ КОНФИГУРАЦИЯ LOD - все звезды видны на любом расстоянии
// ============================================================================

export const DEBUG_LOD_CONFIG: Partial<LODConfig> = {
    thresholds: {
        full3dMax: 1000000,      // 1 млн единиц - все звезды в режиме FULL_3D
        billboardMax: 1000000,   // 1 млн единиц - билборды на любом расстоянии
        detailedPointMax: 1000000,
        simplePointMax: 1000000
    },
    brightnessConfig: {
        useInverseSquare: false,   // ОТКЛЮЧАЕМ закон обратных квадратов
        minBrightness: 0.0001,     // Минимальная яркость
        magnitudeReference: 0,
        exposureCompensation: 10.0 // Максимальная компенсация экспозиции
    },
    performance: {
        maxFull3DStars: 10000,     // Максимум звезд в FULL_3D
        maxBillboardStars: 10000,  // Максимум билбордов
        maxPointsStars: 50000,     // Максимум точечных звезд
        updateFrequency: 1,        // Обновление каждый кадр
        asyncUpdate: false,        // Синхронное обновление
        useFrustumCulling: false   // ОТКЛЮЧАЕМ отсечение по фрустуму
    },
    scientific: {
        preserveParallax: false,   // ОТКЛЮЧАЕМ параллакс
        accurateBrightness: false, // ОТКЛЮЧАЕМ точную яркость
        useRealColors: true,
        useExtinction: false,      // ОТКЛЮЧАЕМ межзвездное поглощение
        galacticExtinction: 0
    },
    adaptive: {
        enabled: false,            // ОТКЛЮЧАЕМ адаптивную производительность
        targetFPS: 60,
        qualityLevel: 'ultra',
        autoAdjust: false
    },
    textureGeneration: {
        enabled: false,            // ОТКЛЮЧАЕМ генерацию текстур
        maxResolution: 512,
        generateMipmaps: false,
        updateIntervalFrames: 1,
        useComputeShaders: false,
        farMapResolution: 64,
        nearMapResolution: 128,
        normalMapStrength: 0,
        horizonOcclusion: 0
    }
};

// ============================================================================
// ЭКСТРЕННАЯ КОНФИГУРАЦИЯ - максимальная видимость
// ============================================================================

export const EMERGENCY_LOD_CONFIG: Partial<LODConfig> = {
    thresholds: {
        full3dMax: 999999999,
        billboardMax: 999999999,
        detailedPointMax: 999999999,
        simplePointMax: 999999999
    },
    brightnessConfig: {
        useInverseSquare: false,
        minBrightness: 0,
        magnitudeReference: -10,
        exposureCompensation: 100
    },
    performance: {
        maxFull3DStars: 100000,
        maxBillboardStars: 100000,
        maxPointsStars: 100000,
        updateFrequency: 1,
        asyncUpdate: false,
        useFrustumCulling: false
    },
    scientific: {
        preserveParallax: false,
        accurateBrightness: false,
        useRealColors: true,
        useExtinction: false,
        galacticExtinction: 0
    },
    adaptive: {
        enabled: false,
        targetFPS: 60,
        qualityLevel: 'ultra',
        autoAdjust: false
    },
    textureGeneration: {
        enabled: false,
        maxResolution: 64,
        generateMipmaps: false,
        updateIntervalFrames: 1,
        useComputeShaders: false,
        farMapResolution: 32,
        nearMapResolution: 32,
        normalMapStrength: 0,
        horizonOcclusion: 0
    }
};

// ============================================================================
// ФУНКЦИЯ ДЛЯ ПРЯМОЙ УСТАНОВКИ ИНТЕНСИВНОСТИ В ШЕЙДЕРЕ
// ============================================================================

/**
 * Принудительная установка интенсивности звезд напрямую в шейдере
 * @param starfieldComponent - компонент звездного поля
 * @param intensity - интенсивность (1-100)
 */
export function forceShaderIntensity(starfieldComponent: any, intensity: number = 50): void {
    if (!starfieldComponent) {
        console.error('❌ Starfield компонент не найден');
        return;
    }

    console.log(`\n⭐ ПРИНУДИТЕЛЬНАЯ УСТАНОВКА ИНТЕНСИВНОСТИ: ${intensity}`);
    console.log('═'.repeat(50));

    // Метод 1: через starBuffer
    if (starfieldComponent.starBuffer && starfieldComponent.starsData) {
        const starsCount = starfieldComponent.starsData.length;
        for (let i = 0; i < starsCount; i++) {
            const offset = i * 16 + 15;
            if (starfieldComponent.starBuffer.outFloat32Array) {
                starfieldComponent.starBuffer.outFloat32Array[offset] = intensity;
            }
        }
        starfieldComponent.starBuffer.apply();
        console.log(`   ✅ starBuffer обновлен для ${starsCount} звезд`);
    }

    // Метод 2: через глобальный буфер времени
    const timeBuffer = starfieldComponent.constructor?.getGlobalTimeBuffer?.();
    if (timeBuffer && timeBuffer.outFloat32Array) {
        timeBuffer.outFloat32Array[2] = intensity;
        timeBuffer.apply();
        console.log(`   ✅ Глобальный timeBuffer обновлен (интенсивность=${intensity})`);
    }

    // Метод 3: через материал
    if (starfieldComponent.renderer?.material) {
        const material = starfieldComponent.renderer.material;
        if (typeof material.setUniformFloat === 'function') {
            material.setUniformFloat('starIntensity', intensity);
            console.log(`   ✅ material.starIntensity = ${intensity}`);
        }
    }

    console.log('═'.repeat(50) + '\n');
}

// ============================================================================
// ПРИМЕНЕНИЕ КОНФИГУРАЦИИ
// ============================================================================

/**
 * Применить отладочную конфигурацию к LOD менеджеру
 */
export function applyDebugLODConfig(lodManager: any): void {
    if (!lodManager) {
        console.error('❌ LOD Manager не найден');
        return;
    }

    console.log('\n🔧 ПРИМЕНЕНИЕ ОТЛАДОЧНОЙ КОНФИГУРАЦИИ LOD');
    console.log('═'.repeat(60));

    lodManager.updateConfig(DEBUG_LOD_CONFIG);

    console.log('   ✅ thresholds.full3dMax = 1,000,000');
    console.log('   ✅ brightnessConfig.useInverseSquare = false');
    console.log('   ✅ brightnessConfig.exposureCompensation = 10.0');
    console.log('   ✅ performance.useFrustumCulling = false');
    console.log('   ✅ scientific.accurateBrightness = false');
    console.log('   ✅ adaptive.enabled = false');
    console.log('   ✅ textureGeneration.enabled = false');
    console.log('═'.repeat(60) + '\n');
}

/**
 * Применить экстренную конфигурацию (максимальная видимость)
 */
export function applyEmergencyLODConfig(lodManager: any): void {
    if (!lodManager) {
        console.error('❌ LOD Manager не найден');
        return;
    }

    console.log('\n🚨 ПРИМЕНЕНИЕ ЭКСТРЕННОЙ КОНФИГУРАЦИИ LOD');
    console.log('═'.repeat(60));

    lodManager.updateConfig(EMERGENCY_LOD_CONFIG);

    console.log('   ✅ thresholds.all = 999,999,999');
    console.log('   ✅ exposureCompensation = 100');
    console.log('   ✅ magnitudeReference = -10');
    console.log('   ✅ Все ограничения ОТКЛЮЧЕНЫ');
    console.log('═'.repeat(60) + '\n');
}

// ============================================================================
// ПОЛНАЯ ОТЛАДКА ЗВЕЗД
// ============================================================================

/**
 * Полная отладка звезд - отключает все фильтры
 */
export async function debugStarsFullVisibility(starfieldComponent: any): Promise<void> {
    if (!starfieldComponent) {
        console.error('❌ Starfield компонент не найден');
        return;
    }

    console.log('\n' + '═'.repeat(70));
    console.log('⭐ ПОЛНАЯ ОТЛАДКА ВИДИМОСТИ ЗВЕЗД');
    console.log('═'.repeat(70));

    // 1. Отключаем LOD ограничения
    if (starfieldComponent.lodManager) {
        applyEmergencyLODConfig(starfieldComponent.lodManager);
    }

    // 2. Форсируем обновление LOD
    if (typeof starfieldComponent.forceUpdateAll === 'function') {
        starfieldComponent.forceUpdateAll();
        console.log('   ✅ forceUpdateAll выполнен');
    }

    // 3. Устанавливаем максимальную интенсивность
    forceShaderIntensity(starfieldComponent, 100);

    // 4. Принудительное обновление материала
    if (starfieldComponent.renderer && starfieldComponent.renderer.material) {
        const material = starfieldComponent.renderer.material;
        if (material.shader) {
            material.shader.noticeValueChange();
            console.log('   ✅ Материал помечен для перекомпиляции');
        }
    }

    console.log('═'.repeat(70));
    console.log('✅ ОТЛАДКА ЗАВЕРШЕНА');
    console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// БЫСТРАЯ ПРОВЕРКА ВИДИМОСТИ
// ============================================================================

/**
 * Быстрая проверка видимости звезд
 */
export function quickStarVisibilityCheck(starfieldComponent: any): void {
    if (!starfieldComponent) {
        console.error('❌ Starfield компонент не найден');
        return;
    }

    console.log('\n📊 БЫСТРАЯ ПРОВЕРКА ВИДИМОСТИ ЗВЕЗД');
    console.log('═'.repeat(50));

    // Статистика
    const stats = starfieldComponent.getRenderStats?.();
    if (stats) {
        console.log(`   📈 Всего звезд: ${stats.totalStars}`);
        console.log(`   📈 Рендерится: ${stats.totalRendered}`);
        console.log(`   📈 FULL_3D: ${stats.full3DCount}`);
        console.log(`   📈 Billboard: ${stats.billboardCount}`);
        console.log(`   📈 Detailed Points: ${stats.detailedPointCount}`);
        console.log(`   📈 Simple Points: ${stats.simplePointCount}`);
        console.log(`   📈 Средняя яркость: ${stats.averageBrightness}`);
    }

    // Проверка буфера
    if (starfieldComponent.starBuffer) {
        const hasData = starfieldComponent.starBuffer.outFloat32Array !== null;
        const dataLength = starfieldComponent.starBuffer.outFloat32Array?.length || 0;
        console.log(`   💾 Буфер звезд: ${hasData ? '✅ есть данные' : '❌ нет данных'} (${dataLength} floats)`);

        // Проверяем первую звезду в буфере
        if (hasData && starfieldComponent.starsData?.length > 0) {
            const firstStar = starfieldComponent.starBuffer.outFloat32Array;
            console.log(`   ⭐ Первая звезда в буфере: pos(${firstStar[0]?.toFixed(1)}, ${firstStar[1]?.toFixed(1)}, ${firstStar[2]?.toFixed(1)})`);
            console.log(`      цвет: (${firstStar[3]?.toFixed(2)}, ${firstStar[4]?.toFixed(2)}, ${firstStar[5]?.toFixed(2)})`);
            console.log(`      яркость: ${firstStar[15]}`);
        }
    }

    // Проверка геометрии
    if (starfieldComponent.renderer?.geometry) {
        const geom = starfieldComponent.renderer.geometry;
        console.log(`   🔷 Геометрия: ${geom.vertexCount} вершин, ${geom.subGeometries.length} сабмешей`);
    }

    // Проверка материала
    if (starfieldComponent.renderer?.material?.shader) {
        const shader = starfieldComponent.renderer.material.shader;
        const passes = shader.getSubShaders?.(1);
        console.log(`   🎨 Материал: ${passes?.length || 0} пассов`);
    }

    // Проверка LOD менеджера
    if (starfieldComponent.lodManager) {
        const lodStats = starfieldComponent.lodManager.getDetailedStats?.();
        if (lodStats) {
            console.log(`   🎚️ LOD Manager: quality=${lodStats.config?.adaptive?.qualityLevel}`);
        }
    }

    console.log('═'.repeat(50) + '\n');
}

// ============================================================================
// СБРОС К НАСТРОЙКАМ ПО УМОЛЧАНИЮ
// ============================================================================

/**
 * Сброс LOD менеджера к настройкам по умолчанию
 */
export function resetLODConfig(lodManager: any): void {
    if (!lodManager) {
        console.error('❌ LOD Manager не найден');
        return;
    }

    console.log('\n🔄 СБРОС LOD К НАСТРОЙКАМ ПО УМОЛЧАНИЮ');
    console.log('═'.repeat(50));

    // Сохраняем только научные настройки
    const defaultConfig: Partial<LODConfig> = {
        thresholds: {
            full3dMax: 50,
            billboardMax: 200,
            detailedPointMax: 500,
            simplePointMax: 2000
        },
        brightnessConfig: {
            useInverseSquare: true,
            minBrightness: 0.001,
            magnitudeReference: 0,
            exposureCompensation: 1.5
        },
        performance: {
            maxFull3DStars: 50,
            maxBillboardStars: 200,
            maxPointsStars: 3000,
            updateFrequency: 30,
            asyncUpdate: false,
            useFrustumCulling: true
        }
    };

    lodManager.updateConfig(defaultConfig);
    console.log('   ✅ Настройки сброшены к значениям по умолчанию');
    console.log('═'.repeat(50) + '\n');
}

// ============================================================================
// ГЛОБАЛЬНЫЙ ДОСТУП ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__debugStars = {
        version: '1.1.0',
        applyDebugConfig: () => {
            const comp = (window as any).__starfieldComponent;
            if (comp?.lodManager) applyDebugLODConfig(comp.lodManager);
            else console.error('❌ Starfield компонент или LOD Manager не найден');
        },
        applyEmergencyConfig: () => {
            const comp = (window as any).__starfieldComponent;
            if (comp?.lodManager) applyEmergencyLODConfig(comp.lodManager);
            else console.error('❌ Starfield компонент или LOD Manager не найден');
        },
        fullVisibility: () => {
            const comp = (window as any).__starfieldComponent;
            debugStarsFullVisibility(comp);
        },
        quickCheck: () => {
            const comp = (window as any).__starfieldComponent;
            quickStarVisibilityCheck(comp);
        },
        forceIntensity: (intensity: number) => {
            const comp = (window as any).__starfieldComponent;
            forceShaderIntensity(comp, intensity);
        },
        reset: () => {
            const comp = (window as any).__starfieldComponent;
            if (comp?.lodManager) resetLODConfig(comp.lodManager);
            else console.error('❌ Starfield компонент или LOD Manager не найден');
        },
        getStarBuffer: () => {
            const comp = (window as any).__starfieldComponent;
            if (comp?.starBuffer?.outFloat32Array) {
                const buffer = comp.starBuffer.outFloat32Array;
                console.log(`📊 Буфер звезд: ${buffer.length} floats, ${buffer.length / 16} звезд`);
                return buffer;
            }
            console.error('❌ Буфер звезд не найден');
            return null;
        }
    };

    console.log('═'.repeat(70));
    console.log('✅ [debugConfig] Отладочные команды:');
    console.log('═'.repeat(70));
    console.log('   __debugStars.quickCheck() - быстрая проверка');
    console.log('   __debugStars.fullVisibility() - полная отладка');
    console.log('   __debugStars.applyEmergencyConfig() - экстренная конфигурация');
    console.log('   __debugStars.forceIntensity(100) - установка яркости');
    console.log('   __debugStars.reset() - сброс к默认ным настройкам');
    console.log('   __debugStars.getStarBuffer() - просмотр буфера звезд');
    console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

export default {
    DEBUG_LOD_CONFIG,
    EMERGENCY_LOD_CONFIG,
    applyDebugLODConfig,
    applyEmergencyLODConfig,
    debugStarsFullVisibility,
    quickStarVisibilityCheck,
    forceShaderIntensity,
    resetLODConfig
};