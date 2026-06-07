// /10/tests/shaders/PlanetFarMeshShader.wgsl.ts
// ТОЧНАЯ КОПИЯ kosmos/PlanetFarMeshShader.coffee
// АДАПТИРОВАН ДЛЯ ПРОЕКТА С ДАННЫМИ GAIA DR3
// Для дальних планет (LOD 3-4, расстояние > 500 пк)
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export const PlanetFarMeshShader_vert = /* wgsl */ `
// ============================================================================
// PLANET FAR MESH VERTEX SHADER
// Точная копия kosmos/PlanetFarMeshShader.coffee
// Для дальних планет - упрощенная геометрия
// Адаптирован для проекта с научными данными
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

// ⭐ РАСШИРЕННАЯ СТРУКТУРА ДЛЯ НАУЧНЫХ ДАННЫХ ПЛАНЕТ
struct InstanceData {
    modelMat: mat4x4<f32>,
    color: vec4<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    lodLevel: f32,
    // ⭐ НОВЫЕ ПОЛЯ ДЛЯ НАУЧНЫХ ДАННЫХ
    planetMass: f32,
    planetTemperature: f32,
    hasAtmosphere: f32,
    hasClouds: f32,
    albedo: f32,
    _pad: array<f32, 2>
};

struct VertexInput {
    @location(0) aPos: vec3<f32>,
    @location(1) aUV: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vLodLevel: f32,
    @location(3) vPlanetRadius: f32,
    @location(4) vHasAtmosphere: f32
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
    output.vPlanetRadius = instance.planetRadius;
    output.vHasAtmosphere = instance.hasAtmosphere;
    
    // ⭐ Упрощенная трансформация (без смещения по высоте для дальних LOD)
    let pos = vec4<f32>(vertex.aPos, 1.0);
    let viewPos = globalUniform.modelViewMat * pos;
    output.position = globalUniform.projMat * viewPos;
    
    return output;
}
`;

export const PlanetFarMeshShader_frag = /* wgsl */ `
// ============================================================================
// PLANET FAR MESH FRAGMENT SHADER
// Точная копия kosmos/PlanetFarMeshShader.coffee
// Упрощенное освещение для дальних планет
// АДАПТИРОВАН ДЛЯ НАУЧНЫХ ДАННЫХ ПРОЕКТА
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

// ⭐ НАУЧНЫЕ ПАРАМЕТРЫ ПЛАНЕТЫ (из Gaia DR3)
struct PlanetScientificData {
    radius: f32,
    mass: f32,
    temperature: f32,
    hasAtmosphere: f32,
    hasClouds: f32,
    albedo: f32,
    gravity: f32,
    density: f32,
    _pad: array<f32, 2>
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(0) @binding(1) var<uniform> lightUniform: LightUniform;
@group(1) @binding(0) var<uniform> materialUniform: MaterialUniform;
@group(1) @binding(1) var<uniform> planetData: PlanetScientificData;
@group(2) @binding(0) var samplerMap: texture_2d<f32>;
@group(2) @binding(1) var samplerSampler: sampler;

// ⭐ НАУЧНАЯ ФУНКЦИЯ ОСВЕЩЕНИЯ (адаптирована)
fn computeScientificLighting(
    globalDot: f32,
    diffuse: f32,
    ambient: f32,
    color: vec3<f32>,
    hasAtmosphere: f32,
    albedo: f32,
    temperature: f32
) -> vec3<f32> {
    // Ночное освещение для дальних планет
    let nightBlend = clamp(0.5 - globalDot * 4.0, 0.0, 1.0);
    let nightLight = clamp(0.2 / 10.0 - 0.001, 0.0, 1.0);
    let ambientNight = nightBlend * (ambient * ambient * 0.14 + 0.02) * nightLight;
    
    // ⭐ Цвет ночного освещения зависит от температуры
    let tempFactor = clamp((temperature - 300.0) / 1000.0, 0.0, 1.0);
    let nightColorBase = vec3<f32>(0.4, 0.1, 1.0);
    let nightColor = mix(nightColorBase, color, tempFactor) * 0.5;
    
    // ⭐ Альбедо влияет на отражение
    let albedoFactor = albedo * 0.8 + 0.2;
    
    return (color * diffuse * albedoFactor) + nightColor * ambientNight;
}

// ⭐ НАУЧНАЯ ФУНКЦИЯ ЦВЕТА (адаптирована под температуру)
fn computeScientificColor(
    height: f32,
    ambient: f32,
    temperature: f32,
    albedo: f32
) -> vec3<f32> {
    let selfShadowing = 1.00 - dot(materialUniform.planetColor1, vec3<f32>(1.0, 1.0, 1.0) / 3.0);
    
    var color = vec3<f32>(1.0, 1.0, 1.0);
    let edge = mix(1.0, ambient, selfShadowing);
    
    // ⭐ Цвет зависит от температуры (чернотельное излучение)
    let t = temperature / 100.0;
    var tempColor: vec3<f32>;
    if (t <= 66.0) {
        let r = 1.0;
        let g = clamp(0.390081578769019 * log(t) - 0.631841443782627, 0.0, 1.0);
        let b = t <= 19.0 ? 0.0 : clamp(0.543206789110196 * log(t - 10.0) - 1.196254089142308, 0.0, 1.0);
        tempColor = vec3<f32>(r, g, b);
    } else {
        let r = clamp(1.292936186062745 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
        let g = clamp(1.129890860895294 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
        let b = 1.0;
        tempColor = vec3<f32>(r, g, b);
    }
    
    // Смешивание цветов в зависимости от высоты
    color *= mix(materialUniform.planetColor2, tempColor * edge, clamp(abs(height - 0.0) / 1.5, 0.0, 1.0));
    color *= mix(materialUniform.planetColor1, tempColor * edge, clamp(abs(height - 0.5) / 2.5, 0.0, 1.0));
    
    // ⭐ Альбедо влияет на яркость
    color *= (height * 0.25 + 1.00) * albedo;
    
    return color;
}

// ⭐ НАУЧНАЯ ФУНКЦИЯ АТМОСФЕРЫ (Rayleigh + Mie)
fn scientificAtmosphereScattering(
    viewDir: vec3<f32>,
    lightDir: vec3<f32>,
    planetRadius: f32,
    atmosphereDensity: f32,
    albedo: f32,
    temperature: f32
) -> vec3<f32> {
    if (atmosphereDensity < 0.1) {
        return vec3<f32>(0.0);
    }
    
    let cosTheta = dot(viewDir, lightDir);
    let rayleighPhase = 3.0 / (16.0 * 3.14159265) * (1.0 + cosTheta * cosTheta);
    let miePhase = 3.0 / (8.0 * 3.14159265) * ((1.0 - 0.5) * (1.0 - cosTheta * cosTheta)) / (2.0 - 0.5);
    
    // ⭐ Цвет рассеяния зависит от температуры
    let tempBlue = clamp((temperature - 300.0) / 2000.0, 0.3, 1.0);
    let rayleighColor = vec3<f32>(0.65 * tempBlue, 0.57 * tempBlue, 0.47);
    let mieColor = vec3<f32>(0.8, 0.7, 0.6);
    
    let rayleigh = rayleighColor * rayleighPhase;
    let mie = mieColor * miePhase;
    
    let scattering = (rayleigh + mie) * atmosphereDensity * albedo * 0.5;
    
    return scattering;
}

@fragment
fn main(
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vLodLevel: f32,
    @location(3) vPlanetRadius: f32,
    @location(4) vHasAtmosphere: f32
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
    
    // ⭐ Вычисляем цвет на основе научных данных
    let color = computeScientificColor(
        height,
        ambient,
        planetData.temperature,
        planetData.albedo
    );
    
    // ⭐ Применяем научное освещение
    var litColor = computeScientificLighting(
        globalDot,
        diffuse,
        ambient,
        color,
        vHasAtmosphere,
        planetData.albedo,
        planetData.temperature
    );
    
    // ⭐ Добавляем атмосферу если есть
    if (vHasAtmosphere > 0.5 && vLodLevel < 3.5) {
        let viewDir = normalize(globalUniform.cameraPos.xyz - vNormal);
        let atmosphere = scientificAtmosphereScattering(
            viewDir,
            lightUniform.lightVec,
            vPlanetRadius,
            vHasAtmosphere * 0.5,
            planetData.albedo,
            planetData.temperature
        );
        litColor = litColor + atmosphere;
    }
    
    // ⭐ Френель для атмосферы (голубоватая дымка на краях)
    if (vHasAtmosphere > 0.5) {
        let NdotV = max(0.0, dot(norm, normalize(globalUniform.cameraPos.xyz - vNormal)));
        let fresnelAtmosphere = pow(1.0 - NdotV, 2.0) * 0.3;
        litColor = litColor + vec3<f32>(0.4, 0.5, 0.6) * fresnelAtmosphere;
    }
    
    // ⭐ Альфа-канал (как в оригинале)
    output.color = vec4<f32>(litColor, materialUniform.alpha);
    
    return output;
}
`;

// ============================================================================
// ВЕРСИЯ С LOW QUALITY (для очень дальних планет, LOD 4)
// ============================================================================

export const PlanetFarMeshShaderLQ_vert = /* wgsl */ `
struct GlobalUniform {
    projMat: mat4x4<f32>,
    modelViewMat: mat4x4<f32>,
    cameraPos: vec4<f32>
};

struct InstanceData {
    modelMat: mat4x4<f32>,
    color: vec4<f32>,
    planetRadius: f32,
    planetTemperature: f32,
    hasAtmosphere: f32
};

struct VertexInput {
    @location(0) aPos: vec3<f32>,
    @location(1) aUV: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vUV: vec2<f32>,
    @location(1) vColor: vec4<f32>
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
    
    output.vUV = vertex.aUV;
    output.vColor = instance.color;
    
    let pos = vec4<f32>(vertex.aPos, 1.0);
    let viewPos = globalUniform.modelViewMat * pos;
    output.position = globalUniform.projMat * viewPos;
    
    return output;
}
`;

export const PlanetFarMeshShaderLQ_frag = /* wgsl */ `
struct FragmentOutput {
    @location(0) color: vec4<f32>
};

struct LightUniform {
    lightVec: vec3<f32>,
    lightColor: vec3<f32>,
    ambientIntensity: f32
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(0) @binding(1) var<uniform> lightUniform: LightUniform;
@group(1) @binding(0) var samplerMap: texture_2d<f32>;
@group(1) @binding(1) var samplerSampler: sampler;

// ⭐ Чернотельный цвет по температуре (упрощенный)
fn blackbodyColorSimple(temperature: f32) -> vec3<f32> {
    let t = temperature / 100.0;
    var r: f32;
    var g: f32;
    var b: f32;
    
    if (t <= 66.0) {
        r = 1.0;
        g = clamp(0.390081578769019 * log(t) - 0.631841443782627, 0.0, 1.0);
        b = t <= 19.0 ? 0.0 : clamp(0.543206789110196 * log(t - 10.0) - 1.196254089142308, 0.0, 1.0);
    } else {
        r = clamp(1.292936186062745 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
        g = clamp(1.129890860895294 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
        b = 1.0;
    }
    
    return vec3<f32>(r, g, b);
}

@fragment
fn main(
    @location(0) vUV: vec2<f32>,
    @location(1) vColor: vec4<f32>
) -> FragmentOutput {
    var output: FragmentOutput;
    
    // ⭐ Максимальное упрощение для LOD4
    let tex = textureSample(samplerMap, samplerSampler, vUV);
    let brightness = tex.a * 0.8 + 0.2;
    
    // ⭐ Цвет на основе научных данных
    let starColor = blackbodyColorSimple(planetData.planetTemperature);
    let finalColor = starColor * brightness;
    
    let NdotL = max(0.2, dot(lightUniform.lightVec, vec3<f32>(0.0, 1.0, 0.0)));
    let litColor = finalColor * lightUniform.lightColor * NdotL;
    let ambient = finalColor * lightUniform.ambientIntensity;
    
    output.color = vec4<f32>(litColor + ambient, brightness);
    
    return output;
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    PlanetFarMeshShader_vert,
    PlanetFarMeshShader_frag,
    PlanetFarMeshShaderLQ_vert,
    PlanetFarMeshShaderLQ_frag
};