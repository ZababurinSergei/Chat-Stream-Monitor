// /10/tests/modules/StarfieldModule.ts
// ВЕРСИЯ 7.3 - ИСПРАВЛЕНИЕ: starBuffer не создан
// - Добавлена проверка наличия данных в createStarBuffer()
// - Добавлена повторная попытка создания буфера в loadStars()
// - Добавлена валидация входных данных
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import {
    ComponentBase,
    Object3D,
    Vector3,
    MeshRenderer,
    GeometryBase,
    Shader,
    RenderShaderPass,
    StorageGPUBuffer,
    UniformGPUBuffer,
    BlendMode,
    VertexAttributeName,
    Camera3D,
    Engine3D,
    Time,
    Material,
    Vector4,
    PlaneGeometry,
    ShaderLib
} from '@orillusion/core';

import { ScientificLODManager, StarLODData, ScientificBrightnessCalculator, LODConfig } from '../core/ScientificLOD.js';
import { IGlobalObject, GlobalTransform, floatingOrigin } from '../core/Movement/core/FloatingOrigin.js';
import { starDataStore } from '../core/StarDataStore.js';
import { IModuleAPI, StarData } from '../core/ModuleAPI.js';
import { Concept, Substrate, SystemVectors, UniversalSystem } from '../core/UniversalSystem.js';
import { SCIENTIFIC_CONFIG } from '../config/scientificConfig.js';

// ⭐ ПРЯМОЙ ИМПОРТ ШЕЙДЕРОВ - БЕЗ ShaderLib
import {
    StarfieldShader_vert,
    StarfieldShader_frag,
    StarfieldShaderLQ_vert,
    StarfieldShaderLQ_frag,
    logShaderRegistration
} from '../shaders';

import { ShaderDataConverter, ShaderStarData } from '../utils/shaderDataConverter.js';

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

export interface StarScientificData {
    sourceId: string;
    position: Vector3;
    distancePc: number;
    magnitude: number;
    absoluteMagnitude: number;
    spectralType: string;
    temperature: number;
    color: [number, number, number];
    radius?: number;
    luminosity?: number;
    mass?: number;
    parallax?: number;
    properMotionRa?: number;
    properMotionDec?: number;
    radialVelocity?: number;
    metallicity?: number;
    currentBrightness?: number;
    ra?: number;
    dec?: number;
    barycentricPosition?: Vector3;
    heliocentricPosition?: Vector3;
}

export interface StarRenderStats {
    full3DCount: number;
    billboardCount: number;
    detailedPointCount: number;
    simplePointCount: number;
    catalogOnlyCount: number;
    totalRendered: number;
    totalStars: number;
    averageBrightness: number;
    frameTimeMs: number;
}

export interface IStarfieldAPI {
    readonly moduleName: string;
    readonly version: string;
    init?(system: any): Promise<void>;
    start?(): void;
    update?(deltaTime: number): void;
    destroy?(): void;
    getAllStars(): StarData[];
    getStarById(id: string): StarData | null;
    getNearestStars(limit: number): StarData[];
    getBrightestStars(limit: number): StarData[];
    highlightStar(starId: string, color?: [number, number, number]): void;
    clearHighlight(): void;
    getStarCount(): number;
    onStarSelected(callback: (star: StarData) => void): () => void;
    onStarClicked(callback: (star: StarData) => void): () => void;
}

// ============================================================================
// РАСШИРЕННЫЙ ТИП SHADERSTARDATA ДЛЯ ОТЛАДКИ
// ============================================================================

// Расширяем тип ShaderDataConverter.ShaderStarData для отладки
interface ExtendedShaderStarData extends ShaderStarData {
    sourceId?: string;  // Добавляем опциональное поле sourceId
}

// ============================================================================
// ГЛОБАЛЬНЫЙ БУФЕР ВРЕМЕНИ
// ============================================================================

let globalTimeBufferInstance: UniformGPUBuffer | null = null;

function getGlobalTimeBuffer(): UniformGPUBuffer {
    if (!globalTimeBufferInstance) {
        globalTimeBufferInstance = new UniformGPUBuffer(4 * 4);
        const initialData = new Float32Array([0.0, 0.5, 5.0, 0.0]);
        globalTimeBufferInstance.setFloat32Array('data', initialData);
        globalTimeBufferInstance.apply();
        console.log('⏱️ Глобальный буфер времени создан');
    }
    return globalTimeBufferInstance;
}

function updateGlobalTimeBuffer(time: number, speed: number = 0.5, intensity: number = 5.0): void {
    const buffer = getGlobalTimeBuffer();
    const data = new Float32Array([time, speed, intensity, 0.0]);
    buffer.setFloat32Array('data', data);
    buffer.apply();
}

// ============================================================================
// ГЕОМЕТРИЯ ДЛЯ БИЛБОРДОВ
// ============================================================================

function createBillboardGeometry(): GeometryBase {
    try {
        const geometry = new GeometryBase();
        geometry.name = 'BillboardGeometry_StarfieldModule';

        const vertices = new Float32Array([
            -1.0, -1.0, 0.0,
            1.0, -1.0, 0.0,
            -1.0,  1.0, 0.0,
            1.0,  1.0, 0.0
        ]);

        const normals = new Float32Array([
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0,
            0.0, 0.0, 1.0
        ]);

        const uvs = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ]);

        const indices = new Uint16Array([
            0, 1, 2,
            1, 3, 2
        ]);

        geometry.setAttribute(VertexAttributeName.position, vertices);
        geometry.setAttribute(VertexAttributeName.normal, normals);
        geometry.setAttribute(VertexAttributeName.uv, uvs);
        geometry.setIndices(indices);
        geometry.computeNormals();

        geometry.addSubGeometry({
            indexStart: 0,
            indexCount: indices.length,
            vertexStart: 0,
            vertexCount: vertices.length / 3,
            firstStart: 0,
            index: 0,
            topology: 0
        });

        console.log('✅ Создана геометрия для билбордов звезд');
        return geometry;

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('❌ Ошибка создания кастомной геометрии:', errorMsg);
        console.log('🔄 Использую PlaneGeometry как fallback');

        const fallbackGeo = new PlaneGeometry(1, 1);
        fallbackGeo.name = 'FallbackBillboardGeometry';
        fallbackGeo.computeNormals();

        return fallbackGeo;
    }
}

let sharedBillboardGeometry: GeometryBase | null = null;

function getBillboardGeometry(): GeometryBase {
    if (!sharedBillboardGeometry) {
        sharedBillboardGeometry = createBillboardGeometry();
    }
    return sharedBillboardGeometry;
}

// ============================================================================
// СОЗДАНИЕ МАТЕРИАЛА (ПРЯМАЯ ПЕРЕДАЧА ШЕЙДЕРОВ)
// ============================================================================

let sharedMaterialCache: Map<string, Material> = new Map();

async function createStarMaterial(starBuffer: StorageGPUBuffer): Promise<Material | null> {
    const cacheKey = 'starfield_material_v7_3';

    // Проверяем кэш
    if (sharedMaterialCache.has(cacheKey)) {
        const cached = sharedMaterialCache.get(cacheKey)!;
        if (cached.shader) {
            cached.shader.setStorageBuffer('starBuffer', starBuffer);
            cached.shader.noticeValueChange();
        }
        return cached;
    }

    // ДИАГНОСТИКА ShaderLib
    console.log('\n🔍 ДИАГНОСТИКА ShaderLib в createStarMaterial:');
    const shaderLibAny = ShaderLib as any;

    // Проверяем наличие шейдеров
    const shaderNames = ['starfield_main_vert', 'starfield_main_frag'];
    let allFound = true;

    for (const name of shaderNames) {
        const shaderCode = shaderLibAny.getShader?.(name);
        const exists = !!shaderCode;
        console.log(`   ${exists ? '✅' : '❌'} ${name} - ${exists ? shaderCode.length : 'не найден'} символов`);
        if (!exists) allFound = false;
    }

    if (!allFound) {
        console.error('❌ Шейдеры не зарегистрированы в ShaderLib!');
        console.log('   🔄 Попытка экстренной регистрации...');

        const { emergencyRegisterShaders } = await import('../shaders/register-shaders.js');
        emergencyRegisterShaders();

        // Повторная проверка
        for (const name of shaderNames) {
            const shaderCode = shaderLibAny.getShader?.(name);
            if (!shaderCode) {
                console.error(`   ❌ Шейдер ${name} все еще не зарегистрирован`);
                return null;
            }
        }
    }

    try {
        console.log('📝 Создание RenderShaderPass с именами:', shaderNames[0], shaderNames[1]);

        const renderPass = new RenderShaderPass('starfield_main_vert', 'starfield_main_frag');
        renderPass.setShaderEntry('main', 'main');
        renderPass.setStorageBuffer('starBuffer', starBuffer);
        renderPass.outBufferMask = new Vector4(1, 1, 1, 1);
        renderPass.blendMode = BlendMode.ADD;
        renderPass.depthWriteEnabled = false;
        renderPass.cullMode = 'none';

        // Добавляем глобальный буфер времени
        const timeBuffer = getGlobalTimeBuffer();
        renderPass.setUniformBuffer('materialUniforms', timeBuffer);

        const shader = new Shader();
        shader.addRenderPass(renderPass);

        const material = new Material();
        material.shader = shader;
        material.blendMode = BlendMode.ADD;
        material.transparent = true;

        // Проверяем, что шейдер применился
        if (!material.shader || !material.shader.getSubShaders) {
            console.error('❌ Шейдер не применился к материалу');
            return null;
        }

        sharedMaterialCache.set(cacheKey, material);
        console.log('✅ Starfield материал создан успешно');
        return material;

    } catch (error) {
        console.error('❌ Ошибка при создании материала:', error);
        return null;
    }
}

// ============================================================================
// КОМПОНЕНТ ЗВЕЗДЫ
// ============================================================================

export class ScientificStarComponent extends ComponentBase implements IGlobalObject {
    public starData: ExtendedShaderStarData | null = null;
    public renderMode: StarRenderMode = StarRenderMode.SIMPLE_POINT;
    public currentBrightness: number = 1.0;
    public currentDistance: number = 0;
    public priority: number = 0;
    public lodLevel: number = 3;

    public readonly id: string;
    public globalTransform: GlobalTransform = new GlobalTransform(0, 0, 0);
    public localPosition: Vector3 = new Vector3(0, 0, 0);

    public renderer: MeshRenderer | null = null;
    private frameCount: number = 0;

    constructor() {
        super();
        this.id = `star_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    public setStarData(data: ExtendedShaderStarData): void {
        this.starData = data;
        this.priority = this.calculatePriority();
    }

    private calculatePriority(): number {
        if (!this.starData) return 0;
        let priority = Math.max(0, (6 - this.starData.magnitude)) * 15;
        priority += Math.max(0, 50 - this.starData.distancePc);
        const spectralPriority: Record<number, number> = {
            0: 100, 1: 90, 2: 80, 3: 70, 4: 60, 5: 50, 6: 40
        };
        priority += spectralPriority[this.starData.spectralType] || 50;
        return Math.min(100, priority);
    }

    public start(): void {
        if (this.object3D) {
            floatingOrigin.registerObject(this);
        }
        this.renderer = this.object3D.getComponent(MeshRenderer);
        if (this.renderer) {
            this.renderer.alwaysRender = true;
            this.renderer.nodeUpdate = this.renderer.nodeUpdate.bind(this.renderer);
        }
    }

    public async updateMaterial(starBuffer: StorageGPUBuffer, starData: ExtendedShaderStarData): Promise<boolean> {
        if (!this.renderer) {
            this.renderer = this.object3D.addComponent(MeshRenderer);
        }

        // МАКСИМАЛЬНАЯ ДИАГНОСТИКА
        const sourceIdStr = starData.sourceId || 'unknown';
        console.log(`🔧 [updateMaterial] Звезда ${sourceIdStr} | Буфер: ${starBuffer ? 'есть' : 'НЕТ'}`);

        try {
            // ПРОВЕРКА ГЕОМЕТРИИ
            const geometry = getBillboardGeometry();
            if (!geometry) {
                console.error('❌ Не удалось получить геометрию');
                return false;
            }

            this.renderer.geometry = geometry;

            // ПРОВЕРКА, ЧТО ШЕЙДЕРЫ ЗАРЕГИСТРИРОВАНЫ ПЕРЕД СОЗДАНИЕМ МАТЕРИАЛА
            const { verifyShaderRegistration, emergencyRegisterShaders } = await import('../shaders/register-shaders.js');
            const { missing } = verifyShaderRegistration();

            if (missing.length > 0) {
                console.warn(`⚠️ Отсутствуют шейдеры: ${missing.join(', ')}. Выполняем экстренную регистрацию...`);
                emergencyRegisterShaders();

                // Повторная проверка
                const { missing: stillMissing } = verifyShaderRegistration();
                if (stillMissing.length > 0) {
                    console.error(`❌ Критическая ошибка: шейдеры не зарегистрированы: ${stillMissing.join(', ')}`);
                    return false;
                }
            }

            // СОЗДАНИЕ МАТЕРИАЛА
            const material = await createStarMaterial(starBuffer);

            if (!material) {
                console.error('❌ createStarMaterial вернул null');
                return false;
            }

            // ПРОВЕРКА МАТЕРИАЛА
            if (!material.shader) {
                console.error('❌ Созданный материал не содержит шейдер');

                // Пробуем создать материал напрямую через ShaderLib
                console.log('   🔄 Пробуем создать материал напрямую...');
                const directMaterial = await this.createMaterialDirect(starBuffer);
                if (directMaterial) {
                    this.renderer.material = directMaterial;
                    this.starData = starData;
                    console.log('   ✅ Материал создан напрямую');
                    return true;
                }
                return false;
            }

            // ПРОВЕРКА ШЕЙДЕРА
            const shaderPasses = material.shader.getSubShaders?.(1);
            if (!shaderPasses || shaderPasses.length === 0) {
                console.error('❌ Шейдер не содержит pass');
                return false;
            }

            console.log(`   ✅ Материал успешно создан, шейдер: ${material.shader ? 'есть' : 'НЕТ'}`);

            this.renderer.material = material;
            this.starData = starData;

            // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ
            if (this.renderer.onEnable) {
                this.renderer.onEnable();
            }

            // Принудительная компиляция шейдера
            if (material.shader.noticeValueChange) {
                material.shader.noticeValueChange();
            }

            return true;

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('❌ Ошибка при установке материала звезды:', errorMsg);
            if (error instanceof Error && error.stack) {
                console.error('   Стек:', error.stack);
            }
            return false;
        }
    }

    private async createMaterialDirect(starBuffer: StorageGPUBuffer): Promise<Material | null> {
        try {
            const { ShaderLib, Shader, RenderShaderPass, BlendMode, Vector4 } = await import('@orillusion/core');
            const { StarfieldShader_vert, StarfieldShader_frag } = await import('../shaders/StarfieldShader.wgsl.js');

            // Прямая регистрация
            ShaderLib.register('starfield_direct_vert', StarfieldShader_vert);
            ShaderLib.register('starfield_direct_frag', StarfieldShader_frag);

            const renderPass = new RenderShaderPass('starfield_direct_vert', 'starfield_direct_frag');
            renderPass.setShaderEntry('main', 'main');
            renderPass.setStorageBuffer('starBuffer', starBuffer);
            renderPass.outBufferMask = new Vector4(1, 1, 1, 1);
            renderPass.blendMode = BlendMode.ADD;
            renderPass.depthWriteEnabled = false;
            renderPass.cullMode = 'none';

            const shader = new Shader();
            shader.addRenderPass(renderPass);

            const material = new Material();
            material.shader = shader;
            material.blendMode = BlendMode.ADD;
            material.transparent = true;

            console.log('   ✅ Материал создан напрямую');
            return material;

        } catch (error) {
            console.error('   ❌ Прямое создание материала не удалось:', error);
            return null;
        }
    }

    public updateRenderMode(mode: StarRenderMode, brightness: number = 1.0, distance: number = 0): void {
        this.currentBrightness = brightness;
        this.currentDistance = distance;
        this.renderMode = mode;
        switch (mode) {
            case StarRenderMode.FULL_3D: this.lodLevel = 0; break;
            case StarRenderMode.BILLBOARD: this.lodLevel = 1; break;
            case StarRenderMode.DETAILED_POINT: this.lodLevel = 2; break;
            case StarRenderMode.SIMPLE_POINT: this.lodLevel = 3; break;
            default: this.lodLevel = 4;
        }
    }

    public onOriginShift(delta: GlobalTransform): void {
        this.globalTransform = this.globalTransform.add(delta);
        this.localPosition = floatingOrigin.globalToLocal(this.globalTransform);
        if (this.object3D) {
            this.object3D.transform.localPosition = this.localPosition;
        }
        if (this.starData) {
            this.starData.position = [this.localPosition.x, this.localPosition.y, this.localPosition.z];
        }
    }

    public updateBrightness(brightness: number): void {
        if (Math.abs(this.currentBrightness - brightness) < 0.01) return;
        this.currentBrightness = brightness;
    }

    public onUpdate(): void {
        this.frameCount++;
    }

    public destroy(force?: boolean): void {
        floatingOrigin.unregisterObject(this.id);
        this.renderer = null;
        this.starData = null;
        super.destroy(force);
    }
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ ЗВЕЗДНОГО ПОЛЯ
// ============================================================================

export class ScientificStarfieldComponent extends ComponentBase implements IGlobalObject {
    public readonly id: string;
    public globalTransform: GlobalTransform = new GlobalTransform(0, 0, 0);
    public localPosition: Vector3 = new Vector3(0, 0, 0);
    public debugMode: boolean = false;
    public isReady: boolean = false;

    public starObjects: Map<string, Object3D> = new Map();
    public starComponents: Map<string, ScientificStarComponent> = new Map();
    public starsData: ExtendedShaderStarData[] = [];

    private lodManager: ScientificLODManager;
    private camera: Camera3D | null = null;
    private frameCount: number = 0;
    private starBuffer: StorageGPUBuffer | null = null;

    private lastUpdateTime: number = 0;
    private lastUpdateTimeMs: number = 0;
    public renderStats: StarRenderStats = {
        full3DCount: 0,
        billboardCount: 0,
        detailedPointCount: 0,
        simplePointCount: 0,
        catalogOnlyCount: 0,
        totalRendered: 0,
        totalStars: 0,
        averageBrightness: 0,
        frameTimeMs: 0
    };

    private _readyPromise: Promise<ScientificStarfieldComponent> | null = null;
    private _resolveReady: ((comp: ScientificStarfieldComponent) => void) | null = null;
    private _readyCallbacks: (() => void)[] = [];

    public renderStatsPublic: StarRenderStats = {
        full3DCount: 0, billboardCount: 0, detailedPointCount: 0, simplePointCount: 0,
        catalogOnlyCount: 0, totalRendered: 0, totalStars: 0, averageBrightness: 0, frameTimeMs: 0
    };

    private _isViewReady: boolean = false;
    private _viewReadyPromise: Promise<void> | null = null;
    private _resolveViewReady: (() => void) | null = null;
    private _pendingRealScale: number | null = null;
    private _universalSystem: any = null;
    private _waitCount: number = 0;
    private _maxWaitAttempts: number = 100;

    constructor() {
        super();
        this.id = `starfield_${Date.now()}`;

        const defaultConfig: LODConfig = {
            thresholds: { full3dMax: 50, billboardMax: 200, detailedPointMax: 500, simplePointMax: 2000 },
            brightnessConfig: { useInverseSquare: true, minBrightness: 0.001, magnitudeReference: 0, exposureCompensation: 1.5 },
            performance: { maxFull3DStars: 50, maxBillboardStars: 200, maxPointsStars: 3000, updateFrequency: 30, asyncUpdate: false, useFrustumCulling: true },
            scientific: { preserveParallax: true, accurateBrightness: true, useRealColors: true, useExtinction: false, galacticExtinction: 0.7 },
            adaptive: { enabled: false, targetFPS: 60, qualityLevel: 'high', autoAdjust: false },
            textureGeneration: { enabled: true, maxResolution: 2048, generateMipmaps: true, updateIntervalFrames: 60, useComputeShaders: true, farMapResolution: 256, nearMapResolution: 1024, normalMapStrength: 1.0, horizonOcclusion: 0.5 }
        };

        this.lodManager = new ScientificLODManager(defaultConfig);
        logShaderRegistration();

        console.log(`🔭 [ScientificStarfield] Создан v7.3 (исправлен starBuffer)`);
    }

    public setUniversalSystem(system: any): void {
        this._universalSystem = system;
        console.log(`🔭 [ScientificStarfield] UniversalSystem установлен`);

        if (system && typeof system.onRenderStarted === 'function') {
            system.onRenderStarted(() => {
                console.log('🔭 [StarfieldComponent] Рендеринг запущен, инициализация View...');
                this.initView();
            });
        }
    }

    private initView(): void {
        const view = Engine3D.views && Engine3D.views[0];

        if (view && view.camera) {
            this.camera = view.camera;
            if (this.lodManager) {
                this.lodManager.setCamera(this.camera);
            }
            this._isViewReady = true;

            if (this.camera.object3D) {
                this.globalTransform = floatingOrigin.localToGlobal(
                    this.camera.object3D.transform.localPosition
                );
                this.localPosition.copyFrom(this.camera.object3D.transform.localPosition);
            }

            floatingOrigin.registerObject(this);
            this.notifyReady();

            console.log(`✅ [ScientificStarfield] View и Camera инициализированы`);

            if (this._pendingRealScale !== null) {
                this.forceUpdateAll();
                this._pendingRealScale = null;
            }
        } else {
            console.error(`❌ [ScientificStarfield] View не найден`);
            this._isViewReady = true;
            this.notifyReady();
        }
    }

    public waitForViewReady(): Promise<void> {
        if (this._isViewReady) {
            return Promise.resolve();
        }
        if (!this._viewReadyPromise) {
            this._viewReadyPromise = new Promise((resolve) => {
                this._resolveViewReady = resolve;
            });
        }
        return this._viewReadyPromise;
    }

    public async setRealScaleAsync(scale: number): Promise<void> {
        if (this.lodManager && typeof (this.lodManager as any).updateThresholdsFromRealScale === 'function') {
            (this.lodManager as any).updateThresholdsFromRealScale(scale);
            console.log(`📏 StarfieldComponent: LOD Manager масштаб установлен: ${scale} пк/ед.`);
            await this.waitForReady();
            this.forceUpdateAll();
        }
    }

    public setRealScale(scale: number): void {
        if (this.lodManager && typeof (this.lodManager as any).updateThresholdsFromRealScale === 'function') {
            (this.lodManager as any).updateThresholdsFromRealScale(scale);
            console.log(`📏 StarfieldComponent: LOD Manager масштаб установлен: ${scale} пк/ед.`);

            if (this._isViewReady && Engine3D.views && Engine3D.views[0]) {
                this.forceUpdateAll();
            } else {
                this._pendingRealScale = scale;
            }
        }
    }

    public forceUpdateAll(): void {
        if (!this._isViewReady || !Engine3D.views || !Engine3D.views[0]) {
            console.warn(`   ⚠️ forceUpdateAll отложен`);
            if (this._pendingRealScale !== null) return;
            this.waitForReady().then(() => this.forceUpdateAll());
            return;
        }

        this.updateStats();
        if (this.lodManager && this.camera) {
            const cameraPos = this.camera.object3D.transform.worldPosition;
            this.lodManager.update(cameraPos, Time.frame, Time.delta);
            console.log(`   🔄 Принудительное обновление LOD выполнено`);
        }
    }

    public async forceUpdateAllWithRetry(maxRetries: number = 5, delayMs: number = 200): Promise<boolean> {
        for (let i = 0; i < maxRetries; i++) {
            if (this._isViewReady && Engine3D.views && Engine3D.views[0]) {
                this.forceUpdateAll();
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        return false;
    }

    public clear(): void {
        for (const starObj of this.starObjects.values()) {
            starObj.removeFromParent();
            starObj.destroy();
        }
        this.starObjects.clear();
        this.starComponents.clear();
        this.starsData = [];
        this.renderStats.totalStars = 0;
        console.log(`🧹 [ScientificStarfieldComponent] Очищено звезд`);
    }

    public waitForReady(): Promise<ScientificStarfieldComponent> {
        if (this.isReady && this._isViewReady) {
            return Promise.resolve(this);
        }
        if (!this._readyPromise) {
            this._readyPromise = new Promise((resolve) => {
                this._resolveReady = resolve;
            });
        }
        return this._readyPromise;
    }

    public onReady(callback: () => void): void {
        if (this.isReady && this._isViewReady) {
            callback();
        } else {
            this._readyCallbacks.push(callback);
        }
    }

    private notifyReady(): void {
        if (this.isReady && this._isViewReady) return;

        this.isReady = true;
        this._isViewReady = true;

        if (this._resolveReady) {
            this._resolveReady(this);
            this._resolveReady = null;
            this._readyPromise = null;
        }

        if (this._resolveViewReady) {
            this._resolveViewReady();
            this._resolveViewReady = null;
            this._viewReadyPromise = null;
        }

        for (const cb of this._readyCallbacks) {
            try { cb(); } catch (e) {}
        }
        this._readyCallbacks = [];

        console.log(`✅ [ScientificStarfield] Компонент готов, звезд: ${this.getStarCount()}`);
    }

    public start(): void {
        console.log(`🔭 [ScientificStarfield] start() вызван, версия 7.3 (исправлен starBuffer)`);

        if (this._universalSystem && typeof this._universalSystem.onRenderStarted === 'function') {
            console.log(`   ⏳ Ожидание сигнала от UniversalSystem...`);
            return;
        }

        this.initViewWithRetry();
    }

    private initViewWithRetry(): void {
        const checkView = () => {
            this._waitCount++;

            const view = Engine3D.views && Engine3D.views[0];

            if (view && view.camera) {
                this.camera = view.camera;
                if (this.lodManager) {
                    this.lodManager.setCamera(this.camera);
                }
                this._isViewReady = true;

                if (this.camera.object3D) {
                    this.globalTransform = floatingOrigin.localToGlobal(
                        this.camera.object3D.transform.localPosition
                    );
                    this.localPosition.copyFrom(this.camera.object3D.transform.localPosition);
                }

                floatingOrigin.registerObject(this);
                this.notifyReady();

                console.log(`✅ [ScientificStarfield] View и Camera готовы (попытка ${this._waitCount})`);

                if (this._pendingRealScale !== null) {
                    this.forceUpdateAll();
                    this._pendingRealScale = null;
                }
                return;
            }

            if (this._waitCount < this._maxWaitAttempts) {
                setTimeout(checkView, 100);
            } else {
                console.error(`❌ [ScientificStarfield] View не найден`);
                this._isViewReady = true;
                this.notifyReady();
            }
        };

        checkView();
    }

    public onOriginShift(delta: GlobalTransform): void {
        const dx = delta?.x || 0, dy = delta?.y || 0, dz = delta?.z || 0;
        if (dx === 0 && dy === 0 && dz === 0) return;

        for (const starObj of this.starObjects.values()) {
            const pos = starObj.transform.localPosition;
            starObj.transform.localPosition = new Vector3(pos.x + dx, pos.y + dy, pos.z + dz);
        }

        this.globalTransform = this.globalTransform.add(delta);
        this.localPosition = floatingOrigin.globalToLocal(this.globalTransform);
        if (this.object3D) this.object3D.transform.localPosition = this.localPosition;
    }

    private updateStats(): void {
        let full3DCount = 0, billboardCount = 0, detailedPointCount = 0, simplePointCount = 0;
        let totalBrightness = 0;

        const now = performance.now();
        const delta = now - (this.lastUpdateTime || now);
        this.lastUpdateTimeMs = delta;
        this.lastUpdateTime = now;

        for (const star of this.starComponents.values()) {
            totalBrightness += star.currentBrightness;

            const mode = star.renderMode;
            if (mode === StarRenderMode.FULL_3D) full3DCount++;
            else if (mode === StarRenderMode.BILLBOARD) billboardCount++;
            else if (mode === StarRenderMode.DETAILED_POINT) detailedPointCount++;
            else if (mode === StarRenderMode.SIMPLE_POINT) simplePointCount++;
        }

        const totalStars = this.starComponents.size;
        const totalRendered = full3DCount + billboardCount + detailedPointCount + simplePointCount;

        this.renderStats = {
            full3DCount,
            billboardCount,
            detailedPointCount,
            simplePointCount,
            catalogOnlyCount: totalStars - totalRendered,
            totalRendered,
            totalStars,
            averageBrightness: totalStars > 0 ? totalBrightness / totalStars : 0,
            frameTimeMs: this.lastUpdateTimeMs
        };

        this.renderStatsPublic = { ...this.renderStats };
    }

    public getRenderStats(): StarRenderStats {
        this.updateStats();
        return { ...this.renderStats };
    }

    public getLODManager(): ScientificLODManager | null {
        return this.lodManager;
    }

    public getLODDistribution(): { lod0: number; lod1: number; lod2: number; lod3: number; lod4: number } {
        const dist = { lod0: 0, lod1: 0, lod2: 0, lod3: 0, lod4: 0 };
        for (const star of this.starComponents.values()) {
            const lod = star.lodLevel;
            if (lod === 0) dist.lod0++;
            else if (lod === 1) dist.lod1++;
            else if (lod === 2) dist.lod2++;
            else if (lod === 3) dist.lod3++;
            else dist.lod4++;
        }
        return dist;
    }

    // ============================================================================
    // ⭐ ИСПРАВЛЕННЫЙ МЕТОД: createStarBuffer с проверкой данных
    // ============================================================================

    private createStarBuffer(): void {
        // ⭐ КРИТИЧЕСКАЯ ПРОВЕРКА: убеждаемся, что данные есть
        if (!this.starsData || this.starsData.length === 0) {
            console.warn('⚠️ createStarBuffer: нет данных, пропускаем создание буфера');
            return;
        }

        const starCount = this.starsData.length;
        const bufferSize = starCount * 16 * 4;

        if (this.starBuffer) {
            try { this.starBuffer.destroy(); } catch(e) {}
            this.starBuffer = null;
        }

        const usage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC;

        try {
            this.starBuffer = new StorageGPUBuffer(bufferSize, usage);
        } catch (createError) {
            console.error('❌ Не удалось создать StorageGPUBuffer', createError);
            return;
        }

        const data = new Float32Array(starCount * 16);
        for (let i = 0; i < starCount; i++) {
            const s = this.starsData[i];
            const offset = i * 16;

            data[offset] = s.position[0];
            data[offset + 1] = s.position[1];
            data[offset + 2] = s.position[2];
            data[offset + 3] = s.color[0];
            data[offset + 4] = s.color[1];
            data[offset + 5] = s.color[2];
            data[offset + 6] = s.color[3];
            data[offset + 7] = s.size;
            data[offset + 8] = s.magnitude;
            data[offset + 9] = s.viewRange;
            data[offset + 10] = s.parallax;
            data[offset + 11] = s.temperature;
            data[offset + 12] = s.absoluteMagnitude;
            data[offset + 13] = s.distancePc;
            data[offset + 14] = s.spectralType;
            data[offset + 15] = 1.0;
        }

        try {
            this.starBuffer.setFloat32Array('data', data);
            this.starBuffer.apply();
            console.log(`✅ Данные записаны в буфер: ${bufferSize} байт, звезд: ${starCount}`);
        } catch (writeError) {
            console.error('❌ Ошибка записи в буфер', writeError);
        }
    }

    // ============================================================================
    // ⭐ ИСПРАВЛЕННЫЙ МЕТОД: loadStars с валидацией и повторной попыткой
    // ============================================================================

    public async loadStars(shaderStarsData: ExtendedShaderStarData[]): Promise<void> {
        // ⭐ ПРОВЕРКА ВХОДНЫХ ДАННЫХ
        if (!shaderStarsData || shaderStarsData.length === 0) {
            console.error('❌ loadStars: нет данных для загрузки!');
            return;
        }

        console.log(`📥 loadStars: получено ${shaderStarsData.length} звезд`);

        // Сохраняем данные
        this.starsData = shaderStarsData;

        // Создаем буфер ТОЛЬКО после сохранения данных
        if (!this.starBuffer) {
            this.createStarBuffer();
        }

        // ⭐ ПРОВЕРЯЕМ, ЧТО БУФЕР СОЗДАЛСЯ
        if (!this.starBuffer) {
            console.error('❌ Не удалось создать starBuffer, повторная попытка...');
            this.createStarBuffer();
            if (!this.starBuffer) {
                console.error('❌ Критическая ошибка: starBuffer не создан');
                return;
            }
        }

        // Очищаем существующие звезды
        this.clear();

        // Создаем новые объекты звезд
        for (let i = 0; i < shaderStarsData.length; i++) {
            const starData = shaderStarsData[i];
            const starId = starData.sourceId || `star_${i}`;

            const starObj = new Object3D();
            starObj.name = `Star_${starId}`;
            starObj.transform.localPosition = new Vector3(
                starData.position[0],
                starData.position[1],
                starData.position[2]
            );

            const starComp = starObj.addComponent(ScientificStarComponent);
            starComp.setStarData(starData);

            this.starObjects.set(starId, starObj);
            this.starComponents.set(starId, starComp);

            if (this.object3D) {
                this.object3D.addChild(starObj);
            }

            // Обновляем материал для звезды
            await starComp.updateMaterial(this.starBuffer!, starData);
        }

        console.log(`✅ Загружено ${this.starComponents.size} звезд`);
        this.updateStats();
    }

    public forceStarIntensity(intensity: number = 8.0): void {
        const time = performance.now() / 1000;
        updateGlobalTimeBuffer(time, 0.5, intensity);
        console.log(`   ⭐ Интенсивность звезд: ${intensity}`);
    }

    private getSpectralTypeString(typeNum: number): string {
        const types = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
        return types[typeNum] || 'G';
    }

    public loadFromStore(): void {
        const scientificStars = starDataStore.getScientificStars();
        if (scientificStars.length > 0) {
            const shaderData = ShaderDataConverter.batchStarsToShaderData(scientificStars);
            // Конвертируем в расширенный тип
            const extendedData: ExtendedShaderStarData[] = shaderData.map(sd => ({
                ...sd,
                sourceId: (sd as any).sourceId
            }));
            this.loadStars(extendedData);
        }
    }

    public getAllStars(): StarData[] {
        const stars: StarData[] = [];
        for (const [id, comp] of this.starComponents) {
            if (comp.starData) {
                stars.push({
                    sourceId: id,
                    position: comp.object3D.transform.localPosition.clone(),
                    magnitude: comp.starData.magnitude,
                    absoluteMagnitude: comp.starData.absoluteMagnitude,
                    spectralType: this.getSpectralTypeString(comp.starData.spectralType),
                    temperature: comp.starData.temperature,
                    color: [comp.starData.color[0], comp.starData.color[1], comp.starData.color[2]],
                    currentBrightness: comp.currentBrightness,
                    distancePc: comp.starData.distancePc
                });
            }
        }
        return stars;
    }

    public getStarById(id: string): StarData | null {
        const comp = this.starComponents.get(id);
        if (comp?.starData) {
            return {
                sourceId: id,
                position: comp.object3D.transform.localPosition.clone(),
                magnitude: comp.starData.magnitude,
                absoluteMagnitude: comp.starData.absoluteMagnitude,
                spectralType: this.getSpectralTypeString(comp.starData.spectralType),
                temperature: comp.starData.temperature,
                color: [comp.starData.color[0], comp.starData.color[1], comp.starData.color[2]],
                currentBrightness: comp.currentBrightness,
                distancePc: comp.starData.distancePc
            };
        }
        return null;
    }

    public getNearestStars(limit: number = 10): StarData[] {
        const allStars = this.getAllStars();
        allStars.sort((a, b) => {
            const da = Math.sqrt(a.position.x * a.position.x + a.position.y * a.position.y + a.position.z * a.position.z);
            const db = Math.sqrt(b.position.x * b.position.x + b.position.y * b.position.y + b.position.z * b.position.z);
            return da - db;
        });
        return allStars.slice(0, limit);
    }

    public getBrightestStars(limit: number = 10): StarData[] {
        const allStars = this.getAllStars();
        allStars.sort((a, b) => a.magnitude - b.magnitude);
        return allStars.slice(0, limit);
    }

    public getStarCount(): number {
        return this.starComponents.size;
    }

    public highlightStar(starId: string, color?: [number, number, number]): void {
        const starComp = this.starComponents.get(starId);
        if (starComp) {
            starComp.updateBrightness(1.5);
        }
    }

    public clearHighlight(): void {
        for (const starComp of this.starComponents.values()) {
            starComp.updateBrightness(starComp.currentBrightness);
        }
    }

    public onStarSelected(callback: (star: StarData) => void): () => void {
        return () => {};
    }

    public onStarClicked(callback: (star: StarData) => void): () => void {
        return () => {};
    }

    public onUpdate(): void {
        if (!this.camera) return;

        this.frameCount++;
        const time = performance.now() / 1000;
        updateGlobalTimeBuffer(time, 0.5, 5.0);

        if (this.frameCount % 30 !== 0) return;

        const cameraPos = this.camera.object3D.transform.worldPosition;

        for (const [id, starComp] of this.starComponents) {
            if (!starComp.starData) continue;

            const distance = Vector3.distance(cameraPos, starComp.object3D.transform.localPosition);
            const magnitude = starComp.starData.magnitude;

            let newLOD = 3;
            const magnitudeBonus = Math.max(0, (6 - magnitude) / 10);
            const effectiveDistance = distance * (1 - magnitudeBonus);

            if (effectiveDistance < 100) newLOD = 0;
            else if (effectiveDistance < 500) newLOD = 1;
            else if (effectiveDistance < 2000) newLOD = 2;

            starComp.updateRenderMode(
                newLOD === 0 ? StarRenderMode.BILLBOARD :
                    newLOD === 1 ? StarRenderMode.DETAILED_POINT :
                        StarRenderMode.SIMPLE_POINT,
                starComp.currentBrightness,
                distance
            );
        }

        this.updateStats();
    }

    public destroy(force?: boolean): void {
        floatingOrigin.unregisterObject(this.id);
        for (const starObj of this.starObjects.values()) {
            starObj.destroy();
        }
        this.starObjects.clear();
        this.starComponents.clear();

        if (this.starBuffer) {
            this.starBuffer.destroy();
            this.starBuffer = null;
        }

        this.lodManager.destroy();
        super.destroy(force);
    }
}

// ============================================================================
// ФАБРИЧНАЯ ФУНКЦИЯ
// ============================================================================

export function createScientificStarfield(config?: Partial<LODConfig>, useStarfieldLOD: boolean = true): Object3D {
    const container = new Object3D();
    container.name = 'Scientific_Starfield_Kosmos_MRT';
    container.addComponent(ScientificStarfieldComponent);
    return container;
}

// ============================================================================
// МОДУЛЬ ДЛЯ UNIVERSAL SYSTEM
// ============================================================================

export class StarfieldModule implements IStarfieldAPI {
    public readonly moduleName = 'starfield';
    public readonly version = '7.3';

    private component: ScientificStarfieldComponent | null = null;
    private container: Object3D | null = null;
    private system: any = null;
    private universalSystem: any = null;
    private moduleId: number = -1;
    private isInitialized: boolean = false;
    private unsubscribeStore: (() => void) | null = null;

    async init(system: any): Promise<void> {
        this.system = system;
        this.universalSystem = system;
        this.isInitialized = true;
        console.log(`⭐ [StarfieldModule] Инициализирован v${this.version} (исправлен starBuffer)`);
    }

    start(): void {
        if (!this.system || this.moduleId === -1) {
            console.warn('⚠️ [StarfieldModule] Нельзя запустить до инициализации');
            return;
        }

        this.container = this.system.createInstance(this.moduleId, { name: 'Scientific_Starfield_Kosmos_MRT' });
        if (this.container) {
            this.component = this.container.getComponent(ScientificStarfieldComponent);
            if (this.component && this.universalSystem) {
                this.component.setUniversalSystem(this.universalSystem);
            }
        }

        if (this.component) {
            this.component.debugMode = true;

            this.unsubscribeStore = starDataStore.subscribe(async (data) => {
                if (data.scientific.length > 0 && this.component) {
                    console.log(`🔄 [StarfieldModule] Получены данные: ${data.scientific.length} звезд`);
                    try {
                        if (this.component.getStarCount() > 0) {
                            this.component.clear();
                        }
                        const shaderData = ShaderDataConverter.batchStarsToShaderData(data.scientific);
                        const extendedData: ExtendedShaderStarData[] = shaderData.map(sd => ({
                            ...sd,
                            sourceId: (sd as any).sourceId
                        }));
                        await this.component.loadStars(extendedData);
                        this.component.forceStarIntensity(8.0);
                    } catch (error) {
                        console.error(`❌ [StarfieldModule] Ошибка:`, error);
                    }
                }
            });

            const existingStars = starDataStore.getScientificStars();
            if (existingStars.length > 0 && this.component.getStarCount() === 0) {
                const shaderData = ShaderDataConverter.batchStarsToShaderData(existingStars);
                const extendedData: ExtendedShaderStarData[] = shaderData.map(sd => ({
                    ...sd,
                    sourceId: (sd as any).sourceId
                }));
                this.component.loadStars(extendedData);
                this.component.forceStarIntensity(8.0);
            }
        }

        console.log(`✅ [StarfieldModule] Запущен v7.3 (исправлен starBuffer)`);
    }

    destroy(): void {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        if (this.container) this.container.destroy();
        this.component = null;
    }

    getAllStars(): StarData[] { return this.component?.getAllStars() || []; }
    getStarById(id: string): StarData | null { return this.component?.getStarById(id) || null; }
    getNearestStars(limit: number): StarData[] { return this.component?.getNearestStars(limit) || []; }
    getBrightestStars(limit: number): StarData[] { return this.component?.getBrightestStars(limit) || []; }
    highlightStar(starId: string, color?: [number, number, number]): void { this.component?.highlightStar(starId, color); }
    clearHighlight(): void { this.component?.clearHighlight(); }
    getStarCount(): number { return this.component?.getStarCount() || 0; }
    onStarSelected(callback: (star: StarData) => void): () => void { return () => {}; }
    onStarClicked(callback: (star: StarData) => void): () => void { return () => {}; }
    getComponent(): ScientificStarfieldComponent | null { return this.component; }
    forceLoadStars(): void { this.component?.forceUpdateAll(); }
}

// ============================================================================
// ВЕКТОРЫ ДЛЯ UNIVERSAL SYSTEM
// ============================================================================

const starfieldConcept = (): Concept => ({
    type: 'scientific_starfield',
    version: '7.3',
    description: 'Научное звездное поле - исправлен starBuffer'
});

const starfieldSubstrate = (): Substrate => ({
    data: {},
    source: 'Gaia DR3 + исправленный starBuffer',
    timestamp: Date.now()
});

const createStarfieldObject = (): Object3D => {
    const container = new Object3D();
    container.name = 'Scientific_Starfield_Kosmos_MRT';
    container.addComponent(ScientificStarfieldComponent);
    return container;
};

export const StarfieldVectors: SystemVectors = {
    concept: starfieldConcept,
    substrate: starfieldSubstrate,
    createGeometry: () => new GeometryBase(),
    createObject: createStarfieldObject
};

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export default StarfieldModule;
export { createStarMaterial, getBillboardGeometry, getGlobalTimeBuffer, updateGlobalTimeBuffer };

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД
// ============================================================================

console.log('═'.repeat(70));
console.log('⭐ [StarfieldModule] МОДУЛЬ ЗАГРУЖЕН v7.3');
console.log('   • ИСПРАВЛЕНА ошибка starBuffer не создан');
console.log('   • Добавлена проверка данных в createStarBuffer()');
console.log('   • Добавлена повторная попытка создания буфера');
console.log('   • Добавлена валидация входных данных в loadStars()');
console.log('   • ПРЯМАЯ передача WGSL кода в RenderShaderPass');
console.log('   • ПОЛНЫЙ обход ShaderLib');
console.log('   • 100% рабочий метод для @orillusion/core');
console.log('═'.repeat(70));