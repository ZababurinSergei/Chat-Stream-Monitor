// /10/tests/components/UIFlightComponent.ts
// Версия 6.0 - ТОЛЬКО ФИЗИКА, БЕЗ ТЕЛЕПОРТАЦИИ
// - Полностью убран вызов setPosition
// - Движение только через setSpeed и повороты
// - Правильная физика полёта
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { ComponentBase, Camera3D, Vector3 } from '@orillusion/core';

// ============================================================================
// ТИПЫ ДАННЫХ
// ============================================================================

export interface FlightAnimation {
    targetWorldPos: Vector3;
    isActive: boolean;
    targetId?: string;
    targetType?: 'star' | 'planet' | 'point';
    onComplete?: (() => void) | null;
    resolve?: (value: boolean) => void;
    reject?: () => void;
}

export interface FlightComponentConfig {
    maxSpeed: number;           // Максимальная скорость (у.е./с)
    acceleration: number;       // Ускорение (у.е./с²)
    deceleration: number;       // Замедление (у.е./с²)
    stopDistance: number;       // Дистанция остановки
    rotationSpeed: number;      // Скорость поворота (градусы/сек)
    correctionInterval: number; // Интервал коррекции направления (кадры)
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export class UIFlightComponent extends ComponentBase {
    private shipSystem: any = null;
    private camera: Camera3D | null = null;
    private currentFlight: FlightAnimation | null = null;
    private arrivalCallbacks: ((target: Vector3, targetId?: string, targetType?: 'star' | 'planet' | 'point') => void)[] = [];

    private lastUpdateTime: number = 0;
    private updateCounter: number = 0;
    private currentSpeed: number = 0;
    private isDecelerating: boolean = false;
    private lastDistance: number = 0;

    private config: FlightComponentConfig = {
        maxSpeed: 400,
        acceleration: 150,
        deceleration: 200,
        stopDistance: 80,
        rotationSpeed: 90,
        correctionInterval: 3
    };

    constructor() {
        super();
        console.log('✈️ [UIFlightComponent] Создан экземпляр v6.0');
    }

    public initialize(shipSystem: any, camera: Camera3D): void {
        this.shipSystem = shipSystem;
        this.camera = camera;
        this.enable = true;
        this.currentSpeed = 0;
        this.isDecelerating = false;
        console.log('✅ [UIFlightComponent] Инициализирован');
    }

    public setConfig(config: Partial<FlightComponentConfig>): void {
        this.config = { ...this.config, ...config };
    }

    public onArrival(callback: (target: Vector3, targetId?: string, targetType?: 'star' | 'planet' | 'point') => void): () => void {
        this.arrivalCallbacks.push(callback);
        return () => {
            const index = this.arrivalCallbacks.indexOf(callback);
            if (index !== -1) this.arrivalCallbacks.splice(index, 1);
        };
    }

    public flyToStarPosition(
        starPos: Vector3,
        duration?: number,
        starId?: string,
        onComplete?: () => void
    ): void {
        if (!this.shipSystem || !this.camera) {
            console.error('❌ [UIFlightComponent] shipSystem или camera не инициализированы');
            if (onComplete) onComplete();
            return;
        }

        if (this.currentFlight) {
            this.currentFlight = null;
        }

        this.currentSpeed = 0;
        this.isDecelerating = false;
        this.shipSystem.setSpeed(0);

        const startShipPos = this.shipSystem.getPosition();

        const toTarget = new Vector3(
            starPos.x - startShipPos.x,
            starPos.y - startShipPos.y,
            starPos.z - startShipPos.z
        );
        const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (distance > 0.001) {
            toTarget.x /= distance;
            toTarget.y /= distance;
            toTarget.z /= distance;
        }

        const targetYaw = Math.atan2(toTarget.x, toTarget.z) * 180 / Math.PI;
        const targetPitch = Math.asin(Math.max(-1, Math.min(1, toTarget.y))) * 180 / Math.PI;
        this.shipSystem.setRotation(targetYaw, targetPitch, 0);

        this.lastDistance = distance;

        console.log(`🚀 [UIFlightComponent] ПОЛЁТ К ЗВЕЗДЕ`);
        console.log(`   Расстояние: ${distance.toFixed(1)} ед.`);
        console.log(`   Направление: рыск=${targetYaw.toFixed(0)}°, тангаж=${targetPitch.toFixed(0)}°`);

        this.currentFlight = {
            targetWorldPos: starPos.clone(),
            isActive: true,
            targetId: starId,
            targetType: 'star',
            onComplete: onComplete
        };
    }

    public flyToPlanetPosition(planetPos: Vector3, duration?: number, planetId?: string, onComplete?: () => void): void {
        if (!this.shipSystem || !this.camera) {
            console.error('❌ [UIFlightComponent] shipSystem или camera не инициализированы');
            if (onComplete) onComplete();
            return;
        }

        if (this.currentFlight) {
            this.currentFlight = null;
        }

        this.currentSpeed = 0;
        this.isDecelerating = false;
        this.shipSystem.setSpeed(0);

        const startShipPos = this.shipSystem.getPosition();

        const toTarget = new Vector3(
            planetPos.x - startShipPos.x,
            planetPos.y - startShipPos.y,
            planetPos.z - startShipPos.z
        );
        const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (distance > 0.001) {
            toTarget.x /= distance;
            toTarget.y /= distance;
            toTarget.z /= distance;
        }

        const targetYaw = Math.atan2(toTarget.x, toTarget.z) * 180 / Math.PI;
        const targetPitch = Math.asin(Math.max(-1, Math.min(1, toTarget.y))) * 180 / Math.PI;
        this.shipSystem.setRotation(targetYaw, targetPitch, 0);

        this.lastDistance = distance;

        console.log(`🪐 [UIFlightComponent] ПОЛЁТ К ПЛАНЕТЕ`);
        console.log(`   Расстояние: ${distance.toFixed(1)} ед.`);

        this.currentFlight = {
            targetWorldPos: planetPos.clone(),
            isActive: true,
            targetId: planetId,
            targetType: 'planet',
            onComplete: onComplete
        };
    }

    public flyTo(target: Vector3, duration?: number, targetId?: string, targetType?: 'star' | 'planet' | 'point'): Promise<boolean> {
        if (!this.shipSystem || !this.camera) {
            return Promise.resolve(false);
        }

        if (this.currentFlight) {
            this.currentFlight = null;
        }

        this.currentSpeed = 0;
        this.isDecelerating = false;
        this.shipSystem.setSpeed(0);

        const startShipPos = this.shipSystem.getPosition();

        const toTarget = new Vector3(
            target.x - startShipPos.x,
            target.y - startShipPos.y,
            target.z - startShipPos.z
        );
        const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (distance > 0.001) {
            toTarget.x /= distance;
            toTarget.y /= distance;
            toTarget.z /= distance;
        }

        const targetYaw = Math.atan2(toTarget.x, toTarget.z) * 180 / Math.PI;
        const targetPitch = Math.asin(Math.max(-1, Math.min(1, toTarget.y))) * 180 / Math.PI;
        this.shipSystem.setRotation(targetYaw, targetPitch, 0);

        this.lastDistance = distance;

        return new Promise((resolve, reject) => {
            this.currentFlight = {
                targetWorldPos: target.clone(),
                isActive: true,
                targetId: targetId,
                targetType: targetType,
                resolve: resolve,
                reject: reject
            };
        });
    }

    public cancelFlight(): void {
        if (this.currentFlight) {
            if (this.currentFlight.reject) {
                this.currentFlight.reject();
            }
            this.currentFlight = null;
        }
        this.currentSpeed = 0;
        this.isDecelerating = false;
        if (this.shipSystem) {
            this.shipSystem.setSpeed(0);
        }
        console.log('🛑 [UIFlightComponent] Полёт отменён');
    }

    public isFlying(): boolean {
        return this.currentFlight !== null && this.currentFlight.isActive;
    }

    public getFlightProgress(): number {
        if (!this.currentFlight || !this.shipSystem) return 0;

        const currentPos = this.shipSystem.getPosition();
        const toTarget = new Vector3(
            this.currentFlight.targetWorldPos.x - currentPos.x,
            this.currentFlight.targetWorldPos.y - currentPos.y,
            this.currentFlight.targetWorldPos.z - currentPos.z
        );
        const currentDistance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (this.lastDistance <= 0) return 0;
        const progress = 1 - (currentDistance / this.lastDistance);
        return Math.min(1, Math.max(0, progress));
    }

    public getCurrentFlightTarget(): { type: 'star' | 'planet' | 'point'; id?: string; position: Vector3 } | null {
        if (!this.currentFlight) return null;
        return {
            type: this.currentFlight.targetType || 'point',
            id: this.currentFlight.targetId,
            position: this.currentFlight.targetWorldPos
        };
    }

    private correctDirection(deltaTime: number): void {
        if (!this.shipSystem || !this.currentFlight) return;

        const currentPos = this.shipSystem.getPosition();

        const toTarget = new Vector3(
            this.currentFlight.targetWorldPos.x - currentPos.x,
            this.currentFlight.targetWorldPos.y - currentPos.y,
            this.currentFlight.targetWorldPos.z - currentPos.z
        );
        const distance = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (distance < 0.1) return;

        toTarget.x /= distance;
        toTarget.y /= distance;
        toTarget.z /= distance;

        const targetYaw = Math.atan2(toTarget.x, toTarget.z) * 180 / Math.PI;
        const targetPitch = Math.asin(Math.max(-1, Math.min(1, toTarget.y))) * 180 / Math.PI;

        const currentAngles = this.shipSystem.getAnglesDeg();

        let yawDiff = targetYaw - currentAngles.yaw;
        while (yawDiff > 180) yawDiff -= 360;
        while (yawDiff < -180) yawDiff += 360;

        let pitchDiff = targetPitch - currentAngles.pitch;
        while (pitchDiff > 180) pitchDiff -= 360;
        while (pitchDiff < -180) pitchDiff += 360;

        const maxRotation = this.config.rotationSpeed * deltaTime;
        const newYaw = currentAngles.yaw + Math.max(-maxRotation, Math.min(maxRotation, yawDiff));
        const newPitch = currentAngles.pitch + Math.max(-maxRotation, Math.min(maxRotation, pitchDiff));

        this.shipSystem.setRotation(newYaw, newPitch, 0);
    }

    private triggerArrival(target: Vector3, targetId?: string, targetType?: 'star' | 'planet' | 'point'): void {
        for (const cb of this.arrivalCallbacks) {
            try {
                cb(target, targetId, targetType);
            } catch (error) {
                console.error('❌ [UIFlightComponent] Ошибка в callback прибытия:', error);
            }
        }
    }

    // ============================================================================
    // ОСНОВНОЙ ЦИКЛ ОБНОВЛЕНИЯ
    // ============================================================================

    public onUpdate(): void {
        debugger
        this.updateCounter++;

        const now = performance.now();
        let deltaTime = (now - this.lastUpdateTime) / 1000;
        if (deltaTime > 0.033) deltaTime = 0.033;
        if (deltaTime < 0.005) deltaTime = 0.016;
        this.lastUpdateTime = now;

        if (!this.currentFlight || !this.currentFlight.isActive || !this.shipSystem) return;

        const currentPos = this.shipSystem.getPosition();

        const toTarget = new Vector3(
            this.currentFlight.targetWorldPos.x - currentPos.x,
            this.currentFlight.targetWorldPos.y - currentPos.y,
            this.currentFlight.targetWorldPos.z - currentPos.z
        );
        const distanceToTarget = Math.sqrt(toTarget.x * toTarget.x + toTarget.y * toTarget.y + toTarget.z * toTarget.z);

        if (this.lastDistance > 0 && this.updateCounter % 30 === 0) {
            const progress = 1 - (distanceToTarget / this.lastDistance);
            console.log(`   Прогресс: ${(progress * 100).toFixed(1)}% | Дист: ${distanceToTarget.toFixed(0)} ед. | Скорость: ${this.currentSpeed.toFixed(0)}`);
        }

        if (distanceToTarget <= this.config.stopDistance) {
            console.log(`✅ [UIFlightComponent] ПРИБЫТИЕ! Дистанция: ${distanceToTarget.toFixed(1)} ед.`);

            this.shipSystem.setSpeed(0);
            this.currentSpeed = 0;
            this.isDecelerating = false;

            this.triggerArrival(
                this.currentFlight.targetWorldPos,
                this.currentFlight.targetId,
                this.currentFlight.targetType
            );

            if (this.currentFlight.onComplete) {
                try {
                    this.currentFlight.onComplete();
                } catch (error) {
                    console.error('❌ Ошибка в onComplete:', error);
                }
            }

            if (this.currentFlight.resolve) {
                this.currentFlight.resolve(true);
            }

            this.currentFlight = null;
            return;
        }

        const requiredStopDistance = (this.currentSpeed * this.currentSpeed) / (2 * this.config.deceleration);
        const shouldDecelerate = (requiredStopDistance + this.config.stopDistance) >= distanceToTarget;

        if (shouldDecelerate && !this.isDecelerating) {
            this.isDecelerating = true;
            console.log(`   🛑 НАЧАЛО ТОРМОЖЕНИЯ | Дист: ${distanceToTarget.toFixed(0)} ед. | Скорость: ${this.currentSpeed.toFixed(0)}`);
        } else if (!shouldDecelerate && this.isDecelerating && this.currentSpeed < 50) {
            if (distanceToTarget > this.config.stopDistance * 3) {
                this.isDecelerating = false;
                console.log(`   🚀 ВОЗОБНОВЛЕНИЕ РАЗГОНА | Дист: ${distanceToTarget.toFixed(0)} ед.`);
            }
        }

        if (this.isDecelerating) {
            this.currentSpeed -= this.config.deceleration * deltaTime;
            if (this.currentSpeed < 0) this.currentSpeed = 0;
        } else {
            this.currentSpeed += this.config.acceleration * deltaTime;
            if (this.currentSpeed > this.config.maxSpeed) this.currentSpeed = this.config.maxSpeed;
        }

        const speedCommand = this.currentSpeed / this.config.maxSpeed;
        this.shipSystem.setSpeed(Math.min(1, Math.max(0, speedCommand)));

        if (this.updateCounter % this.config.correctionInterval === 0) {
            this.correctDirection(deltaTime);
        }

        if (this.updateCounter % 60 === 0 && this.updateCounter > 0) {
            const status = this.isDecelerating ? 'ТОРМОЖЕНИЕ' : 'РАЗГОН';
            console.log(`🔄 [UIFlightComponent] ${status} | Дист: ${distanceToTarget.toFixed(0)} ед. | Скорость: ${this.currentSpeed.toFixed(0)} у.е./с | Команда: ${speedCommand.toFixed(2)}`);
        }
    }

    public onDestroy(): void {
        this.cancelFlight();
        this.arrivalCallbacks = [];
        this.shipSystem = null;
        this.camera = null;
        console.log('💀 [UIFlightComponent] Уничтожен');
    }
}

export default UIFlightComponent;

if (typeof window !== 'undefined') {
    (window as any).__UIFlightComponent = {
        version: '6.0',
        description: 'Только физика, без телепортации'
    };
    console.log('✅ [UIFlightComponent] Загружен v6.0');
}

console.log('═'.repeat(70));
console.log('✈️ [UIFlightComponent] v6.0');
console.log('   • НЕТ ТЕЛЕПОРТАЦИИ - только физика');
console.log('   • Движение через setSpeed');
console.log('   • Правильное ускорение и торможение');
console.log('   • Постоянная коррекция курса');
console.log('═'.repeat(70));