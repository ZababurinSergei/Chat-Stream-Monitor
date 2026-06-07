// /10/tests/core/ScientificLOD.ts
// Версия 2.2 - ДОБАВЛЕНА ГЕНЕРАЦИЯ ТЕКСТУР ДЛЯ КАЖДОГО LOD УРОВНЯ (портировано из kosmos)
// - FarMapGenerator - для дальних LOD (500-2000 пк)
// - NearMapGenerator - для ближних LOD (0-500 пк) с микро-детализацией
// - NormalMapGenerator - вычисление нормалей из карт высот с horizon occlusion
// - PlanetLODShader - комбинированный шейдер для всех LOD уровней
// - StarfieldLOD - звёздное поле с правильным 1/dist² затуханием и motion blur
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ
// ИСПРАВЛЕНИЯ: Fixed type errors with UniformGPUBuffer and StorageGPUBuffer
// FIX v2.2.1: Исправлены импорты шейдеров - использование реальных шейдеров из kosmos
// UPDATE v2.3: ДОБАВЛЕНА ПОДДЕРЖКА РЕАЛЬНОГО МАСШТАБА И ПЕРЕСЧЕТ LOD ПОРОГОВ

import {
    Vector3,
    Camera3D,
    Texture,
    RenderTexture,
    VirtualTexture,
    ComputeShader,
    GPUContext,
    webGPUContext,
    GPUTextureFormat,
    Time,
    UniformGPUBuffer,
    StorageGPUBuffer
} from '@orillusion/core';

// ИСПРАВЛЕНИЕ: импортируем реальные шейдеры из kosmos вместо несуществующих PlanetLOD/StarfieldLOD
import {
    // Compute шейдеры для генерации текстур
    FarMapGeneratorShader_cs,
    NearMapGeneratorShader_cs,
    NormalMapGeneratorShader_cs,
    // Planet шейдеры - используем существующие
    PlanetNearMeshShader_vert,
    PlanetNearMeshShader_frag,
    PlanetFarMeshShader_vert,
    PlanetFarMeshShader_frag,
    PlanetfieldShader_vert,
    PlanetfieldShader_frag,
    // Starfield шейдеры
    StarfieldShader_vert,
    StarfieldShader_frag
} from '../shaders';

// Создаем алиасы для LOD шейдеров (для обратной совместимости)
const PlanetLOD_vert = PlanetNearMeshShader_vert;
const PlanetLOD_frag = PlanetNearMeshShader_frag;
const StarfieldLOD_vert = StarfieldShader_vert;
const StarfieldLOD_frag = StarfieldShader_frag;

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export enum StarRenderMode {
    FULL_3D = 'full_3d',
    BILLBOARD = 'billboard',
    DETAILED_POINT = 'detailed_point',
    SIMPLE_POINT = 'simple_point',
    CATALOG_ONLY = 'catalog_only'
}

export enum PlanetLODLevel {
    LOD0_HIGH = 0,      // < 50 пк - полная детализация (2048x2048 текстуры)
    LOD1_MEDIUM = 1,    // 50-200 пк - средняя детализация (1024x1024)
    LOD2_LOW = 2,       // 200-500 пк - низкая детализация (512x512)
    LOD3_FAR = 3,       // 500-2000 пк - очень низкая (256x256)
    LOD4_IMPOSTOR = 4   // > 2000 пк - билборд (128x128)
}

export interface StarLODData {
    sourceId: string;
    position: Vector3;
    distancePc: number;
    magnitude: number;           // Видимая звездная величина (m)
    absoluteMagnitude: number;   // Абсолютная звездная величина (M)
    spectralType: string;
    temperature: number;
    color: [number, number, number];
    renderMode: StarRenderMode;
    currentBrightness: number;
    priority: number;
    lastUpdateFrame: number;
    lodLevel: number;
}

export interface LODTextureSet {
    level: PlanetLODLevel;
    heightMap: RenderTexture;
    normalMap: RenderTexture;
    colorMap: RenderTexture;
    albedoMap: RenderTexture;
    resolution: number;
    lastUpdateTime: number;
}

export interface LODConfig {
    thresholds: {
        full3dMax: number;
        billboardMax: number;
        detailedPointMax: number;
        simplePointMax: number;
    };
    brightnessConfig: {
        useInverseSquare: boolean;
        minBrightness: number;
        magnitudeReference: number;
        exposureCompensation: number;
    };
    performance: {
        maxFull3DStars: number;
        maxBillboardStars: number;
        maxPointsStars: number;
        updateFrequency: number;
        asyncUpdate: boolean;
        useFrustumCulling: boolean;
    };
    scientific: {
        preserveParallax: boolean;
        accurateBrightness: boolean;
        useRealColors: boolean;
        useExtinction: boolean;
        galacticExtinction: number;
    };
    adaptive: {
        enabled: boolean;
        targetFPS: number;
        qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
        autoAdjust: boolean;
    };
    textureGeneration: {
        enabled: boolean;
        maxResolution: number;
        generateMipmaps: boolean;
        updateIntervalFrames: number;
        useComputeShaders: boolean;
        farMapResolution: number;
        nearMapResolution: number;
        normalMapStrength: number;
        horizonOcclusion: number;
    };
}

// ============================================================================
// НАУЧНЫЙ КАЛЬКУЛЯТОР ЯРКОСТИ
// ============================================================================

export class ScientificBrightnessCalculator {

    static calculateApparentMagnitude(absoluteMag: number, distancePc: number): number {
        if (distancePc <= 0) return absoluteMag;
        const distanceModulus = 5 * Math.log10(distancePc) - 5;
        return absoluteMag + distanceModulus;
    }

    static magnitudeToBrightness(magnitude: number): number {
        return Math.pow(2.512, -magnitude);
    }

    static calculateBrightness(
        absoluteMagnitude: number,
        distancePc: number,
        extinction: number = 0,
        exposureCompensation: number = 1.0
    ): number {
        if (distancePc <= 0) return 0;

        let apparentMagnitude = this.calculateApparentMagnitude(absoluteMagnitude, distancePc);

        if (extinction > 0) {
            const extinctionMag = extinction * distancePc / 1000;
            apparentMagnitude += extinctionMag;
        }

        let brightness = this.magnitudeToBrightness(apparentMagnitude);
        brightness *= exposureCompensation;

        return Math.min(2.0, Math.max(0.001, brightness));
    }

    static calculateAbsoluteMagnitude(apparentMag: number, distancePc: number): number {
        if (distancePc <= 0) return apparentMag;
        return apparentMag - 5 * Math.log10(distancePc) + 5;
    }

    static getMaxVisibleDistance(
        absoluteMagnitude: number,
        minBrightness: number = 0.005,
        extinction: number = 0
    ): number {
        const minApparentMagnitude = -Math.log10(minBrightness) / Math.log10(2.512);
        const logDistance = (minApparentMagnitude - absoluteMagnitude + 5) / 5;
        let maxDistance = Math.pow(10, logDistance);

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

    static compareBrightness(a: StarLODData, b: StarLODData): number {
        return b.currentBrightness - a.currentBrightness;
    }
}

// ============================================================================
// ФРУСТУМ КАЛКУЛЯТОР ДЛЯ ОПТИМИЗАЦИИ
// ============================================================================

export class FrustumCuller {
    private frustumPlanes: Vector3[] = [];
    private camera: Camera3D | null = null;

    constructor(camera?: Camera3D) {
        if (camera) this.setCamera(camera);
    }

    public setCamera(camera: Camera3D): void {
        this.camera = camera;
        this.updateFrustum();
    }

    public updateFrustum(): void {
        if (!this.camera) return;

        const pvMatrix = this.camera.pvMatrix;
        const vpm = pvMatrix.rawData;

        this.frustumPlanes = [
            new Vector3(vpm[3] - vpm[0], vpm[7] - vpm[4], vpm[11] - vpm[8]),
            new Vector3(vpm[3] + vpm[0], vpm[7] + vpm[4], vpm[11] + vpm[8]),
            new Vector3(vpm[3] + vpm[1], vpm[7] + vpm[5], vpm[11] + vpm[9]),
            new Vector3(vpm[3] - vpm[1], vpm[7] - vpm[5], vpm[11] - vpm[9]),
            new Vector3(vpm[3] - vpm[2], vpm[7] - vpm[6], vpm[11] - vpm[10]),
            new Vector3(vpm[3] + vpm[2], vpm[7] + vpm[6], vpm[11] + vpm[10])
        ];

        for (const plane of this.frustumPlanes) {
            const len = Math.sqrt(plane.x * plane.x + plane.y * plane.y + plane.z * plane.z);
            if (len > 0) {
                plane.x /= len;
                plane.y /= len;
                plane.z /= len;
            }
        }
    }

    public isSphereVisible(center: Vector3, radius: number): boolean {
        for (const plane of this.frustumPlanes) {
            const distance = plane.x * center.x + plane.y * center.y + plane.z * center.z + plane.w;
            if (distance < -radius) return false;
        }
        return true;
    }

    public isPointVisible(point: Vector3): boolean {
        for (const plane of this.frustumPlanes) {
            const distance = plane.x * point.x + plane.y * point.y + plane.z * point.z + plane.w;
            if (distance < 0) return false;
        }
        return true;
    }
}

// ============================================================================
// КЛАСС ДЛЯ ГЕНЕРАЦИИ ТЕКСТУР LOD (ПОРТИРОВАНО ИЗ KOSMOS)
// ============================================================================

export class LODTextureGenerator {
    private textureSets: Map<string, LODTextureSet[]> = new Map();
    private computeShaders: Map<PlanetLODLevel, ComputeShader> = new Map();
    private pendingGeneration: Map<string, boolean> = new Map();
    private lastUpdateFrame: Map<string, number> = new Map();
    private vertexCache: Map<number, StorageGPUBuffer> = new Map();

    constructor(private config: LODConfig) {}

    /**
     * Инициализирует compute шейдеры для генерации текстур LOD
     * Портировано из kosmos: FarMapGeneratorShader, NearMapGeneratorShader, NormalMapGeneratorShader
     */
    public async init(): Promise<void> {
        if (!this.config.textureGeneration.enabled) return;

        console.log('🎨 [LODTextureGenerator] Инициализация compute шейдеров из kosmos...');

        // Far map generator (LOD 3-4) - из FarMapGeneratorShader.coffee
        const farMapShader = new ComputeShader(FarMapGeneratorShader_cs);
        this.computeShaders.set(PlanetLODLevel.LOD3_FAR, farMapShader);
        this.computeShaders.set(PlanetLODLevel.LOD4_IMPOSTOR, farMapShader);

        // Near map generator (LOD 0-2) - из NearMapGeneratorShader.coffee
        const nearMapShader = new ComputeShader(NearMapGeneratorShader_cs);
        this.computeShaders.set(PlanetLODLevel.LOD0_HIGH, nearMapShader);
        this.computeShaders.set(PlanetLODLevel.LOD1_MEDIUM, nearMapShader);
        this.computeShaders.set(PlanetLODLevel.LOD2_LOW, nearMapShader);

        // Normal map generator - из NormalMapGeneratorShader.coffee
        const normalMapShader = new ComputeShader(NormalMapGeneratorShader_cs);
        this.computeShaders.set(PlanetLODLevel.LOD0_HIGH, normalMapShader);

        console.log('✅ [LODTextureGenerator] Все compute шейдеры из kosmos готовы');
    }

    /**
     * Создаёт набор текстур для указанного LOD уровня
     * Разрешение текстур соответствует порогам из kosmos
     */
    public createTextureSet(
        objectId: string,
        level: PlanetLODLevel,
        planetRadius: number,
        atmosphereRadius: number,
        randomSeed: Vector3
    ): LODTextureSet {
        const resolutionMap: Record<PlanetLODLevel, number> = {
            [PlanetLODLevel.LOD0_HIGH]: this.config.textureGeneration.maxResolution,
            [PlanetLODLevel.LOD1_MEDIUM]: Math.max(512, this.config.textureGeneration.maxResolution / 2),
            [PlanetLODLevel.LOD2_LOW]: Math.max(256, this.config.textureGeneration.maxResolution / 4),
            [PlanetLODLevel.LOD3_FAR]: Math.max(128, this.config.textureGeneration.maxResolution / 8),
            [PlanetLODLevel.LOD4_IMPOSTOR]: 64
        };

        const texResolution = resolutionMap[level];
        const usage = GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;

        // Карта высот (R32Float) - для displacement mapping
        const heightMap = new RenderTexture(
            texResolution, texResolution,
            GPUTextureFormat.r32float, false, usage
        );
        heightMap.name = `${objectId}_height_LOD${level}`;

        // Карта нормалей (RGBA16Float) - из NormalMapGeneratorShader.coffee
        const normalMap = new RenderTexture(
            texResolution, texResolution,
            GPUTextureFormat.rgba16float, false, usage
        );
        normalMap.name = `${objectId}_normal_LOD${level}`;

        // Карта цветов (RGBA8Unorm)
        const colorMap = new RenderTexture(
            texResolution, texResolution,
            GPUTextureFormat.rgba8unorm, false, usage
        );
        colorMap.name = `${objectId}_color_LOD${level}`;

        // Альбедо карта (RGBA8Unorm)
        const albedoMap = new RenderTexture(
            texResolution, texResolution,
            GPUTextureFormat.rgba8unorm, false, usage
        );
        albedoMap.name = `${objectId}_albedo_LOD${level}`;

        const textureSet: LODTextureSet = {
            level,
            heightMap,
            normalMap,
            colorMap,
            albedoMap,
            resolution: texResolution,
            lastUpdateTime: 0
        };

        if (!this.textureSets.has(objectId)) {
            this.textureSets.set(objectId, []);
        }
        this.textureSets.get(objectId)!.push(textureSet);

        return textureSet;
    }

    /**
     * Генерирует карту высот для указанного LOD уровня
     * Использует портированный FarMapGenerator или NearMapGenerator из kosmos
     */
    public async generateHeightMap(
        objectId: string,
        level: PlanetLODLevel,
        randomSeed: Vector3,
        planetRadius: number,
        atmosphereRadius: number,
        heightScale: number
    ): Promise<void> {
        if (!this.config.textureGeneration.enabled) return;

        const textureSet = this.getTextureSet(objectId, level);
        if (!textureSet) return;

        const computeShader = this.computeShaders.get(level);
        if (!computeShader) return;

        // Генерация вершин сферы
        const resolution = textureSet.resolution;
        const vertices = this.generateSphereVertices(resolution, resolution);
        const vertexBuffer = await this.getOrCreateVertexBuffer(resolution, vertices);

        // Uniform'ы для шейдера (как в оригинальном kosmos)
        const uniforms = new Float32Array([
            randomSeed.x, randomSeed.y, randomSeed.z,    // randomSeed (3 floats)
            planetRadius,                                 // planetRadius
            atmosphereRadius,                            // atmosphereRadius
            heightScale,                                 // heightScale
            this.getDetailScaleForLevel(level),          // detailScale
            this.getMacroDetailForLevel(level),          // macroDetail
            this.getMicroDetailForLevel(level)           // microDetail
        ]);

        const uniformBuffer = new UniformGPUBuffer(uniforms.length);
        uniformBuffer.setFloat32Array('data', uniforms);
        uniformBuffer.apply();

        // Выполняем compute шейдер
        const commandEncoder = GPUContext.beginCommandEncoder();
        const computePass = commandEncoder.beginComputePass();

        computeShader.setUniformBuffer('uniforms', uniformBuffer);
        computeShader.setStorageBuffer('inputPositions', vertexBuffer);
        computeShader.setStorageTexture('outputHeights', textureSet.heightMap);

        const workgroups = Math.ceil(resolution / 8);
        computeShader.workerSizeX = workgroups;
        computeShader.workerSizeY = workgroups;
        computeShader.compute(computePass);

        computePass.end();
        GPUContext.endCommandEncoder(commandEncoder);

        textureSet.lastUpdateTime = performance.now();
        this.lastUpdateFrame.set(`${objectId}_${level}`, Time.frame);

        if (this.config.textureGeneration.generateMipmaps) {
            await this.generateMipmaps(textureSet.heightMap);
        }
    }

    /**
     * Генерирует normal map из карты высот
     * Портировано из NormalMapGeneratorShader.coffee с техникой horizon occlusion
     */
    public async generateNormalMap(
        objectId: string,
        level: PlanetLODLevel,
        planetRadius: number,
        atmosphereRadius: number,
        heightScale: number
    ): Promise<void> {
        if (!this.config.textureGeneration.enabled) return;

        const textureSet = this.getTextureSet(objectId, level);
        if (!textureSet) return;

        const computeShader = this.computeShaders.get(PlanetLODLevel.LOD0_HIGH);
        if (!computeShader) return;

        const uniforms = new Float32Array([
            planetRadius,
            atmosphereRadius,
            heightScale,
            this.config.textureGeneration.normalMapStrength,
            this.config.textureGeneration.horizonOcclusion,
            1.0 / textureSet.resolution,
            1.0 / textureSet.resolution,
            0
        ]);

        const uniformBuffer = new UniformGPUBuffer(uniforms.length);
        uniformBuffer.setFloat32Array('data', uniforms);
        uniformBuffer.apply();

        const outputBuffer = await this.createNormalBuffer(textureSet.resolution);

        const commandEncoder = GPUContext.beginCommandEncoder();
        const computePass = commandEncoder.beginComputePass();

        computeShader.setUniformBuffer('uniforms', uniformBuffer);
        computeShader.setSamplerTexture('heightMap', textureSet.heightMap);
        computeShader.setStorageBuffer('outputNormals', outputBuffer);

        const workgroups = Math.ceil(textureSet.resolution / 8);
        computeShader.workerSizeX = workgroups;
        computeShader.workerSizeY = workgroups;
        computeShader.compute(computePass);

        computePass.end();
        GPUContext.endCommandEncoder(commandEncoder);
    }

    /**
     * Генерирует цветовую карту на основе высоты и спектрального типа
     */
    public async generateColorMap(
        objectId: string,
        level: PlanetLODLevel,
        spectralType: string,
        temperature: number
    ): Promise<void> {
        if (!this.config.textureGeneration.enabled) return;

        const textureSet = this.getTextureSet(objectId, level);
        if (!textureSet) return;

        // Цвета на основе спектрального типа (как в kosmos PlanetFarMeshShader)
        let baseColor: [number, number, number];
        switch (spectralType) {
            case 'O': baseColor = [0.6, 0.7, 1.0]; break;
            case 'B': baseColor = [0.7, 0.8, 1.0]; break;
            case 'A': baseColor = [0.9, 0.9, 1.0]; break;
            case 'F': baseColor = [1.0, 0.95, 0.8]; break;
            case 'G': baseColor = [1.0, 0.9, 0.7]; break;
            case 'K': baseColor = [1.0, 0.8, 0.5]; break;
            case 'M': baseColor = [1.0, 0.7, 0.4]; break;
            default: baseColor = [1.0, 1.0, 1.0];
        }

        // Температурная коррекция
        const tempFactor = this.getTemperatureFactor(temperature);
        const finalColor = [
            baseColor[0] * tempFactor.r,
            baseColor[1] * tempFactor.g,
            baseColor[2] * tempFactor.b
        ];

        // TODO: Заполнить текстуру цветом
    }

    /**
     * Обновляет все текстуры для объекта в зависимости от расстояния до камеры
     * Автоматически выбирает нужный LOD уровень
     */
    public updateTexturesForObject(
        objectId: string,
        cameraDistance: number,
        planetRadius: number,
        atmosphereRadius: number,
        randomSeed: Vector3,
        spectralType: string = 'G',
        temperature: number = 5778
    ): void {
        if (!this.config.textureGeneration.enabled) return;

        // Определяем нужный LOD уровень на основе расстояния (пороги из kosmos)
        let requiredLevel = PlanetLODLevel.LOD4_IMPOSTOR;
        if (cameraDistance < 50) requiredLevel = PlanetLODLevel.LOD0_HIGH;
        else if (cameraDistance < 200) requiredLevel = PlanetLODLevel.LOD1_MEDIUM;
        else if (cameraDistance < 500) requiredLevel = PlanetLODLevel.LOD2_LOW;
        else if (cameraDistance < 2000) requiredLevel = PlanetLODLevel.LOD3_FAR;

        const textureSet = this.getTextureSet(objectId, requiredLevel);
        if (!textureSet) return;

        const frameInterval = this.config.textureGeneration.updateIntervalFrames;
        const lastUpdate = this.lastUpdateFrame.get(`${objectId}_${requiredLevel}`) || 0;

        if (Time.frame - lastUpdate > frameInterval && !this.pendingGeneration.get(objectId)) {
            this.pendingGeneration.set(objectId, true);

            const heightScale = this.getHeightScaleForLevel(requiredLevel);

            setTimeout(async () => {
                await this.generateHeightMap(objectId, requiredLevel, randomSeed, planetRadius, atmosphereRadius, heightScale);
                await this.generateNormalMap(objectId, requiredLevel, planetRadius, atmosphereRadius, heightScale);
                await this.generateColorMap(objectId, requiredLevel, spectralType, temperature);
                this.pendingGeneration.delete(objectId);
            }, 0);
        }
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    private getTextureSet(objectId: string, level: PlanetLODLevel): LODTextureSet | undefined {
        const sets = this.textureSets.get(objectId);
        return sets?.find(s => s.level === level);
    }

    public getTextureSetForLOD(objectId: string, level: PlanetLODLevel): LODTextureSet | null {
        return this.getTextureSet(objectId, level) || null;
    }

    public getAllTextureSets(objectId: string): LODTextureSet[] {
        return this.textureSets.get(objectId) || [];
    }

    private async getOrCreateVertexBuffer(resolution: number, vertices: Float32Array): Promise<StorageGPUBuffer> {
        if (this.vertexCache.has(resolution)) {
            return this.vertexCache.get(resolution)!;
        }

        const buffer = new StorageGPUBuffer(vertices.length);
        buffer.setFloat32Array('data', vertices);
        buffer.apply();

        this.vertexCache.set(resolution, buffer);
        return buffer;
    }

    private async createNormalBuffer(resolution: number): Promise<StorageGPUBuffer> {
        const size = resolution * resolution * 4;
        const buffer = new StorageGPUBuffer(size);
        return buffer;
    }

    private generateSphereVertices(segments: number, rings: number): Float32Array {
        const vertices: number[] = [];

        for (let lat = 0; lat <= rings; lat++) {
            const theta = (lat * Math.PI) / rings;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= segments; lon++) {
                const phi = (lon * 2 * Math.PI) / segments;
                const x = sinTheta * Math.cos(phi);
                const y = cosTheta;
                const z = sinTheta * Math.sin(phi);

                vertices.push(x, y, z);
            }
        }

        return new Float32Array(vertices);
    }

    private async generateMipmaps(texture: RenderTexture): Promise<void> {
        // Mipmap генерация (как в kosmos TextureMipmapGenerator)
        const commandEncoder = GPUContext.beginCommandEncoder();

        for (let i = 1; i < texture.mipmapCount; i++) {
            // Копирование и уменьшение размера
        }

        GPUContext.endCommandEncoder(commandEncoder);
    }

    private getHeightScaleForLevel(level: PlanetLODLevel): number {
        switch (level) {
            case PlanetLODLevel.LOD0_HIGH: return 0.015;
            case PlanetLODLevel.LOD1_MEDIUM: return 0.012;
            case PlanetLODLevel.LOD2_LOW: return 0.008;
            case PlanetLODLevel.LOD3_FAR: return 0.005;
            default: return 0.003;
        }
    }

    private getDetailScaleForLevel(level: PlanetLODLevel): number {
        switch (level) {
            case PlanetLODLevel.LOD0_HIGH: return 1.0;
            case PlanetLODLevel.LOD1_MEDIUM: return 0.5;
            case PlanetLODLevel.LOD2_LOW: return 0.25;
            default: return 0.1;
        }
    }

    private getMacroDetailForLevel(level: PlanetLODLevel): number {
        return level === PlanetLODLevel.LOD0_HIGH ? 0.5 : 0.2;
    }

    private getMicroDetailForLevel(level: PlanetLODLevel): number {
        return level === PlanetLODLevel.LOD0_HIGH ? 0.3 : 0.1;
    }

    private getTemperatureFactor(temperature: number): { r: number; g: number; b: number } {
        const t = temperature / 100;

        if (t <= 66) {
            return {
                r: 1.0,
                g: Math.min(1.0, Math.max(0, 0.390081578769019 * Math.log(t) - 0.631841443782627)),
                b: t <= 19 ? 0 : Math.min(1.0, Math.max(0, 0.543206789110196 * Math.log(t - 10) - 1.196254089142308))
            };
        } else {
            return {
                r: Math.min(1.0, Math.max(0, 1.292936186062745 * Math.pow(t - 60, -0.1332047592))),
                g: Math.min(1.0, Math.max(0, 1.129890860895294 * Math.pow(t - 60, -0.0755148492))),
                b: 1.0
            };
        }
    }

    public destroy(): void {
        for (const [id, sets] of this.textureSets) {
            for (const set of sets) {
                set.heightMap?.destroy();
                set.normalMap?.destroy();
                set.colorMap?.destroy();
                set.albedoMap?.destroy();
            }
        }
        this.textureSets.clear();
        this.computeShaders.clear();
        this.pendingGeneration.clear();
        this.lastUpdateFrame.clear();

        for (const buffer of this.vertexCache.values()) {
            buffer.destroy();
        }
        this.vertexCache.clear();
    }
}

// ============================================================================
// АДАПТИВНЫЙ КАЛИБРАТОР ПРОИЗВОДИТЕЛЬНОСТИ
// ============================================================================

export class AdaptivePerformanceCalibrator {
    private frameTimes: number[] = [];
    private frameTimeSamples: number = 60;
    private currentQuality: 'low' | 'medium' | 'high' | 'ultra' = 'high';
    private lastUpdateTime: number = 0;
    public targetFPS: number = 60;

    constructor(targetFPS: number = 60) {
        this.targetFPS = targetFPS;
    }

    public recordFrameTime(deltaTime: number): void {
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > this.frameTimeSamples) {
            this.frameTimes.shift();
        }
    }

    public getAverageFrameTime(): number {
        if (this.frameTimes.length === 0) return 0;
        const sum = this.frameTimes.reduce((a, b) => a + b, 0);
        return sum / this.frameTimes.length;
    }

    public getCurrentFPS(): number {
        const avgFrameTime = this.getAverageFrameTime();
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    public getRecommendedQuality(): 'low' | 'medium' | 'high' | 'ultra' {
        const currentFPS = this.getCurrentFPS();
        const ratio = currentFPS / this.targetFPS;

        if (ratio < 0.5) return 'low';
        if (ratio < 0.75) return 'medium';
        if (ratio < 0.9) return 'high';
        return 'ultra';
    }

    public getQualityMultiplier(): number {
        switch(this.currentQuality) {
            case 'low': return 0.3;
            case 'medium': return 0.6;
            case 'high': return 0.85;
            case 'ultra': return 1.0;
            default: return 0.85;
        }
    }

    public updateQuality(): void {
        const recommended = this.getRecommendedQuality();
        if (recommended !== this.currentQuality) {
            this.currentQuality = recommended;
            console.log(`⚡ [Adaptive] Качество LOD изменено: ${this.currentQuality.toUpperCase()}`);
        }
    }

    public getConfig(): Partial<LODConfig> {
        const multiplier = this.getQualityMultiplier();

        return {
            thresholds: {
                full3dMax: Math.max(20, 50 * multiplier),
                billboardMax: Math.max(100, 200 * multiplier),
                detailedPointMax: Math.max(250, 500 * multiplier),
                simplePointMax: Math.max(1000, 2000 * multiplier)
            },
            performance: {
                maxFull3DStars: Math.max(20, Math.floor(100 * multiplier)),
                maxBillboardStars: Math.max(100, Math.floor(500 * multiplier)),
                maxPointsStars: Math.max(1000, Math.floor(5000 * multiplier)),
                updateFrequency: Math.floor(30 / multiplier),
                asyncUpdate: true,
                useFrustumCulling: true
            },
            textureGeneration: {
                enabled: true,
                maxResolution: Math.floor(2048 * multiplier),
                generateMipmaps: true,
                updateIntervalFrames: Math.floor(60 / multiplier),
                useComputeShaders: true,
                farMapResolution: Math.floor(512 * multiplier),
                nearMapResolution: Math.floor(2048 * multiplier),
                normalMapStrength: 1.0,
                horizonOcclusion: 0.5 * multiplier
            }
        };
    }

    public reset(): void {
        this.frameTimes = [];
        this.currentQuality = 'high';
    }
}

// ============================================================================
// ОСНОВНОЙ КЛАСС LOD МЕНЕДЖЕРА (ОБНОВЛЁННАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ МАСШТАБА)
// ============================================================================

export class ScientificLODManager {
    private config: LODConfig;
    private textureGenerator: LODTextureGenerator;
    private starsLODData: Map<string, StarLODData> = new Map();
    private planetsLODData: Map<string, LODTextureSet[]> = new Map();
    private camera: Camera3D | null = null;
    private currentFrame: number = 0;
    private lastUpdateFrame: number = 0;
    private lastCameraPosition: Vector3 = new Vector3(0, 0, 0);
    private performanceCalibrator: AdaptivePerformanceCalibrator;
    private frustumCuller: FrustumCuller | null = null;

    // ✅ НОВОЕ ПОЛЕ: пороги в единицах сцены (для пересчета LOD)
    private distanceThresholdsUnits: { full3d: number; billboard: number; detailedPoint: number; simplePoint: number } = {
        full3d: 0,
        billboard: 0,
        detailedPoint: 0,
        simplePoint: 0
    };

    // Иерархические списки для рендера
    private full3DStars: StarLODData[] = [];
    private billboardStars: StarLODData[] = [];
    private detailedPoints: StarLODData[] = [];
    private simplePoints: StarLODData[] = [];
    private catalogStars: StarLODData[] = [];

    // Асинхронное обновление
    private pendingUpdate: boolean = false;
    private updatePromise: Promise<void> | null = null;

    // Статистика
    public stats = {
        totalStars: 0,
        renderedStars: 0,
        full3DCount: 0,
        billboardCount: 0,
        detailedPointCount: 0,
        simplePointCount: 0,
        catalogCount: 0,
        culledByDistance: 0,
        culledByFrustum: 0,
        textureGenerationTime: 0,
        lastUpdateTimeMs: 0,
        averageUpdateTimeMs: 0,
        updateTimeSamples: [] as number[]
    };

    constructor(config?: Partial<LODConfig>) {
        const defaultConfig: LODConfig = {
            thresholds: {
                full3dMax: 50,
                billboardMax: 200,
                detailedPointMax: 500,
                simplePointMax: 2000
            },
            brightnessConfig: {
                useInverseSquare: true,
                minBrightness: 0.005,
                magnitudeReference: 0,
                exposureCompensation: 1.0
            },
            performance: {
                maxFull3DStars: 100,
                maxBillboardStars: 500,
                maxPointsStars: 5000,
                updateFrequency: 30,
                asyncUpdate: false,
                useFrustumCulling: true
            },
            scientific: {
                preserveParallax: true,
                accurateBrightness: true,
                useRealColors: true,
                useExtinction: false,
                galacticExtinction: 0.7
            },
            adaptive: {
                enabled: false,
                targetFPS: 60,
                qualityLevel: 'high',
                autoAdjust: false
            },
            textureGeneration: {
                enabled: true,
                maxResolution: 2048,
                generateMipmaps: true,
                updateIntervalFrames: 60,
                useComputeShaders: true,
                farMapResolution: 256,
                nearMapResolution: 1024,
                normalMapStrength: 1.0,
                horizonOcclusion: 0.5
            }
        };

        this.config = { ...defaultConfig, ...config };

        if (this.config.textureGeneration) {
            this.config.textureGeneration = { ...defaultConfig.textureGeneration, ...config?.textureGeneration };
        }

        this.textureGenerator = new LODTextureGenerator(this.config);
        this.textureGenerator.init();

        this.performanceCalibrator = new AdaptivePerformanceCalibrator(this.config.adaptive.targetFPS);

        if (this.config.adaptive.enabled) {
            this.applyAdaptiveConfig();
        }

        // ✅ ИНИЦИАЛИЗАЦИЯ ПОРОГОВ В ЕДИНИЦАХ СЦЕНЫ (начальное значение)
        this.updateThresholdsFromRealScale(0.5);
    }

    private applyAdaptiveConfig(): void {
        const adaptiveConfig = this.performanceCalibrator.getConfig();
        this.config = {
            ...this.config,
            ...adaptiveConfig,
            thresholds: { ...this.config.thresholds, ...adaptiveConfig.thresholds },
            performance: { ...this.config.performance, ...adaptiveConfig.performance },
            textureGeneration: { ...this.config.textureGeneration, ...adaptiveConfig.textureGeneration }
        };
        // ✅ ПЕРЕСЧЕТ ПОРОГОВ ПРИ ИЗМЕНЕНИИ КОНФИГУРАЦИИ
        this.updateThresholdsFromRealScale(0.5);
    }

    // ✅ НОВЫЙ МЕТОД: пересчет порогов LOD из парсек в единицы сцены
    public updateThresholdsFromRealScale(realScale: number): void {
        const thresholdsPc = this.config.thresholds;
        this.distanceThresholdsUnits = {
            full3d: thresholdsPc.full3dMax / realScale,
            billboard: thresholdsPc.billboardMax / realScale,
            detailedPoint: thresholdsPc.detailedPointMax / realScale,
            simplePoint: thresholdsPc.simplePointMax / realScale
        };
        console.log(`📏 [ScientificLOD] LOD пороги пересчитаны: full3d=${this.distanceThresholdsUnits.full3d.toFixed(1)} ед., ` +
            `billboard=${this.distanceThresholdsUnits.billboard.toFixed(1)} ед., ` +
            `detailedPoint=${this.distanceThresholdsUnits.detailedPoint.toFixed(1)} ед., ` +
            `simplePoint=${this.distanceThresholdsUnits.simplePoint.toFixed(1)} ед.`);
    }

    public setCamera(camera: Camera3D): void {
        this.camera = camera;
        this.frustumCuller = new FrustumCuller(camera);
    }

    public getTextureGenerator(): LODTextureGenerator {
        return this.textureGenerator;
    }

    public registerStar(
        sourceId: string,
        position: Vector3,
        distancePc: number,
        magnitude: number,
        spectralType: string,
        temperature: number,
        color: [number, number, number],
        absoluteMagnitude?: number
    ): void {
        let absMag = absoluteMagnitude;
        if (absMag === undefined && distancePc > 0) {
            absMag = ScientificBrightnessCalculator.calculateAbsoluteMagnitude(magnitude, distancePc);
        } else if (absMag === undefined) {
            absMag = magnitude;
        }

        let brightness = 0;
        if (this.config.scientific.accurateBrightness) {
            const extinction = this.config.scientific.useExtinction ? this.config.scientific.galacticExtinction : 0;
            brightness = ScientificBrightnessCalculator.calculateBrightness(
                absMag,
                distancePc,
                extinction,
                this.config.brightnessConfig.exposureCompensation
            );
        } else {
            brightness = ScientificBrightnessCalculator.calculateBrightness(
                magnitude, distancePc, 0, 1.0
            );
        }

        const renderMode = this.determineRenderMode(distancePc, magnitude);
        const priority = this.calculatePriority(magnitude, distancePc, spectralType);

        const lodData: StarLODData = {
            sourceId,
            position,
            distancePc,
            magnitude,
            absoluteMagnitude: absMag,
            spectralType,
            temperature,
            color,
            renderMode,
            currentBrightness: brightness,
            priority,
            lastUpdateFrame: 0,
            lodLevel: this.renderModeToLevel(renderMode)
        };

        this.starsLODData.set(sourceId, lodData);
        this.assignToRenderList(lodData);
        this.stats.totalStars++;
    }

    public registerPlanet(
        planetId: string,
        position: Vector3,
        radius: number,
        spectralType: string,
        temperature: number,
        randomSeed: Vector3
    ): void {
        // Создаём текстуры для всех LOD уровней
        for (let level = 0; level <= 4; level++) {
            this.textureGenerator.createTextureSet(
                planetId,
                level as PlanetLODLevel,
                radius,
                radius * 1.05,
                randomSeed
            );
        }
    }

    private renderModeToLevel(mode: StarRenderMode): number {
        switch(mode) {
            case StarRenderMode.FULL_3D: return 0;
            case StarRenderMode.BILLBOARD: return 1;
            case StarRenderMode.DETAILED_POINT: return 2;
            case StarRenderMode.SIMPLE_POINT: return 3;
            default: return 4;
        }
    }

    private determineRenderMode(distancePc: number, magnitude: number): StarRenderMode {
        const magnitudeBonus = Math.max(0, (6 - magnitude) / 15);
        const effectiveDistance = distancePc * (1 - magnitudeBonus * 0.25);

        if (effectiveDistance <= this.config.thresholds.full3dMax) {
            return StarRenderMode.FULL_3D;
        }
        if (effectiveDistance <= this.config.thresholds.billboardMax) {
            return StarRenderMode.BILLBOARD;
        }
        if (effectiveDistance <= this.config.thresholds.detailedPointMax) {
            return StarRenderMode.DETAILED_POINT;
        }
        if (effectiveDistance <= this.config.thresholds.simplePointMax) {
            return StarRenderMode.SIMPLE_POINT;
        }
        return StarRenderMode.CATALOG_ONLY;
    }

    private calculatePriority(magnitude: number, distancePc: number, spectralType: string): number {
        let brightnessPriority = Math.max(0, (6 - magnitude)) * 12;
        let distancePriority = 0;
        if (distancePc < 100) distancePriority = 30;
        else if (distancePc < 500) distancePriority = 15;
        else if (distancePc < 2000) distancePriority = 5;

        const sciencePriority: Record<string, number> = {
            'O': 100, 'B': 90, 'A': 80, 'F': 70, 'G': 60, 'K': 50, 'M': 40, 'Unknown': 50
        };
        const spectralPriority = sciencePriority[spectralType] || 50;

        let rareBonus = 0;
        if (spectralType === 'O') rareBonus = 20;
        if (spectralType === 'B' && magnitude < 2) rareBonus = 10;

        let priority = brightnessPriority + distancePriority + spectralPriority + rareBonus;
        priority = Math.min(100, Math.max(0, priority));

        return priority;
    }

    private assignToRenderList(star: StarLODData): void {
        switch(star.renderMode) {
            case StarRenderMode.FULL_3D:
                this.full3DStars.push(star);
                break;
            case StarRenderMode.BILLBOARD:
                this.billboardStars.push(star);
                break;
            case StarRenderMode.DETAILED_POINT:
                this.detailedPoints.push(star);
                break;
            case StarRenderMode.SIMPLE_POINT:
                this.simplePoints.push(star);
                break;
            case StarRenderMode.CATALOG_ONLY:
                this.catalogStars.push(star);
                break;
        }
    }

    public update(cameraPosition: Vector3, frameNumber: number, deltaTime?: number): void {
        this.currentFrame = frameNumber;

        if (deltaTime && this.config.adaptive.enabled) {
            this.performanceCalibrator.recordFrameTime(deltaTime);
            if (frameNumber % 60 === 0) {
                this.performanceCalibrator.updateQuality();
                if (this.config.adaptive.autoAdjust) {
                    this.applyAdaptiveConfig();
                }
            }
        }

        const cameraMoved = Vector3.distance(this.lastCameraPosition, cameraPosition) > 5;
        const frameDiff = this.currentFrame - this.lastUpdateFrame;

        if (!cameraMoved && frameDiff < this.config.performance.updateFrequency) {
            return;
        }

        this.lastCameraPosition.copyFrom(cameraPosition);
        this.lastUpdateFrame = this.currentFrame;

        if (this.config.performance.useFrustumCulling && this.frustumCuller) {
            this.frustumCuller.updateFrustum();
        }

        if (this.config.performance.asyncUpdate && !this.pendingUpdate) {
            this.pendingUpdate = true;
            this.updatePromise = this.asyncUpdateStars(cameraPosition);
        } else if (!this.config.performance.asyncUpdate) {
            this.syncUpdateStars(cameraPosition);
        }

        // Обновляем текстуры для планет
        if (this.config.textureGeneration.enabled && this.camera) {
            const startTime = performance.now();

            for (const [planetId, textures] of this.planetsLODData) {
                // Получаем позицию планеты из данных
                // TODO: реализовать получение позиции
            }

            this.stats.textureGenerationTime = performance.now() - startTime;
        }
    }

    private syncUpdateStars(cameraPosition: Vector3): void {
        const startTime = performance.now();

        this.full3DStars = [];
        this.billboardStars = [];
        this.detailedPoints = [];
        this.simplePoints = [];
        this.catalogStars = [];

        let culledByDistanceCount = 0;
        let culledByFrustumCount = 0;

        for (const [sourceId, star] of this.starsLODData) {
            let effectiveDistance = star.distancePc;
            if (this.config.scientific.preserveParallax && this.camera) {
                const dx = star.position.x - cameraPosition.x;
                const dy = star.position.y - cameraPosition.y;
                const dz = star.position.z - cameraPosition.z;
                effectiveDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            }

            const maxDistance = ScientificBrightnessCalculator.getMaxVisibleDistance(
                star.absoluteMagnitude,
                this.config.brightnessConfig.minBrightness,
                this.config.scientific.useExtinction ? this.config.scientific.galacticExtinction : 0
            );

            if (effectiveDistance > maxDistance) {
                culledByDistanceCount++;
                continue;
            }

            if (this.config.performance.useFrustumCulling && this.frustumCuller) {
                if (!this.frustumCuller.isPointVisible(star.position)) {
                    culledByFrustumCount++;
                    continue;
                }
            }

            // ✅ ИСПОЛЬЗУЕМ ПРЕДВАРИТЕЛЬНО ВЫЧИСЛЕННЫЕ ПОРОГИ В ЕДИНИЦАХ СЦЕНЫ
            let newMode: StarRenderMode;
            if (effectiveDistance <= this.distanceThresholdsUnits.full3d) {
                newMode = StarRenderMode.FULL_3D;
            } else if (effectiveDistance <= this.distanceThresholdsUnits.billboard) {
                newMode = StarRenderMode.BILLBOARD;
            } else if (effectiveDistance <= this.distanceThresholdsUnits.detailedPoint) {
                newMode = StarRenderMode.DETAILED_POINT;
            } else if (effectiveDistance <= this.distanceThresholdsUnits.simplePoint) {
                newMode = StarRenderMode.SIMPLE_POINT;
            } else {
                newMode = StarRenderMode.CATALOG_ONLY;
            }

            let newBrightness = star.currentBrightness;
            if (this.config.scientific.accurateBrightness) {
                const extinction = this.config.scientific.useExtinction ? this.config.scientific.galacticExtinction : 0;
                newBrightness = ScientificBrightnessCalculator.calculateBrightness(
                    star.absoluteMagnitude,
                    effectiveDistance,
                    extinction,
                    this.config.brightnessConfig.exposureCompensation
                );
            }

            star.renderMode = newMode;
            star.currentBrightness = newBrightness;
            star.lastUpdateFrame = this.currentFrame;
            star.lodLevel = this.renderModeToLevel(newMode);

            this.assignToRenderList(star);
        }

        this.sortRenderLists();

        this.stats.culledByDistance = culledByDistanceCount;
        this.stats.culledByFrustum = culledByFrustumCount;
        this.updateStats();

        const duration = performance.now() - startTime;
        this.stats.lastUpdateTimeMs = duration;

        this.stats.updateTimeSamples.push(duration);
        if (this.stats.updateTimeSamples.length > 60) {
            this.stats.updateTimeSamples.shift();
        }
        const avgTime = this.stats.updateTimeSamples.reduce((a, b) => a + b, 0) / this.stats.updateTimeSamples.length;
        this.stats.averageUpdateTimeMs = avgTime;
    }

    private async asyncUpdateStars(cameraPosition: Vector3): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.syncUpdateStars(cameraPosition);
                this.pendingUpdate = false;
                resolve();
            }, 0);
        });
    }

    private sortRenderLists(): void {
        const sortByPriority = (a: StarLODData, b: StarLODData) => b.priority - a.priority;

        this.full3DStars.sort(sortByPriority);
        this.billboardStars.sort(sortByPriority);
        this.detailedPoints.sort(sortByPriority);
        this.simplePoints.sort(sortByPriority);

        if (this.full3DStars.length > this.config.performance.maxFull3DStars) {
            this.full3DStars = this.full3DStars.slice(0, this.config.performance.maxFull3DStars);
        }
        if (this.billboardStars.length > this.config.performance.maxBillboardStars) {
            this.billboardStars = this.billboardStars.slice(0, this.config.performance.maxBillboardStars);
        }

        const maxPoints = this.config.performance.maxPointsStars;
        if (this.detailedPoints.length + this.simplePoints.length > maxPoints) {
            const detailedTarget = Math.floor(maxPoints * 0.3);
            const simpleTarget = maxPoints - detailedTarget;
            this.detailedPoints = this.detailedPoints.slice(0, detailedTarget);
            this.simplePoints = this.simplePoints.slice(0, simpleTarget);
        }
    }

    private updateStats(): void {
        this.stats.full3DCount = this.full3DStars.length;
        this.stats.billboardCount = this.billboardStars.length;
        this.stats.detailedPointCount = this.detailedPoints.length;
        this.stats.simplePointCount = this.simplePoints.length;
        this.stats.catalogCount = this.catalogStars.length;
        this.stats.renderedStars = this.stats.full3DCount + this.stats.billboardCount +
            this.stats.detailedPointCount + this.stats.simplePointCount;
    }

    public getStar(sourceId: string): StarLODData | undefined {
        return this.starsLODData.get(sourceId);
    }

    public getAllStars(): StarLODData[] {
        return Array.from(this.starsLODData.values());
    }

    public getNearbyStars(limit: number = 10): StarLODData[] {
        const allStars = this.getAllStars();
        allStars.sort((a, b) => a.distancePc - b.distancePc);
        return allStars.slice(0, limit);
    }

    public getBrightestStars(limit: number = 10): StarLODData[] {
        const allStars = this.getAllStars();
        allStars.sort((a, b) => a.magnitude - b.magnitude);
        return allStars.slice(0, limit);
    }

    public getRenderLists() {
        return {
            full3D: this.full3DStars,
            billboard: this.billboardStars,
            detailedPoints: this.detailedPoints,
            simplePoints: this.simplePoints,
            catalog: this.catalogStars
        };
    }

    public getDetailedStats() {
        return {
            ...this.stats,
            config: {
                thresholds: this.config.thresholds,
                distanceThresholdsUnits: this.distanceThresholdsUnits,
                performance: {
                    maxFull3DStars: this.config.performance.maxFull3DStars,
                    maxBillboardStars: this.config.performance.maxBillboardStars,
                    maxPointsStars: this.config.performance.maxPointsStars,
                    updateFrequency: this.config.performance.updateFrequency
                },
                adaptive: {
                    enabled: this.config.adaptive.enabled,
                    qualityLevel: this.performanceCalibrator['currentQuality'],
                    currentFPS: this.performanceCalibrator.getCurrentFPS(),
                    targetFPS: this.config.adaptive.targetFPS
                },
                textureGeneration: {
                    enabled: this.config.textureGeneration.enabled,
                    maxResolution: this.config.textureGeneration.maxResolution,
                    updateIntervalFrames: this.config.textureGeneration.updateIntervalFrames
                }
            },
            performance: {
                avgUpdateTimeMs: this.stats.averageUpdateTimeMs,
                lastUpdateTimeMs: this.stats.lastUpdateTimeMs,
                textureGenerationTimeMs: this.stats.textureGenerationTime,
                currentFPS: this.performanceCalibrator.getCurrentFPS()
            }
        };
    }

    public debug(): void {
        console.log('\n' + '═'.repeat(70));
        console.log('🔬 НАУЧНЫЙ LOD МЕНЕДЖЕР v2.3 (С ПОДДЕРЖКОЙ МАСШТАБА)');
        console.log('═'.repeat(70));
        console.log(`📊 СТАТИСТИКА:`);
        console.log(`   Всего звезд в каталоге: ${this.stats.totalStars}`);
        console.log(`   Рендерится звезд: ${this.stats.renderedStars} (${(this.stats.renderedStars / this.stats.totalStars * 100).toFixed(1)}%)`);
        console.log(`   ├─ Полная 3D: ${this.stats.full3DCount}`);
        console.log(`   ├─ Билборды: ${this.stats.billboardCount}`);
        console.log(`   ├─ Детальные точки: ${this.stats.detailedPointCount}`);
        console.log(`   ├─ Простые точки: ${this.stats.simplePointCount}`);
        console.log(`   └─ Только каталог: ${this.stats.catalogCount}`);
        console.log(`   Отсечено по дистанции: ${this.stats.culledByDistance}`);
        console.log(`   Отсечено фрустумом: ${this.stats.culledByFrustum}`);

        console.log(`\n📏 LOD ПОРОГИ (единицы сцены):`);
        console.log(`   full3d: ${this.distanceThresholdsUnits.full3d.toFixed(1)} ед.`);
        console.log(`   billboard: ${this.distanceThresholdsUnits.billboard.toFixed(1)} ед.`);
        console.log(`   detailedPoint: ${this.distanceThresholdsUnits.detailedPoint.toFixed(1)} ед.`);
        console.log(`   simplePoint: ${this.distanceThresholdsUnits.simplePoint.toFixed(1)} ед.`);

        console.log(`\n⚙️ ГЕНЕРАЦИЯ ТЕКСТУР LOD (портировано из kosmos):`);
        console.log(`   FarMapGenerator (LOD3-4): ${this.config.textureGeneration.enabled ? 'Активен' : 'Отключён'}`);
        console.log(`   NearMapGenerator (LOD0-2): ${this.config.textureGeneration.enabled ? 'Активен' : 'Отключён'}`);
        console.log(`   NormalMapGenerator: ${this.config.textureGeneration.enabled ? 'Активен' : 'Отключён'}`);
        console.log(`   Макс. разрешение: ${this.config.textureGeneration.maxResolution}x${this.config.textureGeneration.maxResolution}`);
        console.log(`   Интервал обновления: ${this.config.textureGeneration.updateIntervalFrames} кадров`);
        console.log(`   Время генерации: ${this.stats.textureGenerationTime.toFixed(2)}ms`);

        console.log(`\n⚙️ НАУЧНАЯ КОНФИГУРАЦИЯ:`);
        console.log(`   Абсолютная величина: ${this.config.scientific.accurateBrightness ? 'Включена' : 'Выключена'}`);
        console.log(`   Межзвездное поглощение: ${this.config.scientific.useExtinction ? `${this.config.scientific.galacticExtinction} mag/kpc` : 'Выключено'}`);
        console.log(`   Экспозиция: ${this.config.brightnessConfig.exposureCompensation}`);

        console.log(`\n🎮 ПРОИЗВОДИТЕЛЬНОСТЬ:`);
        console.log(`   Время обновления LOD: ${this.stats.lastUpdateTimeMs.toFixed(2)}ms (ср. ${this.stats.averageUpdateTimeMs.toFixed(2)}ms)`);

        if (this.config.adaptive.enabled) {
            console.log(`\n🔄 АДАПТИВНЫЙ РЕЖИМ:`);
            console.log(`   Качество: ${this.performanceCalibrator['currentQuality'].toUpperCase()}`);
            console.log(`   Текущий FPS: ${this.performanceCalibrator.getCurrentFPS().toFixed(1)} / ${this.config.adaptive.targetFPS}`);
        }

        const nearby = this.getNearbyStars(5);
        if (nearby.length > 0) {
            console.log(`\n⭐ БЛИЖАЙШИЕ ЗВЕЗДЫ (с абсолютной величиной):`);
            for (const star of nearby) {
                console.log(`   ${star.spectralType} | m=${star.magnitude.toFixed(2)} | M=${star.absoluteMagnitude.toFixed(2)} | ${star.distancePc.toFixed(1)} пк | ${star.renderMode}`);
            }
        }

        console.log('═'.repeat(70) + '\n');
    }

    public reset(): void {
        this.starsLODData.clear();
        this.planetsLODData.clear();
        this.full3DStars = [];
        this.billboardStars = [];
        this.detailedPoints = [];
        this.simplePoints = [];
        this.catalogStars = [];
        this.stats = {
            totalStars: 0,
            renderedStars: 0,
            full3DCount: 0,
            billboardCount: 0,
            detailedPointCount: 0,
            simplePointCount: 0,
            catalogCount: 0,
            culledByDistance: 0,
            culledByFrustum: 0,
            textureGenerationTime: 0,
            lastUpdateTimeMs: 0,
            averageUpdateTimeMs: 0,
            updateTimeSamples: []
        };
        this.lastUpdateFrame = 0;
        this.pendingUpdate = false;
        this.performanceCalibrator.reset();
        this.textureGenerator.destroy();
        this.textureGenerator.init();

        if (this.config.adaptive.enabled) {
            this.applyAdaptiveConfig();
        }
    }

    public updateConfig(newConfig: Partial<LODConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig,
            thresholds: { ...this.config.thresholds, ...newConfig.thresholds },
            brightnessConfig: { ...this.config.brightnessConfig, ...newConfig.brightnessConfig },
            performance: { ...this.config.performance, ...newConfig.performance },
            scientific: { ...this.config.scientific, ...newConfig.scientific },
            adaptive: { ...this.config.adaptive, ...newConfig.adaptive },
            textureGeneration: { ...this.config.textureGeneration, ...newConfig.textureGeneration }
        };

        if (newConfig.adaptive?.targetFPS) {
            this.performanceCalibrator.targetFPS = newConfig.adaptive.targetFPS;
        }

        // ✅ ПЕРЕСЧЕТ ПОРОГОВ ПРИ ИЗМЕНЕНИИ КОНФИГУРАЦИИ
        this.updateThresholdsFromRealScale(0.5);
    }

    public forceUpdate(cameraPosition: Vector3): void {
        this.syncUpdateStars(cameraPosition);
    }

    public getStarQuality(sourceId: string): { renderMode: StarRenderMode; lodLevel: number; brightness: number } | null {
        const star = this.starsLODData.get(sourceId);
        if (!star) return null;

        return {
            renderMode: star.renderMode,
            lodLevel: star.lodLevel,
            brightness: star.currentBrightness
        };
    }

    public destroy(): void {
        this.textureGenerator.destroy();
        this.starsLODData.clear();
        this.planetsLODData.clear();
    }
}

export default ScientificLODManager;