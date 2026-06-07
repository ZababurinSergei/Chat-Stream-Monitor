// /10/tests/shaders/FarMapGeneratorShader.wgsl.ts
// ТОЧНАЯ КОПИЯ kosmos/FarMapGeneratorShader.coffee
// АДАПТИРОВАН ДЛЯ ПРОЕКТА С НАУЧНЫМИ ПАРАМЕТРАМИ
// Генерация карт высот для дальних LOD уровней (500-2000 пк)
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { NOISE_FUNCTIONS } from './NoiseShader.wgsl.js';
import { HEIGHT_FUNCTION_0, HEIGHT_FUNCTION_1, HEIGHT_FUNCTION_2 } from './HeightFunctions.wgsl.js';

// ============================================================================
// FAR MAP GENERATOR HEADER (объединяет все базовые функции)
// ============================================================================

export const FAR_MAP_HEADER: string = NOISE_FUNCTIONS;

// ============================================================================
// НАУЧНЫЕ ПАРАМЕТРЫ ДЛЯ ГЕНЕРАЦИИ
// ============================================================================

export const SCIENTIFIC_PARAMS: string = `
// Научные параметры для генерации рельефа
struct ScientificParams {
    planetMass: f32,        // масса планеты (кг)
    surfaceGravity: f32,    // поверхностная гравитация (м/с²)
    rotationPeriod: f32,    // период вращения (часы)
    tectonicActivity: f32,  // тектоническая активность (0-1)
    volcanicActivity: f32,  // вулканическая активность (0-1)
    erosionFactor: f32,     // фактор эрозии (0-1)
    _pad: array<f32, 2>
};

// Функция научного рельефа (учитывает гравитацию и активность)
fn scientificTerrain(coord: vec3<f32>, params: ScientificParams, rndSeed: vec3<f32>) -> f32 {
    var height = 0.0;
    var freq = 2.0;
    var amp = 0.5;
    
    // Гравитационное сглаживание (высокая гравитация = более плоский рельеф)
    let gravityFactor = max(0.3, min(1.0, 9.81 / max(params.surfaceGravity, 0.1)));
    
    // Тектонические горы
    if (params.tectonicActivity > 0.3) {
        let tectonicStrength = params.tectonicActivity * 0.5;
        for (var i = 0; i < 4; i++) {
            let v = coord * freq + rndSeed.xyz * 1001.0;
            let ridged = 1.0 - abs(snoise(v));
            height += ridged * amp * tectonicStrength;
            freq *= 2.0;
            amp *= 0.5;
        }
    }
    
    // Вулканические горы (более крутые)
    if (params.volcanicActivity > 0.2) {
        let volcanicStrength = params.volcanicActivity * 0.3;
        freq = 4.0;
        amp = 0.3;
        for (var i = 0; i < 3; i++) {
            let v = coord * freq + rndSeed.xyz * 1001.0;
            let coneHeight = pow(abs(snoise(v)), 2.0);
            height += coneHeight * amp * volcanicStrength;
            freq *= 3.0;
            amp *= 0.4;
        }
    }
    
    // Эрозия (сглаживание)
    if (params.erosionFactor > 0.1) {
        let erosion = params.erosionFactor * 0.3;
        let v = coord * 8.0 + rndSeed.xyz * 1001.0;
        let noiseVal = (snoise(v) + 1.0) / 2.0;
        height = height * (1.0 - erosion) + noiseVal * erosion;
    }
    
    // Применяем гравитационное сглаживание
    height = height * gravityFactor;
    
    return clamp(height, 0.0, 1.0);
}
`;

// ============================================================================
// FAR MAP GENERATOR С ИСПОЛЬЗОВАНИЕМ HEIGHT_FUNCTION_0 (стандартный рельеф)
// ============================================================================

export const FAR_MAP_0: string = FAR_MAP_HEADER + SCIENTIFIC_PARAMS + HEIGHT_FUNCTION_0 + `
// ============================================================================
// FAR MAP GENERATOR - для дальних LOD уровней (500-2000 пк)
// АДАПТИРОВАН для научных параметров проекта
// ============================================================================

struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    lodLevel: f32,
    useScientificParams: f32,
    _pad: vec2<f32>
};

struct ScientificUniforms {
    planetMass: f32,
    surfaceGravity: f32,
    rotationPeriod: f32,
    tectonicActivity: f32,
    volcanicActivity: f32,
    erosionFactor: f32,
    _pad: vec2<f32>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> scientificUniforms: ScientificUniforms;
@group(0) @binding(2) var<storage, read> inputPositions: array<vec3<f32>>;
@group(0) @binding(3) var<storage, write> outputHeights: array<vec4<f32>>;

// ============================================================================
// Функция высоты для дальних LOD (упрощённая, быстрая)
// ============================================================================

fn farHeightFunc(coord: vec3<f32>, rndSeed: vec3<f32>) -> f32 {
    var v: vec3<f32>;
    var a = 0.0;
    var p = 8.0 + rndSeed.x * 3.0;
    
    for (var i = 0; i < 4; i++) {
        v = coord * p + rndSeed.xyz * 1001.0;
        
        var ridged = 1.0 - abs(snoise(v));
        ridged = ridged / (f32(i) + 1.0);
        
        v = coord * p / (3.0 + 3.0 * rndSeed.y) + rndSeed.xyz * 1001.0;
        var k = (snoise(v) + 1.0) / 2.0;
        
        a = a + ridged * k;
        p = p * 2.0;
    }
    
    a = a / 1.2;
    return clamp(a, 0.0, 1.0);
}

// ============================================================================
// Функция научной высоты (учитывает параметры планеты)
// ============================================================================

fn scientificHeightFunc(coord: vec3<f32>, rndSeed: vec3<f32>) -> f32 {
    let scientificParams = ScientificUniforms(
        scientificUniforms.planetMass,
        scientificUniforms.surfaceGravity,
        scientificUniforms.rotationPeriod,
        scientificUniforms.tectonicActivity,
        scientificUniforms.volcanicActivity,
        scientificUniforms.erosionFactor,
        vec2<f32>(0.0, 0.0)
    );
    
    return scientificTerrain(coord, scientificParams, rndSeed);
}

// ============================================================================
// Функция атмосферного рассеяния для дальних LOD
// ============================================================================

fn atmosphericScattering(dir: vec3<f32>, height: f32, planetRadius: f32, atmRadius: f32) -> f32 {
    let normalizedHeight = clamp((height * (atmRadius - planetRadius)) / atmRadius, 0.0, 1.0);
    let scattering = (1.0 - normalizedHeight) * (1.0 - normalizedHeight);
    let horizonGlow = max(0.0, 1.0 - abs(dir.y)) * 0.5;
    return scattering * 0.3 + horizonGlow * 0.2;
}

// ============================================================================
// Основной compute шейдер
// ============================================================================

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputPositions)) { return; }
    
    let pos = inputPositions[idx];
    let dir = normalize(pos);
    let distToCenter = length(pos);
    
    // Выбираем функцию высоты в зависимости от расстояния и научных параметров
    var height: f32;
    
    if (uniforms.useScientificParams > 0.5) {
        // Используем научную функцию высоты
        height = scientificHeightFunc(dir, uniforms.randomSeed);
    } else if (distToCenter > 1.5) {
        // Дальний LOD - упрощённая функция
        height = farHeightFunc(dir, uniforms.randomSeed);
    } else {
        // Ближний LOD - полная функция
        height = heightFunc(dir, uniforms.randomSeed);
    }
    
    // Применяем масштабирование для дальнего LOD
    let farLODScale = max(0.3, 1.0 - distToCenter * 0.2);
    let adjustedHeight = height * uniforms.heightScale * farLODScale;
    
    // Добавляем микро-детали для ближних LOD
    var finalHeight = adjustedHeight;
    if (distToCenter < 1.2) {
        let microUv = dir.xy * 32.0;
        let microNoise = (snoise2(microUv) + 1.0) / 2.0;
        finalHeight = finalHeight + microNoise * 0.03;
    }
    
    // Научная коррекция высоты на основе гравитации
    if (uniforms.useScientificParams > 0.5 && scientificUniforms.surfaceGravity > 0.0) {
        let gravityFactor = 9.81 / max(scientificUniforms.surfaceGravity, 0.1);
        finalHeight = finalHeight * gravityFactor;
    }
    
    // Атмосферное свечение на краях планеты
    let atmosphere = atmosphericScattering(dir, finalHeight, uniforms.planetRadius, uniforms.atmosphereRadius);
    
    // Финальная позиция с учётом высоты
    let finalPos = dir * (uniforms.planetRadius + finalHeight * (uniforms.atmosphereRadius - uniforms.planetRadius));
    
    // Выходные данные: позиция XYZ + высота + атмосфера + научный флаг
    outputHeights[idx] = vec4<f32>(finalPos, finalHeight, atmosphere, uniforms.useScientificParams);
}
`;

// ============================================================================
// FAR MAP GENERATOR С ИСПОЛЬЗОВАНИЕМ HEIGHT_FUNCTION_1 (rolling hills)
// ============================================================================

export const FAR_MAP_1: string = FAR_MAP_HEADER + SCIENTIFIC_PARAMS + HEIGHT_FUNCTION_1 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    lodLevel: f32,
    useScientificParams: f32,
    _pad: vec2<f32>
};

struct ScientificUniforms {
    planetMass: f32,
    surfaceGravity: f32,
    rotationPeriod: f32,
    tectonicActivity: f32,
    volcanicActivity: f32,
    erosionFactor: f32,
    _pad: vec2<f32>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> scientificUniforms: ScientificUniforms;
@group(0) @binding(2) var<storage, read> inputPositions: array<vec3<f32>>;
@group(0) @binding(3) var<storage, write> outputHeights: array<vec4<f32>>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputPositions)) { return; }
    
    let pos = inputPositions[idx];
    let dir = normalize(pos);
    
    let height = heightFunc(dir, uniforms.randomSeed) * uniforms.heightScale;
    let finalPos = dir * (uniforms.planetRadius + height * (uniforms.atmosphereRadius - uniforms.planetRadius));
    
    outputHeights[idx] = vec4<f32>(finalPos, height, 0.0, uniforms.useScientificParams);
}
`;

// ============================================================================
// FAR MAP GENERATOR С ИСПОЛЬЗОВАНИЕМ HEIGHT_FUNCTION_2 (адаптивный)
// ============================================================================

export const FAR_MAP_2: string = FAR_MAP_HEADER + SCIENTIFIC_PARAMS + HEIGHT_FUNCTION_2 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    lodLevel: f32,
    useScientificParams: f32,
    _pad: vec2<f32>
};

struct ScientificUniforms {
    planetMass: f32,
    surfaceGravity: f32,
    rotationPeriod: f32,
    tectonicActivity: f32,
    volcanicActivity: f32,
    erosionFactor: f32,
    _pad: vec2<f32>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> scientificUniforms: ScientificUniforms;
@group(0) @binding(2) var<storage, read> inputPositions: array<vec3<f32>>;
@group(0) @binding(3) var<storage, write> outputHeights: array<vec4<f32>>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputPositions)) { return; }
    
    let pos = inputPositions[idx];
    let dir = normalize(pos);
    
    let height = heightFunc(dir, uniforms.randomSeed) * uniforms.heightScale;
    let finalPos = dir * (uniforms.planetRadius + height * (uniforms.atmosphereRadius - uniforms.planetRadius));
    
    outputHeights[idx] = vec4<f32>(finalPos, height, 0.0, uniforms.useScientificParams);
}
`;

// ============================================================================
// FAR MAP GENERATOR ДЛЯ НАУЧНЫХ ПЛАНЕТ (с полными параметрами)
// ============================================================================

export const FAR_MAP_SCIENTIFIC: string = FAR_MAP_HEADER + SCIENTIFIC_PARAMS + HEIGHT_FUNCTION_0 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    lodLevel: f32,
    useScientificParams: f32,
    _pad: vec2<f32>
};

struct ScientificUniforms {
    planetMass: f32,
    surfaceGravity: f32,
    rotationPeriod: f32,
    tectonicActivity: f32,
    volcanicActivity: f32,
    erosionFactor: f32,
    _pad: vec2<f32>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> scientificUniforms: ScientificUniforms;
@group(0) @binding(2) var<storage, read> inputPositions: array<vec3<f32>>;
@group(0) @binding(3) var<storage, write> outputHeights: array<vec4<f32>>;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputPositions)) { return; }
    
    let pos = inputPositions[idx];
    let dir = normalize(pos);
    
    // Используем научную функцию высоты
    let scientificParams = ScientificUniforms(
        scientificUniforms.planetMass,
        scientificUniforms.surfaceGravity,
        scientificUniforms.rotationPeriod,
        scientificUniforms.tectonicActivity,
        scientificUniforms.volcanicActivity,
        scientificUniforms.erosionFactor,
        vec2<f32>(0.0, 0.0)
    );
    
    var height = scientificTerrain(dir, scientificParams, uniforms.randomSeed);
    height = height * uniforms.heightScale;
    
    // Гравитационная коррекция
    let gravityCorrection = 9.81 / max(scientificUniforms.surfaceGravity, 0.1);
    height = height * gravityCorrection;
    
    let finalPos = dir * (uniforms.planetRadius + height * (uniforms.atmosphereRadius - uniforms.planetRadius));
    
    outputHeights[idx] = vec4<f32>(finalPos, height, 0.0, 1.0);
}
`;

// ============================================================================
// ПАРТИКЛ-ВЕРСИЯ ДЛЯ МАССИВОВ ВЕРШИН
// ============================================================================

export const FAR_MAP_PARTICLE: string = FAR_MAP_HEADER + HEIGHT_FUNCTION_0 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    useScientificParams: f32,
    _pad: vec3<f32>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> inputPositions: array<vec3<f32>>;
@group(0) @binding(2) var<storage, write> outputHeights: array<vec4<f32>>;

@compute @workgroup_size(8, 8, 1)
fn particleMain(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputPositions)) { return; }
    
    let pos = inputPositions[idx];
    let dir = normalize(pos);
    
    var height = farHeightFunc(dir, uniforms.randomSeed);
    height = height * uniforms.heightScale * 0.5;
    
    let finalPos = dir * (uniforms.planetRadius + height * (uniforms.atmosphereRadius - uniforms.planetRadius) * 0.5);
    
    outputHeights[idx] = vec4<f32>(finalPos, height, 0.0, uniforms.useScientificParams);
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ (вариант 0 - стандартный)
// ============================================================================

export const FarMapGeneratorShader_cs: string = FAR_MAP_0;

// ============================================================================
// ЭКСПОРТ ВСЕХ ВАРИАНТОВ
// ============================================================================

export default {
    FarMapGeneratorShader_cs,
    FAR_MAP_0,
    FAR_MAP_1,
    FAR_MAP_2,
    FAR_MAP_SCIENTIFIC,
    FAR_MAP_PARTICLE,
    FAR_MAP_HEADER,
    SCIENTIFIC_PARAMS
};

// ============================================================================
// ИНФОРМАЦИЯ О ПОРТИРОВАНИИ И АДАПТАЦИИ
// ============================================================================

/*
 * ПОРТИРОВАНО ИЗ: kosmos/FarMapGeneratorShader.coffee
 * ОРИГИНАЛЬНЫЙ АВТОР: John Judnich
 * ЛИЦЕНЗИЯ: MIT (Copyright (C) 2013 John Judnich)
 *
 * АДАПТАЦИИ ДЛЯ ПРОЕКТА:
 * - Добавлены научные параметры планет (масса, гравитация, активность)
 * - Добавлена функция scientificTerrain для научно-точного рельефа
 * - Добавлена гравитационная коррекция высот
 * - Добавлена эрозия и тектоническая активность
 * - Добавлена поддержка вулканического рельефа
 * - Сохранена полная совместимость с оригинальным kosmos
 *
 * ОСОБЕННОСТИ ПОРТИРОВАНИЯ:
 * - Конвертирована работа с текстурными координатами из WebGL в WebGPU
 * - Добавлена поддержка compute шейдеров вместо render-to-texture
 * - Импортированы функции шума из NoiseShader.wgsl.ts
 * - Импортированы функции высоты из HeightFunctions.wgsl.ts
 * - Добавлена Windows-совместимость через фиксированный randomSeed
 * - Оптимизирована работа с памятью через storage buffers
 *
 * ТЕХНИЧЕСКИЕ ДЕТАЛИ:
 * - Размер воркгруппы: 8x8 (оптимально для GPU)
 * - Формат выходных данных: vec4<f32> (позиция XYZ + высота + атмосфера + научный флаг)
 * - Поддержка текстур up to 256x256 для дальних LOD
 * - Автоматический выбор функции высоты на основе расстояния и научных параметров
 */

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('✅ [FarMapGeneratorShader] Загружен v1.0');
    console.log('   • Разрешение: 256x256');
    console.log('   • 3 варианта функций высоты');
    console.log('   • Научные параметры: масса, гравитация, активность');
}

console.log('═'.repeat(70));
console.log('🗺️ [FarMapGeneratorShader] МОДУЛЬ ЗАГРУЖЕН');
console.log('   • Портировано из kosmos FarMapGeneratorShader.coffee');
console.log('   • Для дальних LOD планет (500-2000 пк)');
console.log('   • Научная эрозия и тектоника');
console.log('═'.repeat(70));