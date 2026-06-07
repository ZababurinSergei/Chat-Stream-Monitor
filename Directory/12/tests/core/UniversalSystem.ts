// /10/tests/core/UniversalSystem.ts
// ВЕРСИЯ 22.3 - ИСПРАВЛЕН ПОРЯДОК ИНИЦИАЛИЗАЦИИ
// - Разделен init() на initWebGPU() и startRender()
// - Добавлен onRenderStarted() для отложенных колбэков
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import {
    Engine3D,
    Scene3D,
    Camera3D,
    Object3D,
    Vector3,
    View3D,
    DirectLight,
    GeometryBase,
    MeshRenderer,
    Material,
    ComponentBase,
    Time,
    Color,
    Quaternion,
    Matrix4,
    Ray,
    Frustum,
    BoundingSphere,
    LoaderManager,
    Res,
    fonts,
    GUIAtlasTexture,
    GUICanvas,
    GUIRenderer,
    GUIGeometry,
    GUIMaterial,
    GUISprite,
    GUITexture,
    UIButton,
    UIInteractiveStyle,
    UIPanel,
    ViewPanel,
    Transform,
    ComponentCollect,
    EntityCollect,
    GPUContext,
    RTFrame,
    GBufferFrame,
    PostProcessingComponent,
    BloomPost,
    FXAAPost,
    GlobalFog,
    TAAPost,
    SSRPost,
    ShadowMapPassRenderer,
    PointLightShadowRenderer,
    ClusterLightingRender,
    DDGIProbeRenderer,
    ReflectionRenderer,
    PreDepthPassRenderer,
    OcclusionSystem,
    PickFire,
    InputSystem,
    KeyCode,
    PointerEvent3D,
    TimeInterpolator,
    AnimationCurve,
    WasmMatrix,
    GlobalBindGroup,
    MatrixBindGroup,
    StorageGPUBuffer,
    StructStorageGPUBuffer,
    ComputeShader,
    ShaderPassBase,
    ShaderReflection,
    ShaderUtil,
    Preprocessor,
    MorePassParser,
    GLSLLexer,
    GLSLPreprocessor,
    GLSLSyntax,
    WGSLTranslator,
    ShaderConverter
} from '@orillusion/core';

import { floatingOrigin, GlobalTransform, IGlobalObject } from './Movement/core/FloatingOrigin.js';
import { IModuleAPI } from './ModuleAPI.js';
import { ShipController } from '../simplified/ShipController.js';

// ============================================================================
// ГЛОБАЛЬНАЯ ТИПИЗАЦИЯ WINDOW (v3.6)
// ============================================================================

declare global {
    interface Window {
        __shipController: any;
        __universalSystem: any;
        __starFlightUI: any;
        __starfieldComponent: any;
        __voxelMonitor: any;
        __starDataStore: {
            getScientificStars: () => any[];
            subscribe: (callback: (data: any) => void) => () => void;
            getStats: () => any;
            clear: () => void;
        };
    }
}

// ============================================================================
// ТИПЫ
// ============================================================================

export interface Concept<T = any> {
    type: string;
    version: string;
    description: string;
    metadata?: T;
}

export interface Substrate<T = any> {
    data: T;
    source: string;
    timestamp: number;
}

export interface Properties<T = any> {
    position: Vector3;
    scale: Vector3;
    rotationSpeed: number;
    visible: boolean;
    custom?: T;
}

export interface Descriptor<T = any> {
    id: number;
    name: string;
    position: Vector3;
    scale: Vector3;
    speedMultiplier: number;
    custom?: T;
}

export interface Relation<T = any> {
    parentId: number | null;
    childrenIds: number[];
    orbitalRadius: number;
    orbitalSpeed: number;
    custom?: T;
}

export interface SystemVectors {
    concept: () => Concept;
    substrate: () => Substrate;
    properties?: (data?: Partial<Properties>) => Properties;
    descriptor?: (id: number, data?: Partial<Descriptor>) => Descriptor;
    relation?: (data?: Partial<Relation>) => Relation;
    createGeometry: (substrate: Substrate, properties: Properties) => GeometryBase;
    createMaterial?: (properties: Properties, descriptor: Descriptor) => Material;
    createObject?: (substrate: Substrate, properties: Properties, descriptor: Descriptor) => Object3D;
    onUpdate?: (instance: Object3D, deltaTime: number, vectors: SystemVectors) => void;
    onStart?: (instance: Object3D, vectors: SystemVectors) => void;
}

// ============================================================================
// ДЕФОЛТНЫЕ ЗНАЧЕНИЯ
// ============================================================================

export const defaultProperties = (data?: Partial<Properties>): Properties => ({
    position: data?.position || new Vector3(0, 0, 0),
    scale: data?.scale || new Vector3(1, 1, 1),
    rotationSpeed: data?.rotationSpeed ?? 0.5,
    visible: data?.visible ?? true,
    custom: data?.custom
});

export const defaultDescriptor = (id: number, data?: Partial<Descriptor>): Descriptor => ({
    id,
    name: data?.name || `Instance_${id}`,
    position: data?.position || new Vector3(0, 0, 0),
    scale: data?.scale || new Vector3(1, 1, 1),
    speedMultiplier: data?.speedMultiplier ?? 1.0,
    custom: data?.custom
});

export const defaultRelation = (data?: Partial<Relation>): Relation => ({
    parentId: data?.parentId ?? null,
    childrenIds: data?.childrenIds || [],
    orbitalRadius: data?.orbitalRadius ?? 10,
    orbitalSpeed: data?.orbitalSpeed ?? 0.5,
    custom: data?.custom
});

export const defaultMaterial = (properties: Properties, descriptor: Descriptor): Material => {
    return new Material();
};

// ============================================================================
// МОДУЛЬНЫЙ РЕЕСТР (ДЛЯ ВЕКТОРОВ)
// ============================================================================

export interface ModuleInfo {
    id: number;
    vectors: SystemVectors;
    name: string;
    type: string;
    instanceCount: number;
}

export class ModuleRegistry {
    private modules: Map<number, ModuleInfo> = new Map();
    private nextId: number = 0;
    private typeToId: Map<string, number> = new Map();

    register(vectors: SystemVectors): number {
        const id = this.nextId++;
        const concept = vectors.concept();

        this.modules.set(id, {
            id,
            vectors,
            name: concept.type,
            type: concept.type,
            instanceCount: 0
        });

        this.typeToId.set(concept.type, id);

        console.log(`📦 Модуль #${id} зарегистрирован: ${concept.type} (v${concept.version})`);

        return id;
    }

    registerMultiple(vectorsList: SystemVectors[]): number[] {
        return vectorsList.map(v => this.register(v));
    }

    getModule(id: number): ModuleInfo | undefined {
        return this.modules.get(id);
    }

    getModuleByType(type: string): ModuleInfo | undefined {
        const id = this.typeToId.get(type);
        return id !== undefined ? this.modules.get(id) : undefined;
    }

    getAllModules(): ModuleInfo[] {
        return Array.from(this.modules.values());
    }

    incrementInstanceCount(moduleId: number): void {
        const module = this.modules.get(moduleId);
        if (module) {
            module.instanceCount++;
        }
    }

    decrementInstanceCount(moduleId: number): void {
        const module = this.modules.get(moduleId);
        if (module && module.instanceCount > 0) {
            module.instanceCount--;
        }
    }

    getStatistics(): { totalModules: number; totalInstances: number; modules: any[] } {
        let totalInstances = 0;
        const modules = Array.from(this.modules.values()).map(m => {
            totalInstances += m.instanceCount;
            return {
                id: m.id,
                type: m.type,
                name: m.name,
                instances: m.instanceCount
            };
        });

        return {
            totalModules: this.modules.size,
            totalInstances,
            modules
        };
    }
}

// ============================================================================
// КОМПОНЕНТ ДЛЯ ОБНОВЛЕНИЯ ЭКЗЕМПЛЯРОВ
// ============================================================================

class InstanceUpdaterComponent extends ComponentBase {
    private _instanceId: number = -1;
    private _moduleId: number = -1;
    private _vectors: SystemVectors | null = null;
    private _parentSystem: UniversalSystem | null = null;

    public initialize(
        instanceId: number,
        moduleId: number,
        vectors: SystemVectors,
        parentSystem: UniversalSystem
    ): void {
        this._instanceId = instanceId;
        this._moduleId = moduleId;
        this._vectors = vectors;
        this._parentSystem = parentSystem;
    }

    public onStart(): void {
        if (this._vectors && this._vectors.onStart) {
            this._vectors.onStart(this.object3D, this._vectors);
        }
    }

    public update(): void {
        if (this._vectors && this._vectors.onUpdate) {
            const deltaTime = Time.delta;
            this._vectors.onUpdate(this.object3D, deltaTime, this._vectors);
        }
    }

    public onDestroy(): void {
        if (this._parentSystem && this._instanceId !== -1 && this._moduleId !== -1) {
            this._parentSystem._onInstanceDestroyed(this._instanceId, this._moduleId);
        }
        this._vectors = null;
        this._parentSystem = null;
    }
}

// ============================================================================
// ОСНОВНОЙ КЛАСС (ОБНОВЛЕН - SHIPCONTROLLER + ПРАВИЛЬНЫЙ ПОРЯДОК)
// ============================================================================

export class UniversalSystem {
    private scene: Scene3D | null = null;
    private camera: Camera3D | null = null;
    private view: View3D | null = null;
    private instances: Map<number, Object3D> = new Map();
    private instanceToModule: Map<number, number> = new Map();
    private nextId: number = 0;
    private isInitialized: boolean = false;
    private _isRenderStarted: boolean = false;
    private _pendingStartCallbacks: (() => void)[] = [];

    private moduleRegistry: ModuleRegistry = new ModuleRegistry();
    private shipController: ShipController | null = null;
    private cameraObject: Object3D | null = null;
    private lightObject: Object3D | null = null;

    // Поддержка модулей с API
    private apiModules: Map<string, IModuleAPI> = new Map();
    private moduleUpdateOrder: string[] = [];

    constructor(vectors?: SystemVectors | SystemVectors[]) {
        if (vectors) {
            const vectorsList = Array.isArray(vectors) ? vectors : [vectors];
            this.moduleRegistry.registerMultiple(vectorsList);
        }

        console.log(`\n🚀 UniversalSystem инициализирован`);
        console.log(`   Модулей загружено: ${this.moduleRegistry.getAllModules().length}`);

        if (typeof window !== 'undefined') {
            (window as any).__universalSystem = this;
        }

        const stats = this.moduleRegistry.getStatistics();
        stats.modules.forEach(m => {
            console.log(`      • ${m.type} (id:${m.id})`);
        });
        console.log('');
    }

    // ============================================================================
    // НОВЫЕ МЕТОДЫ: ПРАВИЛЬНЫЙ ПОРЯДОК ИНИЦИАЛИЗАЦИИ
    // ============================================================================

    /**
     * Инициализация WebGPU и сцены (БЕЗ запуска рендеринга)
     * @param canvasId - ID canvas элемента
     * @returns {Promise<void>}
     */
    async initWebGPU(canvasId: string = 'canvas'): Promise<void> {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas с id "${canvasId}" не найден`);
        }

        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // ТОЛЬКО ИНИЦИАЛИЗАЦИЯ Engine3D, БЕЗ ЗАПУСКА РЕНДЕРИНГА
        await Engine3D.init({
            canvasConfig: { canvas, devicePixelRatio: window.devicePixelRatio }
        });

        this.scene = new Scene3D();
        this.scene.name = 'UniversalScene_MultiModule';

        // Создание камеры с ShipController
        this.cameraObject = new Object3D();
        this.cameraObject.transform.localPosition = new Vector3(0, 5, 18);

        this.shipController = this.cameraObject.addComponent(ShipController);
        this.shipController.debugMode = false;

        this.camera = this.cameraObject.addComponent(Camera3D);
        this.camera.perspective(60, Engine3D.aspect, 0.1, 1000000);
        this.camera.far = 1000000;
        this.camera.near = 0.1;

        this.scene.addChild(this.cameraObject);

        // Свет
        this.lightObject = new Object3D();
        this.lightObject.addComponent(DirectLight);
        this.scene.addChild(this.lightObject);

        // СОЗДАЕМ View НО НЕ ЗАПУСКАЕМ РЕНДЕРИНГ
        this.view = new View3D();
        this.view.scene = this.scene;
        this.view.camera = this.camera;

        this.isInitialized = true;

        console.log(`✅ UniversalSystem: WebGPU инициализирован, View создан (рендеринг не запущен)`);
    }

    /**
     * Запуск рендеринга (вызывается ПОСЛЕ создания всех компонентов)
     */
    public startRender(): void {
        if (this._isRenderStarted) {
            console.warn('⚠️ Рендеринг уже запущен');
            return;
        }

        if (!this.view) {
            console.error('❌ View не создан, сначала вызовите initWebGPU()');
            return;
        }

        // ЗАПУСКАЕМ РЕНДЕРИНГ - ТЕПЕРЬ Engine3D.views[0] заполнен
        Engine3D.startRenderView(this.view);
        this._isRenderStarted = true;

        // Вызываем все отложенные колбэки
        for (const cb of this._pendingStartCallbacks) {
            try { cb(); } catch (e) { console.error('Ошибка в отложенном колбэке:', e); }
        }
        this._pendingStartCallbacks = [];

        console.log(`✅ UniversalSystem: Рендеринг запущен`);
    }

    /**
     * Выполнить действие после запуска рендеринга
     * @param callback - функция, которая выполнится после Engine3D.startRenderView()
     */
    public onRenderStarted(callback: () => void): void {
        if (this._isRenderStarted) {
            callback();
        } else {
            this._pendingStartCallbacks.push(callback);
        }
    }

    /**
     * @deprecated Используйте initWebGPU() + startRender()
     */
    async init(canvasId: string = 'canvas'): Promise<void> {
        console.warn('⚠️ UniversalSystem.init() устарел, используйте initWebGPU() + startRender()');
        await this.initWebGPU(canvasId);
        this.startRender();
    }

    // ============================================================================
    // МЕТОДЫ ДЛЯ РАБОТЫ С API МОДУЛЯМИ
    // ============================================================================

    registerModule<T extends IModuleAPI>(module: T): T {
        if (this.apiModules.has(module.moduleName)) {
            console.warn(`⚠️ Модуль ${module.moduleName} уже зарегистрирован, перезаписываем`);
        }

        this.apiModules.set(module.moduleName, module);
        this.moduleUpdateOrder.push(module.moduleName);

        console.log(`📦 [UniversalSystem] Зарегистрирован модуль: ${module.moduleName} v${module.version}`);
        return module;
    }

    getModule<T extends IModuleAPI>(name: string): T | null {
        return (this.apiModules.get(name) as T) || null;
    }

    getAllApiModules(): Map<string, IModuleAPI> {
        return this.apiModules;
    }

    hasModule(name: string): boolean {
        return this.apiModules.has(name);
    }

    removeModule(name: string): boolean {
        const module = this.apiModules.get(name);
        if (module) {
            if (module.destroy) {
                module.destroy();
            }
            this.apiModules.delete(name);
            const index = this.moduleUpdateOrder.indexOf(name);
            if (index !== -1) this.moduleUpdateOrder.splice(index, 1);
            console.log(`🗑️ [UniversalSystem] Удалён модуль: ${name}`);
            return true;
        }
        return false;
    }

    async initModules(): Promise<void> {
        console.log(`\n🔧 [UniversalSystem] Инициализация ${this.apiModules.size} модулей...`);

        for (const [name, module] of this.apiModules) {
            if (module.init) {
                console.log(`   • Инициализация: ${name}`);
                await module.init(this);
            }
        }

        for (const [name, module] of this.apiModules) {
            if (module.setModuleReferences) {
                module.setModuleReferences(this.apiModules);
            }
        }

        for (const [name, module] of this.apiModules) {
            if (module.start) {
                console.log(`   • Запуск: ${name}`);
                module.start();
            }
        }

        console.log(`✅ [UniversalSystem] Инициализировано ${this.apiModules.size} модулей`);
    }

    private updateModules(deltaTime: number): void {
        for (const name of this.moduleUpdateOrder) {
            const module = this.apiModules.get(name);
            if (module && module.update) {
                module.update(deltaTime);
            }
        }
    }

    // ============================================================================
    // МЕТОДЫ ДЛЯ РАБОТЫ С ВЕКТОРАМИ И ЭКЗЕМПЛЯРАМИ
    // ============================================================================

    addModule(vectors: SystemVectors): number {
        const id = this.moduleRegistry.register(vectors);
        console.log(`➕ Модуль добавлен динамически: ${vectors.concept().type} (id:${id})`);
        return id;
    }

    getModuleInfo(id: number): ModuleInfo | undefined {
        return this.moduleRegistry.getModule(id);
    }

    getModuleByType(type: string): ModuleInfo | undefined {
        return this.moduleRegistry.getModuleByType(type);
    }

    getAllModulesInfo(): ModuleInfo[] {
        return this.moduleRegistry.getAllModules();
    }

    createInstance(
        moduleId: number,
        customDescriptor?: Partial<Descriptor>,
        customProperties?: Partial<Properties>
    ): Object3D {
        const moduleInfo = this.moduleRegistry.getModule(moduleId);
        if (!moduleInfo) {
            throw new Error(`Module with id ${moduleId} not found`);
        }

        const vectors = moduleInfo.vectors;
        const id = this.nextId++;
        const concept = vectors.concept();
        const substrate = vectors.substrate();
        const properties = vectors.properties ? vectors.properties(customProperties) : defaultProperties(customProperties);
        const descriptor = vectors.descriptor ? vectors.descriptor(id, customDescriptor) : defaultDescriptor(id, customDescriptor);

        console.log(`🔷 [${concept.type}] Создание ${descriptor.name} (модуль ${moduleId})`);

        let container: Object3D;

        if (vectors.createObject) {
            container = vectors.createObject(substrate, properties, descriptor);
        } else {
            const geometry = vectors.createGeometry(substrate, properties);
            const material = vectors.createMaterial ? vectors.createMaterial(properties, descriptor) : defaultMaterial(properties, descriptor);

            container = new Object3D();
            container.name = descriptor.name;
            container.transform.localPosition = descriptor.position;
            container.transform.localScale = descriptor.scale;

            const renderer = container.addComponent(MeshRenderer);
            renderer.geometry = geometry;
            renderer.material = material;
        }

        (container as any).__id = id;
        (container as any).__moduleId = moduleId;
        (container as any).__vectors = vectors;
        (container as any).__concept = concept;
        (container as any).__substrate = substrate;
        (container as any).__properties = properties;
        (container as any).__descriptor = descriptor;

        const updater = container.addComponent(InstanceUpdaterComponent);
        updater.initialize(id, moduleId, vectors, this);

        this.instances.set(id, container);
        this.instanceToModule.set(id, moduleId);
        this.moduleRegistry.incrementInstanceCount(moduleId);

        if (this.scene) {
            this.scene.addChild(container);
        }

        return container;
    }

    createInstanceByType(
        moduleType: string,
        customDescriptor?: Partial<Descriptor>,
        customProperties?: Partial<Properties>
    ): Object3D {
        const moduleInfo = this.moduleRegistry.getModuleByType(moduleType);
        if (!moduleInfo) {
            const available = this.getAllModulesInfo().map(m => m.type).join(', ');
            throw new Error(`Module type "${moduleType}" not found. Available: ${available}`);
        }
        return this.createInstance(moduleInfo.id, customDescriptor, customProperties);
    }

    getInstanceModule(instanceId: number): ModuleInfo | undefined {
        const moduleId = this.instanceToModule.get(instanceId);
        return moduleId !== undefined ? this.moduleRegistry.getModule(moduleId) : undefined;
    }

    getInstancesByModule(moduleId: number): Object3D[] {
        const result: Object3D[] = [];
        for (const [id, instance] of this.instances) {
            if (this.instanceToModule.get(id) === moduleId) {
                result.push(instance);
            }
        }
        return result;
    }

    getInstancesByType(moduleType: string): Object3D[] {
        const moduleInfo = this.moduleRegistry.getModuleByType(moduleType);
        if (!moduleInfo) return [];
        return this.getInstancesByModule(moduleInfo.id);
    }

    public _onInstanceDestroyed(instanceId: number, moduleId: number): void {
        if (this.instances.has(instanceId)) {
            this.instances.delete(instanceId);
            this.instanceToModule.delete(instanceId);
            this.moduleRegistry.decrementInstanceCount(moduleId);
        }
    }

    // ============================================================================
    // МАССОВОЕ СОЗДАНИЕ
    // ============================================================================

    public createCircleInstances(
        moduleId: number,
        count: number,
        radius: number = 12,
        yOffset: number = 0
    ): Object3D[] {
        const instances: Object3D[] = [];

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const position = new Vector3(
                Math.cos(angle) * radius,
                yOffset,
                Math.sin(angle) * radius
            );

            const instance = this.createInstance(
                moduleId,
                { name: `Circle_${i}`, position: position },
                {}
            );
            instances.push(instance);
        }

        console.log(`✅ Создано ${instances.length} объектов на окружности (модуль ${moduleId})`);
        return instances;
    }

    public createGridInstances(
        moduleId: number,
        rows: number,
        cols: number,
        spacing: number = 5,
        yOffset: number = 0
    ): Object3D[] {
        const instances: Object3D[] = [];
        const startX = -(cols - 1) * spacing / 2;
        const startZ = -(rows - 1) * spacing / 2;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const position = new Vector3(
                    startX + j * spacing,
                    yOffset,
                    startZ + i * spacing
                );

                const instance = this.createInstance(
                    moduleId,
                    { name: `Grid_${i}_${j}`, position: position },
                    {}
                );
                instances.push(instance);
            }
        }

        console.log(`✅ Создано ${instances.length} объектов в сетке ${rows}x${cols} (модуль ${moduleId})`);
        return instances;
    }

    // ============================================================================
    // УПРАВЛЕНИЕ КОРАБЛЁМ (SHIPCONTROLLER API)
    // ============================================================================

    public setShipController(controller: ShipController): void {
        if (this.shipController === controller) {
            console.log('ℹ️ [UniversalSystem] ShipController уже был зарегистрирован');
            return;
        }

        this.shipController = controller;

        if (typeof window !== 'undefined') {
            window.__shipController = controller;
            console.log('🌍 [UniversalSystem] __shipController установлен в window');
        }

        console.log('🛸 [UniversalSystem] ShipController зарегистрирован');
    }

    public getShipController(): ShipController | null {
        return this.shipController;
    }

    public getShipMovementSystem(): ShipController | null {
        return this.shipController;
    }

    public setShipSpeed(speed: number, reverseMode?: boolean): void {
        if (this.shipController) {
            this.shipController.setSpeed(speed);
        }
    }

    public getShipSpeed(): number {
        return this.shipController?.getSpeed() || 0;
    }

    public resetShipPosition(): void {
        if (this.shipController) {
            this.shipController.setPosition(new Vector3(0, 0, 0));
        }
    }

    public getShipPosition(): Vector3 {
        return this.shipController?.getPosition() || new Vector3(0, 0, 0);
    }

    public flyTo(target: Vector3, duration?: number, onComplete?: () => void): void {
        if (this.shipController) {
            this.shipController.flyTo(target, duration, onComplete);
        }
    }

    public flyToStar(position: Vector3, starId?: string, onComplete?: () => void): void {
        if (this.shipController) {
            this.shipController.flyToStar(position, starId, onComplete);
        }
    }

    public isFlying(): boolean {
        return this.shipController?.isFlying() || false;
    }

    public getFlightProgress(): number {
        return this.shipController?.getFlightProgress() || 0;
    }

    public cancelFlight(): void {
        this.shipController?.cancelFlight();
    }

    // ============================================================================
    // УПРАВЛЕНИЕ ЭКЗЕМПЛЯРАМИ
    // ============================================================================

    public getInstances(): Map<number, Object3D> {
        return this.instances;
    }

    public getInstance(id: number): Object3D | undefined {
        return this.instances.get(id);
    }

    public removeInstance(id: number): boolean {
        const instance = this.instances.get(id);
        if (instance && this.scene) {
            instance.destroy();
            return true;
        }
        return false;
    }

    public removeAllInstances(): void {
        for (const [id, instance] of this.instances) {
            instance.destroy();
        }
        this.instances.clear();
        this.instanceToModule.clear();
        console.log(`🗑️ Все экземпляры удалены`);
    }

    // ============================================================================
    // СТАТИСТИКА И УПРАВЛЕНИЕ
    // ============================================================================

    public getScene(): Scene3D | null {
        return this.scene;
    }

    public getCamera(): Camera3D | null {
        return this.camera;
    }

    public getView(): View3D | null {
        return this.view;
    }

    public getStatistics(): any {
        const moduleStats = this.moduleRegistry.getStatistics();
        const instanceByModule: Record<string, number> = {};

        for (const [instanceId, moduleId] of this.instanceToModule) {
            const moduleName = this.moduleRegistry.getModule(moduleId)?.name || `module_${moduleId}`;
            instanceByModule[moduleName] = (instanceByModule[moduleName] || 0) + 1;
        }

        const apiModulesList: string[] = [];
        for (const [name, module] of this.apiModules) {
            apiModulesList.push(`${name} v${module.version}`);
        }

        return {
            vectorModules: moduleStats,
            instances: {
                total: this.instances.size,
                byModule: instanceByModule
            },
            apiModules: {
                count: this.apiModules.size,
                list: apiModulesList
            },
            ship: {
                position: this.getShipPosition(),
                speed: this.getShipSpeed(),
                isFlying: this.isFlying(),
                flightProgress: this.getFlightProgress()
            },
            renderStarted: this._isRenderStarted,
            initialized: this.isInitialized
        };
    }

    public stop(): void {
        Engine3D.pause();
        console.log('🛑 Система остановлена');
    }

    public resume(): void {
        Engine3D.resume();
        console.log('▶️ Система возобновлена');
    }

    public destroy(): void {
        // Уничтожаем API модули
        for (const [name, module] of this.apiModules) {
            if (module.destroy) {
                module.destroy();
            }
        }
        this.apiModules.clear();
        this.moduleUpdateOrder = [];

        // Уничтожаем экземпляры
        this.removeAllInstances();

        if (this.shipController) {
            this.shipController.destroy();
            this.shipController = null;
        }

        if (this.cameraObject) {
            this.cameraObject.destroy();
            this.cameraObject = null;
        }

        if (this.lightObject) {
            this.lightObject.destroy();
            this.lightObject = null;
        }

        if (this.view) {
            const viewIndex = Engine3D.views.indexOf(this.view);
            if (viewIndex !== -1) {
                Engine3D.views.splice(viewIndex, 1);
            }
            this.view = null;
        }

        if (this.scene) {
            this.scene.destroy();
            this.scene = null;
        }

        if (typeof window !== 'undefined') {
            delete (window as any).__shipController;
        }

        this.instances.clear();
        this.instanceToModule.clear();
        this.isInitialized = false;
        this._isRenderStarted = false;
        this._pendingStartCallbacks = [];

        console.log('💀 UniversalSystem уничтожен');
    }

    public debug(): void {
        const stats = this.getStatistics();

        console.log('\n' + '═'.repeat(70));
        console.log('🔧 UNIVERSAL SYSTEM DEBUG');
        console.log('═'.repeat(70));

        console.log(`\n📦 ВЕКТОРНЫЕ МОДУЛИ:`);
        console.log(`   Всего: ${stats.vectorModules.totalModules}`);
        console.log(`   Экземпляров: ${stats.vectorModules.totalInstances}`);
        for (const m of stats.vectorModules.modules) {
            console.log(`      • ${m.type} (id:${m.id}): ${m.instances} экз.`);
        }

        console.log(`\n🔌 API МОДУЛИ:`);
        console.log(`   Всего: ${stats.apiModules.count}`);
        for (const name of stats.apiModules.list) {
            console.log(`      • ${name}`);
        }

        console.log(`\n🚀 КОРАБЛЬ (ShipController):`);
        console.log(`   Позиция: (${stats.ship.position.x.toFixed(1)}, ${stats.ship.position.y.toFixed(1)}, ${stats.ship.position.z.toFixed(1)})`);
        console.log(`   Скорость: ${stats.ship.speed.toFixed(1)} у.е./с`);
        console.log(`   В полёте: ${stats.ship.isFlying ? 'ДА' : 'НЕТ'}`);
        if (stats.ship.isFlying) {
            console.log(`   Прогресс: ${(stats.ship.flightProgress * 100).toFixed(0)}%`);
        }

        console.log(`\n📊 СТАТУС:`);
        console.log(`   Инициализирована: ${stats.initialized ? '✅' : '❌'}`);
        console.log(`   Рендеринг запущен: ${stats.renderStarted ? '✅' : '❌'}`);
        console.log(`   Отложенных колбэков: ${this._pendingStartCallbacks.length}`);

        console.log('═'.repeat(70) + '\n');
    }
}

// ============================================================================
// УТИЛИТЫ
// ============================================================================

export function createVectors(base: Partial<SystemVectors>): SystemVectors {
    if (!base.createGeometry) {
        throw new Error('createGeometry is required in SystemVectors');
    }

    return {
        concept: base.concept || (() => ({ type: 'unknown', version: '1.0', description: '' })),
        substrate: base.substrate || (() => ({ data: {}, source: 'default', timestamp: Date.now() })),
        properties: base.properties || defaultProperties,
        descriptor: base.descriptor || defaultDescriptor,
        relation: base.relation || defaultRelation,
        createGeometry: base.createGeometry,
        createMaterial: base.createMaterial || defaultMaterial,
        createObject: base.createObject,
        onUpdate: base.onUpdate,
        onStart: base.onStart
    };
}

// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__UniversalSystem = {
        create: (vectors?: SystemVectors | SystemVectors[]) => new UniversalSystem(vectors),
        version: '22.3'
    };
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default UniversalSystem;

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

console.log('═'.repeat(70));
console.log('🚀 [UniversalSystem] МОДУЛЬ ЗАГРУЖЕН v22.3');
console.log('   • initWebGPU() - инициализация WebGPU (без рендеринга)');
console.log('   • startRender() - запуск рендеринга');
console.log('   • onRenderStarted() - отложенные колбэки');
console.log('   • Правильный порядок инициализации');
console.log('═'.repeat(70));