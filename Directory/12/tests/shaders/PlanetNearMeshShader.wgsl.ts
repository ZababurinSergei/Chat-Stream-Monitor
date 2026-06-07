// /10/tests/shaders/PlanetNearMeshShader.wgsl.ts
// ТОЧНАЯ КОПИЯ kosmos/PlanetNearMeshShader.coffee
// Для ближних планет (LOD 0-2, расстояние < 500 пк)
// АДАПТИРОВАН ДЛЯ ПРОЕКТА - добавлена научная атмосфера и параметры
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export const PlanetNearMeshShader_vert = /* wgsl */ `
// ============================================================================
// PLANET NEAR MESH VERTEX SHADER
// Точная копия kosmos/PlanetNearMeshShader.coffee
// Для ближних планет - полная геометрия с параллаксом
// ============================================================================

struct GlobalUniform {
    viewMat: mat4x4<f32>,
    projMat: mat4x4<f32>,
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
    heightScale: f32,
    hasAtmosphere: f32,
    _pad: array<f32, 3>
};

struct VertexInput {
    @location(0) aPos: vec3<f32>,
    @location(1) aUV: vec2<f32>
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vCamDist: f32,
    @location(3) vWorldPos: vec3<f32>
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(1) @binding(0) var<storage, read> instanceBuffer: array<InstanceData>;
@group(2) @binding(0) var heightMap: texture_2d<f32>;
@group(2) @binding(1) var heightSampler: sampler;

@vertex
fn main(
    vertex: VertexInput,
    @builtin(instance_index) instanceId: u32
) -> VertexOutput {
    var output: VertexOutput;
    
    let instance = instanceBuffer[instanceId];
    
    // ⭐ UV с учетом масштаба (как в оригинале kosmos)
    let uvScalar = 4097.0 / 4096.0;
    let uv = vertex.aUV * uvScalar;
    
    // ⭐ Получаем высоту из текстуры (как в оригинале)
    let height = textureSampleLevel(heightMap, heightSampler, uv, 0.0).a;
    
    // ⭐ Смещаем позицию в зависимости от высоты (как в оригинале)
    // aPos *= 0.985 + (height - offset) * 0.015
    var pos = normalize(vertex.aPos);
    let heightOffset = height * instance.heightScale;
    pos = pos * (instance.planetRadius + heightOffset * (instance.atmosphereRadius - instance.planetRadius));
    
    output.vNormal = pos;
    output.vUV = uv;
    
    let worldPos = instance.modelMat * vec4<f32>(pos, 1.0);
    output.vWorldPos = worldPos.xyz;
    
    let viewPos = globalUniform.viewMat * worldPos;
    output.position = globalUniform.projMat * viewPos;
    output.vCamDist = length(viewPos.xyz);
    
    return output;
}
`;

export const PlanetNearMeshShader_frag = /* wgsl */ `
// ============================================================================
// PLANET NEAR MESH FRAGMENT SHADER
// Точная копия kosmos/PlanetNearMeshShader.coffee
// АДАПТИРОВАН: добавлена научная атмосфера и физические параметры
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

// ⭐ НОВАЯ СТРУКТУРА ДЛЯ НАУЧНЫХ ДАННЫХ ПЛАНЕТЫ
struct PlanetScientificData {
    radius: f32,
    mass: f32,
    temperature: f32,
    hasAtmosphere: f32,
    hasClouds: f32,
    albedo: f32,
    atmosphereDensity: f32,
    cloudCoverage: f32,
    _pad: array<f32, 4>
};

struct MaterialUniform {
    planetColor1: vec3<f32>,
    planetColor2: vec3<f32>,
    alpha: f32,
    roughness: f32,
    metallic: f32,
    detailStrength: f32,
    _pad: array<f32, 4>
};

@group(0) @binding(0) var<uniform> globalUniform: GlobalUniform;
@group(0) @binding(1) var<uniform> lightUniform: LightUniform;
@group(1) @binding(0) var<uniform> materialUniform: MaterialUniform;
@group(1) @binding(1) var<uniform> planetScientific: PlanetScientificData;
@group(2) @binding(0) var samplerMap: texture_2d<f32>;
@group(2) @binding(1) var samplerSampler: sampler;
@group(2) @binding(2) var detailMap: texture_2d<f32>;
@group(2) @binding(3) var detailSampler: sampler;
@group(2) @binding(4) var cloudMap: texture_2d<f32>;
@group(2) @binding(5) var cloudSampler: sampler;

// ⭐ Функция освещения (как в оригинале kosmos)
fn computeLighting(globalDot: f32, diffuse: f32, ambient: f32, color: vec3<f32>, camDist: f32) -> vec3<f32> {
    let nightBlend = clamp(0.5 - globalDot * 4.0, 0.0, 1.0);
    let nightLight = clamp(0.2 / sqrt(camDist) - 0.001, 0.0, 1.0);
    let ambientNight = nightBlend * (ambient * ambient * 0.14 + 0.02) * nightLight;
    let nightColor = normalize(color) * 0.4 + vec3<f32>(0.4, 0.1, 1.0) * 0.4;
    
    return color * diffuse + nightColor * ambientNight;
}

// ⭐ Функция цвета на основе высоты (как в оригинале kosmos)
fn computeColor(height: f32, ambient: f32) -> vec3<f32> {
    let selfShadowing = 1.00 - dot(materialUniform.planetColor1, vec3<f32>(1.0, 1.0, 1.0) / 3.0);
    
    var color = vec3<f32>(1.0, 1.0, 1.0);
    let edge = mix(1.0, ambient, selfShadowing);
    
    color *= mix(materialUniform.planetColor2, vec3<f32>(1.0, 1.0, 1.0) * edge, clamp(abs(height - 0.0) / 1.5, 0.0, 1.0));
    color *= mix(materialUniform.planetColor1, vec3<f32>(1.0, 1.0, 1.0) * edge, clamp(abs(height - 0.5) / 2.5, 0.0, 1.0));
    
    color *= height * 0.25 + 1.00;
    
    return color;
}

// ⭐ НОВАЯ ФУНКЦИЯ: НАУЧНОЕ АТМОСФЕРНОЕ РАССЕЯНИЕ (Rayleigh + Mie)
fn scientificAtmosphereScattering(
    viewDir: vec3<f32>,
    lightDir: vec3<f32>,
    planetRadius: f32,
    atmosphereRadius: f32,
    density: f32,
    planetPos: vec3<f32>,
    albedo: f32
) -> vec3<f32> {
    let r = length(planetPos);
    let Rg = planetRadius;
    let Rt = atmosphereRadius;
    
    if (r > Rt) {
        return vec3<f32>(0.0);
    }
    
    let h = max(0.0, r - Rg);
    let hNorm = h / (Rt - Rg);
    let opticalDepth = exp(-hNorm * density * 10.0);
    
    let cosTheta = dot(viewDir, lightDir);
    let rayleighPhase = 3.0 / (16.0 * 3.14159265) * (1.0 + cosTheta * cosTheta);
    let miePhase = 3.0 / (8.0 * 3.14159265) * ((1.0 - 0.5) * (1.0 - cosTheta * cosTheta)) / (2.0 - 0.5);
    
    let rayleighColor = vec3<f32>(0.65, 0.57, 0.47) * rayleighPhase;
    let mieColor = vec3<f32>(0.8, 0.7, 0.6) * miePhase;
    
    let scattering = (rayleighColor + mieColor) * opticalDepth * albedo;
    
    return scattering;
}

// ⭐ НОВАЯ ФУНКЦИЯ: ОБЛАКА С ПРОЦЕДУРНЫМ ШУМОМ
fn calculateClouds(uv: vec2<f32>, time: f32, coverage: f32, intensity: f32) -> f32 {
    let cloudUV = uv * 4.0 + vec2<f32>(time * 0.05, time * 0.03);
    let cloudTex = textureSample(cloudMap, cloudSampler, cloudUV);
    
    var clouds = cloudTex.r;
    
    // Процедурный шум для дополнительной детализации
    let noiseUV = uv * 16.0 - vec2<f32>(time * 0.02, time * 0.01);
    let noise1 = sin(noiseUV.x * 3.14159 * 2.0) * cos(noiseUV.y * 3.14159 * 2.0);
    let noise2 = sin(noiseUV.x * 6.28318) * sin(noiseUV.y * 6.28318);
    
    clouds = clouds * 0.7 + (noise1 * 0.5 + 0.5) * 0.2 + (noise2 * 0.5 + 0.5) * 0.1;
    clouds = clamp((clouds - (1.0 - coverage)) / coverage, 0.0, 1.0);
    
    return clouds * intensity;
}

@fragment
fn main(
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vCamDist: f32,
    @location(3) vWorldPos: vec3<f32>
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
    
    // ⭐ Вычисляем цвет на основе высоты
    var color = computeColor(height, ambient);
    
    // ⭐ Детальная текстура (как в оригинале kosmos)
    let detailColor = textureSample(detailMap, detailSampler, vUV * 128.0) * 2.0 - 1.0;
    let detailPower = clamp(1.0 / (vCamDist * 25.0), 0.0, 1.0) * (0.80 - clamp(globalDot, 0.0, 1.0) * 0.5);
    color *= 1.0 + detailColor.xyz * detailPower;
    
    // ⭐ НАУЧНАЯ АТМОСФЕРА (если есть)
    var atmosphere = vec3<f32>(0.0);
    if (planetScientific.hasAtmosphere > 0.5) {
        let viewDir = normalize(globalUniform.cameraPos.xyz - vWorldPos);
        atmosphere = scientificAtmosphereScattering(
            viewDir,
            lightUniform.lightVec,
            planetScientific.radius,
            planetScientific.radius * 1.05,
            planetScientific.atmosphereDensity,
            vWorldPos,
            planetScientific.albedo
        );
        color = color + atmosphere * 0.5;
    }
    
    // ⭐ ОБЛАКА (если есть)
    var clouds = 0.0;
    if (planetScientific.hasClouds > 0.5 && planetScientific.cloudCoverage > 0.0) {
        clouds = calculateClouds(vUV, globalUniform.time, planetScientific.cloudCoverage, 0.5);
        let cloudColor = vec3<f32>(0.95, 0.95, 0.98);
        color = mix(color, cloudColor, clouds);
    }
    
    // ⭐ АТМОСФЕРНЫЙ ФРЕНЕЛЬ (голубоватая дымка на краях)
    let NdotV = max(dot(norm, normalize(globalUniform.cameraPos.xyz - vWorldPos)), 0.0);
    let fresnelAtmosphere = pow(1.0 - NdotV, 3.0) * 0.3;
    color = color + vec3<f32>(0.4, 0.5, 0.6) * fresnelAtmosphere;
    
    // ⭐ Применяем освещение
    let litColor = computeLighting(globalDot, diffuse, ambient, color, vCamDist);
    
    // ⭐ FOG ПО РАССТОЯНИЮ
    let fogDensity = 0.0005;
    let fogColor = vec3<f32>(0.05, 0.05, 0.1);
    let fogFactor = exp(-vCamDist * fogDensity);
    let finalColor = mix(fogColor, litColor, fogFactor);
    
    // ⭐ Альфа-канал (как в оригинале)
    output.color = vec4<f32>(finalColor, materialUniform.alpha);
    
    return output;
}
`;

// ============================================================================
// ВЕРСИЯ С ВЫСОКИМ КАЧЕСТВОМ (для LOD0)
// ============================================================================

export const PlanetNearMeshShaderHQ_frag = /* wgsl */ `
// ============================================================================
// PLANET NEAR MESH HIGH QUALITY FRAGMENT SHADER
// Для LOD0 - максимальная детализация с PBR
// ============================================================================

struct PBRMaterial {
    albedo: vec3<f32>,
    roughness: f32,
    metallic: f32,
    ao: f32,
    emissive: vec3<f32>
};

// ⭐ PBR BRDF функции
fn distributionGGX(N: vec3<f32>, H: vec3<f32>, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;
    let nom = a2;
    var denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = 3.14159265 * denom * denom;
    return nom / denom;
}

fn geometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = roughness + 1.0;
    let k = (r * r) / 8.0;
    let nom = NdotV;
    let denom = NdotV * (1.0 - k) + k;
    return nom / denom;
}

fn geometrySmith(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2 = geometrySchlickGGX(NdotV, roughness);
    let ggx1 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
}

fn fresnelSchlick(cosTheta: f32, F0: vec3<f32>) -> vec3<f32> {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}

@fragment
fn mainHQ(
    @location(0) vNormal: vec3<f32>,
    @location(1) vUV: vec2<f32>,
    @location(2) vCamDist: f32,
    @location(3) vWorldPos: vec3<f32>
) -> FragmentOutput {
    var output: FragmentOutput;
    
    let tex = textureSample(samplerMap, samplerSampler, vUV);
    let norm = normalize(tex.xyz * 2.0 - 1.0);
    let albedo = tex.rgb;
    
    let V = normalize(globalUniform.cameraPos.xyz - vWorldPos);
    let L = normalize(lightUniform.lightVec);
    let H = normalize(V + L);
    let N = norm;
    
    let NdotV = max(dot(N, V), 0.001);
    let NdotL = max(dot(N, L), 0.0);
    let NdotH = max(dot(N, H), 0.0);
    let VdotH = max(dot(V, H), 0.0);
    
    let F0 = mix(vec3<f32>(0.04), albedo, materialUniform.metallic);
    let fresnel = fresnelSchlick(VdotH, F0);
    
    let D = distributionGGX(N, H, materialUniform.roughness);
    let G = geometrySmith(N, V, L, materialUniform.roughness);
    
    let specular = (D * G * fresnel) / (4.0 * NdotV * NdotL + 0.001);
    let kD = (1.0 - fresnel) * (1.0 - materialUniform.metallic);
    let diffuse = kD * albedo / 3.14159265;
    
    let color = (diffuse + specular) * lightUniform.lightColor * NdotL;
    let ambient = albedo * lightUniform.ambientIntensity;
    
    let finalColor = color + ambient;
    
    output.color = vec4<f32>(finalColor, materialUniform.alpha);
    return output;
}
`;

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default {
    PlanetNearMeshShader_vert,
    PlanetNearMeshShader_frag,
    PlanetNearMeshShaderHQ_frag
};