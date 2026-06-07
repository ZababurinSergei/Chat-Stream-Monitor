// /10/tests/components/VoxelMonitorComponent.ts
// Версия 6.8 - ИСПРАВЛЕН ПОРЯДОК МЕТОДОВ (checkOriginShift объявлен до использования)
// - Метод checkOriginShift перемещен выше
// - Добавлен публичный метод setShipController
// - Метод onShipControllerFound сделан публичным
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { ComponentBase, Vector3 } from '@orillusion/core';
import { floatingOrigin, GlobalTransform } from '../core/Movement/core/FloatingOrigin.js';
import { ShipController } from '../simplified/ShipController.js';

// ============================================================================
// ИНТЕРФЕЙСЫ
// ============================================================================

interface VoxelMonitorElements {
    voxelCoords: HTMLElement | null;
    progressBar: HTMLElement | null;
    progressText: HTMLElement | null;
    shipLocalCoords: HTMLElement | null;
    shipSpeed: HTMLElement | null;
    shipAngles: HTMLElement | null;
    distKm: HTMLElement | null;
    distLy: HTMLElement | null;
    distToShift: HTMLElement | null;
    shiftLog: HTMLElement | null;
    flightTarget: HTMLElement | null;
}

interface ShiftLogEntry {
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
    time: string;
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
// ============================================================================

export class VoxelMonitorComponent extends ComponentBase {
    private elements: VoxelMonitorElements;
    private widgetContainer: HTMLElement | null = null;
    private shiftLogEntries: ShiftLogEntry[] = [];
    private lastVoxel: { x: number; y: number; z: number } | null = null;
    private updateCounter: number = 0;
    private isInitialized: boolean = false;
    private retryCount: number = 0;
    private maxRetries: number = 200;

    private shipController: ShipController | null = null;
    private findControllerTimer: any = null;
    private emergencyRecoveryAttempts: number = 0;
    private readonly MAX_EMERGENCY_ATTEMPTS: number = 50;
    private lastOriginHash: string = '';
    private emergencyTimer: any = null;

    // КЭШ ДАННЫХ КОРАБЛЯ (обновляется каждый кадр)
    private cachedPosition: Vector3 = new Vector3(0, 0, 0);
    private cachedSpeed: number = 0;
    private cachedAngles: { yaw: number; pitch: number; roll: number } = { yaw: 0, pitch: 0, roll: 0 };

    private readonly SHIFT_THRESHOLD_KM: number = 10_000_000;
    private readonly KM_TO_LY: number = 9_461_000_000_000;
    private readonly KM_TO_BILLION: number = 1_000_000_000;
    private readonly KM_TO_MILLION: number = 1_000_000;
    private readonly KM_TO_THOUSAND: number = 1_000;

    constructor() {
        super();
        this.elements = {
            voxelCoords: null,
            progressBar: null,
            progressText: null,
            shipLocalCoords: null,
            shipSpeed: null,
            shipAngles: null,
            distKm: null,
            distLy: null,
            distToShift: null,
            shiftLog: null,
            flightTarget: null
        };
    }

    // ============================================================================
    // ЖИЗНЕННЫЙ ЦИКЛ КОМПОНЕНТА
    // ============================================================================

    public start(): void {
        console.log('✅ [VoxelMonitorComponent] Компонент запущен v6.8 (оптимизированный)');

        this.widgetContainer = document.getElementById('voxel-monitor');
        if (!this.widgetContainer) {
            console.warn('⚠️ [VoxelMonitor] Контейнер #voxel-monitor не найден!');
        }

        this.findDOMElements();
        this.injectStyles();

        // Запускаем поиск ShipController (без setInterval)
        this.startFindShipController();

        // ВАЖНО: включаем компонент, чтобы onUpdate вызывался
        this.enable = true;
    }

    public onEnable(): void {
        super.onEnable?.();
        console.log('✅ [VoxelMonitorComponent] Компонент активирован');
    }

    public onDisable(): void {
        super.onDisable?.();
        console.log('⏸️ [VoxelMonitorComponent] Компонент деактивирован');
    }

    // ============================================================================
    // ПУБЛИЧНЫЙ МЕТОД ДЛЯ УСТАНОВКИ SHIP CONTROLLER
    // ============================================================================

    /**
     * Установка ссылки на ShipController (публичный метод для внешней синхронизации)
     * @param controller - экземпляр ShipController
     */
    public setShipController(controller: ShipController): void {
        if (this.shipController === controller) return;

        console.log('🎮 [VoxelMonitor] Установка ShipController через публичный метод');
        this.onShipControllerFound(controller);
    }

    /**
     * Метод для обработки найденного ShipController (публичный для обратной совместимости)
     * @param controller - экземпляр ShipController
     */
    public onShipControllerFound(controller: ShipController): void {
        if (this.shipController === controller) return;

        console.log('✅ [VoxelMonitor] ShipController найден, переходим на прямую синхронизацию');

        this.shipController = controller;

        if (this.findControllerTimer) {
            clearTimeout(this.findControllerTimer);
            this.findControllerTimer = null;
        }

        if (this.emergencyTimer) {
            clearTimeout(this.emergencyTimer);
            this.emergencyTimer = null;
        }

        // ПЕРВИЧНАЯ СИНХРОНИЗАЦИЯ
        this.syncShipDataDirect();

        // ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ UI
        this.updateDisplay();

        this.checkOriginShift();

        console.log('✅ [VoxelMonitor] Прямая синхронизация активирована, данные обновлены');
    }

    // ============================================================================
    // ПОИСК SHIPCONTROLLER (БЕЗ setInterval, С АВАРИЙНЫМ ВОССТАНОВЛЕНИЕМ)
    // ============================================================================

    private startFindShipController(): void {
        let attempt = 0;
        const maxAttempts = 100;
        let currentDelay = 100;

        console.log('🔍 [VoxelMonitor] Поиск ShipController...');

        const findController = () => {
            attempt++;

            // ============================================================
            // 1. ПРЯМОЙ ДОСТУП К ГЛОБАЛЬНОЙ ПЕРЕМЕННОЙ
            // ============================================================
            if (typeof window !== 'undefined') {
                const globalShip = (window as any).__shipController;
                if (globalShip && globalShip instanceof ShipController) {
                    console.log('🎯 [VoxelMonitor] Найден через __shipController');
                    this.onShipControllerFound(globalShip);
                    return;
                }
            }

            // ============================================================
            // 2. ПОИСК ЧЕРЕЗ UNIVERSAL SYSTEM (ОСНОВНОЙ СПОСОБ)
            // ============================================================
            if (typeof window !== 'undefined') {
                const universalSystem = (window as any).__universalSystem;
                if (universalSystem && typeof universalSystem.getShipController === 'function') {
                    const shipCtrl = universalSystem.getShipController();
                    if (shipCtrl) {
                        console.log('🎯 [VoxelMonitor] Найден через UniversalSystem.getShipController()');
                        this.onShipControllerFound(shipCtrl);
                        return;
                    }
                }
            }

            // ============================================================
            // 3. ПОИСК ЧЕРЕЗ STAR FLIGHT UI (ПРЯМОЙ ДОСТУП)
            // ============================================================
            if (typeof window !== 'undefined') {
                const starFlightUI = (window as any).__starFlightUI;
                if (starFlightUI && typeof starFlightUI.getShipController === 'function') {
                    const shipCtrl = starFlightUI.getShipController();
                    if (shipCtrl) {
                        console.log('🎯 [VoxelMonitor] Найден через __starFlightUI.getShipController()');
                        this.onShipControllerFound(shipCtrl);
                        return;
                    }
                }
            }

            // ============================================================
            // 4. ПОИСК ЧЕРЕЗ КОМПОНЕНТ ЗВЕЗД (КОСВЕННЫЙ)
            // ============================================================
            if (typeof window !== 'undefined') {
                const starfieldComp = (window as any).__starfieldComponent;
                if (starfieldComp && starfieldComp.object3D) {
                    const scene = starfieldComp.object3D.scene3D;
                    if (scene && scene.view && scene.view.camera) {
                        const camera = scene.view.camera;
                        const shipCtrl = camera.object3D.getComponent(ShipController);
                        if (shipCtrl) {
                            console.log('🎯 [VoxelMonitor] Найден через камеру');
                            this.onShipControllerFound(shipCtrl);
                            return;
                        }
                    }
                }
            }

            // ============================================================
            // 5. НАБЛЮДАТЕЛЬ ЗА ПОЯВЛЕНИЕМ __starFlightUI
            // ============================================================
            if (typeof window !== 'undefined' && !(window as any).__starFlightUI && attempt < 10) {
                console.log('🔍 [VoxelMonitor] __starFlightUI еще не готов, устанавливаю наблюдатель...');
                Object.defineProperty(window, '__starFlightUI', {
                    configurable: true,
                    set: (val) => {
                        console.log('🎯 [VoxelMonitor] __starFlightUI появился!');
                        delete (window as any).__starFlightUI;
                        (window as any).__starFlightUI = val;
                        this.startFindShipController();
                    }
                });
            }

            if (attempt >= maxAttempts) {
                console.warn('⚠️ [VoxelMonitor] ShipController не найден после ' + maxAttempts + ' попыток');
                console.log('🆘 [VoxelMonitor] Запуск аварийного восстановления...');
                this.startEmergencyRecovery();
                if (this.findControllerTimer) {
                    clearTimeout(this.findControllerTimer);
                    this.findControllerTimer = null;
                }
                return;
            }

            currentDelay = Math.min(2000, currentDelay + 50);
            this.findControllerTimer = setTimeout(findController, currentDelay) as any;
        };

        this.findControllerTimer = setTimeout(findController, 100) as any;
    }

    private startEmergencyRecovery(): void {
        if (this.shipController) return;
        if (this.emergencyRecoveryAttempts >= this.MAX_EMERGENCY_ATTEMPTS) {
            console.error('❌ [VoxelMonitor] Аварийное восстановление исчерпало все попытки');
            return;
        }

        this.emergencyRecoveryAttempts++;

        const attemptRecovery = () => {
            if (this.shipController) return;

            try {
                const engineViews = (window as any).Engine3D?.views;
                if (engineViews && engineViews[0]) {
                    const camera = engineViews[0].camera;
                    if (camera && camera.object3D) {
                        const controller = camera.object3D.getComponent(ShipController);
                        if (controller) {
                            console.log('🆘 [VoxelMonitor] EMERGENCY: ShipController найден через Engine3D.views');
                            this.onShipControllerFound(controller);
                            return;
                        }
                    }
                }
            } catch(e) {
                console.warn('   Emergency recovery error:', e);
            }

            if (this.emergencyRecoveryAttempts < this.MAX_EMERGENCY_ATTEMPTS) {
                this.emergencyTimer = setTimeout(() => attemptRecovery(), 2000);
            }
        };

        attemptRecovery();
    }

    // ============================================================================
    // ПРЯМАЯ СИНХРОНИЗАЦИЯ ДАННЫХ
    // ============================================================================

    /**
     * Прямая синхронизация данных корабля (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
     */
    private syncShipDataDirect(): void {
        if (!this.shipController) return;

        if (typeof (this.shipController as any).copyPositionTo === 'function') {
            (this.shipController as any).copyPositionTo(this.cachedPosition);
        } else {
            const pos = this.shipController.getPosition();
            if (pos) {
                this.cachedPosition.x = pos.x;
                this.cachedPosition.y = pos.y;
                this.cachedPosition.z = pos.z;
            }
        }

        if (typeof (this.shipController as any).getSpeedValue === 'function') {
            this.cachedSpeed = (this.shipController as any).getSpeedValue();
        } else if (typeof this.shipController.getSpeed === 'function') {
            this.cachedSpeed = this.shipController.getSpeed();
        }

        if (typeof (this.shipController as any).copyAnglesTo === 'function') {
            (this.shipController as any).copyAnglesTo(this.cachedAngles);
        } else {
            const angles = this.shipController.getAnglesDeg();
            if (angles) {
                this.cachedAngles = {
                    yaw: angles.yaw,
                    pitch: angles.pitch,
                    roll: angles.roll
                };
            }
        }
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ UI
    // ============================================================================

    private updateDisplay(): void {
        this.updateFlightTarget();
        this.updateVoxelDisplay();
        this.updateShipData();
        this.updateDistances();
        this.updateShiftLog();
    }

    // ============================================================================
    // ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ
    // ============================================================================

    public onUpdate(): void {
        this.updateCounter++;

        // Синхронизация данных каждый кадр (минимальная нагрузка)
        this.syncShipDataDirect();

        // Обновление UI каждый кадр (максимальная плавность)
        this.updateDisplay();

        this.checkOriginShift();

        // Периодический вызов forceUpdateAll для LOD звезд
        if (this.updateCounter % 300 === 0) {
            if (typeof window !== 'undefined') {
                const starfield = (window as any).__starfieldComponent;
                if (starfield && starfield.forceUpdateAll) {
                    starfield.forceUpdateAll();
                    if (this.shipController && this.updateCounter % 600 === 0) {
                        console.log(`🔄 [VoxelMonitor] forceUpdateAll вызван, кадр ${this.updateCounter}`);
                    }
                }
            }
        }

        // Дебаг лог для проверки (можно убрать в продакшене)
        if (this.shipController && this.updateCounter % 600 === 0) {
            console.log(`🟢 [VoxelMonitor] onUpdate активен, кадр ${this.updateCounter}, скорость=${this.cachedSpeed.toFixed(1)}`);
        }
    }

    // ============================================================================
    // ПРОВЕРКА СМЕНЫ ВОКСЕЛЯ (ОБЪЯВЛЕНА ДО ИСПОЛЬЗОВАНИЯ)
    // ============================================================================

    private checkOriginShift(): void {
        try {
            const origin = floatingOrigin.getOrigin();
            const originHash = `${origin.x},${origin.y},${origin.z}`;
            if (originHash !== this.lastOriginHash) {
                this.lastOriginHash = originHash;
                if (this.shipController && (this.shipController as any).globalTransform) {
                    const globalPos = (this.shipController as any).globalTransform;
                    if (globalPos) {
                        const newLocal = floatingOrigin.globalToLocal(globalPos);
                        this.cachedPosition.copyFrom(newLocal);
                        if (this.updateCounter % 60 === 0) {
                            console.log(`🌍 [VoxelMonitor] Смена вокселя: ${originHash.substring(0, 30)}...`);
                        }
                    }
                }
            }
        } catch(e) {
            // Игнорируем ошибки при старте
        }
    }

    // ============================================================================
    // ПОИСК DOM ЭЛЕМЕНТОВ
    // ============================================================================

    public findDOMElements(): void {
        const findElement = (id: string): HTMLElement | null => {
            return document.getElementById(id);
        };

        // СОЗДАЕМ ЭЛЕМЕНТ ДЛЯ ЦЕЛИ ПОЛЕТА ЕСЛИ ЕГО НЕТ
        let flightTargetEl = findElement('voxel-flight-target');
        if (!flightTargetEl && this.widgetContainer) {
            const targetDiv = document.createElement('div');
            targetDiv.id = 'voxel-flight-target';
            targetDiv.style.marginTop = '6px';
            targetDiv.style.borderTop = '1px solid #333';
            targetDiv.style.paddingTop = '6px';
            targetDiv.style.fontSize = '10px';
            targetDiv.innerHTML = '<div style="color:#888;">🎯 ЦЕЛЬ ПОЛЁТА</div><div id="flight-target-info" style="color:#ffaa44;">— нет —</div>';

            const lastChild = this.widgetContainer?.lastElementChild;
            if (lastChild) {
                this.widgetContainer?.insertBefore(targetDiv, lastChild);
            } else {
                this.widgetContainer?.appendChild(targetDiv);
            }
        }

        const newElements: VoxelMonitorElements = {
            voxelCoords: findElement('voxel-coords'),
            progressBar: findElement('voxel-progress-bar'),
            progressText: findElement('voxel-progress-text'),
            shipLocalCoords: findElement('ship-local-coords'),
            shipSpeed: findElement('ship-speed'),
            shipAngles: findElement('ship-angles'),
            distKm: findElement('voxel-dist-km'),
            distLy: findElement('voxel-dist-ly'),
            distToShift: findElement('voxel-dist-to-shift'),
            shiftLog: findElement('voxel-shift-log'),
            flightTarget: findElement('flight-target-info')
        };

        for (const key of Object.keys(newElements) as (keyof VoxelMonitorElements)[]) {
            if (this.elements[key] !== newElements[key]) {
                this.elements[key] = newElements[key];
            }
        }

        const foundCount = Object.values(this.elements).filter(el => el !== null).length;
        this.isInitialized = foundCount > 0;

        if (foundCount > 0) {
            console.log(`✅ [VoxelMonitor] Найдено ${foundCount} DOM элементов`);
        }
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ ЦЕЛИ ПОЛЁТА
    // ============================================================================

    private updateFlightTarget(): void {
        if (!this.elements.flightTarget) return;

        if (this.shipController && this.shipController.isFlying()) {
            const target = this.shipController.getCurrentTarget();
            const progress = this.shipController.getFlightProgress();
            if (target) {
                const progressPercent = Math.floor(progress * 100);
                this.elements.flightTarget.innerHTML = `✈️ ПОЛЁТ: ${progressPercent}%<br>🎯 Цель: (${target.x.toFixed(0)}, ${target.y.toFixed(0)}, ${target.z.toFixed(0)})`;
                this.elements.flightTarget.style.color = '#ffaa44';
                return;
            }
        }
        this.elements.flightTarget.innerHTML = '— нет активного полёта —';
        this.elements.flightTarget.style.color = '#666';
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ ВОКСЕЛЯ
    // ============================================================================

    private updateVoxelDisplay(): void {
        if (!this.elements.voxelCoords) return;

        const localX = this.safeNumber(this.cachedPosition?.x);
        const localY = this.safeNumber(this.cachedPosition?.y);
        const localZ = this.safeNumber(this.cachedPosition?.z);
        const localDist = this.safeNumber(Math.sqrt(localX * localX + localY * localY + localZ * localZ));
        const progress = Math.min(100, (localDist / this.SHIFT_THRESHOLD_KM) * 100);
        const progressColor = progress > 90 ? '#f44336' : progress > 70 ? '#ff9800' : '#4caf50';

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${Math.min(100, progress)}%`;
            this.elements.progressBar.style.background = progressColor;
        }

        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${progress.toFixed(4)}%`;
        }

        if (this.elements.distToShift) {
            const distToShift = this.safeNumber(Math.max(0, this.SHIFT_THRESHOLD_KM - localDist));
            this.elements.distToShift.textContent = this.formatDistance(distToShift);
        }

        if (this.elements.voxelCoords) {
            const origin = floatingOrigin.getOrigin();
            const voxelX = Math.floor(this.safeNumber(origin?.x) / this.SHIFT_THRESHOLD_KM);
            const voxelY = Math.floor(this.safeNumber(origin?.y) / this.SHIFT_THRESHOLD_KM);
            const voxelZ = Math.floor(this.safeNumber(origin?.z) / this.SHIFT_THRESHOLD_KM);
            this.elements.voxelCoords.textContent = `[${voxelX}, ${voxelY}, ${voxelZ}]`;
        }
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ ДАННЫХ КОРАБЛЯ
    // ============================================================================

    private updateShipData(): void {
        if (!this.elements.shipLocalCoords) return;

        const localX = this.safeNumber(this.cachedPosition?.x);
        const localY = this.safeNumber(this.cachedPosition?.y);
        const localZ = this.safeNumber(this.cachedPosition?.z);

        let globalX = 0, globalY = 0, globalZ = 0;
        try {
            const shipGlobalPos = floatingOrigin.localToGlobal(this.cachedPosition);
            globalX = this.safeNumber(shipGlobalPos?.x);
            globalY = this.safeNumber(shipGlobalPos?.y);
            globalZ = this.safeNumber(shipGlobalPos?.z);
        } catch (e) {}

        const speedKmh = this.cachedSpeed * 3600;

        const formatCoord = (v: number): string => {
            const absV = Math.abs(v);
            if (absV >= this.KM_TO_MILLION) return (v / this.KM_TO_MILLION).toFixed(2) + 'M';
            if (absV >= this.KM_TO_THOUSAND) return (v / this.KM_TO_THOUSAND).toFixed(1) + 'K';
            return v.toFixed(0);
        };

        this.elements.shipLocalCoords.innerHTML = `
            <div>⭐ Глобальные: X:${formatCoord(globalX)} Y:${formatCoord(globalY)} Z:${formatCoord(globalZ)}</div>
            <div style="font-size:9px; color:#888;">📁 Локальные: X:${formatCoord(localX)} Y:${formatCoord(localY)} Z:${formatCoord(localZ)}</div>
        `;

        if (this.elements.shipSpeed) {
            const speedIcon = this.cachedSpeed > 100 ? '🚀' : this.cachedSpeed > 10 ? '✈️' : this.cachedSpeed > 1 ? '🚗' : '🐢';
            this.elements.shipSpeed.textContent = `${speedIcon} ${this.cachedSpeed.toFixed(1)} у.е./с (${speedKmh.toFixed(0)} км/ч)`;
        }

        if (this.elements.shipAngles) {
            const yawColor = '#0ff';
            const pitchColor = '#0f0';
            const rollColor = Math.abs(this.safeNumber(this.cachedAngles.roll)) > 0.5 ? '#f00' : '#aaa';
            this.elements.shipAngles.innerHTML = `
                <span style="color:${yawColor};">Рыск: ${this.safeNumber(this.cachedAngles.yaw).toFixed(0)}°</span>
                <span style="color:${pitchColor}; margin-left:10px;">Тангаж: ${this.safeNumber(this.cachedAngles.pitch).toFixed(0)}°</span>
                <span style="color:${rollColor}; margin-left:10px;">Крен: ${this.safeNumber(this.cachedAngles.roll).toFixed(0)}°</span>
            `;
        }
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ РАССТОЯНИЙ
    // ============================================================================

    private updateDistances(): void {
        if (!this.elements.distKm) return;

        let globalX = 0, globalY = 0, globalZ = 0;

        try {
            const origin = floatingOrigin.getOrigin();
            if (origin) {
                globalX = this.safeNumber(origin.x);
                globalY = this.safeNumber(origin.y);
                globalZ = this.safeNumber(origin.z);
            }
        } catch (e) {}

        const realDistFromEarthKm = this.safeNumber(Math.sqrt(globalX * globalX + globalY * globalY + globalZ * globalZ));

        if (this.elements.distKm) {
            this.elements.distKm.textContent = this.formatDistance(realDistFromEarthKm);
        }

        if (this.elements.distLy) {
            this.elements.distLy.textContent = this.formatLightYears(realDistFromEarthKm);
        }
    }

    // ============================================================================
    // ОБНОВЛЕНИЕ ЛОГА СДВИГОВ
    // ============================================================================

    private updateShiftLog(): void {
        if (!this.elements.shiftLog) return;

        const origin = floatingOrigin.getOrigin();
        const originX = this.safeNumber(origin?.x);
        const originY = this.safeNumber(origin?.y);
        const originZ = this.safeNumber(origin?.z);

        const currentVoxel = {
            x: Math.floor(originX / this.SHIFT_THRESHOLD_KM),
            y: Math.floor(originY / this.SHIFT_THRESHOLD_KM),
            z: Math.floor(originZ / this.SHIFT_THRESHOLD_KM)
        };

        if (this.lastVoxel && (this.lastVoxel.x !== currentVoxel.x ||
            this.lastVoxel.y !== currentVoxel.y ||
            this.lastVoxel.z !== currentVoxel.z)) {

            this.shiftLogEntries.unshift({
                from: { ...this.lastVoxel },
                to: { ...currentVoxel },
                time: new Date().toLocaleTimeString()
            });

            if (this.shiftLogEntries.length > 5) {
                this.shiftLogEntries.pop();
            }

            if (this.elements.voxelCoords) {
                this.elements.voxelCoords.style.animation = 'voxelFlash 0.3s ease';
                setTimeout(() => {
                    if (this.elements.voxelCoords) {
                        this.elements.voxelCoords.style.animation = '';
                    }
                }, 300);
            }

            console.log(`🌍 [VoxelMonitor] Смена вокселя: [${this.lastVoxel.x},${this.lastVoxel.y},${this.lastVoxel.z}] → [${currentVoxel.x},${currentVoxel.y},${currentVoxel.z}]`);
        }

        this.lastVoxel = { ...currentVoxel };

        if (this.elements.shiftLog) {
            if (this.shiftLogEntries.length === 0) {
                this.elements.shiftLog.innerHTML = '<div style="font-size:9px; color:#666;">— нет сдвигов —</div>';
            } else {
                this.elements.shiftLog.innerHTML = this.shiftLogEntries.map(entry => `
                    <div style="font-size:9px; color:#ff9800; margin-bottom:2px;">
                        ${entry.time} → [${entry.to.x},${entry.to.y},${entry.to.z}]
                    </div>
                `).join('');
            }
        }
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================================================

    private safeNumber(value: any, defaultValue: number = 0): number {
        if (value === undefined || value === null) return defaultValue;
        const num = typeof value === 'number' ? value : Number(value);
        return (isNaN(num) || !isFinite(num)) ? defaultValue : num;
    }

    private formatDistance(km: number): string {
        const safeKm = this.safeNumber(km);
        const absKm = Math.abs(safeKm);

        if (absKm >= this.KM_TO_BILLION) {
            return (safeKm / this.KM_TO_BILLION).toFixed(2) + ' млрд км';
        }
        if (absKm >= this.KM_TO_MILLION) {
            return (safeKm / this.KM_TO_MILLION).toFixed(2) + ' млн км';
        }
        if (absKm >= this.KM_TO_THOUSAND) {
            return (safeKm / this.KM_TO_THOUSAND).toFixed(2) + ' тыс км';
        }
        if (absKm >= 1) {
            return safeKm.toFixed(0) + ' км';
        }
        return safeKm.toFixed(2) + ' км';
    }

    private formatLightYears(km: number): string {
        const safeKm = this.safeNumber(km);
        const absKm = Math.abs(safeKm);
        const ly = absKm / this.KM_TO_LY;

        if (ly >= 0.01) return ly.toFixed(6) + ' св.лет';
        if (ly >= 0.000001) return ly.toFixed(9) + ' св.лет';
        return ly.toExponential(3) + ' св.лет';
    }

    private injectStyles(): void {
        if (document.getElementById('voxel-monitor-styles')) return;

        const style = document.createElement('style');
        style.id = 'voxel-monitor-styles';
        style.textContent = `
            @keyframes voxelFlash {
                0% { opacity: 1; text-shadow: none; }
                50% { opacity: 0.7; text-shadow: 0 0 10px #0ff; }
                100% { opacity: 1; text-shadow: none; }
            }
            #voxel-coords { transition: all 0.2s ease; font-family: monospace; }
            .voxel-progress-container { background: #222; border-radius: 4px; overflow: hidden; margin-top: 2px; }
        `;
        document.head.appendChild(style);
    }

    // ============================================================================
    // ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ ОТЛАДКИ
    // ============================================================================

    public getShiftLog(): ShiftLogEntry[] {
        return [...this.shiftLogEntries];
    }

    public getCurrentVoxel(): { x: number; y: number; z: number } | null {
        return this.lastVoxel ? { ...this.lastVoxel } : null;
    }

    public isReady(): boolean {
        return this.isInitialized && this.shipController !== null;
    }

    public getCachedPosition(): Vector3 {
        return this.cachedPosition.clone();
    }

    public getCachedSpeed(): number {
        return this.cachedSpeed;
    }

    public getCachedAngles(): { yaw: number; pitch: number; roll: number } {
        return { ...this.cachedAngles };
    }

    // ============================================================================
    // УНИЧТОЖЕНИЕ
    // ============================================================================

    public onDestroy(): void {
        if (this.findControllerTimer) {
            clearTimeout(this.findControllerTimer);
            this.findControllerTimer = null;
        }
        if (this.emergencyTimer) {
            clearTimeout(this.emergencyTimer);
            this.emergencyTimer = null;
        }

        this.elements = {
            voxelCoords: null,
            progressBar: null,
            progressText: null,
            shipLocalCoords: null,
            shipSpeed: null,
            shipAngles: null,
            distKm: null,
            distLy: null,
            distToShift: null,
            shiftLog: null,
            flightTarget: null
        };
        this.shiftLogEntries = [];
        this.lastVoxel = null;
        this.updateCounter = 0;
        this.isInitialized = false;
        this.shipController = null;
        console.log('🗑️ [VoxelMonitorComponent] Компонент уничтожен');
    }
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default VoxelMonitorComponent;

// ============================================================================
// КОНСОЛЬНЫЕ КОМАНДЫ ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__VoxelMonitorComponent = {
        version: '6.8',
        description: 'Монитор навигации - оптимизированная версия',
        getInstance: () => {
            const universalSystem = (window as any).__universalSystem;
            if (universalSystem && universalSystem.getCamera()) {
                return universalSystem.getCamera().object3D.getComponent(VoxelMonitorComponent);
            }
            return null;
        },
        getShipData: () => {
            const instance = (window as any).__VoxelMonitorComponent.getInstance();
            if (instance) {
                return {
                    position: instance.getCachedPosition(),
                    speed: instance.getCachedSpeed(),
                    angles: instance.getCachedAngles()
                };
            }
            return null;
        },
        status: () => {
            const instance = (window as any).__VoxelMonitorComponent.getInstance();
            if (instance) {
                console.log('📊 [VoxelMonitor] Статус:');
                console.log(`   • ShipController: ${instance.isReady() ? '✅' : '❌'}`);
                console.log(`   • Скорость: ${instance.getCachedSpeed().toFixed(1)} у.е./с`);
                console.log(`   • Позиция: (${instance.getCachedPosition().x.toFixed(1)}, ${instance.getCachedPosition().y.toFixed(1)}, ${instance.getCachedPosition().z.toFixed(1)})`);
            } else {
                console.log('❌ [VoxelMonitor] Компонент не найден');
            }
        }
    };
    console.log('✅ [VoxelMonitorComponent] Загружен v6.8 (оптимизированный)');
}

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

console.log('═'.repeat(70));
console.log('📡 [VoxelMonitorComponent] КОМПОНЕНТ ЗАГРУЖЕН v6.8');
console.log('   • ✅ checkOriginShift объявлен до использования');
console.log('   • ✅ Публичный метод setShipController');
console.log('   • ❌ УДАЛЁН setInterval (дублирование onUpdate)');
console.log('   • ✅ Прямая синхронизация данных в onUpdate');
console.log('   • ✅ UI обновляется каждый кадр (60 FPS)');
console.log('   • 🆘 Аварийное восстановление через Engine3D.views');
console.log('   • Команды: __VoxelMonitorComponent.status()');
console.log('═'.repeat(70));