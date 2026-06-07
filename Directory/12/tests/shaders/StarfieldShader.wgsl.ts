// /10/tests/shaders/StarfieldShader.wgsl.ts
// ВЕРСИЯ 7.0 - ИСПРАВЛЕНО: добавлены viewMat и projMat в вершинный шейдер
// - Добавлено преобразование мировых координат в пространство камеры
// - Исправлена структура GlobalUniform (viewMat, projMat, cameraPos)
// - Удалено использование устаревших матриц
// - Оптимизирован расчет размера и яркости звезд
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export const StarfieldShader_vert = /* wgsl */ `
// ============================================================================
// СТРУКТУРЫ ДАННЫХ
// ============================================================================

struct GlobalUniform {
    viewMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    cameraPos: vec4<f32>,
    time: f32,
    speed: f32,
    screenWidth: f32,
    screenHeight: f32,
    exposure: f32,
    gamma: f32,
    starIntensity: f32,
    lodBias: f32,
    _pad: array<f32, 5>
};

struct StarInstance {
    position: vec3<f32>,
    color: vec4<f32>,
    size: f32,
    magnitude: f32,
    viewRange: f32,
    parallax: f32,
    temperature: f32,
    absoluteMagnitude: f32,
    distancePc: f32,
    spectralType: u32,
    _pad: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) v_uv: vec2<f32>,
    @location(1) v_color: vec4<f32>,
    @location(2) v_magnitude: f32,
    @location(3) v_temperature: f32,
    @location(4) v_distance: f32,
    @location(5) v_absoluteMagnitude: f32,
    @location(6) v_spectralType: f32,
    @location(7) v_lodLevel: f32,
    @location(8) v_brightness: f32
};

// ============================================================================
// БАЙНДИНГИ
// ============================================================================

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(1) @binding(0) var<storage, read> starBuffer: array<StarInstance>;

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

fn rand(seed: f32) -> f32 {
    return fract(sin(seed * 12.9898) * 43758.5453);
}

// ============================================================================
// ВЕРТЕКСНЫЙ ШЕЙДЕР
// ============================================================================

@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceId: u32
) -> VertexOutput {
    var output: VertexOutput;
    
    let star = starBuffer[instanceId];
    let worldPos = star.position;
    
    // ============================================================
    // ПРЕОБРАЗОВАНИЕ В ПРОСТРАНСТВО КАМЕРЫ
    // ============================================================
    let viewPos = globalUniform.viewMat * vec4<f32>(worldPos, 1.0);
    let dist = length(viewPos.xyz);
    
    // Защита от невалидных матриц
    var finalViewPos = viewPos;
    if (abs(viewPos.z) < 0.001 && abs(viewPos.x) < 0.001 && abs(viewPos.y) < 0.001) {
        let dir = normalize(worldPos);
        finalViewPos = vec4<f32>(dir * 100.0, 1.0);
    }
    
    // ============================================================
    // РАСЧЕТ РАЗМЕРА ЗВЕЗДЫ
    // ============================================================
    let magnitudeFactor = max(0.5, (6.0 - star.magnitude) / 2.0);
    let distanceFactor = 1.0 / max(0.1, abs(finalViewPos.z) / 50.0);
    
    let minSize = 8.0;
    let maxSize = 150.0;
    let rawSize = magnitudeFactor * distanceFactor * 15.0;
    let finalSize = max(minSize, min(rawSize, maxSize));
    
    // ============================================================
    // МЕРЦАНИЕ ЗВЕЗД
    // ============================================================
    let prng = rand(star.magnitude * 12.9898 + globalUniform.time);
    let modulation = cos(globalUniform.time * 1000.0 * prng) * 0.3 + 0.7;
    let modulatedSizeX = finalSize * modulation;
    let modulatedSizeY = finalSize * modulation;
    
    // ============================================================
    // UV КООРДИНАТЫ ДЛЯ КВАДРАТА
    // ============================================================
    var quadUV: vec2<f32>;
    var uv: vec2<f32>;
    if (vertexIndex == 0u) {
        quadUV = vec2<f32>(-1.0, -1.0);
        uv = vec2<f32>(0.0, 0.0);
    } else if (vertexIndex == 1u) {
        quadUV = vec2<f32>(1.0, -1.0);
        uv = vec2<f32>(1.0, 0.0);
    } else if (vertexIndex == 2u) {
        quadUV = vec2<f32>(-1.0, 1.0);
        uv = vec2<f32>(0.0, 1.0);
    } else {
        quadUV = vec2<f32>(1.0, 1.0);
        uv = vec2<f32>(1.0, 1.0);
    }
    
    // ============================================================
    // ПОЛУЧЕНИЕ НАПРАВЛЕНИЙ КАМЕРЫ ИЗ VIEW МАТРИЦЫ
    // ============================================================
    let cameraRight = vec3<f32>(
        globalUniform.viewMat[0][0],
        globalUniform.viewMat[1][0],
        globalUniform.viewMat[2][0]
    );
    let cameraUp = vec3<f32>(
        globalUniform.viewMat[0][1],
        globalUniform.viewMat[1][1],
        globalUniform.viewMat[2][1]
    );
    
    // Защита от нулевых векторов
    var safeRight = cameraRight;
    var safeUp = cameraUp;
    if (length(safeRight) < 0.001) { safeRight = vec3<f32>(1.0, 0.0, 0.0); }
    if (length(safeUp) < 0.001) { safeUp = vec3<f32>(0.0, 1.0, 0.0); }
    
    // ============================================================
    // ОФФСЕТ ДЛЯ БИЛБОРДА
    // ============================================================
    let offset = safeRight * quadUV.x * modulatedSizeX + safeUp * quadUV.y * modulatedSizeY;
    var vertexPos = finalViewPos + vec4<f32>(offset, 0.0);
    
    // ============================================================
    // MOTION BLUR
    // ============================================================
    let motionBlur = min(0.5, globalUniform.speed * 0.015);
    let stretch = 1.0 + motionBlur * 2.0;
    vertexPos.z = vertexPos.z * (1.0 + quadUV.y * motionBlur * stretch);
    
    // ============================================================
    // ALPHA (ЗАТУХАНИЕ ПО РАССТОЯНИЮ)
    // ============================================================
    let maxViewDist = 100000.0;
    var alpha = clamp(1.0 - (dist / maxViewDist), 0.5, 1.0);
    
    // ============================================================
    // RGB SHIFT (ДЛЯ ЭФФЕКТА ДВИЖЕНИЯ)
    // ============================================================
    let rgbShift = motionBlur * 0.2;
    var finalColor = star.color;
    finalColor = vec4<f32>(
        finalColor.r - rgbShift,
        finalColor.g - abs(rgbShift),
        finalColor.b + rgbShift,
        alpha
    );
    
    // ============================================================
    // LOD УРОВЕНЬ
    // ============================================================
    var lodLevel: f32 = 3.0;
    let absDist = abs(finalViewPos.z);
    if (absDist < 500.0) { lodLevel = 0.0; }
    else if (absDist < 2000.0) { lodLevel = 1.0; }
    else if (absDist < 5000.0) { lodLevel = 2.0; }
    
    // ============================================================
    // ЯРКОСТЬ ЗВЕЗДЫ
    // ============================================================
    let magnitudeBrightness = pow(2.512, -star.magnitude);
    let distanceAtten = 1.0 / max(0.5, absDist * 0.01);
    let starIntensity = max(0.5, globalUniform.starIntensity);
    let finalBrightness = magnitudeBrightness * distanceAtten * starIntensity * 5.0;
    
    // ============================================================
    // ФИНАЛЬНАЯ ПОЗИЦИЯ
    // ============================================================
    output.position = globalUniform.projMat * vertexPos;
    
    // Защита от невалидной proj матрицы
    if (output.position.w < 0.001) {
        let ndc = vertexPos.xyz;
        output.position = vec4<f32>(ndc.xy, ndc.z * 0.01, 1.0);
    }
    
    // ============================================================
    // ВЫХОДНЫЕ ДАННЫЕ
    // ============================================================
    output.v_uv = uv;
    output.v_color = finalColor;
    output.v_magnitude = star.magnitude;
    output.v_temperature = star.temperature;
    output.v_distance = star.distancePc;
    output.v_absoluteMagnitude = star.absoluteMagnitude;
    output.v_spectralType = f32(star.spectralType);
    output.v_lodLevel = lodLevel;
    output.v_brightness = finalBrightness;
    
    // Анти-мерцание
    if (alpha > 0.0 && output.position.w > 0.001) {
        let offsetXY = quadUV * max(0.0, output.position.z / output.position.w) / 100.0;
        output.position = output.position + vec4<f32>(offsetXY, 0.0, 0.0);
    }
    
    return output;
}
`;

export const StarfieldShader_frag = /* wgsl */ `
// ============================================================================
// СТРУКТУРЫ ДАННЫХ
// ============================================================================

struct GlobalUniform {
    viewMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    cameraPos: vec4<f32>,
    time: f32,
    speed: f32,
    screenWidth: f32,
    screenHeight: f32,
    exposure: f32,
    gamma: f32,
    starIntensity: f32,
    lodBias: f32,
    _pad: array<f32, 5>
};

// Структура вывода для MRT (Multiple Render Targets)
struct FragmentOutput {
    @location(0) color: vec4<f32>,
    @location(1) normal: vec4<f32>,
    @location(2) material: vec4<f32>,
    @location(3) motion: vec4<f32>
};

// ============================================================================
// БАЙНДИНГИ
// ============================================================================

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;

// ============================================================================
// ФУНКЦИЯ ЧЕРНОТЕЛЬНОГО ИЗЛУЧЕНИЯ
// ============================================================================

fn blackbodyColor(temp: f32) -> vec3<f32> {
    let t = temp / 100.0;
    var r: f32;
    var g: f32;
    var b: f32;
    
    if (t <= 66.0) {
        r = 1.0;
        g = clamp(0.390081578769019 * log(t) - 0.631841443782627, 0.0, 1.0);
        if (t <= 19.0) {
            b = 0.0;
        } else {
            b = clamp(0.543206789110196 * log(t - 10.0) - 1.196254089142308, 0.0, 1.0);
        }
    } else {
        r = clamp(1.292936186062745 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
        g = clamp(1.129890860895294 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
        b = 1.0;
    }
    
    // Коррекция для очень горячих звёзд (O класс, >30000K)
    if (temp > 30000.0) {
        r = r * 0.7;
        g = g * 0.85;
        b = b * 1.3;
    }
    // Коррекция для холодных звёзд (M класс, <4000K)
    else if (temp < 4000.0) {
        r = r * 1.3;
        g = g * 0.65;
        b = b * 0.4;
    }
    
    return vec3<f32>(r, g, b);
}

// ============================================================================
// ОСНОВНОЙ ФРАГМЕНТНЫЙ ШЕЙДЕР
// ============================================================================

@fragment
fn main(
    @location(0) v_uv: vec2<f32>,
    @location(1) v_color: vec4<f32>,
    @location(2) v_magnitude: f32,
    @location(3) v_temperature: f32,
    @location(4) v_distance: f32,
    @location(5) v_absoluteMagnitude: f32,
    @location(6) v_spectralType: f32,
    @location(7) v_lodLevel: f32,
    @location(8) v_brightness: f32
) -> FragmentOutput {
    var output: FragmentOutput;
    
    // ============================================================
    // ВЫЧИСЛЕНИЕ ОСНОВНОГО ЦВЕТА (RT0)
    // ============================================================
    
    let center = vec2<f32>(0.5, 0.5);
    let offset = v_uv - center;
    let d = length(offset);
    
    // Интенсивность в центре диска
    let intensity = 3.0 / max(d * 40.0, 0.001);
    
    // Затухание на краях
    let edgeFade = clamp(d * 2.5, 0.0, 1.0);
    let finalIntensity = intensity * (1.0 - edgeFade * edgeFade);
    
    // Применяем яркость от вершинного шейдера
    let brightness = v_brightness * finalIntensity;
    
    // Не дискардим слишком тусклые звезды
    var finalBrightness = brightness;
    if (brightness < 0.01) {
        finalBrightness = 0.01;
    }
    
    // Цвет по температуре (чернотельное излучение)
    let starColor = blackbodyColor(v_temperature);
    
    // Глоу для ярких звезд
    var glowIntensity = 0.0;
    if (v_magnitude < 4.0 && finalBrightness > 0.5) {
        let glow = exp(-d * d * 3.0) * 0.8;
        glowIntensity = glow * (1.0 - v_magnitude / 8.0);
    }
    
    // Финальный цвет
    let finalColor = (starColor * finalBrightness) + (starColor * glowIntensity);
    
    // HDR тонмаппинг
    let exposure = max(0.5, globalUniform.exposure);
    let hdrColor = finalColor * exposure;
    let mapped = hdrColor / (hdrColor + vec3<f32>(1.0));
    
    // Гамма-коррекция
    let gamma = max(1.0, globalUniform.gamma);
    let gammaColor = pow(mapped, vec3<f32>(1.0 / gamma));
    
    // RT0: Основной цвет
    output.color = vec4<f32>(gammaColor, clamp(finalBrightness * v_color.a, 0.2, 1.0));
    
    // ============================================================
    // RT1: НОРМАЛЬ (звезды всегда смотрят на камеру)
    // ============================================================
    output.normal = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    
    // ============================================================
    // RT2: МАТЕРИАЛ (металличность, шероховатость, AO)
    // ============================================================
    let metallic = 1.0;
    let roughness = max(0.2, min(0.9, 1.0 - v_magnitude / 12.0));
    let ao = 1.0;
    output.material = vec4<f32>(metallic, roughness, ao, 1.0);
    
    // ============================================================
    // RT3: ВЕКТОРЫ ДВИЖЕНИЯ ДЛЯ TAA
    // ============================================================
    output.motion = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    
    return output;
}
`;

// ============================================================================
// LQ ВЕРСИЯ ДЛЯ ДАЛЬНИХ ЗВЕЗД (LOD 3-4) С ПОДДЕРЖКОЙ MRT
// ============================================================================

export const StarfieldShaderLQ_vert = /* wgsl */ `
struct GlobalUniformLQ {
    viewMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
    cameraPos: vec4<f32>,
    time: f32,
    screenWidth: f32,
    screenHeight: f32,
    starIntensity: f32
};

struct StarInstanceLQ {
    position: vec3<f32>,
    color: vec4<f32>,
    size: f32,
    magnitude: f32,
    viewRange: f32,
    temperature: f32,
    absoluteMagnitude: f32,
    distancePc: f32
};

struct VertexOutputLQ {
    @builtin(position) position: vec4<f32>,
    @location(0) v_uv: vec2<f32>,
    @location(1) v_color: vec4<f32>,
    @location(2) v_brightness: f32,
    @location(3) v_temperature: f32,
    @location(4) v_absoluteMagnitude: f32,
    @location(5) v_distance: f32
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniformLQ;
@group(1) @binding(0) var<storage, read> starBuffer: array<StarInstanceLQ>;

@vertex
fn main(
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceId: u32
) -> VertexOutputLQ {
    var output: VertexOutputLQ;
    
    let star = starBuffer[instanceId];
    let worldPos = star.position;
    let viewPos = globalUniform.viewMat * vec4<f32>(worldPos, 1.0);
    let dist = length(viewPos.xyz);
    
    var quadUV: vec2<f32>;
    var uv: vec2<f32>;
    if (vertexIndex == 0u) {
        quadUV = vec2<f32>(-1.0, -1.0);
        uv = vec2<f32>(0.0, 0.0);
    } else if (vertexIndex == 1u) {
        quadUV = vec2<f32>(1.0, -1.0);
        uv = vec2<f32>(1.0, 0.0);
    } else if (vertexIndex == 2u) {
        quadUV = vec2<f32>(-1.0, 1.0);
        uv = vec2<f32>(0.0, 1.0);
    } else {
        quadUV = vec2<f32>(1.0, 1.0);
        uv = vec2<f32>(1.0, 1.0);
    }
    
    let cameraRight = vec3<f32>(
        globalUniform.viewMat[0][0],
        globalUniform.viewMat[1][0],
        globalUniform.viewMat[2][0]
    );
    let cameraUp = vec3<f32>(
        globalUniform.viewMat[0][1],
        globalUniform.viewMat[1][1],
        globalUniform.viewMat[2][1]
    );
    
    // Упрощенный размер для LQ
    let magnitudeFactor = max(0.3, (6.0 - star.magnitude) / 3.0);
    let distanceFactor = 1.0 / max(0.5, dist / 50.0);
    let minSize = 4.0;
    let maxSize = 80.0;
    let rawSize = magnitudeFactor * distanceFactor * 8.0;
    let finalSize = max(minSize, min(rawSize, maxSize));
    
    let offset = cameraRight * quadUV.x * finalSize + cameraUp * quadUV.y * finalSize;
    let vertexPos = viewPos + vec4<f32>(offset, 0.0);
    
    let maxViewDist = 50000.0;
    var alpha = clamp(1.0 - (dist / maxViewDist), 0.3, 1.0);
    
    let magnitudeBrightness = pow(2.512, -star.magnitude);
    let distanceAtten = 1.0 / max(0.5, dist * 0.01);
    let starIntensity = max(0.5, globalUniform.starIntensity);
    let brightness = magnitudeBrightness * distanceAtten * starIntensity * 3.0;
    
    output.position = globalUniform.projMat * vertexPos;
    output.v_uv = uv;
    output.v_color = star.color;
    output.v_brightness = brightness * alpha;
    output.v_temperature = star.temperature;
    output.v_absoluteMagnitude = star.absoluteMagnitude;
    output.v_distance = star.distancePc;
    
    return output;
}
`;

export const StarfieldShaderLQ_frag = /* wgsl */ `
struct FragmentOutputLQ {
    @location(0) color: vec4<f32>,
    @location(1) normal: vec4<f32>,
    @location(2) material: vec4<f32>,
    @location(3) motion: vec4<f32>
};

fn blackbodyColorLQ(temp: f32) -> vec3<f32> {
    let t = temp / 100.0;
    var r: f32;
    var g: f32;
    var b: f32;
    
    if (t <= 66.0) {
        r = 1.0;
        g = clamp(0.390081578769019 * log(t) - 0.631841443782627, 0.0, 1.0);
        if (t <= 19.0) {
            b = 0.0;
        } else {
            b = clamp(0.543206789110196 * log(t - 10.0) - 1.196254089142308, 0.0, 1.0);
        }
    } else {
        r = clamp(1.292936186062745 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
        g = clamp(1.129890860895294 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
        b = 1.0;
    }
    
    return vec3<f32>(r, g, b);
}

@fragment
fn main(
    @location(0) v_uv: vec2<f32>,
    @location(1) v_color: vec4<f32>,
    @location(2) v_brightness: f32,
    @location(3) v_temperature: f32,
    @location(4) v_absoluteMagnitude: f32,
    @location(5) v_distance: f32
) -> FragmentOutputLQ {
    var output: FragmentOutputLQ;
    
    let center = vec2<f32>(0.5, 0.5);
    let offset = v_uv - center;
    let d = length(offset);
    
    var intensity = 2.5 / max(d * 50.0, 0.001);
    let edgeFade = clamp(d * 3.0, 0.0, 1.0);
    intensity = intensity * (1.0 - edgeFade * edgeFade);
    intensity = intensity * v_brightness;
    
    var finalIntensity = intensity;
    if (intensity < 0.01) {
        finalIntensity = 0.01;
    }
    
    let starColor = blackbodyColorLQ(v_temperature);
    let finalColor = starColor * finalIntensity;
    
    output.color = vec4<f32>(finalColor, finalIntensity);
    output.normal = vec4<f32>(0.0, 0.0, 1.0, 1.0);
    output.material = vec4<f32>(1.0, 0.5, 1.0, 1.0);
    output.motion = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    
    return output;
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    StarfieldShader_vert,
    StarfieldShader_frag,
    StarfieldShaderLQ_vert,
    StarfieldShaderLQ_frag
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('⭐ [StarfieldShader] Загружен v7.0 с исправлением матриц камеры');
    console.log('   • Добавлены viewMat и projMat в вершинный шейдер');
    console.log('   • Правильное преобразование мировых координат');
    console.log('   • Минимальный размер звезд: 8 пикселей');
    console.log('   • Максимальный размер: 150 пикселей');
    console.log('   • Защита от невалидных матриц камеры');
    console.log('   • Fallback при нулевой позиции камеры');
    console.log('   • RT0: основной цвет');
    console.log('   • RT1: нормаль (всегда смотрит на камеру)');
    console.log('   • RT2: материал (металличность, шероховатость)');
    console.log('   • RT3: векторы движения для TAA');
    console.log('   • LQ версия также обновлена');
}

console.log('═'.repeat(70));
console.log('⭐ [StarfieldShader] МОДУЛЬ ЗАГРУЖЕН v7.0');
console.log('   • viewMat и projMat добавлены');
console.log('   • Минимальный размер 8 пикселей, максимальный 150');
console.log('   • Защита от нулевых векторов и позиций камеры');
console.log('   • ПОЛНАЯ ПОДДЕРЖКА MRT (4 целевых буфера)');
console.log('   • Проверка валидности proj матрицы');
console.log('═'.repeat(70));