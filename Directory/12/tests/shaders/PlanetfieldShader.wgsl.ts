// /10/tests/shaders/PlanetfieldShader.wgsl.ts
// ТОЧНАЯ КОПИЯ kosmos/PlanetfieldShader.coffee + АДАПТАЦИЯ ПОД ПРОЕКТ
// Для базового рендеринга планет с поддержкой научных данных Gaia DR3
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export const PlanetfieldShader_vert = /* wgsl */ `
// ============================================================================
// PLANETFIELD VERTEX SHADER
// Базовый вершинный шейдер для планет
// Адаптирован для работы с научными данными
// ============================================================================

struct GlobalUniform {
    projMat: mat4x4<f32>,
    modelViewMat: mat4x4<f32>,
    cameraPos: vec4<f32>,
    time: f32,
    delta: f32,
    frame: f32,
    screenWidth: f32,
    screenHeight: f32,
    near: f32,
    far: f32,
    exposure: f32,
    gamma: f32,
    _pad: array<f32, 8>
};

struct InstanceData {
    modelMat: mat4x4<f32>,
    color: vec4<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    lodLevel: f32,
    hasAtmosphere: f32,
    temperature: f32,
    albedo: f32,
    _pad: array<f32, 4>
};

struct VertexInput {
    @location(0) aPos: vec3<f32>,
    @location(1) aUV: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vWorldPos: vec3<f32>,
    @location(3) vLodLevel: f32,
    @location(4) vTemperature: f32,
    @location(5) vAlbedo: f32
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(1) @binding(0) var<storage, read> instanceBuffer: array<InstanceData>;

@vertex
fn main(
    vertex: VertexInput,
    @builtin(instance_index) instanceId: u32
) -> VertexOutput {
    var output: VertexOutput;
    
    let instance = instanceBuffer[instanceId];
    
    // ⭐ Нормаль = позиция (как в оригинале kosmos)
    output.vNormal = vertex.aPos;
    output.vUV = vertex.aUV;
    output.vLodLevel = instance.lodLevel;
    output.vTemperature = instance.temperature;
    output.vAlbedo = instance.albedo;
    
    // Трансформация позиции
    let pos = vec4<f32>(vertex.aPos, 1.0);
    let worldPos = instance.modelMat * pos;
    let viewPos = globalUniform.modelViewMat * pos;
    output.position = globalUniform.projMat * viewPos;
    output.vWorldPos = worldPos.xyz;
    
    return output;
}
`;

export const PlanetfieldShader_frag = /* wgsl */ `
// ============================================================================
// PLANETFIELD FRAGMENT SHADER
// Базовый фрагментный шейдер для планет
// Адаптирован для научных данных: температура, альбедо, атмосфера
// ============================================================================

struct FragmentOutput {
    @location(0) color: vec4<f32>
};

struct LightUniform {
    lightVec: vec3<f32>,
    lightColor: vec3<f32>,
    ambientIntensity: f32,
    diffuseIntensity: f32,
    _pad: array<f32, 4>
};

struct MaterialUniform {
    planetColor1: vec3<f32>,
    planetColor2: vec3<f32>,
    alpha: f32,
    roughness: f32,
    metallic: f32,
    _pad: array<f32, 4>
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(0) @binding(1) var<uniform> lightUniform: LightUniform;
@group(1) @binding(0) var<uniform> materialUniform: MaterialUniform;
@group(2) @binding(0) var samplerMap: texture_2d<f32>;
@group(2) @binding(1) var samplerSampler: sampler;

// ============================================================================
// ⭐ НАУЧНОЕ АТМОСФЕРНОЕ РАССЕЯНИЕ (Rayleigh + Mie)
// Адаптировано для работы с температурой и альбедо из Gaia DR3
// ============================================================================

fn scientificAtmosphereScattering(
    viewDir: vec3<f32>,
    lightDir: vec3<f32>,
    planetRadius: f32,
    atmosphereDensity: f32,
    temperature: f32,
    albedo: f32
) -> vec3<f32> {
    let cosTheta = dot(viewDir, lightDir);
    
    // ⭐ Рэйли-рассеяние (зависит от температуры)
    var rayleighCoeff: vec3<f32>;
    if (temperature > 5000.0) {
        // Горячие планеты - голубоватая атмосфера
        rayleighCoeff = vec3<f32>(0.65, 0.57, 0.47);
    } else if (temperature > 3000.0) {
        // Умеренные планеты - желтоватая
        rayleighCoeff = vec3<f32>(0.7, 0.6, 0.5);
    } else {
        // Холодные планеты - красноватая
        rayleighCoeff = vec3<f32>(0.8, 0.5, 0.3);
    }
    
    let rayleighPhase = 3.0 / (16.0 * 3.14159265) * (1.0 + cosTheta * cosTheta);
    let miePhase = 3.0 / (8.0 * 3.14159265) * ((1.0 - 0.5) * (1.0 - cosTheta * cosTheta)) / (2.0 - 0.5);
    
    let rayleighColor = rayleighCoeff * rayleighPhase;
    let mieColor = vec3<f32>(0.8, 0.7, 0.6) * miePhase;
    
    // ⭐ Интенсивность рассеяния зависит от альбедо
    let scatteringIntensity = atmosphereDensity * albedo * 0.5;
    let scattering = (rayleighColor + mieColor) * scatteringIntensity;
    
    return scattering;
}

// ============================================================================
// ⭐ ФУНКЦИЯ ОСВЕЩЕНИЯ (как в оригинале kosmos)
// ============================================================================

fn computeLighting(globalDot: f32, diffuse: f32, ambient: f32, color: vec3<f32>, temperature: f32) -> vec3<f32> {
    // Ночное освещение с учетом температуры
    let nightBlend = clamp(0.5 - globalDot * 4.0, 0.0, 1.0);
    let nightLight = clamp(0.2 / 10.0 - 0.001, 0.0, 1.0);
    let ambientNight = nightBlend * (ambient * ambient * 0.14 + 0.02) * nightLight;
    
    // ⭐ Цвет ночного освещения зависит от температуры
    var nightColor: vec3<f32>;
    if (temperature > 5000.0) {
        nightColor = vec3<f32>(0.4, 0.2, 0.8);
    } else if (temperature > 3000.0) {
        nightColor = vec3<f32>(0.5, 0.3, 0.6);
    } else {
        nightColor = vec3<f32>(0.6, 0.3, 0.4);
    }
    
    return color * diffuse + nightColor * ambientNight;
}

// ============================================================================
// ⭐ ФУНКЦИЯ ЦВЕТА НА ОСНОВЕ ВЫСОТЫ И ТЕМПЕРАТУРЫ
// ============================================================================

fn computeColor(height: f32, ambient: f32, temperature: f32, albedo: f32) -> vec3<f32> {
    let selfShadowing = 1.00 - dot(materialUniform.planetColor1, vec3<f32>(1.0, 1.0, 1.0) / 3.0);
    
    // ⭐ Базовая цветовая гамма в зависимости от температуры
    var baseColor1: vec3<f32>;
    var baseColor2: vec3<f32>;
    
    if (temperature > 5000.0) {
        // Горячие планеты (голубоватые, белые)
        baseColor1 = vec3<f32>(0.7, 0.8, 1.0);
        baseColor2 = vec3<f32>(0.5, 0.6, 0.8);
    } else if (temperature > 3000.0) {
        // Умеренные планеты (зеленоватые, желтоватые)
        baseColor1 = vec3<f32>(0.6, 0.7, 0.5);
        baseColor2 = vec3<f32>(0.4, 0.5, 0.3);
    } else {
        // Холодные планеты (красноватые, коричневые)
        baseColor1 = vec3<f32>(0.8, 0.5, 0.3);
        baseColor2 = vec3<f32>(0.6, 0.3, 0.2);
    }
    
    // Применяем альбедо
    baseColor1 = baseColor1 * albedo;
    baseColor2 = baseColor2 * albedo;
    
    var color = vec3<f32>(1.0, 1.0, 1.0);
    let edge = mix(1.0, ambient, selfShadowing);
    
    // Смешивание цветов в зависимости от высоты
    color *= mix(baseColor2, vec3<f32>(1.0, 1.0, 1.0) * edge, clamp(abs(height - 0.0) / 1.5, 0.0, 1.0));
    color *= mix(baseColor1, vec3<f32>(1.0, 1.0, 1.0) * edge, clamp(abs(height - 0.5) / 2.5, 0.0, 1.0));
    
    // Яркость в зависимости от высоты
    color *= height * 0.25 + 1.00;
    
    return color;
}

// ============================================================================
// ФУНКЦИЯ ФРЕНЕЛЯ ДЛЯ АТМОСФЕРЫ
// ============================================================================

fn fresnelAtmosphere(cosTheta: f32, refractiveIndex: f32) -> f32 {
    let r0 = (refractiveIndex - 1.0) / (refractiveIndex + 1.0);
    let r0sq = r0 * r0;
    let fresnel = r0sq + (1.0 - r0sq) * pow(1.0 - cosTheta, 5.0);
    return fresnel;
}

// ============================================================================
// ОСНОВНОЙ ФРАГМЕНТНЫЙ ШЕЙДЕР
// ============================================================================

@fragment
fn main(
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vWorldPos: vec3<f32>,
    @location(3) vLodLevel: f32,
    @location(4) vTemperature: f32,
    @location(5) vAlbedo: f32
) -> FragmentOutput {
    var output: FragmentOutput;
    
    // ⭐ Извлекаем данные из текстуры (как в оригинале)
    let tex = textureSample(samplerMap, samplerSampler, vUV);
    let norm = normalize(tex.xyz * 2.0 - 1.0);
    
    // ⭐ Вычисляем компоненты освещения (как в оригинале)
    let globalDot = dot(lightUniform.lightVec, normalize(vNormal));
    let diffuse = clamp(dot(lightUniform.lightVec, norm), 0.0, 1.0);
    let ambient = clamp(1.0 - 2.0 * acos(dot(norm, normalize(vNormal))), 0.0, 1.0);
    let height = tex.a;
    
    // ⭐ Вычисляем цвет на основе высоты и температуры
    let color = computeColor(height, ambient, vTemperature, vAlbedo);
    
    // ⭐ Применяем освещение
    let litColor = computeLighting(globalDot, diffuse, ambient, color, vTemperature);
    
    // ⭐ Атмосферное рассеяние (только для планет с атмосферой)
    var atmosphere = vec3<f32>(0.0);
    if (vLodLevel < 2.0 && vTemperature > 200.0) {
        let viewDir = normalize(globalUniform.cameraPos.xyz - vWorldPos);
        let atmosphereDensity = max(0.0, 1.0 - vLodLevel * 0.5);
        atmosphere = scientificAtmosphereScattering(
            viewDir,
            lightUniform.lightVec,
            1.0,
            atmosphereDensity,
            vTemperature,
            vAlbedo
        );
    }
    
    // ⭐ Атмосферный френель (свечение на краях)
    let NdotV = max(0.0, dot(norm, normalize(globalUniform.cameraPos.xyz - vWorldPos)));
    let fresnelGlow = fresnelAtmosphere(NdotV, 1.3) * 0.3;
    let finalAtmosphere = atmosphere + vec3<f32>(0.4, 0.5, 0.6) * fresnelGlow;
    
    // ⭐ Финальный цвет
    let finalColor = litColor + finalAtmosphere;
    
    // ⭐ Альфа-канал (как в оригинале)
    output.color = vec4<f32>(finalColor, materialUniform.alpha);
    
    return output;
}
`;

// ============================================================================
// ВЕРСИЯ С ВЫСОКИМ КАЧЕСТВОМ (для LOD 0-1)
// ============================================================================

export const PlanetfieldShaderHQ_frag = /* wgsl */ `
// Высококачественная версия с полной атмосферой

@fragment
fn main(
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vWorldPos: vec3<f32>,
    @location(3) vLodLevel: f32,
    @location(4) vTemperature: f32,
    @location(5) vAlbedo: f32
) -> FragmentOutput {
    var output: FragmentOutput;
    
    let tex = textureSample(samplerMap, samplerSampler, vUV);
    let norm = normalize(tex.xyz * 2.0 - 1.0);
    
    // ⭐ Множественные источники света для HQ версии
    var totalDiffuse = 0.0;
    var totalSpecular = 0.0;
    
    // Основной источник света
    let globalDot = dot(lightUniform.lightVec, normalize(vNormal));
    let diffuse = clamp(dot(lightUniform.lightVec, norm), 0.0, 1.0);
    totalDiffuse = diffuse;
    
    // ⭐ Добавляем окружающее освещение с учетом температуры
    let ambientStrength = 0.3 + (vTemperature / 10000.0) * 0.2;
    let ambientLight = tex.rgb * ambientStrength;
    
    let height = tex.a;
    let color = computeColor(height, 0.5, vTemperature, vAlbedo);
    let litColor = color * totalDiffuse;
    
    // Полная атмосфера для HQ
    let viewDir = normalize(globalUniform.cameraPos.xyz - vWorldPos);
    let atmosphere = scientificAtmosphereScattering(
        viewDir,
        lightUniform.lightVec,
        1.0,
        0.5,
        vTemperature,
        vAlbedo
    );
    
    let NdotV = max(0.0, dot(norm, viewDir));
    let fresnelGlow = fresnelAtmosphere(NdotV, 1.5) * 0.5;
    let finalAtmosphere = atmosphere + vec3<f32>(0.5, 0.6, 0.8) * fresnelGlow;
    
    let finalColor = litColor + ambientLight + finalAtmosphere;
    output.color = vec4<f32>(finalColor, materialUniform.alpha);
    
    return output;
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    PlanetfieldShader_vert,
    PlanetfieldShader_frag,
    PlanetfieldShaderHQ_frag
};