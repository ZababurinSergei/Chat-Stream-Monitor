// /10/tests/ui/StarFlightUI.ts
// ВЕРСИЯ 9.1 - ИСПРАВЛЕНИЕ: проверка готовности буферов перед установкой яркости
// - Добавлена проверка starBuffer.outFloat32Array в forceIncreaseStarBrightness()
// - Добавлен fallback с повторными попытками при недоступности буфера
// - Улучшена обработка ошибок при установке интенсивности
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { Vector3, Camera3D, Object3D } from '@orillusion/core';
import { floatingOrigin, GlobalTransform } from '../core/Movement/core/FloatingOrigin.js';
import { ScientificStarfieldComponent, StarScientificData } from '../modules/StarfieldModule.js';
import { starDataStore } from '../core/StarDataStore.js';
import { ShipController } from '../simplified/ShipController.js';

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface StarUIData {
    id: number;
    source_id: string | null;
    ra: number;
    dec: number;
    mag: number;
    position: [number, number, number];
    localPosition: [number, number, number];
    color: [number, number, number];
    size: number;
    brightness: number;
    spectralType: string;
    teff?: number | null;
    distance?: number | null;
    parallax?: number | null;
    absoluteMagnitude?: number;
}

export interface StarFlightUIConfig {
    flyDuration: number;
    stopDistance: number;
    cameraOffset: number;
    cameraHeightOffset: number;
    starIntensity: number;
}

// ============================================================================
// ГЛОБАЛЬНЫЙ ДОСТУП К SHIPCONTROLLER
// ============================================================================

let globalShipControllerInstance: ShipController | null = null;

export function setGlobalShipController(controller: ShipController): void {
    globalShipControllerInstance = controller;
    console.log('🌍 [StarFlightUI] Глобальный ShipController установлен');
}

export function getGlobalShipController(): ShipController | null {
    return globalShipControllerInstance;
}

// ============================================================================
// ОСНОВНОЙ КЛАСС UI
// ============================================================================

export class StarFlightUI {
    private allStarsData: StarUIData[] = [];
    private filteredStarsList: StarUIData[] = [];
    private selectedStar: StarUIData | null = null;
    private currentFilterType: string = 'all';
    private searchQueryText: string = '';
    private isInitialized: boolean = false;
    private isLoadingStars: boolean = false;

    private initializationPromise: Promise<void> | null = null;
    private resolveInitialization: (() => void) | null = null;

    private starfieldComponentRef: ScientificStarfieldComponent | null = null;
    private shipController: ShipController | null = null;
    private universalSystem: any = null;
    private isRenderStarted: boolean = false;
    private pendingRenderCallbacks: (() => void)[] = [];

    // Подписка на хранилище
    private unsubscribeStore: (() => void) | null = null;

    // Элементы DOM
    private starListContainer: HTMLElement | null = null;
    private searchInputField: HTMLInputElement | null = null;
    private starCountSpan: HTMLElement | null = null;
    private distanceInfoSpan: HTMLElement | null = null;
    private flyButton: HTMLButtonElement | null = null;
    private flightIndicatorDiv: HTMLElement | null = null;
    private loadStarsButton: HTMLElement | null = null;
    private starPanelDesc: HTMLElement | null = null;
    private debugBtn: HTMLElement | null = null;
    private forceVisibilityBtn: HTMLElement | null = null;
    private increaseBrightnessBtn: HTMLElement | null = null;

    public config: StarFlightUIConfig = {
        flyDuration: 3.0,
        stopDistance: 50,
        cameraOffset: 20,
        cameraHeightOffset: 30,
        starIntensity: 10.0
    };

    private constructor() {
        console.log('⭐ [StarFlightUI] Приватный конструктор v9.1');
    }

    // ============================================================================
    // АСИНХРОННОЕ СОЗДАНИЕ
    // ============================================================================

    public static async create(): Promise<StarFlightUI> {
        console.log('🚀 [StarFlightUI] Асинхронное создание экземпляра...');

        const ui = new StarFlightUI();

        ui.initializationPromise = new Promise((resolve) => {
            ui.resolveInitialization = resolve;
        });

        await ui.init();

        console.log('⏳ [StarFlightUI] Ожидание установки камеры через setCamera()...');

        ui.attachEventHandlers();

        console.log('✅ [StarFlightUI] Базовый экземпляр создан, ожидает камеру');

        return ui;
    }

    // ============================================================================
    // ПРИВАТНАЯ ИНИЦИАЛИЗАЦИЯ
    // ============================================================================

    private async init(): Promise<void> {
        console.log('⭐ [StarFlightUI] Инициализация...');
        this.getDOMElements();
        this.setupEventDelegation();
        this.isInitialized = true;
    }

    private getDOMElements(): void {
        this.starListContainer = document.getElementById('starList');
        this.searchInputField = document.getElementById('searchInput') as HTMLInputElement;
        this.starCountSpan = document.getElementById('starCount');
        this.distanceInfoSpan = document.getElementById('distanceInfo');
        this.flyButton = document.getElementById('flyBtn') as HTMLButtonElement;
        this.flightIndicatorDiv = document.getElementById('flightIndicator');
        this.loadStarsButton = document.getElementById('loadStarsBtn');
        this.starPanelDesc = document.getElementById('starPanelDesc');
        this.debugBtn = document.getElementById('debugBtn');
        this.forceVisibilityBtn = document.getElementById('forceVisibilityBtn');

        console.log('⭐ DOM элементы получены:', {
            starListContainer: !!this.starListContainer,
            loadStarsButton: !!this.loadStarsButton,
            flyButton: !!this.flyButton,
            shipControllerReady: !!this.shipController
        });
    }

    private setupEventDelegation(): void {
        if (this.starListContainer) {
            this.starListContainer.addEventListener('click', (e) => {
                const target = (e.target as HTMLElement).closest('.star-item');
                if (target) {
                    const starIdx = target.getAttribute('data-star-idx');
                    if (starIdx !== null && this.filteredStarsList[parseInt(starIdx)]) {
                        this.selectStar(this.filteredStarsList[parseInt(starIdx)]);
                    }
                }
            });
        }
    }

    private attachEventHandlers(): void {
        console.log('🔗 [StarFlightUI] Привязка обработчиков событий...');

        if (this.loadStarsButton) {
            const newLoadBtn = this.loadStarsButton.cloneNode(true) as HTMLElement;
            this.loadStarsButton.parentNode?.replaceChild(newLoadBtn, this.loadStarsButton);
            this.loadStarsButton = newLoadBtn;
            if (this.loadStarsButton.style.display !== 'none') {
                this.loadStarsButton.style.display = 'none';
            }
        }

        if (this.flyButton) {
            const newFlyBtn = this.flyButton.cloneNode(true) as HTMLButtonElement;
            this.flyButton.parentNode?.replaceChild(newFlyBtn, this.flyButton);
            this.flyButton = newFlyBtn;
            this.flyButton.addEventListener('click', () => this.flyToSelectedStar());
            this.flyButton.disabled = true;
        }

        if (this.searchInputField) {
            this.searchInputField.addEventListener('input', (e) => {
                this.searchQueryText = (e.target as HTMLInputElement).value;
                this.filterStars();
            });
        }

        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true) as HTMLElement;
            btn.parentNode?.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                newBtn.classList.add('active');
                this.currentFilterType = newBtn.getAttribute('data-filter') || 'all';
                this.filterStars();
            });
        });

        if (this.debugBtn) {
            const newDebugBtn = this.debugBtn.cloneNode(true) as HTMLElement;
            this.debugBtn.parentNode?.replaceChild(newDebugBtn, this.debugBtn);
            this.debugBtn = newDebugBtn;
            this.debugBtn.addEventListener('click', () => this.debugStars());
        }

        if (this.forceVisibilityBtn) {
            const newForceBtn = this.forceVisibilityBtn.cloneNode(true) as HTMLElement;
            this.forceVisibilityBtn.parentNode?.replaceChild(newForceBtn, this.forceVisibilityBtn);
            this.forceVisibilityBtn = newForceBtn;
            this.forceVisibilityBtn.addEventListener('click', () => this.forceVisibility());
        }

        if (this.resolveInitialization) {
            this.resolveInitialization();
            this.resolveInitialization = null;
        }
    }

    // ============================================================================
    // ПУБЛИЧНЫЕ МЕТОДЫ
    // ============================================================================

    /**
     * Принудительное увеличение яркости звезд (ИСПРАВЛЕНАЯ ВЕРСИЯ v9.1)
     * @param intensity - интенсивность (1-20)
     * @param retryCount - количество повторных попыток
     */
    public forceIncreaseStarBrightness(intensity: number = 15.0, retryCount: number = 0): void {
        console.log(`⭐ [StarFlightUI] Принудительное увеличение яркости до ${intensity}...`);

        if (!this.starfieldComponentRef) {
            console.warn('⚠️ starfieldComponentRef не инициализирован');
            if (retryCount < 5) {
                setTimeout(() => this.forceIncreaseStarBrightness(intensity, retryCount + 1), 500);
            }
            return;
        }

        try {
            const comp = this.starfieldComponentRef as any;

            // ================================================================
            // МЕТОД 1: ПРЯМОЕ ОБНОВЛЕНИЕ starBuffer
            // ================================================================
            if (comp.starBuffer) {
                // Проверяем, доступен ли outFloat32Array
                if (!comp.starBuffer.outFloat32Array) {
                    console.log('   ⏳ starBuffer.outFloat32Array не готов, пробуем прочитать...');
                    try {
                        comp.starBuffer.readBuffer(false);
                    } catch(e) {
                        console.warn(`   ⚠️ Не удалось прочитать буфер: ${e}`);
                        if (retryCount < 5) {
                            setTimeout(() => this.forceIncreaseStarBrightness(intensity, retryCount + 1), 300);
                        }
                        return;
                    }
                }

                if (comp.starBuffer.outFloat32Array && comp.starsData) {
                    const starsCount = comp.starsData.length;
                    for (let i = 0; i < starsCount; i++) {
                        const offset = i * 16 + 15;
                        if (comp.starBuffer.outFloat32Array[offset] !== undefined) {
                            comp.starBuffer.outFloat32Array[offset] = intensity;
                        }
                    }
                    comp.starBuffer.apply();
                    console.log(`   ✅ starBuffer обновлен для ${starsCount} звезд`);
                } else {
                    console.warn('   ⚠️ starBuffer.outFloat32Array или starsData недоступны');
                }
            } else {
                console.warn('   ⚠️ starBuffer не создан');
            }

            // ================================================================
            // МЕТОД 2: ГЛОБАЛЬНЫЙ БУФЕР ВРЕМЕНИ
            // ================================================================
            const timeBuffer = (comp.constructor as any).getGlobalTimeBuffer?.();
            if (timeBuffer) {
                if (!timeBuffer.outFloat32Array) {
                    try {
                        timeBuffer.readBuffer(false);
                    } catch(e) {
                        console.warn(`   ⚠️ Не удалось прочитать timeBuffer: ${e}`);
                    }
                }

                if (timeBuffer.outFloat32Array) {
                    const time = performance.now() / 1000;
                    timeBuffer.outFloat32Array[0] = time;
                    timeBuffer.outFloat32Array[2] = intensity;
                    timeBuffer.apply();
                    console.log(`   ✅ Глобальный timeBuffer обновлен, интенсивность=${intensity}`);
                }
            }

            // ================================================================
            // МЕТОД 3: ЧЕРЕЗ МАТЕРИАЛ
            // ================================================================
            if (comp.renderer && comp.renderer.material && comp.renderer.material.shader) {
                const material = comp.renderer.material;
                if (typeof material.setUniformFloat === 'function') {
                    material.setUniformFloat('starIntensity', intensity);
                    console.log(`   ✅ material.starIntensity = ${intensity}`);
                }
            }

            // ================================================================
            // ОТОБРАЖАЕМ УВЕДОМЛЕНИЕ В UI
            // ================================================================
            if (this.flightIndicatorDiv) {
                this.flightIndicatorDiv.innerHTML = `⭐ ЯРКОСТЬ УВЕЛИЧЕНА ДО ${intensity}!`;
                this.flightIndicatorDiv.style.display = 'block';
                setTimeout(() => {
                    if (this.flightIndicatorDiv) this.flightIndicatorDiv.style.display = 'none';
                }, 2000);
            }

        } catch (error) {
            console.error('❌ Ошибка при увеличении яркости:', error);
            if (retryCount < 3) {
                console.log(`   🔄 Повторная попытка через 500ms (${retryCount + 1}/3)`);
                setTimeout(() => this.forceIncreaseStarBrightness(intensity, retryCount + 1), 500);
            }
        }
    }

    /**
     * Установка ссылки на UniversalSystem для правильной синхронизации
     * @param system - экземпляр UniversalSystem
     */
    public setUniversalSystem(system: any): void {
        this.universalSystem = system;
        console.log('🔗 [StarFlightUI] UniversalSystem установлен');

        if (system && typeof system.onRenderStarted === 'function') {
            system.onRenderStarted(() => {
                console.log('🎬 [StarFlightUI] Рендеринг запущен, инициализация UI...');
                this.isRenderStarted = true;

                for (const cb of this.pendingRenderCallbacks) {
                    try { cb(); } catch (e) { console.error('Ошибка в отложенном колбэке:', e); }
                }
                this.pendingRenderCallbacks = [];
            });
        }
    }

    /**
     * Выполнить действие после запуска рендеринга
     * @param callback - функция, которая выполнится после старта рендеринга
     */
    public onRenderStarted(callback: () => void): void {
        if (this.isRenderStarted) {
            callback();
        } else {
            this.pendingRenderCallbacks.push(callback);
        }
    }

    /**
     * Установка камеры и создание ShipController
     * @param cameraObj - объект камеры, на который будет добавлен контроллер
     */
    public setCamera(cameraObj: Object3D): void {
        console.log('📷 [StarFlightUI] Камера получена, создаю ShipController...');

        if (!cameraObj) {
            console.error('❌ [StarFlightUI] cameraObj не передан!');
            return;
        }

        if (!this.shipController) {
            this.shipController = cameraObj.addComponent(ShipController);
            this.shipController.debugMode = true;

            globalShipControllerInstance = this.shipController;
            if (typeof window !== 'undefined') {
                window.__shipController = this.shipController;
            }
            console.log('✅ [StarFlightUI] __shipController установлен в window');

            if (this.universalSystem && typeof this.universalSystem.getShipController === 'function') {
                if (this.universalSystem.getShipController() !== this.shipController) {
                    this.universalSystem.setShipController(this.shipController);
                    console.log('✅ [StarFlightUI] ShipController зарегистрирован в UniversalSystem');
                } else {
                    console.log('ℹ️ [StarFlightUI] ShipController уже был зарегистрирован');
                }
            }

            if (this.flyButton) {
                this.flyButton.disabled = false;
                console.log('🔘 [StarFlightUI] Кнопка полета активирована');
            }
        } else {
            console.log('✅ [StarFlightUI] ShipController уже существует');
        }
    }

    /**
     * Установка ссылки на компонент звездного поля
     * @param ref - ссылка на ScientificStarfieldComponent
     */
    public setStarfieldComponentRef(ref: ScientificStarfieldComponent): void {
        this.starfieldComponentRef = ref;
        console.log('⭐ [StarFlightUI] Связан с компонентом звезд');

        this.subscribeToStoreUpdates();

        this.onRenderStarted(() => {
            const scientificStars = starDataStore.getScientificStars();
            if (scientificStars.length > 0) {
                this.loadStarsDirectly();
                // Даем время на инициализацию буферов
                setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 500);
                // Вторая попытка для надежности
                setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 1500);
            }
        });
    }

    /**
     * Подписка на обновления хранилища
     */
    private subscribeToStoreUpdates(): void {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }

        this.unsubscribeStore = starDataStore.subscribe((data) => {
            console.log(`🔄 [StarFlightUI] Получены новые данные из хранилища: ${data.scientific.length} звезд`);

            if (data.scientific.length > 0 && this.starfieldComponentRef) {
                this.allStarsData = this.convertScientificToUI(data.scientific);
                this.filterStars();
                this.renderStarList();

                if (this.starCountSpan) {
                    this.starCountSpan.textContent = this.allStarsData.length.toString();
                }
                if (this.starPanelDesc) {
                    this.starPanelDesc.textContent = `${this.allStarsData.length} звёзд из Gaia DR3`;
                }

                console.log(`✅ [StarFlightUI] UI обновлен: ${this.allStarsData.length} звезд`);

                // Даем время на инициализацию буферов
                setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 300);
                setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 1000);
            }
        });

        console.log('✅ [StarFlightUI] Подписка на обновления хранилища активирована');
    }

    /**
     * Принудительное обновление UI
     */
    public forceRefresh(): void {
        console.log('🔄 [StarFlightUI] Принудительное обновление UI...');

        const scientificStars = starDataStore.getScientificStars();

        if (scientificStars.length === 0) {
            console.warn('⚠️ [StarFlightUI] Нет данных в хранилище');
            if (this.starListContainer) {
                this.starListContainer.innerHTML = '<div class="loading-indicator">⭐ Загрузка данных из Gaia DR3...</div>';
            }
            return;
        }

        this.loadStarsDirectly();
        setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 500);
    }

    public loadStarsDirectly(): void {
        console.log('🌟 Прямая загрузка звёзд...');

        const scientificStars = starDataStore.getScientificStars();

        if (scientificStars.length === 0) {
            console.warn('⚠️ Нет данных о звездах в хранилище');
            if (this.starListContainer) {
                this.starListContainer.innerHTML = '<div class="loading-indicator">⭐ Загрузка данных из Gaia DR3...</div>';
            }
            return;
        }

        const validStars = scientificStars.filter(star =>
            star.absoluteMagnitude !== undefined &&
            star.absoluteMagnitude !== null &&
            !isNaN(star.absoluteMagnitude)
        );

        if (validStars.length === 0) {
            console.warn('⚠️ Нет звезд с absoluteMagnitude в хранилище');
            if (this.starListContainer) {
                this.starListContainer.innerHTML = '<div class="loading-indicator">⚠️ Нет валидных звезд для отображения</div>';
            }
            return;
        }

        console.log(`⭐ Данных звезд в хранилище: ${scientificStars.length}, валидных: ${validStars.length}`);

        this.allStarsData = this.convertScientificToUI(validStars);

        if (this.allStarsData.length === 0) {
            if (this.starListContainer) {
                this.starListContainer.innerHTML = '<div class="loading-indicator">⚠️ Нет звезд для отображения</div>';
            }
            return;
        }

        this.allStarsData.sort((a, b) => a.mag - b.mag);
        (window as any).__starsData = this.allStarsData;

        console.log(`✅ Загружено ${this.allStarsData.length} звёзд`);

        this.filterStars();
        this.renderStarList();

        if (this.starCountSpan) {
            this.starCountSpan.textContent = this.allStarsData.length.toString();
        }
        if (this.starPanelDesc) {
            this.starPanelDesc.textContent = `${this.allStarsData.length} звёзд из Gaia DR3`;
        }
    }

    private convertScientificToUI(stars: StarScientificData[]): StarUIData[] {
        return stars.map((star, idx) => {
            let posX = 0, posY = 0, posZ = 0;

            if (star.position) {
                if (star.position instanceof Vector3) {
                    posX = star.position.x;
                    posY = star.position.y;
                    posZ = star.position.z;
                } else if (Array.isArray(star.position)) {
                    posX = star.position[0] || 0;
                    posY = star.position[1] || 0;
                    posZ = star.position[2] || 0;
                } else if (typeof star.position === 'object') {
                    posX = (star.position as any).x || 0;
                    posY = (star.position as any).y || 0;
                    posZ = (star.position as any).z || 0;
                }
            }

            if (Math.abs(posX) < 0.01 && Math.abs(posY) < 0.01 && Math.abs(posZ) < 0.01) {
                const raRad = (star.ra !== undefined ? star.ra : 0) * Math.PI / 180;
                const decRad = (star.dec !== undefined ? star.dec : 0) * Math.PI / 180;
                const distance = star.distancePc || 100;

                posX = distance * Math.cos(decRad) * Math.cos(raRad);
                posY = distance * Math.sin(decRad);
                posZ = distance * Math.cos(decRad) * Math.sin(raRad);
            }

            return {
                id: idx,
                source_id: star.sourceId,
                ra: star.ra !== undefined ? star.ra : 0,
                dec: star.dec !== undefined ? star.dec : 0,
                mag: star.magnitude,
                position: [posX, posY, posZ],
                localPosition: [posX, posY, posZ],
                color: star.color,
                size: 0.5,
                brightness: star.currentBrightness || 1,
                spectralType: star.spectralType,
                teff: star.temperature,
                distance: star.distancePc,
                parallax: star.parallax || null,
                absoluteMagnitude: star.absoluteMagnitude
            };
        });
    }

    private getClassColorHex(spectralType: string): string {
        const colors: Record<string, string> = {
            'O': '#9BB0FF', 'B': '#AABFFF', 'A': '#CAD5FF',
            'F': '#FFF5E0', 'G': '#FFF0A0', 'K': '#FFCC6F',
            'M': '#FFAA55'
        };
        return colors[spectralType] || '#FFFFFF';
    }

    private getStarDisplayName(star: StarUIData): string {
        if (star.source_id && star.source_id !== `star_${star.id}`) {
            const shortId = String(star.source_id).slice(-8);
            return `Gaia ${shortId}`;
        }
        return `Звезда ${star.id + 1}`;
    }

    public async loadStars(): Promise<void> {
        if (this.isLoadingStars) {
            console.log('⭐ [StarFlightUI] Загрузка уже выполняется');
            return;
        }

        this.isLoadingStars = true;
        console.log('🌟 Загрузка звёзд по кнопке...');

        if (this.starListContainer) {
            this.starListContainer.innerHTML = '<div class="loading-indicator">⏳ Поиск компонента звезд...</div>';
        }

        let attempts = 0;
        const maxAttempts = 30;

        const findComponent = setInterval(() => {
            attempts++;

            if (this.starfieldComponentRef) {
                clearInterval(findComponent);
                this.loadStarsDirectly();
                this.isLoadingStars = false;
                setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 500);
                return;
            }

            const universalSystem = (window as any).__universalSystem;
            if (universalSystem) {
                const stars = universalSystem.getInstancesByType('scientific_starfield');
                if (stars.length > 0) {
                    const starfield = stars[0];
                    const component = starfield.getComponent(ScientificStarfieldComponent);
                    if (component) {
                        this.starfieldComponentRef = component;
                        clearInterval(findComponent);
                        this.loadStarsDirectly();
                        this.isLoadingStars = false;
                        setTimeout(() => this.forceIncreaseStarBrightness(this.config.starIntensity, 0), 500);
                        return;
                    }
                }
            }

            if (attempts >= maxAttempts) {
                clearInterval(findComponent);
                this.isLoadingStars = false;
                if (this.starListContainer) {
                    this.starListContainer.innerHTML = '<div class="loading-indicator">⚠️ Компонент звезд не найден. Проверьте консоль.</div>';
                }
                console.error('❌ Компонент звезд не найден после 30 попыток');
            }
        }, 500);
    }

    private filterStars(): void {
        this.filteredStarsList = this.allStarsData.filter(star => {
            if (this.currentFilterType !== 'all') {
                const starClass = star.spectralType;
                if (starClass !== this.currentFilterType) return false;
            }

            if (this.searchQueryText) {
                const query = this.searchQueryText.toLowerCase();
                const displayName = this.getStarDisplayName(star).toLowerCase();
                const sourceId = star.source_id ? String(star.source_id).toLowerCase() : '';
                const raStr = star.ra.toFixed(2);
                const decStr = star.dec.toFixed(2);

                return displayName.includes(query) ||
                    sourceId.includes(query) ||
                    raStr.includes(query) ||
                    decStr.includes(query);
            }

            return true;
        });

        if (this.selectedStar && !this.filteredStarsList.includes(this.selectedStar)) {
            this.selectedStar = null;
            if (this.flyButton) this.flyButton.disabled = true;
            if (this.distanceInfoSpan) this.distanceInfoSpan.textContent = '—';
        }

        this.renderStarList();
    }

    public renderStarList(): void {
        if (!this.starListContainer) return;

        if (this.filteredStarsList.length === 0) {
            if (this.allStarsData.length === 0) {
                this.starListContainer.innerHTML = '<div class="loading-indicator">⭐ Загрузка данных из Gaia DR3...</div>';
            } else {
                this.starListContainer.innerHTML = '<div class="loading-indicator">🔍 Звёзд не найдено</div>';
            }
            if (this.starCountSpan) this.starCountSpan.textContent = '0';
            if (this.starPanelDesc) this.starPanelDesc.textContent = '0 звёзд';
            return;
        }

        if (this.starCountSpan) this.starCountSpan.textContent = this.filteredStarsList.length.toString();
        if (this.starPanelDesc) this.starPanelDesc.textContent = `${this.filteredStarsList.length} звёзд из Gaia DR3`;

        const html = this.filteredStarsList.map((star, idx) => {
            const displayName = this.getStarDisplayName(star);
            const spectralType = star.spectralType;
            const classColor = this.getClassColorHex(spectralType);
            const mag = star.mag.toFixed(2);
            const selectedClass = this.selectedStar === star ? 'selected' : '';
            const pos3d = star.position;
            const posStr = pos3d ? `${pos3d[0].toFixed(0)}, ${pos3d[1].toFixed(0)}, ${pos3d[2].toFixed(0)}` : 'N/A';

            return `<div class="star-item ${selectedClass}" data-star-idx="${idx}">
                <div class="star-info">
                    <div class="star-name" style="color: ${classColor};">${displayName}</div>
                    <div class="star-details">
                        ${spectralType} | ${mag}m<br>
                        3D: (${posStr})
                    </div>
                </div>
                <div class="star-mag" style="background: ${classColor}20; color: ${classColor};">${mag}m</div>
            </div>`;
        }).join('');

        this.starListContainer.innerHTML = html;
    }

    public selectStar(star: StarUIData): void {
        this.selectedStar = star;
        this.renderStarList();
        if (this.flyButton && this.shipController) {
            this.flyButton.disabled = false;
        }

        if (this.distanceInfoSpan) {
            if (star.distance) {
                this.distanceInfoSpan.textContent = `${star.distance.toFixed(2)} пк`;
            } else if (star.parallax && star.parallax > 0) {
                const dist = (1000 / star.parallax).toFixed(2);
                this.distanceInfoSpan.textContent = `${dist} пк`;
            } else {
                this.distanceInfoSpan.textContent = '~ пк';
            }
        }

        console.log(`⭐ Выбрана звезда: ${this.getStarDisplayName(star)} (${star.mag.toFixed(2)}m)`);
        console.log(`   Позиция: (${star.position[0].toFixed(2)}, ${star.position[1].toFixed(2)}, ${star.position[2].toFixed(2)})`);
    }

    private validatePosition(pos: [number, number, number]): boolean {
        return this.isValidNumber(pos[0]) && this.isValidNumber(pos[1]) && this.isValidNumber(pos[2]);
    }

    private isValidNumber(value: number): boolean {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    public async flyToSelectedStar(): Promise<void> {
        if (!this.shipController) {
            console.error('❌ ShipController не найден! Убедитесь, что setCamera() был вызван');
            alert('Ошибка: контроллер корабля не инициализирован');
            return;
        }

        if (!this.selectedStar) {
            console.warn('⚠️ Сначала выберите звезду!');
            if (this.flightIndicatorDiv) {
                this.flightIndicatorDiv.innerHTML = '⚠️ СНАЧАЛА ВЫБЕРИТЕ ЗВЕЗДУ!';
                this.flightIndicatorDiv.style.display = 'block';
                setTimeout(() => {
                    if (this.flightIndicatorDiv) this.flightIndicatorDiv.style.display = 'none';
                }, 2000);
            }
            return;
        }

        if (this.shipController.isFlying()) {
            console.warn('⚠️ Полёт уже выполняется!');
            return;
        }

        let starPos = this.selectedStar.position;

        if (!this.validatePosition(starPos)) {
            console.warn(`⚠️ Невалидная позиция звезды: ${starPos}, пробуем получить актуальную...`);

            if (this.starfieldComponentRef && (this.starfieldComponentRef as any).starsData) {
                const starData = (this.starfieldComponentRef as any).starsData[this.selectedStar.id];
                if (starData && starData.position) {
                    const pos = starData.position;
                    if (pos instanceof Vector3) {
                        starPos = [pos.x, pos.y, pos.z];
                    } else if (Array.isArray(pos)) {
                        starPos = [pos[0] || 0, pos[1] || 0, pos[2] || 0];
                    }
                    this.selectedStar.position = starPos;
                    console.log(`✅ Позиция обновлена из компонента: (${starPos[0]}, ${starPos[1]}, ${starPos[2]})`);
                }
            }
        }

        if (!this.validatePosition(starPos)) {
            const universalSystem = (window as any).__universalSystem;
            const camera = universalSystem?.getCamera();
            if (camera) {
                const camPos = camera.object3D.transform.localPosition;
                starPos = [camPos.x + 100, camPos.y, camPos.z + 100];
                console.log(`⚠️ Используем fallback позицию: (${starPos[0]}, ${starPos[1]}, ${starPos[2]})`);
            } else {
                starPos = [100, 0, 100];
                console.log(`⚠️ Используем позицию по умолчанию: (100, 0, 100)`);
            }
            this.selectedStar.position = starPos;
        }

        const starGlobalX = starPos[0];
        const starGlobalY = starPos[1];
        const starGlobalZ = starPos[2];

        if (Math.abs(starGlobalX) < 0.1 && Math.abs(starGlobalY) < 0.1 && Math.abs(starGlobalZ) < 0.1) {
            const angle = (this.selectedStar.id / Math.max(1, this.allStarsData.length)) * Math.PI * 2;
            const radius = 300;
            const newX = Math.cos(angle) * radius;
            const newY = Math.sin(angle * 2) * 50;
            const newZ = Math.sin(angle) * radius;
            starPos = [newX, newY, newZ];
            this.selectedStar.position = starPos;
            console.log(`⭐ Звезда в центре, генерируем позицию: (${newX.toFixed(0)}, ${newY.toFixed(0)}, ${newZ.toFixed(0)})`);
        }

        const displayName = this.getStarDisplayName(this.selectedStar);

        if (this.flightIndicatorDiv) {
            this.flightIndicatorDiv.style.display = 'block';
            this.flightIndicatorDiv.innerHTML = `🚀 ПОЛЁТ К ${displayName}... 0%`;
        }

        if (this.flyButton) {
            this.flyButton.disabled = true;
        }

        const starPosVec = new Vector3(starPos[0], starPos[1], starPos[2]);

        this.shipController.flyToStar(starPosVec, this.selectedStar.source_id || undefined, () => {
            console.log(`✅ ПРИЛЕТЕЛИ К ${displayName}!`);
            if (this.flightIndicatorDiv) {
                this.flightIndicatorDiv.innerHTML = `✅ ПРИБЫЛИ К ${displayName}!`;
                setTimeout(() => {
                    if (this.flightIndicatorDiv) this.flightIndicatorDiv.style.display = 'none';
                }, 2000);
            }
            if (this.flyButton) {
                this.flyButton.disabled = false;
            }

            if (this.starfieldComponentRef && (this.starfieldComponentRef as any).updateLODByDistance) {
                (this.starfieldComponentRef as any).updateLODByDistance(100);
            }
        });

        let lastProgress = 0;
        const updateProgress = setInterval(() => {
            if (!this.shipController || !this.shipController.isFlying()) {
                clearInterval(updateProgress);
                if (this.flyButton) {
                    this.flyButton.disabled = false;
                }
                return;
            }
            const progress = this.shipController.getFlightProgress();
            const progressPercent = Math.floor(progress * 100);
            if (Math.abs(progressPercent - lastProgress) > 5) {
                lastProgress = progressPercent;
                if (this.flightIndicatorDiv) {
                    this.flightIndicatorDiv.innerHTML = `🚀 ПОЛЁТ К ${displayName}... ${progressPercent}%`;
                }
            }
        }, 100);
    }

    public debugStars(): void {
        console.log('\n⭐ [DEBUG] ========== ОТЛАДКА ЗВЕЗД ==========');
        console.log(`⭐ Всего звезд в данных: ${this.allStarsData.length}`);
        console.log(`⭐ Отфильтровано звезд: ${this.filteredStarsList.length}`);
        console.log(`⭐ Текущая выбранная звезда: ${this.selectedStar ? this.getStarDisplayName(this.selectedStar) : 'нет'}`);
        console.log(`⭐ Компонент найден: ${!!this.starfieldComponentRef}`);
        console.log(`⭐ ShipController: ${!!this.shipController}`);
        console.log(`⭐ Глобальный ShipController: ${!!globalShipControllerInstance}`);
        console.log(`⭐ UniversalSystem: ${!!this.universalSystem}`);
        console.log(`⭐ Рендеринг запущен: ${this.isRenderStarted}`);

        if (this.selectedStar) {
            console.log(`⭐ Выбранная звезда позиция: (${this.selectedStar.position[0]}, ${this.selectedStar.position[1]}, ${this.selectedStar.position[2]})`);
            console.log(`⭐ Валидность позиции: ${this.validatePosition(this.selectedStar.position)}`);
            if (this.selectedStar.absoluteMagnitude !== undefined) {
                console.log(`⭐ Абсолютная величина: ${this.selectedStar.absoluteMagnitude.toFixed(2)}M`);
            }
        }

        if (this.starfieldComponentRef) {
            const comp = this.starfieldComponentRef as any;
            console.log(`⭐ Компонент звезд: starsData=${comp.starsData?.length || 0}`);
            console.log(`⭐ starBuffer: ${comp.starBuffer ? 'существует' : 'НЕТ'}`);
            console.log(`⭐ starBuffer.outFloat32Array: ${comp.starBuffer?.outFloat32Array ? 'ДОСТУПЕН' : 'НЕ ДОСТУПЕН'}`);
        }

        if (this.shipController) {
            const pos = this.shipController.getPosition();
            console.log(`⭐ Корабль позиция: (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
            console.log(`⭐ Скорость: ${this.shipController.getSpeed().toFixed(1)} у.е./с`);
            console.log(`⭐ В полёте: ${this.shipController.isFlying()}`);
        }

        const camera = this.universalSystem?.getCamera();
        if (camera) {
            const camPos = camera.object3D.transform.localPosition;
            console.log(`⭐ Камера позиция: (${camPos.x.toFixed(1)}, ${camPos.y.toFixed(1)}, ${camPos.z.toFixed(1)})`);
        }
        console.log('⭐ [DEBUG] =====================================\n');
    }

    public forceVisibility(): void {
        console.log('\n🔧 ПРИНУДИТЕЛЬНАЯ АКТИВАЦИЯ ВИДИМОСТИ ЗВЕЗД');

        const camera = this.universalSystem?.getCamera();
        if (camera) {
            camera.far = 2000000;
            camera.updateProjection();
            console.log(`✅ Far plane камеры: ${camera.far}`);
        }

        if (this.starfieldComponentRef) {
            if ((this.starfieldComponentRef as any).updateAllStars) {
                (this.starfieldComponentRef as any).updateAllStars();
            }
            console.log('✅ Звезды принудительно обновлены');
        }

        this.forceIncreaseStarBrightness(this.config.starIntensity, 0);
    }

    public getShipController(): ShipController | null {
        return this.shipController;
    }

    public getSelectedStar(): StarUIData | null {
        return this.selectedStar;
    }

    public getAllStars(): StarUIData[] {
        return this.allStarsData;
    }

    public isLoading(): boolean {
        return this.isLoadingStars;
    }

    public refresh(): void {
        console.log('🔄 Принудительное обновление списка звезд');
        this.forceRefresh();
    }

    public async waitForReady(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    public destroy(): void {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
            this.unsubscribeStore = null;
        }
        console.log('⭐ [StarFlightUI] Уничтожен');
    }

    // ============================================================================
    // СТАТИЧЕСКИЙ МЕТОД ЗАПУСКА (ПРИНИМАЕТ UniversalSystem)
    // ============================================================================

    public static async main(universalSystemInstance?: any): Promise<StarFlightUI> {
        console.log('🚀 [StarFlightUI] Запуск main() v9.1...');

        const ui = await StarFlightUI.create();

        if (universalSystemInstance) {
            ui.setUniversalSystem(universalSystemInstance);
            console.log('✅ [StarFlightUI] Получена ссылка на UniversalSystem');
        } else {
            console.warn('⚠️ [StarFlightUI] UniversalSystem не передан, регистрация ShipController будет недоступна');
            if (typeof window !== 'undefined' && (window as any).__universalSystem) {
                ui.setUniversalSystem((window as any).__universalSystem);
                console.log('✅ [StarFlightUI] Найдена ссылка на UniversalSystem через window');
            }
        }

        if (typeof window !== 'undefined') {
            (window as any).__starFlightUI = ui;
        }

        console.log('🚀 StarFlightUI загружен и готов к работе (v9.1)');
        console.log('   Команды: __starFlightUI.debugStars(), __starFlightUI.loadStars(), __starFlightUI.refresh()');
        console.log('   Команды: __starFlightUI.forceIncreaseStarBrightness(15) - УВЕЛИЧЕНИЕ ЯРКОСТИ ⭐');
        console.log('   ✅ ShipController создается через setCamera(cameraObj)');
        console.log('   ✅ Глобальная переменная: __shipController');
        console.log('   ✅ Метод setCamera(cameraObj) для создания контроллера');
        console.log('   ✅ Метод setStarfieldComponentRef для связи с компонентом звезд');
        console.log('   ✅ Метод setUniversalSystem для синхронизации');
        console.log('   ✅ Автообновление UI при загрузке данных');
        console.log('   ✅ НОВОЕ В v9.1: проверка готовности буферов перед установкой яркости');
        console.log('   ✅ НОВОЕ В v9.1: повторные попытки при недоступности буфера');

        return ui;
    }
}

// ============================================================================
// ЯВНЫЙ ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================
export default StarFlightUI;

// ============================================================================
// КОНСОЛЬНЫЕ КОМАНДЫ ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__StarFlightUI = {
        version: '9.1',
        description: 'UI для управления полётами к звёздам (с проверкой готовности буферов)',
        methods: ['loadStars', 'refresh', 'forceRefresh', 'debugStars', 'forceVisibility', 'flyToSelectedStar', 'setCamera', 'setStarfieldComponentRef', 'setUniversalSystem', 'forceIncreaseStarBrightness'],
        setShipController: (ctrl: ShipController) => setGlobalShipController(ctrl),
        getShipController: () => getGlobalShipController(),
        forceRefresh: () => {
            const ui = (window as any).__starFlightUI;
            if (ui && ui.forceRefresh) ui.forceRefresh();
        },
        forceIncreaseStarBrightness: (intensity: number) => {
            const ui = (window as any).__starFlightUI;
            if (ui && ui.forceIncreaseStarBrightness) ui.forceIncreaseStarBrightness(intensity, 0);
            else console.warn('⚠️ StarFlightUI не инициализирован');
        },
        checkBuffers: () => {
            const ui = (window as any).__starFlightUI;
            if (ui && ui.starfieldComponentRef) {
                const comp = ui.starfieldComponentRef as any;
                console.log('📊 СОСТОЯНИЕ БУФЕРОВ:');
                console.log(`   starBuffer: ${comp.starBuffer ? '✅' : '❌'}`);
                console.log(`   outFloat32Array: ${comp.starBuffer?.outFloat32Array ? '✅' : '❌'}`);
                console.log(`   starsData: ${comp.starsData?.length || 0} звезд`);
                return { starBuffer: !!comp.starBuffer, outFloat32Array: !!comp.starBuffer?.outFloat32Array, starsCount: comp.starsData?.length || 0 };
            }
            console.log('❌ Компонент звезд не найден');
            return null;
        }
    };

    console.log('✅ [StarFlightUI] Загружен v9.1 с проверкой готовности буферов');
    console.log('   🚀 Команды: __starFlightUI.debugStars(), __starFlightUI.loadStars()');
    console.log('   📷 ShipController создается через setCamera(cameraObj)');
    console.log('   🌍 Глобальный доступ: __starFlightUI.setShipController(ctrl)');
    console.log('   🔄 Автообновление: __starFlightUI.forceRefresh()');
    console.log('   ⭐ НОВАЯ КОМАНДА: __starFlightUI.forceIncreaseStarBrightness(15)');
    console.log('   🔍 НОВАЯ КОМАНДА: __starFlightUI.checkBuffers() - проверка состояния буферов');
    console.log('   📦 Экспорт: default = StarFlightUI');
}

console.log('═'.repeat(70));
console.log('⭐ [StarFlightUI] МОДУЛЬ ЗАГРУЖЕН v9.1');
console.log('   • НЕТ автоматического запуска при загрузке');
console.log('   • ShipController создается ТОЛЬКО через setCamera()');
console.log('   • Вызов main() должен быть из sky.ts');
console.log('   • Добавлен метод forceIncreaseStarBrightness(intensity, retryCount)');
console.log('   • Проверка готовности starBuffer.outFloat32Array');
console.log('   • Автоматические повторные попытки при недоступности буфера');
console.log('   • Автоувеличение яркости до 10.0 при загрузке');
console.log('   • Возможность ручного увеличения через консоль');
console.log('   • НОВОЕ: команда checkBuffers() для диагностики');
console.log('═'.repeat(70));