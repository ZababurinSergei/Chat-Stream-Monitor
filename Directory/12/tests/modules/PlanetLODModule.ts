// /10/tests/modules/PlanetLODModule.ts
// НОВЫЙ МОДУЛЬ - Планеты с LOD системой из kosmos
// Портировано из kosmos PlanetFarMeshShader и PlanetNearMeshShader
// Версия 2.1 - ИСПРАВЛЕНЫ ОШИБКИ ТИПОВ
// - Исправлен renderPass.transparent -> material.transparent
// - Добавлен экспорт интерфейса IPlanetLODAPI
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import {
    ComponentBase,
    Object3D,
    Vector3,
    MeshRenderer,
    GeometryBase,
    Material,
    VertexAttributeName,
    ShaderLib,
    Camera3D,
    Engine3D,
    Color,
    Time,
    LitMaterial,
    UnLitMaterial,
    WorldPanel,
    UIImage,
    UITextField,
    BillboardType,
    TextAnchor,
    View3D,
    Shader,
    RenderShaderPass,
    StorageGPUBuffer,
    UniformGPUBuffer,
    Texture
} from '@orillusion/core';

import { SystemVectors, Concept, Substrate, UniversalSystem } from '../core/UniversalSystem.js';
import { ScientificLODManager, LODTextureGenerator } from '../core/ScientificLOD.js';
import { IModuleAPI, PlanetData, StarData, ShipStateData } from '../core/ModuleAPI.js';

// ============================================================================
// ИМПОРТ ШЕЙДЕРОВ ИЗ KOSMOS
// ============================================================================

import {
    PlanetfieldShader_vert,
    PlanetfieldShader_frag,
    PlanetNearMeshShader_vert,
    PlanetNearMeshShader_frag,
    PlanetFarMeshShader_vert,
    PlanetFarMeshShader_frag,
    PlanetFarMeshShaderLQ_vert,
    PlanetFarMeshShaderLQ_frag,
    NormalMapGeneratorShader_cs,
    FarMapGeneratorShader_cs,
    NearMapGeneratorShader_cs,
    logShaderRegistration
} from '../shaders';

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export enum PlanetLODLevel {
    LOD0_HIGH = 0,      // < 50 пк - полная детализация (NearMesh)
    LOD1_MEDIUM = 1,    // 50-200 пк - средняя детализация (NearMesh)
    LOD2_LOW = 2,       // 200-500 пк - низкая детализация (field)
    LOD3_FAR = 3,       // 500-2000 пк - очень низкая (FarMesh)
    LOD4_IMPOSTOR = 4   // > 2000 пк - билборд (FarMesh LQ)
}

export interface ExtendedPlanetData extends PlanetData {
    distancePc?: number;
    lodLevel?: PlanetLODLevel;
    textureSet?: LODTextureSet;
}

export interface LODTextureSet {
    level: PlanetLODLevel;
    heightMap: Texture;
    normalMap: Texture;
    colorMap: Texture;
    albedoMap: Texture;
    resolution: number;
    lastUpdateTime: number;
}

// ============================================================================
// ИНТЕРФЕЙС API ДЛЯ МОДУЛЯ ПЛАНЕТ (ЭКСПОРТИРУЕТСЯ)
// ============================================================================

export interface IPlanetLODAPI extends IModuleAPI {
    getAllPlanets(): ExtendedPlanetData[];
    getPlanetById(id: string): ExtendedPlanetData | null;
    getPlanetsInRadius(center: Vector3, radius: number): ExtendedPlanetData[];
    getPlanetsByStarId(starId: string): ExtendedPlanetData[];
    addPlanet(data: ExtendedPlanetData): Object3D;
    removePlanet(id: string): boolean;
    updatePlanetPosition(id: string, position: Vector3): void;
    setPlanetOrbit(planetId: string, center: Vector3, radius: number, speed: number): void;
    setPlanetRotation(planetId: string, speedY: number, speedX?: number, speedZ?: number): void;
    getOrbitingStar(planetId: string): StarData | null;
    setOrbitingStar(planetId: string, starId: string): void;
    autoOrbitAroundStar(planetId: string, starId: string, distance?: number, speed?: number): void;
    setPlanetColor(planetId: string, color: [number, number, number]): void;
    setPlanetAtmosphere(planetId: string, enabled: boolean, intensity?: number): void;
    setPlanetClouds(planetId: string, enabled: boolean, coverage?: number): void;
    forceLODUpdate(planetId: string): void;
    getCurrentLOD(planetId: string): PlanetLODLevel;
    setLODBias(bias: number): void;
    onPlanetSelected(callback: (planet: ExtendedPlanetData) => void): () => void;
    onPlanetClicked(callback: (planet: ExtendedPlanetData) => void): () => void;
    onLODChanged(callback: (planetId: string, oldLOD: PlanetLODLevel, newLOD: PlanetLODLevel) => void): () => void;
    selectPlanet(planetId: string): void;
    getLODManager(): ScientificLODManager | null;
}

// ============================================================================
// КОМПОНЕНТ ПЛАНЕТЫ С LOD И ШЕЙДЕРАМИ ИЗ KOSMOS
// ============================================================================

export class PlanetLODComponent extends ComponentBase {
    public planetData!: ExtendedPlanetData;
    public currentLOD: PlanetLODLevel = PlanetLODLevel.LOD4_IMPOSTOR;
    public lastDistance: number = 0;
    public rotationSpeedY: number = 0.1;
    public rotationSpeedX: number = 0;
    public rotationSpeedZ: number = 0;

    private renderer: MeshRenderer | null = null;
    private lodManager: ScientificLODManager | null = null;
    private textureGenerator: LODTextureGenerator | null = null;
    private camera: Camera3D | null = null;
    private orbitData: { center: Vector3; radius: number; speed: number; angle: number } | null = null;
    private orbitingStarId: string | null = null;
    private atmosphereEnabled: boolean = true;
    private atmosphereIntensity: number = 0.3;
    private cloudsEnabled: boolean = false;
    private cloudCoverage: number = 0.3;
    private lastLODUpdateFrame: number = 0;
    private labelPanel: WorldPanel | null = null;
    private isSelected: boolean = false;

    // GPU буферы для шейдеров
    private planetDataBuffer: UniformGPUBuffer | null = null;
    private lightBuffer: UniformGPUBuffer | null = null;

    private static readonly PLANET_COLORS: Record<string, [number, number, number]> = {
        'O': [0.6, 0.7, 1.0],
        'B': [0.7, 0.8, 1.0],
        'A': [0.9, 0.9, 1.0],
        'F': [1.0, 0.95, 0.8],
        'G': [1.0, 0.9, 0.7],
        'K': [1.0, 0.8, 0.5],
        'M': [1.0, 0.7, 0.4]
    };

    constructor(lodManager: ScientificLODManager) {
        super();
        this.lodManager = lodManager;
        this.textureGenerator = lodManager.getTextureGenerator();

        // Логируем информацию о шейдерах
        logShaderRegistration();
    }

    public initComponent(data: ExtendedPlanetData, lodManager: ScientificLODManager): void {
        this.planetData = data;
        this.lodManager = lodManager;
        this.textureGenerator = lodManager.getTextureGenerator();

        this.object3D.name = `Planet_${data.name}_${data.spectralType}`;
        this.object3D.transform.localPosition = data.position.clone();

        this.atmosphereEnabled = data.hasAtmosphere;
        this.cloudsEnabled = data.hasClouds || false;
        this.currentLOD = data.lodLevel || PlanetLODLevel.LOD4_IMPOSTOR;

        // Создаем GPU буферы для шейдеров
        this.createUniformBuffers();

        // Создаем рендерер с шейдером из kosmos
        this.createRenderer();
        this.createLabel();
    }

    public init(param?: any): void {
        super.init(param);
    }

    private createUniformBuffers(): void {
        // Буфер данных планеты для шейдера
        this.planetDataBuffer = new UniformGPUBuffer(32);
        const planetUniforms = new Float32Array([
            this.planetData.radius,
            this.planetData.radius * 1.05,  // атмосфера
            this.atmosphereEnabled ? 1.0 : 0.0,
            this.atmosphereIntensity,
            this.cloudsEnabled ? 1.0 : 0.0,
            this.cloudCoverage,
            this.getRoughnessForType(),
            this.getMetallicForType()
        ]);
        this.planetDataBuffer.setFloat32Array('data', planetUniforms);
        this.planetDataBuffer.apply();

        // Буфер освещения
        this.lightBuffer = new UniformGPUBuffer(48);
        this.updateLightBuffer();
    }

    private updateLightBuffer(): void {
        if (!this.lightBuffer) return;

        // Получаем направление света (от ближайшей звезды или солнца)
        const lightDir = new Vector3(1, 1, 0).normalize();
        const lightColor = new Vector3(1, 0.95, 0.85);

        const lightUniforms = new Float32Array([
            lightDir.x, lightDir.y, lightDir.z, 0,
            lightColor.x, lightColor.y, lightColor.z, 1.0,
            0.5,  // ambientIntensity
            0.8,  // diffuseIntensity
            0, 0
        ]);
        this.lightBuffer.setFloat32Array('data', lightUniforms);
        this.lightBuffer.apply();
    }

    private createLabel(): void {
        const dist = this.planetData.distancePc;
        if (dist !== undefined && dist > 500) return;

        this.labelPanel = this.object3D.addComponent(WorldPanel);
        this.labelPanel.billboard = BillboardType.BillboardY;
        this.labelPanel.object3D.localScale = new Vector3(0.3, 0.3, 0.3);

        const bgQuad = new Object3D();
        this.labelPanel.object3D.addChild(bgQuad);
        const background = bgQuad.addComponent(UIImage);
        background.uiTransform.resize(160, 40);
        background.color = new Color(0, 0, 0, 0.7);

        const textQuad = new Object3D();
        this.labelPanel.object3D.addChild(textQuad);
        const textField = textQuad.addComponent(UITextField);
        textField.text = `${this.planetData.name}\n${this.planetData.spectralType}`;
        textField.fontSize = 10;
        textField.color = new Color(1, 1, 1, 1);
        textField.alignment = TextAnchor.MiddleCenter;
        textField.uiTransform.resize(150, 30);
        textField.uiTransform.y = 0;
    }

    private setLabelVisible(visible: boolean): void {
        if (this.labelPanel) {
            this.labelPanel.visible = visible;
        }
    }

    private createRenderer(): void {
        this.renderer = this.object3D.addComponent(MeshRenderer);

        // Создаем геометрию сферы с высоким разрешением для ближних LOD
        const geometry = this.createSphereGeometry(128, 128);
        this.renderer.geometry = geometry;

        // Создаем материал с шейдером из kosmos
        const material = this.createPlanetMaterial(this.currentLOD);
        this.renderer.material = material;

        // Устанавливаем цвет планеты
        const color = PlanetLODComponent.PLANET_COLORS[this.planetData.spectralType] || [1.0, 0.9, 0.7];
        material.setUniformVector3('baseColor', new Vector3(color[0], color[1], color[2]));
        material.setUniformFloat('roughness', this.getRoughnessForType());
        material.setUniformFloat('metallic', this.getMetallicForType());
        material.setUniformFloat('hasAtmosphere', this.atmosphereEnabled ? 1.0 : 0.0);
        material.setUniformFloat('atmosphereIntensity', this.atmosphereIntensity);
        material.setUniformFloat('hasClouds', this.cloudsEnabled ? 1.0 : 0.0);
        material.setUniformFloat('cloudCoverage', this.cloudCoverage);
    }

    private createPlanetMaterial(lodLevel: PlanetLODLevel): Material {
        const shader = new Shader();

        let vertShader: string;
        let fragShader: string;

        // Выбор шейдера в зависимости от LOD (как в kosmos)
        switch (lodLevel) {
            case PlanetLODLevel.LOD0_HIGH:
            case PlanetLODLevel.LOD1_MEDIUM:
                // Ближние планеты - PlanetNearMeshShader (высокое разрешение)
                vertShader = PlanetNearMeshShader_vert;
                fragShader = PlanetNearMeshShader_frag;
                break;
            case PlanetLODLevel.LOD2_LOW:
                // Средние планеты - PlanetfieldShader (базовый)
                vertShader = PlanetfieldShader_vert;
                fragShader = PlanetfieldShader_frag;
                break;
            case PlanetLODLevel.LOD3_FAR:
                // Дальние планеты - PlanetFarMeshShader
                vertShader = PlanetFarMeshShader_vert;
                fragShader = PlanetFarMeshShader_frag;
                break;
            case PlanetLODLevel.LOD4_IMPOSTOR:
            default:
                // Очень дальние - упрощенный шейдер
                vertShader = PlanetFarMeshShaderLQ_vert;
                fragShader = PlanetFarMeshShaderLQ_frag;
                break;
        }

        const renderPass = new RenderShaderPass(vertShader, fragShader);
        renderPass.setShaderEntry('main', 'main');

        // Настройки для планет
        renderPass.depthWriteEnabled = true;
        // ⚡ ИСПРАВЛЕНИЕ: transparent устанавливается у материала, а не у renderPass
        // renderPass.transparent = this.atmosphereEnabled; // БЫЛО (НЕПРАВИЛЬНО)

        shader.addRenderPass(renderPass);

        const material = new Material();
        material.shader = shader;
        // ⚡ ИСПРАВЛЕНИЕ: transparent устанавливаем у материала
        material.transparent = this.atmosphereEnabled;

        // Подключаем буферы
        if (this.planetDataBuffer) {
            material.setUniformBuffer('planetData', this.planetDataBuffer);
        }
        if (this.lightBuffer) {
            material.setUniformBuffer('lightUniform', this.lightBuffer);
        }

        return material;
    }

    private createSphereGeometry(segments: number, rings: number): GeometryBase {
        const geometry = new GeometryBase();
        const vertices: number[] = [];
        const normals: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];
        const radius = this.planetData.radius;

        for (let lat = 0; lat <= rings; lat++) {
            const theta = (lat * Math.PI) / rings;
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            for (let lon = 0; lon <= segments; lon++) {
                const phi = (lon * 2 * Math.PI) / segments;
                const x = sinTheta * Math.cos(phi);
                const y = cosTheta;
                const z = sinTheta * Math.sin(phi);

                vertices.push(x * radius, y * radius, z * radius);
                normals.push(x, y, z);
                uvs.push(lon / segments, lat / rings);
            }
        }

        for (let lat = 0; lat < rings; lat++) {
            for (let lon = 0; lon < segments; lon++) {
                const first = lat * (segments + 1) + lon;
                const second = first + segments + 1;
                indices.push(first, second, first + 1);
                indices.push(second, second + 1, first + 1);
            }
        }

        geometry.setAttribute(VertexAttributeName.position, new Float32Array(vertices));
        geometry.setAttribute(VertexAttributeName.normal, new Float32Array(normals));
        geometry.setAttribute(VertexAttributeName.uv, new Float32Array(uvs));
        geometry.setIndices(new Uint32Array(indices));

        geometry.addSubGeometry({
            indexStart: 0,
            indexCount: indices.length,
            vertexStart: 0,
            vertexCount: vertices.length / 3,
            firstStart: 0,
            index: 0,
            topology: 0
        });

        return geometry;
    }

    private getRoughnessForType(): number {
        const roughnessMap: Record<string, number> = {
            'O': 0.2, 'B': 0.25, 'A': 0.3, 'F': 0.35, 'G': 0.4, 'K': 0.5, 'M': 0.6
        };
        return roughnessMap[this.planetData.spectralType] || 0.4;
    }

    private getMetallicForType(): number {
        const metallicMap: Record<string, number> = {
            'O': 0.1, 'B': 0.15, 'A': 0.2, 'F': 0.25, 'G': 0.3, 'K': 0.35, 'M': 0.4
        };
        return metallicMap[this.planetData.spectralType] || 0.3;
    }

    public start(): void {
        const view = Engine3D.views[0];
        if (view && view.camera) {
            this.camera = view.camera;
        }

        // Обновляем буфер освещения каждый кадр
        this.updateLightBuffer();
    }

    public setOrbit(center: Vector3, radius: number, speed: number): void {
        this.orbitData = {
            center: center.clone(),
            radius,
            speed,
            angle: Math.random() * Math.PI * 2
        };
    }

    public setRotationSpeed(speedY: number, speedX: number = 0, speedZ: number = 0): void {
        this.rotationSpeedY = speedY;
        this.rotationSpeedX = speedX;
        this.rotationSpeedZ = speedZ;
    }

    public setOrbitingStar(starId: string): void {
        this.orbitingStarId = starId;
    }

    public getOrbitingStarId(): string | null {
        return this.orbitingStarId;
    }

    public setSelected(selected: boolean): void {
        this.isSelected = selected;
        this.setLabelVisible(selected);

        if (this.renderer && this.renderer.material) {
            const intensity = selected ? 1.5 : 1.0;
            this.renderer.material.setUniformFloat('emissiveIntensity', intensity);
        }
    }

    public setColor(color: [number, number, number]): void {
        if (this.renderer && this.renderer.material) {
            this.renderer.material.setUniformVector3('baseColor', new Vector3(color[0], color[1], color[2]));
        }
    }

    public setAtmosphere(enabled: boolean, intensity: number = 0.3): void {
        this.atmosphereEnabled = enabled;
        this.atmosphereIntensity = intensity;
        if (this.renderer && this.renderer.material) {
            this.renderer.material.setUniformFloat('hasAtmosphere', enabled ? 1.0 : 0.0);
            this.renderer.material.setUniformFloat('atmosphereIntensity', intensity);
        }
        // Обновляем буфер
        this.createUniformBuffers();
    }

    public setClouds(enabled: boolean, coverage: number = 0.3): void {
        this.cloudsEnabled = enabled;
        this.cloudCoverage = coverage;
        if (this.renderer && this.renderer.material) {
            this.renderer.material.setUniformFloat('hasClouds', enabled ? 1.0 : 0.0);
            this.renderer.material.setUniformFloat('cloudCoverage', coverage);
        }
        // Обновляем буфер
        this.createUniformBuffers();
    }

    public forceLODUpdate(): void {
        if (this.camera) {
            const cameraPos = this.camera.object3D.transform.worldPosition;
            const distance = Vector3.distance(cameraPos, this.object3D.transform.localPosition);
            this.updateLODByDistance(distance);
        }
    }

    private updateLODByDistance(distance: number): void {
        let newLOD = PlanetLODLevel.LOD4_IMPOSTOR;

        // Пороги LOD как в kosmos
        if (distance < 50) newLOD = PlanetLODLevel.LOD0_HIGH;
        else if (distance < 200) newLOD = PlanetLODLevel.LOD1_MEDIUM;
        else if (distance < 500) newLOD = PlanetLODLevel.LOD2_LOW;
        else if (distance < 2000) newLOD = PlanetLODLevel.LOD3_FAR;

        if (newLOD !== this.currentLOD) {
            const oldLOD = this.currentLOD;
            this.currentLOD = newLOD;
            this.updateMaterialForLOD();

            if (this.object3D && (this.object3D as any).onLODChanged) {
                (this.object3D as any).onLODChanged(this.planetData.id, oldLOD, newLOD);
            }
        }

        this.lastDistance = distance;
    }

    private updateMaterialForLOD(): void {
        if (!this.renderer) return;

        // Создаем новый материал с соответствующим LOD шейдером
        const newMaterial = this.createPlanetMaterial(this.currentLOD);

        // Копируем основные параметры
        const color = PlanetLODComponent.PLANET_COLORS[this.planetData.spectralType] || [1.0, 0.9, 0.7];
        newMaterial.setUniformVector3('baseColor', new Vector3(color[0], color[1], color[2]));
        newMaterial.setUniformFloat('roughness', this.getRoughnessForType());
        newMaterial.setUniformFloat('metallic', this.getMetallicForType());
        newMaterial.setUniformFloat('hasAtmosphere', this.atmosphereEnabled ? 1.0 : 0.0);
        newMaterial.setUniformFloat('atmosphereIntensity', this.atmosphereIntensity);
        newMaterial.setUniformFloat('hasClouds', this.cloudsEnabled ? 1.0 : 0.0);
        newMaterial.setUniformFloat('cloudCoverage', this.cloudCoverage);

        // ⚡ ИСПРАВЛЕНИЕ: transparent устанавливаем у материала
        newMaterial.transparent = this.atmosphereEnabled;

        this.renderer.material = newMaterial;

        // Упрощаем геометрию для дальних LOD
        if (this.currentLOD >= 3) {
            this.renderer.geometry = this.createSphereGeometry(32, 32);
        } else if (this.currentLOD >= 2) {
            this.renderer.geometry = this.createSphereGeometry(64, 64);
        } else {
            this.renderer.geometry = this.createSphereGeometry(128, 128);
        }
    }

    private updateOrbit(deltaTime: number): void {
        if (!this.orbitData) return;

        this.orbitData.angle += this.orbitData.speed * deltaTime;
        const x = this.orbitData.center.x + Math.cos(this.orbitData.angle) * this.orbitData.radius;
        const z = this.orbitData.center.z + Math.sin(this.orbitData.angle) * this.orbitData.radius;

        this.object3D.transform.localPosition = new Vector3(x, 0, z);
        this.planetData.position = this.object3D.transform.localPosition.clone();
    }

    private updateRotation(deltaTime: number): void {
        const rot = this.object3D.transform.localRotation;
        this.object3D.transform.localRotation = new Vector3(
            rot.x + this.rotationSpeedX * deltaTime,
            rot.y + this.rotationSpeedY * deltaTime,
            rot.z + this.rotationSpeedZ * deltaTime
        );
    }

    private updateTextures(): void {
        if (!this.textureGenerator || !this.lodManager || !this.camera) return;

        const cameraPos = this.camera.object3D.transform.worldPosition;
        const distance = Vector3.distance(cameraPos, this.object3D.transform.localPosition);
        const randomSeed = new Vector3(
            Math.sin(this.planetData.id.length),
            Math.cos(this.planetData.id.length),
            Math.sin(this.planetData.id.length * 2)
        );

        this.textureGenerator.updateTexturesForObject(
            this.planetData.id,
            distance,
            this.planetData.radius,
            this.planetData.radius * 1.05,
            randomSeed,
            this.planetData.spectralType,
            this.planetData.temperature
        );
    }

    public onUpdate(): void {
        if (!this.camera) {
            const view = Engine3D.views[0];
            if (view && view.camera) {
                this.camera = view.camera;
            }
            return;
        }

        const deltaTime = Time.delta;

        this.updateOrbit(deltaTime);
        this.updateRotation(deltaTime);

        const cameraPos = this.camera.object3D.transform.worldPosition;
        const distance = Vector3.distance(cameraPos, this.object3D.transform.localPosition);
        this.updateLODByDistance(distance);

        // Обновляем текстуры раз в 60 кадров
        if (Time.frame % 60 === 0) {
            this.updateTextures();
        }

        // Обновляем интенсивность атмосферы в зависимости от расстояния
        if (this.renderer && this.renderer.material && this.atmosphereEnabled) {
            const atmosphereIntensity = Math.min(0.5, Math.max(0, (distance - 500) / 1500) * this.atmosphereIntensity);
            this.renderer.material.setUniformFloat('atmosphereIntensity', atmosphereIntensity);
        }

        // Видимость лейбла
        if (this.labelPanel) {
            this.labelPanel.visible = distance < 1000 && this.isSelected;
        }

        // Обновляем буфер освещения каждый кадр для динамического света
        this.updateLightBuffer();
    }

    public destroy(force?: boolean): void {
        if (this.renderer) {
            this.renderer.destroy();
            this.renderer = null;
        }
        if (this.labelPanel) {
            this.labelPanel.destroy();
            this.labelPanel = null;
        }
        if (this.planetDataBuffer) {
            this.planetDataBuffer.destroy();
            this.planetDataBuffer = null;
        }
        if (this.lightBuffer) {
            this.lightBuffer.destroy();
            this.lightBuffer = null;
        }
        super.destroy(force);
    }
}

// ============================================================================
// ОСНОВНОЙ МОДУЛЬ ПЛАНЕТ С API
// ============================================================================

export class PlanetLODModule implements IPlanetLODAPI {
    public readonly moduleName = 'planet';
    public readonly version = '2.1.0';

    private planets: Map<string, ExtendedPlanetData> = new Map();
    private planetObjects: Map<string, Object3D> = new Map();
    private planetComponents: Map<string, PlanetLODComponent> = new Map();
    private planetOrbits: Map<string, { center: Vector3; radius: number; speed: number; angle: number }> = new Map();
    private planetToStar: Map<string, string> = new Map();
    private lodManager: ScientificLODManager | null = null;
    private system: UniversalSystem | null = null;
    private lodBias: number = 1.0;
    private lastUpdateTime: number = 0;

    private planetSelectedCallbacks: ((planet: ExtendedPlanetData) => void)[] = [];
    private planetClickedCallbacks: ((planet: ExtendedPlanetData) => void)[] = [];
    private lodChangedCallbacks: ((planetId: string, oldLOD: PlanetLODLevel, newLOD: PlanetLODLevel) => void)[] = [];

    async init(system: UniversalSystem): Promise<void> {
        this.system = system;

        this.lodManager = new ScientificLODManager({
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
        });

        // Логируем информацию о шейдерах
        logShaderRegistration();

        console.log('🪐 [PlanetLODModule] Инициализирован v2.1.0 с шейдерами из kosmos');
    }

    setModuleReferences(modules: Map<string, IModuleAPI>): void {
        console.log(`🪐 [PlanetLODModule] Получено ${modules.size} модулей для связи`);
    }

    start(): void {
        const view = Engine3D.views[0];
        if (view && view.camera && this.lodManager) {
            this.lodManager.setCamera(view.camera);
        }
        console.log('🪐 [PlanetLODModule] Запущен, шейдеры kosmos активны');
    }

    update(deltaTime: number): void {
        if (this.lodManager) {
            const view = Engine3D.views[0];
            if (view && view.camera) {
                const cameraPos = view.camera.object3D.transform.worldPosition;
                this.lodManager.update(cameraPos, Time.frame, deltaTime);
            }
        }

        const now = Date.now();
        if (now - this.lastUpdateTime > 5000) {
            for (const [id, component] of this.planetComponents) {
                const data = this.planets.get(id);
                if (data && component) {
                    data.position = component.object3D.transform.localPosition.clone();
                }
            }
            this.lastUpdateTime = now;
        }
    }

    getAllPlanets(): ExtendedPlanetData[] {
        return Array.from(this.planets.values());
    }

    getPlanetById(id: string): ExtendedPlanetData | null {
        return this.planets.get(id) || null;
    }

    getPlanetsInRadius(center: Vector3, radius: number): ExtendedPlanetData[] {
        const radiusSq = radius * radius;
        const result: ExtendedPlanetData[] = [];

        for (const planet of this.planets.values()) {
            const dx = planet.position.x - center.x;
            const dy = planet.position.y - center.y;
            const dz = planet.position.z - center.z;
            if (dx*dx + dy*dy + dz*dz <= radiusSq) {
                result.push(planet);
            }
        }

        return result;
    }

    getPlanetsByStarId(starId: string): ExtendedPlanetData[] {
        const result: ExtendedPlanetData[] = [];
        for (const [planetId, starIdRef] of this.planetToStar) {
            if (starIdRef === starId) {
                const planet = this.planets.get(planetId);
                if (planet) result.push(planet);
            }
        }
        return result;
    }

    addPlanet(data: ExtendedPlanetData): Object3D {
        if (!this.lodManager) {
            throw new Error('LODManager не инициализирован');
        }

        this.planets.set(data.id, data);

        const planetObj = new Object3D();
        planetObj.name = `Planet_${data.name}`;
        planetObj.transform.localPosition = data.position.clone();

        const component = planetObj.addComponent(PlanetLODComponent, this.lodManager);
        component.initComponent(data, this.lodManager);

        (planetObj as any).onClick = () => {
            for (const cb of this.planetClickedCallbacks) {
                cb(data);
            }
        };

        (planetObj as any).onLODChanged = (planetId: string, oldLOD: PlanetLODLevel, newLOD: PlanetLODLevel) => {
            for (const cb of this.lodChangedCallbacks) {
                cb(planetId, oldLOD, newLOD);
            }
        };

        this.system?.getScene()?.addChild(planetObj);
        this.planetObjects.set(data.id, planetObj);
        this.planetComponents.set(data.id, component);

        console.log(`🪐 [PlanetLODModule] Добавлена планета: ${data.name} (${data.spectralType}) с шейдером kosmos`);

        return planetObj;
    }

    removePlanet(id: string): boolean {
        const obj = this.planetObjects.get(id);
        if (obj) {
            obj.destroy();
            this.planetObjects.delete(id);
            this.planetComponents.delete(id);
            this.planets.delete(id);
            this.planetToStar.delete(id);
            this.planetOrbits.delete(id);
            console.log(`🪐 [PlanetLODModule] Удалена планета: ${id}`);
            return true;
        }
        return false;
    }

    updatePlanetPosition(id: string, position: Vector3): void {
        const planet = this.planets.get(id);
        const obj = this.planetObjects.get(id);
        if (planet && obj) {
            planet.position = position.clone();
            obj.transform.localPosition = position;
        }
    }

    setPlanetOrbit(planetId: string, center: Vector3, radius: number, speed: number): void {
        this.planetOrbits.set(planetId, {
            center: center.clone(),
            radius,
            speed,
            angle: 0
        });

        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setOrbit(center, radius, speed);
        }
    }

    setPlanetRotation(planetId: string, speedY: number, speedX: number = 0, speedZ: number = 0): void {
        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setRotationSpeed(speedY, speedX, speedZ);
        }
    }

    getOrbitingStar(planetId: string): StarData | null {
        const starId = this.planetToStar.get(planetId);
        if (starId && this.system) {
            const starfieldModule = this.system.getModule('starfield');
            if (starfieldModule && 'getStarById' in starfieldModule) {
                return (starfieldModule as any).getStarById(starId);
            }
        }
        return null;
    }

    setOrbitingStar(planetId: string, starId: string): void {
        this.planetToStar.set(planetId, starId);

        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setOrbitingStar(starId);
        }

        const orbit = this.planetOrbits.get(planetId);
        if (orbit && this.system) {
            const starfieldModule = this.system.getModule('starfield');
            if (starfieldModule && 'getStarById' in starfieldModule) {
                const star = (starfieldModule as any).getStarById(starId);
                if (star) {
                    orbit.center = star.position.clone();
                    if (component) {
                        component.setOrbit(orbit.center, orbit.radius, orbit.speed);
                    }
                }
            }
        }
    }

    autoOrbitAroundStar(planetId: string, starId: string, distance: number = 100, speed: number = 0.5): void {
        this.setOrbitingStar(planetId, starId);

        if (this.system) {
            const starfieldModule = this.system.getModule('starfield');
            if (starfieldModule && 'getStarById' in starfieldModule) {
                const star = (starfieldModule as any).getStarById(starId);
                if (star) {
                    this.setPlanetOrbit(planetId, star.position, distance, speed);
                }
            }
        }
    }

    setPlanetColor(planetId: string, color: [number, number, number]): void {
        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setColor(color);
        }
    }

    setPlanetAtmosphere(planetId: string, enabled: boolean, intensity: number = 0.3): void {
        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setAtmosphere(enabled, intensity);
        }
    }

    setPlanetClouds(planetId: string, enabled: boolean, coverage: number = 0.3): void {
        const component = this.planetComponents.get(planetId);
        if (component) {
            component.setClouds(enabled, coverage);
        }
    }

    forceLODUpdate(planetId: string): void {
        const component = this.planetComponents.get(planetId);
        if (component) {
            component.forceLODUpdate();
        }
    }

    getCurrentLOD(planetId: string): PlanetLODLevel {
        const component = this.planetComponents.get(planetId);
        return component ? component.currentLOD : PlanetLODLevel.LOD4_IMPOSTOR;
    }

    setLODBias(bias: number): void {
        this.lodBias = Math.max(0.5, Math.min(2.0, bias));
        if (this.lodManager) {
            const newThresholds = {
                full3dMax: 50 * this.lodBias,
                billboardMax: 200 * this.lodBias,
                detailedPointMax: 500 * this.lodBias,
                simplePointMax: 2000 * this.lodBias
            };
            this.lodManager.updateConfig({ thresholds: newThresholds });
        }
    }

    onPlanetSelected(callback: (planet: ExtendedPlanetData) => void): () => void {
        this.planetSelectedCallbacks.push(callback);
        return () => {
            const index = this.planetSelectedCallbacks.indexOf(callback);
            if (index !== -1) this.planetSelectedCallbacks.splice(index, 1);
        };
    }

    onPlanetClicked(callback: (planet: ExtendedPlanetData) => void): () => void {
        this.planetClickedCallbacks.push(callback);
        return () => {
            const index = this.planetClickedCallbacks.indexOf(callback);
            if (index !== -1) this.planetClickedCallbacks.splice(index, 1);
        };
    }

    onLODChanged(callback: (planetId: string, oldLOD: PlanetLODLevel, newLOD: PlanetLODLevel) => void): () => void {
        this.lodChangedCallbacks.push(callback);
        return () => {
            const index = this.lodChangedCallbacks.indexOf(callback);
            if (index !== -1) this.lodChangedCallbacks.splice(index, 1);
        };
    }

    selectPlanet(planetId: string): void {
        for (const [id, component] of this.planetComponents) {
            component.setSelected(id === planetId);
        }

        const planet = this.planets.get(planetId);
        if (planet) {
            for (const cb of this.planetSelectedCallbacks) {
                cb(planet);
            }
        }
    }

    getLODManager(): ScientificLODManager | null {
        return this.lodManager;
    }

    destroy(): void {
        for (const [id, obj] of this.planetObjects) {
            obj.destroy();
        }
        this.planets.clear();
        this.planetObjects.clear();
        this.planetComponents.clear();
        this.planetOrbits.clear();
        this.planetToStar.clear();
        this.planetSelectedCallbacks = [];
        this.planetClickedCallbacks = [];
        this.lodChangedCallbacks = [];

        if (this.lodManager) {
            this.lodManager.destroy();
            this.lodManager = null;
        }

        console.log('🪐 [PlanetLODModule] Уничтожен');
    }
}

// ============================================================================
// ФАБРИКА СОЗДАНИЯ ПЛАНЕТЫ
// ============================================================================

export function createPlanetWithLOD(
    lodManager: ScientificLODManager,
    data: ExtendedPlanetData
): Object3D {
    const container = new Object3D();
    container.name = `Planet_${data.name}_${data.spectralType}`;

    const component = container.addComponent(PlanetLODComponent, lodManager);
    component.initComponent(data, lodManager);

    console.log(`🪐 [Factory] Создана планета: ${data.name} (${data.spectralType}), шейдер kosmos активен`);

    return container;
}

// ============================================================================
// SYSTEM VECTORS
// ============================================================================

const planetConcept = (): Concept => ({
    type: 'planet_lod',
    version: '2.1.0',
    description: 'Планета с LOD системой (шейдеры из kosmos)'
});

const planetSubstrate = (): Substrate => ({
    data: {},
    source: 'Procedural + kosmos LOD + Gaia DR3',
    timestamp: Date.now()
});

const createPlanetObject = (): Object3D => {
    const container = new Object3D();
    container.name = 'Planet_Template_Kosmos';
    return container;
};

export const PlanetLODVectors: SystemVectors = {
    concept: planetConcept,
    substrate: planetSubstrate,
    createGeometry: () => new GeometryBase(),
    createObject: createPlanetObject
};

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default PlanetLODVectors;

// ============================================================================
// КОНСОЛЬНЫЕ КОМАНДЫ ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__PlanetLODModule = {
        version: '2.1.0',
        description: 'Модуль планет с LOD и шейдерами из kosmos',
        getStats: () => {
            const system = (window as any).__universalSystem;
            if (system) {
                const module = system.getModule('planet');
                if (module) {
                    const planets = module.getAllPlanets();
                    console.log(`🪐 Планет в системе: ${planets.length}`);
                    for (const planet of planets) {
                        console.log(`   - ${planet.name}: ${planet.spectralType}, LOD=${planet.lodLevel || 4}`);
                    }
                    return planets;
                }
            }
            return null;
        },
        shaderInfo: () => {
            console.log('\n🎨 ШЕЙДЕРЫ ПЛАНЕТ ИЗ KOSMOS:');
            console.log('   🪐 PlanetNearMeshShader - ближние планеты (LOD 0-1)');
            console.log('   🪐 PlanetfieldShader - средние планеты (LOD 2)');
            console.log('   🪐 PlanetFarMeshShader - дальние планеты (LOD 3)');
            console.log('   🪐 PlanetFarMeshShaderLQ - очень дальние (LOD 4)');
            console.log('   🔧 NormalMapGeneratorShader - генерация normal maps');
            console.log('   🔧 FarMapGeneratorShader - генерация far maps');
            console.log('   🔧 NearMapGeneratorShader - генерация near maps');
        }
    };

    console.log('✅ [PlanetLODModule] Загружен v2.1.0 с шейдерами из kosmos');
    console.log('   Команды: __PlanetLODModule.getStats(), .shaderInfo()');
}

console.log('═'.repeat(70));
console.log('🪐 [PlanetLODModule] МОДУЛЬ ПЛАНЕТ ЗАГРУЖЕН v2.1.0');
console.log('   • Шейдеры из kosmos (PlanetNearMesh, Planetfield, PlanetFarMesh)');
console.log('   • Полная поддержка LOD системы (0-4 уровни)');
console.log('   • Генерация текстур для каждого LOD');
console.log('   • Атмосфера и облака');
console.log('   • Орбитальное движение');
console.log('   • Интеграция с ModuleAPI');
console.log('   • Поддержка UniversalSystem');
console.log('═'.repeat(70));