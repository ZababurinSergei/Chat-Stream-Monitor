// /10/tests/shaders/NormalMapGeneratorShader.wgsl.ts
// Портировано из kosmos NormalMapGeneratorShader.coffee
// С horizon occlusion техникой (кодирование AO в длине вектора нормали)
// АДАПТИРОВАН ПОД ПРОЕКТ: поддержка научных карт высот с разным разрешением
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export const NormalMapGeneratorShader_cs = /* wgsl */ `
// ============================================================================
// NORMAL MAP GENERATOR
// Портировано из kosmos NormalMapGeneratorShader.coffee
// Оригинальный автор: John Judnich (C) 2013
// Лицензия: MIT
//
// УНИКАЛЬНАЯ ТЕХНИКА ИЗ KOSMOS:
// - Кодирование ambient occlusion / horizon map как длины вектора нормали
// - Позволяет эффективно упаковать AO информацию
// - Результат - sharpened normal maps с эффектом 2x разрешения
// - Причина: При интерполяции между большим вектором и маленьким,
//   и последующей ре-нормализации во фрагментном шейдере,
//   создаётся нелинейная интерполяция - чем меньше целевой вектор,
//   тем быстрее к нему приближаемся. Это создаёт эффект "sharpening".
//
// АДАПТАЦИЯ ПОД ПРОЕКТ:
// - Поддержка научных карт высот с разным разрешением
// - Автоматический выбор качества на основе разрешения текстуры
// - Оптимизация для LOD уровней планет
// ============================================================================

// ============================================================================
// СТРУКТУРЫ ДАННЫХ
// ============================================================================

struct Uniforms {
    planetRadius: f32,
    atmosphereRadius: f32,
    heightScale: f32,
    normalStrength: f32,
    horizonOcclusion: f32,
    texelSizeX: f32,
    texelSizeY: f32,
    lodLevel: f32,              // ⭐ НОВОЕ - уровень LOD для адаптивного качества
    _pad: array<f32, 3>
};

struct NormalOutput {
    normal: vec3<f32>,
    height: f32,
    ambientOcclusion: f32
};

// ============================================================================
// БАЙНДИНГИ
// ============================================================================

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var heightMap: texture_2d<f32>;
@group(0) @binding(2) var heightSampler: sampler;
@group(0) @binding(3) var<storage, write> outputNormals: array<NormalOutput>;

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

fn getHeight(uv: vec2<f32>) -> f32 {
    let h = textureSampleLevel(heightMap, heightSampler, uv, 0.0).r;
    return h * uniforms.heightScale;
}

fn getHeightWithOffset(uv: vec2<f32>, offset: vec2<f32>) -> f32 {
    let sampleUV = uv + offset * vec2<f32>(uniforms.texelSizeX, uniforms.texelSizeY);
    return getHeight(sampleUV);
}

// ============================================================================
// ПОЛУЧЕНИЕ ПОЗИЦИИ С УЧЁТОМ ВЫСОТЫ (КАК В ОРИГИНАЛЬНОМ KOSMOS)
// ============================================================================

fn positionAndHeight(uv: vec2<f32>, offsetUV: vec2<f32>) -> vec4<f32> {
    let sampleUV = uv + offsetUV;
    let height = getHeight(sampleUV);
    
    // Преобразуем UV в направление на сфере (сферические координаты)
    let phi = sampleUV.x * 2.0 * 3.141592653589793;
    let theta = sampleUV.y * 3.141592653589793;
    let cosTheta = cos(theta);
    let sinTheta = sin(theta);
    let cosPhi = cos(phi);
    let sinPhi = sin(phi);
    
    var dir = vec3<f32>(
        sinTheta * cosPhi,
        cosTheta,
        sinTheta * sinPhi
    );
    
    // Смещаем позицию в зависимости от высоты (как в оригинальном kosmos)
    // pos *= 0.997 + h * 0.003
    let radius = uniforms.planetRadius + height * (uniforms.atmosphereRadius - uniforms.planetRadius);
    let pos = dir * radius;
    
    return vec4<f32>(pos, height);
}

// ============================================================================
// ВЫЧИСЛЕНИЕ НОРМАЛИ С HORIZON OCCLUSION (СТАНДАРТНОЕ КАЧЕСТВО)
// ============================================================================

fn computeNormalWithAO(uv: vec2<f32>) -> NormalOutput {
    // ========================================================================
    // ШАГ 1: Сэмплируем высоты в 4 направлениях (как в kosmos)
    // ========================================================================
    let hCenter = positionAndHeight(uv, vec2<f32>(0.0, 0.0));
    let hRight = positionAndHeight(uv, vec2<f32>(uniforms.texelSizeX, 0.0));
    let hLeft = positionAndHeight(uv, vec2<f32>(-uniforms.texelSizeX, 0.0));
    let hUp = positionAndHeight(uv, vec2<f32>(0.0, uniforms.texelSizeY));
    let hDown = positionAndHeight(uv, vec2<f32>(0.0, -uniforms.texelSizeY));
    
    // ========================================================================
    // ШАГ 2: Вычисляем векторы для нормали (метод конечных разностей)
    // ========================================================================
    let right = hRight.xyz - hLeft.xyz;
    let forward = hUp.xyz - hDown.xyz;
    var normal = normalize(cross(right, forward));
    
    let height = hCenter.w;
    
    // ========================================================================
    // ШАГ 3: HORIZON OCCLUSION (уникальная техника из kosmos)
    // ========================================================================
    // Оригинальный комментарий из kosmos:
    // "this is a very unique and extremely efficient hack
    // basically we encode the ambient occlusion map / horizon map as the normal vector length!
    // not only does this efficiently pack this info, but actually ENHANCES the normal map quality
    // because wide open areas determined by the horizon map scale down the vector length, resulting
    // in a 'sharpening' effect for these areas, and a smoothing effect for curved surfaces.
    // The end result is sharpened normal maps in general appearing 2x as high resolution!"
    // ========================================================================
    
    var horizonOcclusion = 1.0;
    if (uniforms.horizonOcclusion > 0.0) {
        // Вычисляем среднюю высоту вокруг (как в оригинале)
        let aveHeight = (hRight.w + hLeft.w + hUp.w + hDown.w) * 0.25;
        
        // Разница высот определяет затенение
        let diff = abs(height - aveHeight) * uniforms.horizonOcclusion;
        
        // Уникальная формула из kosmos: масштабируем нормаль
        // Чем больше перепад высот, тем сильнее уменьшаем вектор
        let scale = 1.0 / (1.0 + diff * diff * 4.0);
        horizonOcclusion = scale;
        
        // КЛЮЧЕВОЙ МОМЕНТ: НЕ нормируем нормаль!
        // AO кодируется в длине вектора!
        normal = normal * scale;
    }
    
    // ========================================================================
    // ШАГ 4: Применяем силу нормали (strength)
    // ========================================================================
    if (uniforms.normalStrength != 1.0) {
        let len = length(normal);
        if (len > 0.001) {
            let normalized = normal / len;
            let enhanced = vec3<f32>(
                normalized.x * uniforms.normalStrength,
                normalized.y * uniforms.normalStrength,
                normalized.z
            );
            normal = normalize(enhanced) * len;
        }
    }
    
    // ========================================================================
    // ШАГ 5: ФИНАЛЬНЫЙ ВЫВОД
    // ========================================================================
    var output: NormalOutput;
    output.normal = normal;
    output.height = height;
    output.ambientOcclusion = horizonOcclusion;
    
    return output;
}

// ============================================================================
// ВЫЧИСЛЕНИЕ НОРМАЛИ ВЫСОКОГО КАЧЕСТВА (8 НАПРАВЛЕНИЙ)
// ============================================================================

fn computeNormalHighQuality(uv: vec2<f32>) -> NormalOutput {
    let texel = vec2<f32>(uniforms.texelSizeX, uniforms.texelSizeY);
    
    let hCenter = positionAndHeight(uv, vec2<f32>(0.0, 0.0));
    
    // 8 направлений: 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°
    let angles: array<vec2<f32>, 8> = array(
        vec2<f32>(1.0, 0.0), vec2<f32>(0.7071, 0.7071),
        vec2<f32>(0.0, 1.0), vec2<f32>(-0.7071, 0.7071),
        vec2<f32>(-1.0, 0.0), vec2<f32>(-0.7071, -0.7071),
        vec2<f32>(0.0, -1.0), vec2<f32>(0.7071, -0.7071)
    );
    
    var sum = vec3<f32>(0.0);
    var count = 0;
    
    for (var i = 0; i < 8; i++) {
        let offset = angles[i] * texel;
        let hSample = positionAndHeight(uv, offset);
        let diff = hSample.xyz - hCenter.xyz;
        let dist = length(diff);
        if (dist > 0.001) {
            let dir = diff / dist;
            let weight = 1.0 / (dist * dist + 0.01);
            sum = sum + dir * weight;
            count = count + 1;
        }
    }
    
    var normal = normalize(sum);
    let height = hCenter.w;
    
    var horizonOcclusion = 1.0;
    if (uniforms.horizonOcclusion > 0.0 && count > 0) {
        let avgLen = length(sum) / f32(count);
        horizonOcclusion = clamp(avgLen, 0.3, 1.0);
        normal = normal * horizonOcclusion;
    }
    
    var output: NormalOutput;
    output.normal = normal;
    output.height = height;
    output.ambientOcclusion = horizonOcclusion;
    
    return output;
}

// ============================================================================
// ВЫЧИСЛЕНИЕ НОРМАЛИ ДЛЯ LOD (УПРОЩЕННОЕ)
// ============================================================================

fn computeNormalLOD(uv: vec2<f32>) -> NormalOutput {
    // Упрощенная версия для дальних LOD (только 4 направления, без AO)
    let hCenter = positionAndHeight(uv, vec2<f32>(0.0, 0.0));
    let hRight = positionAndHeight(uv, vec2<f32>(uniforms.texelSizeX, 0.0));
    let hLeft = positionAndHeight(uv, vec2<f32>(-uniforms.texelSizeX, 0.0));
    let hUp = positionAndHeight(uv, vec2<f32>(0.0, uniforms.texelSizeY));
    let hDown = positionAndHeight(uv, vec2<f32>(0.0, -uniforms.texelSizeY));
    
    let right = hRight.xyz - hLeft.xyz;
    let forward = hUp.xyz - hDown.xyz;
    let normal = normalize(cross(right, forward));
    let height = hCenter.w;
    
    var output: NormalOutput;
    output.normal = normal;
    output.height = height;
    output.ambientOcclusion = 1.0;
    
    return output;
}

// ============================================================================
// ОСНОВНОЙ COMPUTE ШЕЙДЕР (С ПОДДЕРЖКОЙ LOD)
// ============================================================================

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    let x = id.x;
    let y = id.y;
    let width = i32(textureDimensions(heightMap).x);
    let height = i32(textureDimensions(heightMap).y);
    
    if (x >= u32(width) || y >= u32(height)) {
        return;
    }
    
    // Нормализованные UV координаты (0-1)
    let uv = vec2<f32>(
        (f32(x) + 0.5) / f32(width),
        (f32(y) + 0.5) / f32(height)
    );
    
    // ⭐ АДАПТАЦИЯ ПОД ПРОЕКТ: выбор качества на основе LOD уровня
    let lodLevel = uniforms.lodLevel;
    
    var result: NormalOutput;
    
    if (lodLevel < 0.5) {
        // LOD0: максимальное качество (8 направлений)
        let useHighQuality = width > 1024;
        result = select(computeNormalWithAO(uv), computeNormalHighQuality(uv), useHighQuality);
    } else if (lodLevel < 1.5) {
        // LOD1: среднее качество (4 направления с AO)
        result = computeNormalWithAO(uv);
    } else {
        // LOD2+: упрощенное качество (без AO)
        result = computeNormalLOD(uv);
    }
    
    let idx = y * u32(width) + x;
    outputNormals[idx] = result;
}

// ============================================================================
// ВЕРШИННЫЙ ШЕЙДЕР ДЛЯ ОТЛАДКИ (опционально)
// ============================================================================

struct DebugVertexInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>
};

struct DebugVertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>
};

@vertex
fn debugVertexMain(vertex: DebugVertexInput) -> DebugVertexOutput {
    var output: DebugVertexOutput;
    output.position = vec4<f32>(vertex.position, 1.0);
    output.uv = vertex.uv;
    return output;
}

@fragment
fn debugFragmentMain(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let normalTex = textureSample(heightMap, heightSampler, uv);
    let normal = normalTex.xyz * 2.0 - 1.0;
    return vec4<f32>(normal * 0.5 + 0.5, 1.0);
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default NormalMapGeneratorShader_cs;

// ============================================================================
// ИНФОРМАЦИЯ О ПОРТИРОВАНИИ И АДАПТАЦИИ
// ============================================================================

/*
 * ПОРТИРОВАНО ИЗ: kosmos/NormalMapGeneratorShader.coffee
 * ОРИГИНАЛЬНЫЙ АВТОР: John Judnich
 * ЛИЦЕНЗИЯ: MIT (Copyright (C) 2013 John Judnich)
 *
 * АДАПТАЦИЯ ПОД ПРОЕКТ:
 * - Добавлен параметр lodLevel для адаптивного качества
 * - Автоматический выбор качества на основе LOD уровня:
 *   LOD0 (<0.5): максимальное качество (8 направлений)
 *   LOD1 (0.5-1.5): среднее качество (4 направления с AO)
 *   LOD2+ (>1.5): упрощенное качество (без AO)
 * - Поддержка научных карт высот с разным разрешением
 * - Оптимизация для LOD уровней планет
 *
 * ТЕХНИЧЕСКИЕ ДЕТАЛИ:
 * - Размер воркгруппы: 8x8 (оптимально для GPU)
 * - Формат выходных данных: vec3<f32> нормаль + f32 высота + f32 AO
 * - Поддержка текстур up to 4096x4096
 * - Автоматический выбор качества на основе разрешения
 */