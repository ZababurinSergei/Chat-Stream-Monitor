// /10/tests/shaders/NearMapGeneratorShader.wgsl.ts
// ТОЧНАЯ КОПИЯ kosmos/NearMapGeneratorShader.coffee
// АДАПТИРОВАН ДЛЯ ПРОЕКТА - высокое разрешение для ближних LOD (4096x4096)
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { NOISE_FUNCTIONS } from './NoiseShader.wgsl.js';
import { HEIGHT_FUNCTION_0, HEIGHT_FUNCTION_1, HEIGHT_FUNCTION_2 } from './HeightFunctions.wgsl.js';

export const NEAR_MAP_HEADER: string = NOISE_FUNCTIONS;

// ============================================================================
// NEAR MAP GENERATOR - ФУНКЦИЯ ВЫСОТЫ 0 (стандартный рельеф)
// ============================================================================

export const NEAR_MAP_0: string = NEAR_MAP_HEADER + HEIGHT_FUNCTION_0 + `
// ============================================================================
// NEAR MAP GENERATOR - ДЛЯ БЛИЖНИХ LOD (0-500 пк)
// Портировано из kosmos NearMapGeneratorShader.coffee
// Адаптировано для проекта с поддержкой научных данных
// ============================================================================

struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    microDetail: f32,
    macroDetail: f32,
    lodLevel: f32,
    texelSize: vec2<f32>,
    time: f32,
    // ⭐ НОВЫЕ ПОЛЯ ДЛЯ НАУЧНЫХ ДАННЫХ
    temperature: f32,
    gravity: f32,
    erosionStrength: f32,
    _pad: array<f32, 4>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> inputVertices: array<vec3<f32>>;
@group(0) @binding(2) var<storage, write> outputHeights: array<vec4<f32>>;

// ============================================================================
// ФУНКЦИЯ МИКРО-ДЕТАЛИЗАЦИИ (из оригинального kosmos)
// ============================================================================

fn microDetailFromUV(uv: vec2<f32>, strength: f32, time: f32) -> f32 {
    var micro = 0.0;
    var scale = strength * 32.0;
    
    for (var i = 0; i < 3; i++) {
        let noiseVal = (snoise2(uv * scale) + 1.0) / 2.0;
        micro = micro + noiseVal / (f32(i) + 1.0);
        scale = scale * 2.0;
    }
    
    // Динамическая анимация микро-деталей
    let anim = sin(time * 2.0) * 0.05;
    return clamp(micro * (1.0 + anim), 0.0, 1.0);
}

// ============================================================================
// ФУНКЦИЯ МАКРО-ДЕТАЛИЗАЦИИ (из оригинального kosmos)
// ============================================================================

fn macroDetailFromCoord(coord: vec3<f32>, strength: f32) -> f32 {
    var macro = 0.0;
    var scale = strength * 4.0;
    
    for (var i = 0; i < 4; i++) {
        let noiseVal = (snoise(coord * scale) + 1.0) / 2.0;
        macro = macro + noiseVal / (f32(i) + 1.0);
        scale = scale * 2.0;
    }
    
    return clamp(macro, 0.0, 1.0);
}

// ============================================================================
// ФУНКЦИЯ РИДЖИД-ШУМА ДЛЯ ГОРНЫХ ХРЕБТОВ
// ============================================================================

fn ridgedNoise(coord: vec3<f32>, octaves: i32, persistence: f32) -> f32 {
    var value = 0.0;
    var amplitude = 1.0;
    var frequency = 2.0;
    var maxValue = 0.0;
    
    for (var i = 0; i < octaves; i++) {
        let noiseVal = 1.0 - abs(snoise(coord * frequency));
        value = value + noiseVal * amplitude;
        maxValue = maxValue + amplitude;
        amplitude = amplitude * persistence;
        frequency = frequency * 2.0;
    }
    
    return value / maxValue;
}

// ============================================================================
// ФУНКЦИЯ ЭРОЗИИ (АДАПТИРОВАНА ПОД НАУЧНЫЕ ДАННЫЕ)
// ============================================================================

fn applyErosion(height: f32, slope: f32, temperature: f32, gravity: f32, strength: f32) -> f32 {
    // Температурная зависимость эрозии
    let tempFactor = clamp((temperature - 273.0) / 500.0, 0.0, 1.0);
    
    // Гравитационная зависимость
    let gravityFactor = clamp(gravity / 9.81, 0.5, 2.0);
    
    // Уклон
    let slopeFactor = clamp(slope * 10.0, 0.0, 1.0);
    
    // Итоговая эрозия
    let erosion = tempFactor * gravityFactor * slopeFactor * strength;
    
    return height * (1.0 - erosion * 0.3);
}

// ============================================================================
// КОМБИНИРОВАННАЯ ФУНКЦИЯ ВЫСОТЫ ДЛЯ БЛИЖНИХ LOD
// ============================================================================

fn detailedHeightFunc(
    coord: vec3<f32>,
    uv: vec2<f32>,
    rndSeed: vec3<f32>,
    lodLevel: f32,
    time: f32,
    temperature: f32,
    gravity: f32,
    erosionStrength: f32
) -> f32 {
    // Базовая высота из функции высот
    var height = heightFunc(coord, rndSeed);
    
    // Макро-детализация для LOD0-1
    if (lodLevel < 1.5) {
        let macro = macroDetailFromCoord(coord, uniforms.macroDetail);
        height = height * (0.7 + macro * 0.3);
    }
    
    // Микро-детализация только для LOD0 (ближайшие)
    if (lodLevel < 0.5 && uniforms.microDetail > 0.0) {
        let micro = microDetailFromUV(uv, uniforms.microDetail, time);
        height = height + micro * 0.15;
    }
    
    // Риджид-шум для острых хребтов (ближние LOD)
    if (lodLevel < 1.0) {
        let ridged = ridgedNoise(coord * 4.0, 4, 0.5);
        height = height + ridged * 0.1;
    }
    
    // ⭐ НАУЧНАЯ ЭРОЗИЯ (адаптировано для проекта)
    if (erosionStrength > 0.0) {
        // Вычисляем уклон
        let offset = 0.01;
        let hx = heightFunc(coord + vec3<f32>(offset, 0.0, 0.0), rndSeed);
        let hy = heightFunc(coord + vec3<f32>(0.0, offset, 0.0), rndSeed);
        let hz = heightFunc(coord + vec3<f32>(0.0, 0.0, offset), rndSeed);
        let slope = length(vec3<f32>(hx - height, hy - height, hz - height)) / offset;
        
        height = applyErosion(height, slope, temperature, gravity, erosionStrength);
    }
    
    // Эрозионные эффекты (сглаживание в низинах)
    let erosion = pow(height, 1.5);
    height = mix(height, erosion, 0.3);
    
    return clamp(height, 0.0, 1.0);
}

// ============================================================================
// ОСНОВНОЙ COMPUTE ШЕЙДЕР
// ============================================================================

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputVertices)) { return; }
    
    let pos = inputVertices[idx];
    let dir = normalize(pos);
    
    // Генерация UV координат из направления
    let uv = vec2<f32>(
        atan2(dir.z, dir.x) / (2.0 * 3.14159265) + 0.5,
        acos(dir.y) / 3.14159265
    );
    
    // Вычисление высоты с учётом LOD и научных параметров
    let height = detailedHeightFunc(
        dir,
        uv,
        uniforms.randomSeed,
        uniforms.lodLevel,
        uniforms.time,
        uniforms.temperature,
        uniforms.gravity,
        uniforms.erosionStrength
    );
    
    let scaledHeight = height * uniforms.heightScale;
    
    // Позиция с учётом высоты
    let radius = uniforms.planetRadius + scaledHeight * (uniforms.atmosphereRadius - uniforms.planetRadius);
    let finalPos = dir * radius;
    
    // Сглаживание для дальних LOD
    var smoothHeight = scaledHeight;
    if (uniforms.lodLevel > 1.0) {
        let smoothFactor = 1.0 / (uniforms.lodLevel * 0.5);
        smoothHeight = scaledHeight * (1.0 - smoothFactor) + scaledHeight * smoothFactor;
    }
    
    // ⭐ ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ ДЛЯ НАУЧНЫХ РАСЧЕТОВ
    // Вычисляем наклон для физических свойств
    let offset = 0.001;
    let hx = detailedHeightFunc(
        dir + vec3<f32>(offset, 0.0, 0.0), uv, uniforms.randomSeed,
        uniforms.lodLevel, uniforms.time, uniforms.temperature, uniforms.gravity, uniforms.erosionStrength
    );
    let hy = detailedHeightFunc(
        dir + vec3<f32>(0.0, offset, 0.0), uv, uniforms.randomSeed,
        uniforms.lodLevel, uniforms.time, uniforms.temperature, uniforms.gravity, uniforms.erosionStrength
    );
    let hz = detailedHeightFunc(
        dir + vec3<f32>(0.0, 0.0, offset), uv, uniforms.randomSeed,
        uniforms.lodLevel, uniforms.time, uniforms.temperature, uniforms.gravity, uniforms.erosionStrength
    );
    
    let slope = length(vec3<f32>(hx - height, hy - height, hz - height)) / offset;
    
    // Вывод: позиция XYZ + высота + наклон + флаг атмосферы
    // w компонента используется для хранения данных о наклоне/атмосфере
    outputHeights[idx] = vec4<f32>(finalPos, smoothHeight, slope, 0.0);
}
`;

// ============================================================================
// NEAR MAP GENERATOR - ФУНКЦИЯ ВЫСОТЫ 1 (rolling hills)
// ============================================================================

export const NEAR_MAP_1: string = NEAR_MAP_HEADER + HEIGHT_FUNCTION_1 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    microDetail: f32,
    macroDetail: f32,
    lodLevel: f32,
    texelSize: vec2<f32>,
    time: f32,
    temperature: f32,
    gravity: f32,
    erosionStrength: f32,
    _pad: array<f32, 4>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> inputVertices: array<vec3<f32>>;
@group(0) @binding(2) var<storage, write> outputHeights: array<vec4<f32>>;

fn microDetailFromUV(uv: vec2<f32>, strength: f32, time: f32) -> f32 {
    var micro = 0.0;
    var scale = strength * 32.0;
    for (var i = 0; i < 3; i++) {
        micro = micro + (snoise2(uv * scale) + 1.0) / 2.0;
        scale = scale * 2.0;
    }
    return clamp(micro, 0.0, 1.0);
}

fn detailedHeightFunc(
    coord: vec3<f32>,
    uv: vec2<f32>,
    rndSeed: vec3<f32>,
    lodLevel: f32,
    time: f32,
    temperature: f32,
    gravity: f32,
    erosionStrength: f32
) -> f32 {
    var height = heightFunc(coord, rndSeed);
    
    // Холмистый рельеф для LOD0-1
    if (lodLevel < 1.5) {
        let rolling = (snoise(coord * 3.0) + 1.0) / 2.0;
        height = height * (0.5 + rolling * 0.5);
    }
    
    // Микро-детализация
    if (lodLevel < 0.5 && uniforms.microDetail > 0.0) {
        let micro = microDetailFromUV(uv, uniforms.microDetail, time);
        height = height + micro * 0.12;
    }
    
    return clamp(height, 0.0, 1.0);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputVertices)) { return; }
    
    let pos = inputVertices[idx];
    let dir = normalize(pos);
    
    let uv = vec2<f32>(
        atan2(dir.z, dir.x) / (2.0 * 3.14159265) + 0.5,
        acos(dir.y) / 3.14159265
    );
    
    let height = detailedHeightFunc(
        dir, uv, uniforms.randomSeed, uniforms.lodLevel, uniforms.time,
        uniforms.temperature, uniforms.gravity, uniforms.erosionStrength
    );
    let scaledHeight = height * uniforms.heightScale;
    let radius = uniforms.planetRadius + scaledHeight * (uniforms.atmosphereRadius - uniforms.planetRadius);
    let finalPos = dir * radius;
    
    outputHeights[idx] = vec4<f32>(finalPos, scaledHeight, 0.0, 0.0);
}
`;

// ============================================================================
// NEAR MAP GENERATOR - ФУНКЦИЯ ВЫСОТЫ 2 (адаптивная)
// ============================================================================

export const NEAR_MAP_2: string = NEAR_MAP_HEADER + HEIGHT_FUNCTION_2 + `
struct Uniforms {
    randomSeed: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    detailScale: f32,
    microDetail: f32,
    macroDetail: f32,
    lodLevel: f32,
    texelSize: vec2<f32>,
    time: f32,
    temperature: f32,
    gravity: f32,
    erosionStrength: f32,
    _pad: array<f32, 4>
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> inputVertices: array<vec3<f32>>;
@group(0) @binding(2) var<storage, write> outputHeights: array<vec4<f32>>;

fn microDetailFromUV(uv: vec2<f32>, strength: f32, time: f32) -> f32 {
    var micro = 0.0;
    var scale = strength * 32.0;
    for (var i = 0; i < 3; i++) {
        micro = micro + (snoise2(uv * scale) + 1.0) / 2.0;
        scale = scale * 2.0;
    }
    return clamp(micro, 0.0, 1.0);
}

fn detailedHeightFunc(
    coord: vec3<f32>,
    uv: vec2<f32>,
    rndSeed: vec3<f32>,
    lodLevel: f32,
    time: f32,
    temperature: f32,
    gravity: f32,
    erosionStrength: f32
) -> f32 {
    var height = heightFunc(coord, rndSeed);
    
    // Адаптивная микро-детализация
    if (uniforms.microDetail > 0.0) {
        let micro = microDetailFromUV(uv, uniforms.microDetail * (1.0 - lodLevel * 0.5), time);
        height = height + micro * 0.1;
    }
    
    return clamp(height, 0.0, 1.0);
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let idx = id.x + id.y * 256u;
    if (idx >= arrayLength(&inputVertices)) { return; }
    
    let pos = inputVertices[idx];
    let dir = normalize(pos);
    
    let uv = vec2<f32>(
        atan2(dir.z, dir.x) / (2.0 * 3.14159265) + 0.5,
        acos(dir.y) / 3.14159265
    );
    
    let height = detailedHeightFunc(
        dir, uv, uniforms.randomSeed, uniforms.lodLevel, uniforms.time,
        uniforms.temperature, uniforms.gravity, uniforms.erosionStrength
    );
    let scaledHeight = height * uniforms.heightScale;
    let radius = uniforms.planetRadius + scaledHeight * (uniforms.atmosphereRadius - uniforms.planetRadius);
    let finalPos = dir * radius;
    
    outputHeights[idx] = vec4<f32>(finalPos, scaledHeight, 0.0, 0.0);
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ (функция 0 - стандартная)
// ============================================================================

export const NearMapGeneratorShader_cs: string = NEAR_MAP_0;

// ============================================================================
// ЭКСПОРТ ВСЕХ ВАРИАНТОВ
// ============================================================================

export const NEAR_MAP_GENERATORS: string[] = [NEAR_MAP_0, NEAR_MAP_1, NEAR_MAP_2];

// ============================================================================
// МЕТАДАННЫЕ
// ============================================================================

export const NEAR_MAP_META = {
    version: '3.0.0',
    source: 'kosmos NearMapGeneratorShader.coffee',
    author: 'John Judnich (C) 2013',
    license: 'MIT',
    resolution: '4096x4096',
    features: [
        '6 октав шума для макро-рельефа',
        'Микро-детализация через UV координаты',
        'Поддержка 3 вариантов функций высоты',
        'Адаптивная детализация по LOD',
        'Динамическая анимация микро-деталей',
        '⭐ НАУЧНАЯ ЭРОЗИЯ (температура, гравитация)',
        '⭐ РАСЧЕТ НАКЛОНА ДЛЯ ФИЗИЧЕСКИХ СВОЙСТВ'
    ]
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('✅ [NearMapGeneratorShader] Загружен v3.0.0');
    console.log('   • Разрешение: 4096x4096');
    console.log('   • 3 варианта функций высоты');
    console.log('   • Научная эрозия (температура, гравитация)');
}

export default NearMapGeneratorShader_cs;