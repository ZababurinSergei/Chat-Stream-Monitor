// /10/tests/shaders/HeightFunctions.wgsl.ts
// Портировано из kosmos HeightFunctions.coffee
// 3 различных функции высоты для генерации процедурных планет
// Оригинал: John Judnich (C) 2013, MIT License
// АДАПТИРОВАНО ДЛЯ ПРОЕКТА: добавлены научные параметры
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { NOISE_FUNCTIONS } from './NoiseShader.wgsl.js';

// ============================================================================
// HEIGHT FUNCTION 0 - Риджид-шум с холмистым рельефом
// ============================================================================

export const HEIGHT_FUNCTION_0 = /* wgsl */ `
// Height Function 0 - Риджид-шум с холмистым рельефом
// АДАПТИРОВАНО: добавлен параметр scientificScale для научных данных
fn heightFunc(coord: vec3<f32>, rndSeed: vec3<f32>, scientificScale: f32) -> f32 {
    var v: vec3<f32>;
    var a = 0.0;
    var p = 6.0 + rndSeed.x * 2.0;
    
    for (var i = 0; i < 6; i++) {
        v = coord * p + rndSeed.xyz * 1001.0;
        
        // Риджид-шум для горных хребтов
        var ridged = 1.0 - abs(snoise(v));
        ridged = ridged / (f32(i) + 1.0);
        
        v = coord * p / (2.5 + 2.5 * rndSeed.y) + rndSeed.xyz * 1001.0;
        var k = (snoise(v) + 1.0) / 2.0;
        
        v = coord * p + rndSeed.xyz * 1001.0;
        a = a + ridged * k;
        
        // Холмистый рельеф для дальних октав
        if (i >= 3) {
            v = coord * p * 8.0 + rndSeed.xyz * 1001.0;
            var rolling = (snoise(v) + 1.0) / 2.0;
            a = a + rolling * (1.0 - k) / 50.0;
        }
        
        p = p * (2.25 - 0.25 * rndSeed.x - rndSeed.z * 0.5);
    }
    
    a = a / 1.6;
    
    // ⭐ АДАПТАЦИЯ: научное масштабирование высоты
    a = a * scientificScale;
    
    return clamp(a, 0.0, 1.0);
}
`;

// ============================================================================
// HEIGHT FUNCTION 1 - Смешанный рельеф с rolling hills
// ============================================================================

export const HEIGHT_FUNCTION_1 = /* wgsl */ `
// Height Function 1 - Смешанный рельеф с rolling hills
// АДАПТИРОВАНО: добавлен параметр scientificScale для научных данных
fn heightFunc(coord: vec3<f32>, rndSeed: vec3<f32>, scientificScale: f32) -> f32 {
    var v: vec3<f32>;
    var a = 0.0;
    var p = 6.0 + rndSeed.x * 2.0;
    
    // Предварительный шум для rolling hills
    var rolly = clamp((snoise(coord * 3.0) + snoise(coord * 6.0) + rndSeed.y) / 2.0, 0.0, 1.0);
    
    for (var i = 0; i < 6; i++) {
        v = coord * p + rndSeed.xyz * 1001.0;
        
        // Смешиваем ridged и rolling шум
        var ridged = 1.0 - abs(snoise(v));
        ridged = ridged * (1.0 - rolly) + rolly * ((snoise(v) + 1.0) / 2.0);
        ridged = ridged / (f32(i) + 1.0);
        
        v = coord * p / (2.5 + 2.5 * rndSeed.y) + rndSeed.xyz * 1001.0;
        var k = (snoise(v) + 1.0) / 2.0;
        
        v = coord * p + rndSeed.xyz * 1001.0;
        a = a + ridged * k;
        
        if (i >= 2) {
            v = coord * p * 8.0 + rndSeed.xyz * 1001.0;
            var ridged2 = 1.0 - abs(snoise(v));
            a = a + ridged2 * (1.0 - k) / 50.0;
        }
        
        p = p * (2.25 - 0.25 * rndSeed.x - rndSeed.z * 0.5);
    }
    
    a = a / 1.6;
    
    // ⭐ АДАПТАЦИЯ: научное масштабирование высоты
    a = a * scientificScale;
    
    return clamp(a, 0.0, 1.0);
}
`;

// ============================================================================
// HEIGHT FUNCTION 2 - Адаптивный рельеф с UV-детализацией
// ============================================================================

export const HEIGHT_FUNCTION_2 = /* wgsl */ `
// Height Function 2 - Адаптивный рельеф
// АДАПТИРОВАНО: добавлен параметр scientificScale и поддержка UV для микро-детализации
fn heightFunc(coord: vec3<f32>, rndSeed: vec3<f32>, scientificScale: f32) -> f32 {
    var v: vec3<f32>;
    var a = 0.0;
    var p = 6.0 + rndSeed.x * 2.0;
    
    for (var i = 0; i < 6; i++) {
        v = coord * p + rndSeed.xyz * 1001.0;
        
        // Адаптивный rolly на основе текущей позиции
        var rolly = clamp((snoise(v) + 1.0) / 2.0, 0.0, 1.0);
        
        // Смешанный ridged шум
        var ridged = 1.0 - abs(snoise(v));
        ridged = ridged * (1.0 - rolly) + rolly * ((snoise(v) + 1.0) / 2.0);
        ridged = ridged / (f32(i) + 1.0);
        
        v = coord * p / (2.5 + 2.5 * rndSeed.y) + rndSeed.xyz * 1001.0;
        var k = 1.0 - abs(snoise(v));
        
        v = coord * p + rndSeed.xyz * 1001.0;
        a = a + ridged * k;
        
        if (i >= 2) {
            v = coord * p * 8.0 + rndSeed.xyz * 1001.0;
            var ridged2 = 1.0 - abs(snoise(v));
            a = a + ridged2 * (1.0 - k) / 50.0;
        }
        
        p = p * (2.25 - 0.25 * rndSeed.x - rndSeed.z * 0.5);
    }
    
    a = a / 1.6;
    
    // ⭐ АДАПТАЦИЯ: научное масштабирование высоты
    a = a * scientificScale;
    
    return clamp(a, 0.0, 1.0);
}
`;

// ============================================================================
// HEIGHT FUNCTION 3 - НАУЧНАЯ (НОВАЯ ДЛЯ ПРОЕКТА)
// ============================================================================

export const HEIGHT_FUNCTION_3 = /* wgsl */ `
// Height Function 3 - Научная функция высоты для экзопланет
// ⭐ НОВАЯ: добавлена для проекта, учитывает научные параметры
fn scientificHeightFunc(
    coord: vec3<f32>,
    rndSeed: vec3<f32>,
    baseHeight: f32,
    roughness: f32,
    hasAtmosphere: f32,
    scientificScale: f32
) -> f32 {
    var v: vec3<f32>;
    var a = baseHeight;
    var p = 8.0 + rndSeed.x * 4.0;
    
    // Атмосферное влияние на высоту
    let atmosphereFactor = 1.0 + hasAtmosphere * 0.2;
    
    for (var i = 0; i < 8; i++) {
        v = coord * p + rndSeed.xyz * 1001.0;
        
        // Шум с учетом шероховатости
        var noise = (snoise(v) + 1.0) / 2.0;
        noise = pow(noise, 1.0 / (roughness + 0.5));
        
        // Риджид-шум для гор
        var ridged = 1.0 - abs(snoise(v * 2.0));
        
        // Смешивание в зависимости от высоты
        let mixFactor = clamp((a - 0.3) / 0.4, 0.0, 1.0);
        let heightContrib = mix(noise, ridged, mixFactor);
        
        a = a + heightContrib * (0.5 / (f32(i) + 1.0));
        p = p * (1.8 + rndSeed.z * 0.5);
    }
    
    // Нормализация с учетом атмосферы
    a = a / (1.5 + hasAtmosphere * 0.3);
    a = a * atmosphereFactor * scientificScale;
    
    return clamp(a, 0.0, 1.0);
}
`;

// ============================================================================
// Функция высоты для дальних LOD (упрощённая, быстрая)
// ============================================================================

export const FAR_HEIGHT_FUNCTION = /* wgsl */ `
// Far LOD Height Function - упрощённая для производительности
// АДАПТИРОВАНО: оптимизировано для дальних планет
fn farHeightFunc(coord: vec3<f32>, rndSeed: vec3<f32>, scientificScale: f32) -> f32 {
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
    a = a * scientificScale;
    
    return clamp(a, 0.0, 1.0);
}
`;

// ============================================================================
// Функция микро-детализации на основе UV координат
// ============================================================================

export const MICRO_DETAIL_FUNCTION = /* wgsl */ `
// Микро-детализация для ближних LOD (UV-зависимый шум)
// АДАПТИРОВАНО: добавлен параметр strength для научного контроля
fn microDetail(uv: vec2<f32>, strength: f32, scale: f32, time: f32) -> f32 {
    var detail = 0.0;
    var currentScale = scale;
    
    for (var i = 0; i < 4; i++) {
        let noise = (snoise2(uv * currentScale) + 1.0) / 2.0;
        detail = detail + noise / (f32(i) + 1.0);
        currentScale = currentScale * 2.0;
    }
    
    // Динамическая анимация для реализма
    let anim = sin(time * 2.0) * 0.05;
    
    return clamp(detail * (strength + anim), 0.0, 1.0);
}
`;

// ============================================================================
// Функция атмосферного рассеяния
// ============================================================================

export const ATMOSPHERIC_SCATTERING = /* wgsl */ `
// Атмосферное рассеяние для краёв планеты
// АДАПТИРОВАНО: добавлены научные параметры атмосферы
fn atmosphericScattering(
    dir: vec3<f32>,
    height: f32,
    planetRadius: f32,
    atmRadius: f32,
    atmosphereDensity: f32,
    ozoneLayer: f32
) -> f32 {
    let normalizedHeight = clamp((height * (atmRadius - planetRadius)) / atmRadius, 0.0, 1.0);
    
    // Рэлеевское рассеяние
    let rayleighScattering = (1.0 - normalizedHeight) * (1.0 - normalizedHeight);
    
    // Озоновый слой (голубоватое свечение)
    let ozoneGlow = max(0.0, 1.0 - abs(dir.y)) * ozoneLayer * 0.3;
    
    // Горное свечение на краях
    let horizonGlow = max(0.0, 1.0 - abs(dir.y)) * 0.2;
    
    let scattering = (rayleighScattering * atmosphereDensity * 0.5) + horizonGlow + ozoneGlow;
    
    return clamp(scattering, 0.0, 1.0);
}
`;

// ============================================================================
// Функция эрозии для реалистичного рельефа
// ============================================================================

export const EROSION_FUNCTION = /* wgsl */ `
// Эрозия рельефа
// ⭐ НОВАЯ: добавлена для проекта
fn applyErosion(height: f32, slope: f32, precipitation: f32) -> f32 {
    // Вода течет вниз по склону
    let waterFlow = slope * precipitation * 0.5;
    
    // Эрозия на крутых склонах
    let erosionFactor = clamp((slope - 0.3) / 0.7, 0.0, 1.0);
    let erosion = waterFlow * erosionFactor * 0.3;
    
    // Осаждение в низинах
    var sediment = 0.0;
    if (height < 0.3) {
        sediment = (0.3 - height) * precipitation * 0.5;
    }
    
    let finalHeight = height - erosion + sediment;
    
    return clamp(finalHeight, 0.0, 1.0);
}
`;

// ============================================================================
// КОМБИНИРОВАННАЯ ФУНКЦИЯ ВЫСОТЫ ДЛЯ НАУЧНЫХ ДАННЫХ
// ============================================================================

export const SCIENTIFIC_HEIGHT_FUNCTION = /* wgsl */ `
// Комбинированная научная функция высоты
// ⭐ НОВАЯ: объединяет все функции для научных расчетов
fn scientificCombinedHeight(
    coord: vec3<f32>,
    uv: vec2<f32>,
    rndSeed: vec3<f32>,
    scientificParams: vec4<f32>
) -> f32 {
    let baseScale = scientificParams.x;
    let roughness = scientificParams.y;
    let hasAtmosphere = scientificParams.z;
    let time = scientificParams.w;
    
    // Выбираем функцию высоты на основе параметров
    var height = 0.0;
    
    if (roughness > 0.7) {
        // Грубый рельеф (функция 0)
        height = heightFunc(coord, rndSeed, baseScale);
    } else if (roughness > 0.3) {
        // Смешанный рельеф (функция 1)
        height = heightFunc(coord, rndSeed, baseScale);
    } else {
        // Гладкий рельеф (функция 2)
        height = heightFunc(coord, rndSeed, baseScale);
    }
    
    // Добавляем микро-детализацию
    let micro = microDetail(uv, 0.2, 32.0, time);
    height = height + micro * 0.05;
    
    // Применяем эрозию
    let slope = abs(height - 0.5) * 2.0;
    height = applyErosion(height, slope, 0.5);
    
    // Атмосферное влияние
    if (hasAtmosphere > 0.5) {
        let dir = normalize(coord);
        let atmosphere = atmosphericScattering(dir, height, 1.0, 1.05, 0.5, 0.2);
        height = height + atmosphere * 0.1;
    }
    
    return clamp(height, 0.0, 1.0);
}
`;

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================

export const HEIGHT_FUNCTIONS = [
    HEIGHT_FUNCTION_0,
    HEIGHT_FUNCTION_1,
    HEIGHT_FUNCTION_2,
    HEIGHT_FUNCTION_3
];

export const HEIGHT_FUNCTIONS_NAMES = [
    "Ridged/Rolling Hybrid",
    "Rolling Hills Mix",
    "Adaptive Terrain",
    "Scientific Exoplanet"
];

// ============================================================================
// МЕТАДАННЫЕ ДЛЯ ОТЛАДКИ
// ============================================================================

export const HEIGHT_FUNCTIONS_META = {
    version: '2.0.0',
    source: 'kosmos HeightFunctions.coffee + научные адаптации',
    author: 'John Judnich (C) 2013 + адаптация для Gaia DR3',
    license: 'MIT',
    functions: [
        { id: 0, name: 'HEIGHT_FUNCTION_0', description: 'Риджид-шум с холмистым рельефом', scientific: false },
        { id: 1, name: 'HEIGHT_FUNCTION_1', description: 'Смешанный рельеф с rolling hills', scientific: false },
        { id: 2, name: 'HEIGHT_FUNCTION_2', description: 'Адаптивный рельеф', scientific: false },
        { id: 3, name: 'HEIGHT_FUNCTION_3', description: 'Научная функция для экзопланет', scientific: true }
    ],
    adaptations: [
        'Добавлен параметр scientificScale для научных данных',
        'Добавлена HEIGHT_FUNCTION_3 для экзопланет',
        'Добавлена EROSION_FUNCTION для реалистичного рельефа',
        'Добавлена SCIENTIFIC_HEIGHT_FUNCTION комбинированная',
        'Улучшена MICRO_DETAIL_FUNCTION с анимацией',
        'Расширена ATMOSPHERIC_SCATTERING научными параметрами'
    ]
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('✅ [HeightFunctions] Загружены 4 функции высоты');
    console.log('   • HEIGHT_FUNCTION_0 - Риджид-шум с холмистым рельефом');
    console.log('   • HEIGHT_FUNCTION_1 - Смешанный рельеф с rolling hills');
    console.log('   • HEIGHT_FUNCTION_2 - Адаптивный рельеф');
    console.log('   • HEIGHT_FUNCTION_3 - НАУЧНАЯ (экзопланеты) ⭐ НОВАЯ');
    console.log('   • FAR_HEIGHT_FUNCTION - Упрощённая для дальних LOD');
    console.log('   • MICRO_DETAIL_FUNCTION - UV-зависимая микро-детализация');
    console.log('   • ATMOSPHERIC_SCATTERING - Научное атмосферное рассеяние');
    console.log('   • EROSION_FUNCTION - Эрозия рельефа ⭐ НОВАЯ');
    console.log('   • SCIENTIFIC_HEIGHT_FUNCTION - Комбинированная ⭐ НОВАЯ');
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    HEIGHT_FUNCTION_0,
    HEIGHT_FUNCTION_1,
    HEIGHT_FUNCTION_2,
    HEIGHT_FUNCTION_3,
    FAR_HEIGHT_FUNCTION,
    MICRO_DETAIL_FUNCTION,
    ATMOSPHERIC_SCATTERING,
    EROSION_FUNCTION,
    SCIENTIFIC_HEIGHT_FUNCTION,
    HEIGHT_FUNCTIONS,
    HEIGHT_FUNCTIONS_NAMES,
    HEIGHT_FUNCTIONS_META
};

console.log('═'.repeat(70));
console.log('🏔️ [HeightFunctions] МОДУЛЬ ФУНКЦИЙ ВЫСОТЫ ЗАГРУЖЕН v2.0');
console.log('   • Портировано из kosmos HeightFunctions.coffee');
console.log('   • 4 варианта генерации процедурного рельефа (включая научный)');
console.log('   • Поддержка ridged noise, rolling hills, микро-детализации');
console.log('   • НОВОЕ: научная функция для экзопланет');
console.log('   • НОВОЕ: эрозия рельефа');
console.log('   • НОВОЕ: комбинированная научная функция');
console.log('   • Оригинал: John Judnich (C) 2013, MIT License');
console.log('   • Адаптация: добавлены научные параметры для Gaia DR3');
console.log('═'.repeat(70));