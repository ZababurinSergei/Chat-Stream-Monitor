// /10/tests/simplified/ShipController.ts
// Версия 4.2 - ДОБАВЛЕНЫ ОПТИМИЗИРОВАННЫЕ МЕТОДЫ ДЛЯ VOXEL MONITOR
// - Крен (Q/E) - вращение вокруг локальной оси forward (С ЗАТУХАНИЕМ)
// - Тангаж (T/G) - вращение вокруг локальной оси right (С ЗАТУХАНИЕМ)
// - Рыскание (Z/C) - вращение вокруг локальной оси up (С ЗАТУХАНИЕМ)
// - Добавлены методы для обратной совместимости: onPositionChange, onArrival, flyToStar, etc.
// - ДОБАВЛЕНЫ: copyPositionTo(), copyAnglesTo(), getSpeedValue() для оптимизации
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import {
    ComponentBase,
    Camera3D,
    Object3D,
    Vector3,
    Quaternion,
} from '@orillusion/core';

import { floatingOrigin, GlobalTransform, IGlobalObject } from '../core/Movement/core/FloatingOrigin.js';

// ============================================================================
// КОНФИГУРАЦИЯ КОРАБЛЯ
// ============================================================================

export interface ShipConfig {
    maxSpeed: number;
    acceleration: number;
    deceleration: number;
    reverseAcceleration?: number;
    inertia: number;
    speedExponent: number;
    speedMultiplier: number;
    rotationSpeed: number;
    rotationAcceleration: number;
    rotationDamping: number;
    angularInertia: number;
    maxPitch: number;
    maxRoll: number;
    minSpeed: number;
    enableMouseLook: boolean;
    mouseSensitivity: number;
    maxRotationSpeed: number;
    invertY: boolean;
    invertX: boolean;
    mouseCenterDeadzone: number;
    mouseMaxDistance: number;
    wheelSensitivity: number;
    wheelDecayFactor: number;
    enableAutopilot: boolean;
    autopilotSpeed: number;
    planetAlignment: boolean;
    alignmentStrength: number;
    alignmentDistance: number;
    boostMultiplier: number;
    boostConsumption: number;
    boostRegenRate: number;
    maxBoost: number;
    brakePower: number;
    airBrakePower: number;
    enableGForce: boolean;
    gForceMultiplier: number;
    cameraShakeMultiplier: number;
    engineNoiseMultiplier: number;
    rollSpeed: number;
    pitchSpeed: number;
    yawSpeed: number;
    rollAcceleration: number;
    pitchAcceleration: number;
    yawAcceleration: number;
    rollDamping: number;
    pitchDamping: number;
    yawDamping: number;
    maxRollSpeed: number;
    maxPitchSpeed: number;
    maxYawSpeed: number;
    initialPosition: Vector3;
}

// ============================================================================
// СОСТОЯНИЕ КОРАБЛЯ
// ============================================================================

export interface ShipState {
    position: Vector3;
    velocity: Vector3;
    acceleration: Vector3;
    forward: Vector3;
    up: Vector3;
    right: Vector3;
    yaw: number;
    pitch: number;
    roll: number;
    angularVelocity: Vector3;
    speed: number;
    forwardSpeed: number;
    lateralSpeed: number;
    verticalSpeed: number;
    desiredRotation: Quaternion;
    smoothRotation: Quaternion;
    autopilotEnabled: boolean;
    autopilotAngle: number;
    planetAlignmentActive: boolean;
    planetPosition: Vector3;
    boost: number;
    boostActive: boolean;
    lastUpdateTime: number;
    flightTime: number;
    gForce: number;
    cameraShake: number;
    engineNoise: number;
}

// ============================================================================
// ВХОДНЫЕ СИГНАЛЫ
// ============================================================================

export interface ShipInput {
    speedCommand: number;
    strafeX: number;
    strafeY: number;
    yaw: number;
    pitch: number;
    roll: number;
    reverseMode: boolean;
    boostRequest: boolean;
    brakeRequest: boolean;
    rollLeft: boolean;
    rollRight: boolean;
    pitchUp: boolean;
    pitchDown: boolean;
    yawLeft: boolean;
    yawRight: boolean;
}

// ============================================================================
// ДАННЫЕ ДЛЯ АНИМАЦИИ ПОЛЁТА
// ============================================================================

export interface FlightAnimationData {
    startPos: Vector3;
    targetPos: Vector3;
    startTime: number;
    duration: number;
    onComplete?: () => void;
    isActive: boolean;
}

// ============================================================================
// КОМПОНЕНТ УПРАВЛЕНИЯ ПОЛЁТОМ
// ============================================================================

export class FlightControllerComponent extends ComponentBase {
    private currentFlight: FlightAnimationData | null = null;
    private shipSystem: ShipMovementSystem | null = null;

    public initialize(shipSystem: ShipMovementSystem): void {
        this.shipSystem = shipSystem;
    }

    public startFlight(
        startPos: Vector3,
        targetPos: Vector3,
        duration: number,
        onComplete?: () => void
    ): void {
        this.currentFlight = {
            startPos: startPos.clone(),
            targetPos: targetPos.clone(),
            startTime: performance.now(),
            duration: duration * 1000,
            onComplete: onComplete,
            isActive: true
        };
    }

    public cancelFlight(): void {
        this.currentFlight = null;
    }

    public isFlying(): boolean {
        return this.currentFlight !== null && this.currentFlight.isActive;
    }

    public getCurrentTarget(): Vector3 | null {
        return this.currentFlight?.targetPos.clone() || null;
    }

    public getFlightProgress(): number {
        if (!this.currentFlight) return 0;
        const elapsed = performance.now() - this.currentFlight.startTime;
        return Math.min(1, elapsed / this.currentFlight.duration);
    }

    onUpdate(): void {
        if (!this.currentFlight || !this.currentFlight.isActive || !this.shipSystem) return;

        const now = performance.now();
        const elapsed = now - this.currentFlight.startTime;
        let progress = Math.min(1, elapsed / this.currentFlight.duration);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const newX = this.currentFlight.startPos.x +
            (this.currentFlight.targetPos.x - this.currentFlight.startPos.x) * easeProgress;
        const newY = this.currentFlight.startPos.y +
            (this.currentFlight.targetPos.y - this.currentFlight.startPos.y) * easeProgress;
        const newZ = this.currentFlight.startPos.z +
            (this.currentFlight.targetPos.z - this.currentFlight.startPos.z) * easeProgress;

        this.shipSystem.setPosition(new Vector3(newX, newY, newZ));

        if (progress >= 1.0) {
            if (this.currentFlight.onComplete) {
                this.currentFlight.onComplete();
            }
            this.currentFlight = null;
        }
    }
}

// ============================================================================
// КОНФИГУРАЦИЯ ПО УМОЛЧАНИЮ
// ============================================================================

const DEFAULT_CONFIG: ShipConfig = {
    initialPosition: new Vector3(0, 50, 200),
    maxSpeed: 500,
    acceleration: 200,
    deceleration: 100,
    reverseAcceleration: 80,
    inertia: 0.95,
    speedExponent: 22.0,
    speedMultiplier: 3.0,
    rotationSpeed: 2.0,
    rotationAcceleration: 8.0,
    rotationDamping: 0.92,
    angularInertia: 0.95,
    maxPitch: Math.PI / 2.2,
    maxRoll: Math.PI / 3,
    minSpeed: 0.1,
    enableMouseLook: true,
    mouseSensitivity: 0.002,
    maxRotationSpeed: 1.5,
    invertY: false,
    invertX: false,
    mouseCenterDeadzone: 30,
    mouseMaxDistance: 200,
    wheelSensitivity: 0.002,
    wheelDecayFactor: 0.95,
    enableAutopilot: true,
    autopilotSpeed: 0.5,
    planetAlignment: true,
    alignmentStrength: 0.15,
    alignmentDistance: 0.10,
    boostMultiplier: 1.5,
    boostConsumption: 50,
    boostRegenRate: 25,
    maxBoost: 100,
    brakePower: 300,
    airBrakePower: 1.5,
    enableGForce: true,
    gForceMultiplier: 0.5,
    cameraShakeMultiplier: 0.01,
    engineNoiseMultiplier: 0.001,
    rollSpeed: 180.0,
    pitchSpeed: 180.0,
    yawSpeed: 180.0,
    rollAcceleration: 240.0,
    pitchAcceleration: 120.0,
    yawAcceleration: 120.0,
    rollDamping: 0.98,
    pitchDamping: 0.92,
    yawDamping: 0.92,
    maxRollSpeed: 540.0,
    maxPitchSpeed: 360.0,
    maxYawSpeed: 360.0
};

// ============================================================================
// ОСНОВНОЙ КЛАСС СИСТЕМЫ ПЕРЕДВИЖЕНИЯ
// ============================================================================

export class ShipMovementSystem extends ComponentBase implements IGlobalObject {
    public config: ShipConfig;
    public state: ShipState;
    public input: ShipInput;
    public enabled: boolean = true;
    public debugMode: boolean = false;
    public shipName: string = 'Explorer';
    public worldBounds: number = 100000;
    public enableWrapAround: boolean = false;

    public readonly id: string;
    public globalTransform: GlobalTransform = new GlobalTransform(0, 0, 0);
    public localPosition: Vector3 = new Vector3(0, 0, 0);

    public flightController: FlightControllerComponent | null = null;

    // ✅ НОВЫЕ ПОЛЯ ДЛЯ СОБЫТИЙ (обратная совместимость)
    private positionChangeCallbacks: ((position: Vector3) => void)[] = [];
    private arrivalCallbacks: ((target: Vector3) => void)[] = [];
    private lastPosition: Vector3 = new Vector3(0, 0, 0);

    private cameraObject: Object3D | null = null;
    private camera: Camera3D | null = null;
    private planetManager: any = null;
    private mouseInside: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private wheelAccumulator: number = 0;
    private engineNoisePhase: number = 0;
    private debugElement: HTMLElement | null = null;
    private velocityForward: number = 0;
    private velocityStrafe: number = 0;
    private velocityVertical: number = 0;
    private currentRollVelocity: number = 0;
    private currentPitchVelocity: number = 0;
    private currentYawVelocity: number = 0;
    private targetRotationVelocity: Vector3 = new Vector3(0, 0, 0);
    private currentMouseYawVelocity: number = 0;
    private currentMousePitchVelocity: number = 0;
    private isMouseControlActive: boolean = false;
    private isMouseInputActive: boolean = false;
    private lastYawInput: number = 0;
    private lastPitchInput: number = 0;
    private readonly INPUT_THRESHOLD: number = 0.01;

    constructor(config?: Partial<ShipConfig>) {
        super();
        this.id = `ship_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        this.config = { ...DEFAULT_CONFIG, ...config };
        if (this.config.wheelSensitivity === undefined) this.config.wheelSensitivity = 0.002;
        if (this.config.wheelDecayFactor === undefined) this.config.wheelDecayFactor = 0.92;

        this.state = {
            position: new Vector3(0, 0, 0),
            velocity: new Vector3(0, 0, 0),
            acceleration: new Vector3(0, 0, 0),
            forward: new Vector3(0, 0, 1),
            up: new Vector3(0, 1, 0),
            right: new Vector3(1, 0, 0),
            yaw: 0,
            pitch: 0,
            roll: 0,
            angularVelocity: new Vector3(0, 0, 0),
            speed: 0,
            forwardSpeed: 0,
            lateralSpeed: 0,
            verticalSpeed: 0,
            desiredRotation: Quaternion.identity().clone(),
            smoothRotation: Quaternion.identity().clone(),
            autopilotEnabled: this.config.enableAutopilot,
            autopilotAngle: 0,
            planetAlignmentActive: false,
            planetPosition: new Vector3(0, 0, 0),
            boost: this.config.maxBoost,
            boostActive: false,
            lastUpdateTime: 0,
            flightTime: 0,
            gForce: 0,
            cameraShake: 0,
            engineNoise: 0
        };

        this.input = {
            speedCommand: 0,
            strafeX: 0,
            strafeY: 0,
            yaw: 0,
            pitch: 0,
            roll: 0,
            reverseMode: false,
            boostRequest: false,
            brakeRequest: false,
            rollLeft: false,
            rollRight: false,
            pitchUp: false,
            pitchDown: false,
            yawLeft: false,
            yawRight: false
        };
    }

    public init(param?: any): void {
        this.cameraObject = this.object3D;
        if (this.cameraObject) this.camera = this.cameraObject.getComponent(Camera3D);
        this.flightController = this.object3D.addComponent(FlightControllerComponent);
        this.flightController.initialize(this);
        if (this.debugMode) this.createDebugUI();
        this.state.lastUpdateTime = performance.now();
    }

    public start(): void {
        this.setupCanvasEvents();
        this.setupKeyboardEvents();
        this.setupWheelEvents();
        floatingOrigin.registerObject(this);
        if (this.camera) floatingOrigin.setCamera(this.camera);
        this.globalTransform = floatingOrigin.localToGlobal(this.config.initialPosition);
        this.state.position.copyFrom(this.config.initialPosition);
        this.localPosition.copyFrom(this.config.initialPosition);
        if (this.cameraObject) {
            const controllers = this.cameraObject.getComponents(ComponentBase);
            for (const controller of controllers) {
                if (controller !== this && controller.constructor.name !== 'Camera3D') {
                    (controller as any).enabled = false;
                }
            }
        }
        if (this.debugMode) console.log(`🚀 Корабль зарегистрирован в Floating Origin: ${this.id}`);
        this.resetPosition();
    }

    onOriginShift(delta: GlobalTransform): void {
        this.globalTransform = this.globalTransform.add(delta);
        this.localPosition = floatingOrigin.globalToLocal(this.globalTransform);
        if (this.cameraObject) this.cameraObject.transform.updateWorldMatrix(true);
        if (this.debugMode) {
            const distLy = this.getDistanceFromEarthLy();
            console.log(`🚀 [Ship] Origin shift! Расстояние от Земли: ${distLy.toFixed(6)} св. лет`);
        }
    }

    private moveTowards(current: number, target: number, maxDelta: number): number {
        if (Math.abs(target - current) <= maxDelta) return target;
        return current + Math.sign(target - current) * maxDelta;
    }

    private getLocalAxes(quat: Quaternion): { right: Vector3; up: Vector3; forward: Vector3 } {
        const q = quat;
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const right = new Vector3(1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y));
        const up = new Vector3(2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x));
        const forward = new Vector3(2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y));
        return { right, up, forward };
    }

    private createRotationQuat(axis: Vector3, angleDeg: number): Quaternion {
        if (Math.abs(angleDeg) < 0.001) return new Quaternion(0, 0, 0, 1);
        const angleRad = angleDeg * Math.PI / 180;
        const halfAngle = angleRad / 2;
        const sinHalf = Math.sin(halfAngle);
        return new Quaternion(axis.x * sinHalf, axis.y * sinHalf, axis.z * sinHalf, Math.cos(halfAngle));
    }

    private multiplyQuaternions(a: Quaternion, b: Quaternion): Quaternion {
        const result = new Quaternion();
        result.multiply(a, b);
        return result;
    }

    private applyAllRotations(baseQuat: Quaternion, rollAngle: number, pitchAngle: number, yawAngle: number): Quaternion {
        const { right, up, forward } = this.getLocalAxes(baseQuat);
        const rollQuat = this.createRotationQuat(forward, rollAngle);
        const pitchQuat = this.createRotationQuat(right, pitchAngle);
        const yawQuat = this.createRotationQuat(up, yawAngle);
        let combined = rollQuat;
        combined = this.multiplyQuaternions(pitchQuat, combined);
        combined = this.multiplyQuaternions(yawQuat, combined);
        const result = this.multiplyQuaternions(combined, baseQuat);
        result.normalize();
        return result;
    }

    private applyRotationFromQuat(quat: Quaternion): void {
        if (!this.cameraObject) return;
        this.cameraObject.transform.localRotQuat = quat.clone();
        this.cameraObject.transform.updateWorldMatrix(true);
        const { forward, up, right } = this.getLocalAxes(quat);
        this.state.forward.copyFrom(forward);
        this.state.up.copyFrom(up);
        this.state.right.copyFrom(right);
        this.state.smoothRotation.copyFrom(quat);
        const euler = quat.getEulerAngles();
        this.state.yaw = euler.y * Math.PI / 180;
        this.state.pitch = euler.x * Math.PI / 180;
        this.state.roll = euler.z * Math.PI / 180;
    }

    private updateRotations(deltaTime: number): void {
        if (deltaTime <= 0 || !this.cameraObject) return;
        const currentQuat = this.cameraObject.transform.localRotQuat;
        if (!currentQuat) return;

        let targetRollVel = 0, targetPitchVel = 0, targetYawVel = 0;
        if (this.input.rollLeft) targetRollVel = -1;
        if (this.input.rollRight) targetRollVel = 1;
        if (this.input.pitchUp) targetPitchVel = -1;
        if (this.input.pitchDown) targetPitchVel = 1;
        if (this.input.yawLeft) targetYawVel = -1;
        if (this.input.yawRight) targetYawVel = 1;

        const rollAcc = this.config.rollAcceleration * deltaTime;
        const pitchAcc = this.config.pitchAcceleration * deltaTime;
        const yawAcc = this.config.yawAcceleration * deltaTime;

        this.currentRollVelocity = this.moveTowards(this.currentRollVelocity, targetRollVel * this.config.maxRollSpeed, rollAcc);
        this.currentPitchVelocity = this.moveTowards(this.currentPitchVelocity, targetPitchVel * this.config.maxPitchSpeed, pitchAcc);
        this.currentYawVelocity = this.moveTowards(this.currentYawVelocity, targetYawVel * this.config.maxYawSpeed, yawAcc);

        this.currentRollVelocity *= this.config.rollDamping;
        this.currentPitchVelocity *= this.config.pitchDamping;
        this.currentYawVelocity *= this.config.yawDamping;

        if (Math.abs(this.currentRollVelocity) < 0.01) this.currentRollVelocity = 0;
        if (Math.abs(this.currentPitchVelocity) < 0.01) this.currentPitchVelocity = 0;
        if (Math.abs(this.currentYawVelocity) < 0.01) this.currentYawVelocity = 0;

        const rollAngle = this.currentRollVelocity * deltaTime;
        const pitchAngle = this.currentPitchVelocity * deltaTime;
        const yawAngle = this.currentYawVelocity * deltaTime;

        if (Math.abs(rollAngle) < 0.001 && Math.abs(pitchAngle) < 0.001 && Math.abs(yawAngle) < 0.001) return;

        const { right, up, forward } = this.getLocalAxes(currentQuat);
        const rollQuat = this.createRotationQuat(forward, rollAngle);
        const pitchQuat = this.createRotationQuat(right, pitchAngle);
        const yawQuat = this.createRotationQuat(up, yawAngle);
        let combined = this.multiplyQuaternions(rollQuat, pitchQuat);
        combined = this.multiplyQuaternions(combined, yawQuat);
        const newQuat = this.multiplyQuaternions(combined, currentQuat);
        newQuat.normalize();
        this.applyRotationFromQuat(newQuat);
    }

    private updateMovement(deltaTime: number): void {
        if (!this.cameraObject) return;
        const currentQuat = this.cameraObject.transform.localRotQuat;
        if (!currentQuat) return;
        const { forward, right, up } = this.getLocalAxes(currentQuat);

        let targetForward = 0, targetStrafe = 0, targetVertical = 0;
        if (this.input.speedCommand > 0) targetForward = this.input.speedCommand * this.config.maxSpeed;
        else if (this.input.speedCommand < 0) targetForward = this.input.speedCommand * this.config.maxSpeed;
        if (this.input.reverseMode) targetForward = -Math.abs(targetForward);
        if (this.input.strafeX !== 0) targetStrafe = this.input.strafeX * this.config.maxSpeed * 0.6;
        if (this.input.strafeY !== 0) targetVertical = this.input.strafeY * this.config.maxSpeed * 0.6;

        if (this.input.boostRequest && this.state.boost > 0) {
            targetForward *= this.config.boostMultiplier;
            this.state.boost = Math.max(0, this.state.boost - this.config.boostConsumption * deltaTime);
            this.state.boostActive = true;
        } else {
            this.state.boostActive = false;
            if (this.state.boost < this.config.maxBoost) {
                this.state.boost = Math.min(this.config.maxBoost, this.state.boost + this.config.boostRegenRate * deltaTime);
            }
        }

        if (this.input.brakeRequest) {
            const brakeEffect = Math.min(1.0, this.config.brakePower * deltaTime);
            targetForward *= (1 - brakeEffect);
            targetStrafe *= (1 - brakeEffect);
            targetVertical *= (1 - brakeEffect);
        }

        const inertia = this.config.inertia;
        this.velocityForward = this.velocityForward * inertia + targetForward * (1 - inertia) * deltaTime;
        this.velocityStrafe = this.velocityStrafe * inertia + targetStrafe * (1 - inertia) * deltaTime;
        this.velocityVertical = this.velocityVertical * inertia + targetVertical * (1 - inertia) * deltaTime;

        this.state.speed = Math.sqrt(this.velocityForward * this.velocityForward + this.velocityStrafe * this.velocityStrafe + this.velocityVertical * this.velocityVertical);

        const moveDelta = new Vector3(
            this.velocityForward * forward.x + this.velocityStrafe * right.x + this.velocityVertical * up.x,
            this.velocityForward * forward.y + this.velocityStrafe * right.y + this.velocityVertical * up.y,
            this.velocityForward * forward.z + this.velocityStrafe * right.z + this.velocityVertical * up.z
        );

        const newLocalPos = this.localPosition.clone().add(moveDelta);
        this.globalTransform = floatingOrigin.localToGlobal(newLocalPos);
        this.state.position.copyFrom(newLocalPos);
        this.localPosition.copyFrom(newLocalPos);

        if (this.cameraObject) {
            this.cameraObject.transform.localPosition.copyFrom(newLocalPos);
            this.cameraObject.transform.updateWorldMatrix(true);
        }

        this.state.forward.copyFrom(forward);
        this.state.right.copyFrom(right);
        this.state.up.copyFrom(up);
        floatingOrigin.syncShipPosition(this.localPosition);

        // ✅ ВЫЗЫВАЕМ КОЛБЭКИ ПРИ ИЗМЕНЕНИИ ПОЗИЦИИ
        if (!this.state.position.equals(this.lastPosition)) {
            for (const cb of this.positionChangeCallbacks) {
                try { cb(this.state.position.clone()); } catch(e) {}
            }
            this.lastPosition.copyFrom(this.state.position);
        }
    }

    // ✅ МЕТОД ДЛЯ ПОДПИСКИ НА ИЗМЕНЕНИЕ ПОЗИЦИИ
    public onPositionChange(callback: (position: Vector3) => void): () => void {
        this.positionChangeCallbacks.push(callback);
        return () => {
            const index = this.positionChangeCallbacks.indexOf(callback);
            if (index !== -1) this.positionChangeCallbacks.splice(index, 1);
        };
    }

    // ✅ МЕТОД ДЛЯ ПОДПИСКИ НА ПРИБЫТИЕ
    public onArrival(callback: (target: Vector3) => void): () => void {
        this.arrivalCallbacks.push(callback);
        return () => {
            const index = this.arrivalCallbacks.indexOf(callback);
            if (index !== -1) this.arrivalCallbacks.splice(index, 1);
        };
    }

    // ✅ МЕТОД ДЛЯ ВЫЗОВА КОЛБЭКОВ ПРИ ПРИБЫТИИ
    private notifyArrival(target: Vector3): void {
        for (const cb of this.arrivalCallbacks) {
            try { cb(target.clone()); } catch(e) {}
        }
    }

    // ✅ МЕТОД ДЛЯ ПОЛЁТА К ТОЧКЕ
    public flyTo(target: Vector3, duration?: number, onComplete?: () => void): void {
        const startPos = this.getPosition();
        const flyDuration = duration || 3;
        this.startFlight(startPos, target, flyDuration, () => {
            if (onComplete) onComplete();
            this.notifyArrival(target);
        });
    }

    // ✅ МЕТОД ДЛЯ ПОЛЁТА К ЗВЕЗДЕ
    public flyToStar(position: Vector3, starId?: string, onComplete?: () => void): void {
        this.flyTo(position, 3, onComplete);
    }

    // ✅ МЕТОД ДЛЯ ПОЛУЧЕНИЯ ПРОГРЕССА ПОЛЁТА
    public getFlightProgress(): number {
        return this.flightController?.getFlightProgress() || 0;
    }

    // ✅ МЕТОД ДЛЯ ПОЛУЧЕНИЯ ТЕКУЩЕЙ ЦЕЛИ
    public getCurrentTarget(): Vector3 | null {
        return this.flightController?.getCurrentTarget() || null;
    }

    // ✅ МЕТОД ДЛЯ ПРОВЕРКИ ПОЛЁТА
    public isFlying(): boolean {
        return this.flightController?.isFlying() || false;
    }

    // ✅ МЕТОД ДЛЯ ОТМЕНЫ ПОЛЁТА
    public cancelFlight(): void {
        this.flightController?.cancelFlight();
    }

    private setupKeyboardEvents(): void {
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        const preventDefaultKeys = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'KeyZ', 'KeyC', 'KeyT', 'KeyG', 'KeyF', 'KeyV', 'KeyX', 'KeyR', 'ShiftLeft', 'ShiftRight'];
        window.addEventListener('keydown', (e) => { if (preventDefaultKeys.includes(e.code)) e.preventDefault(); });
    }

    private onKeyDown(event: KeyboardEvent): void {
        if (!this.enabled) return;
        if (event.code === 'KeyQ') { this.input.rollLeft = true; if (this.debugMode) console.log('🔄 Q - крен ВЛЕВО'); }
        if (event.code === 'KeyE') { this.input.rollRight = true; if (this.debugMode) console.log('🔄 E - крен ВПРАВО'); }
        if (event.code === 'KeyZ') { this.input.yawLeft = true; if (this.debugMode) console.log('🔄 Z - рыскание ВЛЕВО'); }
        if (event.code === 'KeyC') { this.input.yawRight = true; if (this.debugMode) console.log('🔄 C - рыскание ВПРАВО'); }
        if (event.code === 'KeyT') { this.input.pitchUp = true; if (this.debugMode) console.log('🔄 T - тангаж ВВЕРХ'); }
        if (event.code === 'KeyG') { this.input.pitchDown = true; if (this.debugMode) console.log('🔄 G - тангаж ВНИЗ'); }
        if (event.code === 'KeyW' || event.code === 'ArrowUp') { this.input.speedCommand = Math.min(1, this.input.speedCommand + 0.05); }
        if (event.code === 'KeyS' || event.code === 'ArrowDown') { this.input.speedCommand = Math.max(0, this.input.speedCommand - 0.05); }
        if (event.code === 'KeyA') { this.input.strafeX = -1; }
        if (event.code === 'KeyD') { this.input.strafeX = 1; }
        if (event.code === 'KeyF') { this.input.strafeY = 1; event.preventDefault(); }
        if (event.code === 'KeyV') { this.input.strafeY = -1; event.preventDefault(); }
        if (event.code === 'KeyR') { this.input.reverseMode = !this.input.reverseMode; }
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') { this.input.boostRequest = true; }
        if (event.code === 'KeyX') { this.input.brakeRequest = true; }
        if (event.code === 'Escape') { this.input.speedCommand = 0; this.velocityForward = 0; this.velocityStrafe = 0; this.velocityVertical = 0; }
        if (event.code === 'KeyB') { this.resetPosition(); }
    }

    private onKeyUp(event: KeyboardEvent): void {
        if (!this.enabled) return;
        if (event.code === 'KeyQ') this.input.rollLeft = false;
        if (event.code === 'KeyE') this.input.rollRight = false;
        if (event.code === 'KeyZ') this.input.yawLeft = false;
        if (event.code === 'KeyC') this.input.yawRight = false;
        if (event.code === 'KeyT') this.input.pitchUp = false;
        if (event.code === 'KeyG') this.input.pitchDown = false;
        if (event.code === 'KeyA' || event.code === 'KeyD') this.input.strafeX = 0;
        if (event.code === 'KeyF') this.input.strafeY = 0;
        if (event.code === 'KeyV') this.input.strafeY = 0;
        if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') this.input.boostRequest = false;
        if (event.code === 'KeyX') this.input.brakeRequest = false;
    }

    private setupCanvasEvents(): void {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        canvas.addEventListener('mouseenter', (e) => { this.mouseInside = true; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; });
        canvas.addEventListener('mouseleave', () => { this.mouseInside = false; canvas.style.cursor = 'grab'; this.targetRotationVelocity.set(0, 0, 0); this.isMouseControlActive = false; this.currentMouseYawVelocity = 0; this.currentMousePitchVelocity = 0; });
        canvas.addEventListener('mousemove', (e) => {
            if (!this.enabled || !this.config.enableMouseLook || !this.mouseInside) return;
            const rect = canvas.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            let deltaX = e.clientX - centerX;
            let deltaY = e.clientY - centerY;
            let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const deadzone = this.config.mouseCenterDeadzone;
            if (distance < deadzone) { this.targetRotationVelocity.set(0, 0, 0); this.isMouseControlActive = false; return; }
            let normalizedDistance = (distance - deadzone) / (this.config.mouseMaxDistance - deadzone);
            normalizedDistance = Math.min(1.0, Math.max(0.0, normalizedDistance));
            let speedFactor = normalizedDistance;
            let targetYaw = (deltaX > 0 ? 1 : -1) * speedFactor;
            let targetPitch = (deltaY > 0 ? 1 : -1) * speedFactor;
            if (this.config.invertX) targetYaw = -targetYaw;
            if (this.config.invertY) targetPitch = -targetPitch;
            const maxSpeed = this.config.maxRotationSpeed;
            targetYaw = Math.max(-maxSpeed, Math.min(maxSpeed, targetYaw));
            targetPitch = Math.max(-maxSpeed, Math.min(maxSpeed, targetPitch));
            const acceleration = this.config.rotationAcceleration * 0.016;
            this.currentMouseYawVelocity = this.moveTowards(this.currentMouseYawVelocity, targetYaw, acceleration);
            this.currentMousePitchVelocity = this.moveTowards(this.currentMousePitchVelocity, targetPitch, acceleration);
            this.targetRotationVelocity.set(this.currentMousePitchVelocity, this.currentMouseYawVelocity, 0);
            this.isMouseControlActive = true;
        });
    }

    public setMouseInput(yawVelocity: number, pitchVelocity: number, isActive: boolean = true): void {
        if (!this.config.enableMouseLook) return;
        this.isMouseInputActive = isActive;
        if (!isActive) {
            const damping = this.config.rotationDamping;
            this.currentMouseYawVelocity *= damping;
            this.currentMousePitchVelocity *= damping;
            if (Math.abs(this.currentMouseYawVelocity) < 0.001) this.currentMouseYawVelocity = 0;
            if (Math.abs(this.currentMousePitchVelocity) < 0.001) this.currentMousePitchVelocity = 0;
            this.targetRotationVelocity.set(this.currentMousePitchVelocity, this.currentMouseYawVelocity, 0);
            return;
        }
        const maxSpeed = this.config.maxRotationSpeed;
        const clampedYaw = Math.max(-maxSpeed, Math.min(maxSpeed, yawVelocity));
        const clampedPitch = Math.max(-maxSpeed, Math.min(maxSpeed, pitchVelocity));
        const acceleration = this.config.rotationAcceleration * 0.016;
        this.currentMouseYawVelocity = this.moveTowards(this.currentMouseYawVelocity, clampedYaw, acceleration);
        this.currentMousePitchVelocity = this.moveTowards(this.currentMousePitchVelocity, clampedPitch, acceleration);
        this.targetRotationVelocity.set(this.currentMousePitchVelocity, this.currentMouseYawVelocity, 0);
    }

    private setupWheelEvents(): void {
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (!canvas) return;
        canvas.addEventListener('wheel', (e) => {
            if (!this.enabled) return;
            const sensitivity = this.config.wheelSensitivity ?? 0.002;
            let delta = e.deltaY;
            if (Math.abs(delta) > 100) delta = delta / 100;
            this.wheelAccumulator += -delta / 4000.0 * sensitivity * 100;
            e.preventDefault();
        }, { passive: false });
    }

    public setRotation(yawDeg: number, pitchDeg: number, rollDeg: number = 0): void {
        const qRoll = new Quaternion(); qRoll.fromAxisAngle(new Vector3(0, 0, 1), rollDeg);
        const qPitch = new Quaternion(); qPitch.fromAxisAngle(new Vector3(1, 0, 0), pitchDeg);
        const qYaw = new Quaternion(); qYaw.fromAxisAngle(new Vector3(0, 1, 0), yawDeg);
        let combined = new Quaternion();
        combined.multiply(qRoll, qPitch);
        combined.multiply(combined, qYaw);
        combined.normalize();
        this.applyRotationFromQuat(combined);
    }

    public testRotate(yawDeg: number, pitchDeg: number): void {
        if (!this.cameraObject) return;
        const currentQuat = this.cameraObject.transform.localRotQuat;
        const newQuat = this.applyAllRotations(currentQuat, 0, pitchDeg, yawDeg);
        this.applyRotationFromQuat(newQuat);
    }

    public setSpeed(speed: number, reverseMode?: boolean): void {
        this.input.speedCommand = Math.max(0, Math.min(1, speed));
        if (reverseMode !== undefined) this.input.reverseMode = reverseMode;
    }

    public getSpeedCommand(): number { return this.input.speedCommand; }
    public getSpeed(): number { return Math.abs(this.state.speed); }

    public setPosition(position: Vector3): void {
        this.state.position.copyFrom(position);
        this.localPosition.copyFrom(position);
        this.globalTransform = floatingOrigin.localToGlobal(position);
        if (this.cameraObject) {
            this.cameraObject.transform.localPosition.copyFrom(position);
            this.cameraObject.transform.updateWorldMatrix(true);
        }
        floatingOrigin.syncShipPosition(this.localPosition);
    }

    public getPosition(): Vector3 { return this.state.position.clone(); }
    public getGlobalPosition(): GlobalTransform { return this.globalTransform.clone(); }

    public getDistanceFromEarthKm(): number {
        return Math.sqrt(this.globalTransform.x * this.globalTransform.x + this.globalTransform.y * this.globalTransform.y + this.globalTransform.z * this.globalTransform.z);
    }

    public getDistanceFromEarthLy(): number { return this.getDistanceFromEarthKm() / 9_461_000_000_000; }
    public getForward(): Vector3 { return this.state.forward.clone(); }
    public getUp(): Vector3 { return this.state.up.clone(); }
    public getRight(): Vector3 { return this.state.right.clone(); }
    public setAutopilot(enabled: boolean): void { this.state.autopilotEnabled = enabled; }
    public isAutopilotEnabled(): boolean { return this.state.autopilotEnabled; }
    public isReverseMode(): boolean { return this.input.reverseMode; }
    public getBoostLevel(): number { return this.state.boost; }
    public getGForce(): number { return this.state.gForce; }

    public getAnglesDeg(): { yaw: number; pitch: number; roll: number } {
        let yawDeg = this.state.yaw * 180 / Math.PI;
        yawDeg = ((yawDeg % 360) + 360) % 360;
        return { yaw: yawDeg, pitch: this.state.pitch * 180 / Math.PI, roll: this.state.roll * 180 / Math.PI };
    }

    public startFlight(startPos: Vector3, targetPos: Vector3, duration: number, onComplete?: () => void): void {
        this.flightController?.startFlight(startPos, targetPos, duration, onComplete);
    }

    public resetPosition(): void {
        this.state.position = new Vector3(0, 0, 0);
        this.localPosition = new Vector3(0, 0, 0);
        this.globalTransform = floatingOrigin.localToGlobal(this.state.position);
        this.state.velocity = new Vector3(0, 0, 0);
        this.state.speed = 0;
        this.velocityForward = 0;
        this.velocityStrafe = 0;
        this.velocityVertical = 0;
        this.currentRollVelocity = 0;
        this.currentPitchVelocity = 0;
        this.currentYawVelocity = 0;
        this.input.speedCommand = 0;
        this.input.reverseMode = false;
        this.input.strafeX = 0;
        this.input.strafeY = 0;
        this.input.rollLeft = false;
        this.input.rollRight = false;
        this.input.pitchUp = false;
        this.input.pitchDown = false;
        this.input.yawLeft = false;
        this.input.yawRight = false;
        const identityQuat = new Quaternion(0, 0, 0, 1);
        this.applyRotationFromQuat(identityQuat);
        if (this.cameraObject) {
            this.cameraObject.transform.localPosition.copyFrom(this.state.position);
            this.cameraObject.transform.updateWorldMatrix(true);
        }
        floatingOrigin.syncShipPosition(this.localPosition);
        if (this.debugMode) console.log('🚀 Корабль сброшен в начальную позицию');
    }

    // ============================================================================
    // ⭐ НОВЫЕ ОПТИМИЗИРОВАННЫЕ МЕТОДЫ ДЛЯ VOXEL MONITOR (v4.2)
    // ============================================================================

    /**
     * Копирует позицию корабля в существующий Vector3 (без создания нового объекта)
     * @param target - целевой Vector3 для записи
     */
    public copyPositionTo(target: Vector3): void {
        if (target && this.state.position) {
            target.x = this.state.position.x;
            target.y = this.state.position.y;
            target.z = this.state.position.z;
        }
    }

    /**
     * Копирует углы в существующий объект
     * @param target - целевой объект для записи
     */
    public copyAnglesTo(target: { yaw: number; pitch: number; roll: number }): void {
        if (target) {
            target.yaw = this.state.yaw * 180 / Math.PI;
            target.pitch = this.state.pitch * 180 / Math.PI;
            target.roll = this.state.roll * 180 / Math.PI;
        }
    }

    /**
     * Возвращает текущую скорость (без создания объекта)
     */
    public getSpeedValue(): number {
        return Math.abs(this.state.speed);
    }

    // ============================================================================
    // ОСТАЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    public onUpdate(): void {
        if (!this.enabled || !this.cameraObject) return;
        const now = performance.now();
        let deltaTime = (now - this.state.lastUpdateTime) / 1000;
        deltaTime = Math.min(deltaTime, 0.033);
        if (deltaTime <= 0) { this.state.lastUpdateTime = now; return; }
        this.state.lastUpdateTime = now;
        this.state.flightTime += deltaTime;
        this.updateRotations(deltaTime);
        this.updateMovement(deltaTime);
        this.updateDebugUI();
    }

    private createDebugUI(): void {
        if (this.debugElement) return;
        this.debugElement = document.createElement('div');
        this.debugElement.style.position = 'absolute';
        this.debugElement.style.bottom = '20px';
        this.debugElement.style.left = '20px';
        this.debugElement.style.backgroundColor = 'rgba(0,0,0,0.85)';
        this.debugElement.style.color = '#0f0';
        this.debugElement.style.fontFamily = 'monospace';
        this.debugElement.style.fontSize = '12px';
        this.debugElement.style.padding = '12px 16px';
        this.debugElement.style.borderRadius = '8px';
        this.debugElement.style.zIndex = '200';
        this.debugElement.style.pointerEvents = 'none';
        this.debugElement.style.backdropFilter = 'blur(4px)';
        this.debugElement.style.borderLeft = '4px solid #00ffff';
        this.debugElement.style.minWidth = '340px';
        document.body.appendChild(this.debugElement);
    }

    private updateDebugUI(): void {
        if (!this.debugElement) return;
        const speedAbs = Math.abs(this.state.speed);
        const speedKmh = speedAbs * 3600;
        const angles = this.getAnglesDeg();
        const SHIFT_THRESHOLD_KM = 10_000_000;
        const shipLocalDist = Math.sqrt(this.localPosition.x * this.localPosition.x + this.localPosition.y * this.localPosition.y + this.localPosition.z * this.localPosition.z);
        let shiftProgress = Math.min(100, Math.max(0, (shipLocalDist / SHIFT_THRESHOLD_KM) * 100));
        let progressColor = shiftProgress > 90 ? '#f44336' : shiftProgress > 70 ? '#ff9800' : '#4caf50';
        const distFromEarthLy = this.getDistanceFromEarthLy();
        this.debugElement.innerHTML = `
            <div style="font-weight:bold; margin-bottom:8px; color:#0ff;">🚀 GAIA STAR MAP</div>
            <div style="border-bottom:1px solid #333; margin-bottom:8px;"></div>
            <div style="font-weight:bold; color:#0fa;">🚀 КОСМИЧЕСКИЙ КОРАБЛЬ</div>
            <div>📍 Позиция: X=${this.localPosition.x.toFixed(0)} Y=${this.localPosition.y.toFixed(0)} Z=${this.localPosition.z.toFixed(0)}</div>
            <div>⚡ Скорость: ${speedAbs.toFixed(1)} у.е./с (${speedKmh.toFixed(0)} км/ч)</div>
            <div>🎯 Углы: рыск=${angles.yaw.toFixed(0)}° тангаж=${angles.pitch.toFixed(0)}° крен=${angles.roll.toFixed(0)}°</div>
            <div>⚡ Буст: ${(this.state.boost / this.config.maxBoost * 100).toFixed(0)}%</div>
            <div>🎮 Команда: ${(this.input.speedCommand * 100).toFixed(0)}% | Реверс: ${this.input.reverseMode ? 'ON' : 'OFF'}</div>
            <div>🌍 Расстояние от Земли: ${distFromEarthLy.toFixed(6)} св. лет</div>
            <div>🔄 Смена вокселя: ${shiftProgress.toFixed(0)}% <div style="background:#222; border-radius:4px; overflow:hidden;"><div style="background:${progressColor}; width:${shiftProgress}%; height:4px;"></div></div></div>
            <div style="font-size:9px; color:#666;">Управление: Q/E крен | T/G тангаж | Z/C рыскание | W/S вперёд/назад | A/D стрейф | F/V вверх/вниз | Shift буст | X тормоз | B сброс</div>
        `;
    }

    private getSpeedIcon(speed: number): string {
        const absSpeed = Math.abs(speed);
        if (absSpeed < 10) return '🐢';
        if (absSpeed < 50) return '🚗';
        if (absSpeed < 200) return '✈️';
        if (absSpeed < 500) return '🚀';
        return '⚡';
    }

    private getSpeedColor(speed: number): string {
        const absSpeed = Math.abs(speed);
        if (absSpeed < 10) return '#4caf50';
        if (absSpeed < 50) return '#ff9800';
        if (absSpeed < 200) return '#ff5722';
        return '#f44336';
    }

    public destroy(force?: boolean): void {
        floatingOrigin.unregisterObject(this.id);
        if (this.debugElement) this.debugElement.remove();
        const canvas = document.getElementById('canvas') as HTMLCanvasElement;
        if (canvas) canvas.style.cursor = 'grab';
        super.destroy(force);
    }
}

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

// Алиас для обратной совместимости
export const ShipController = ShipMovementSystem;

// Экспорт типа для TypeScript
export type ShipController = ShipMovementSystem;

// Экспорт по умолчанию
export default ShipMovementSystem;

// ============================================================================
// ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ ТЕСТИРОВАНИЯ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).testRotateCamera = (yaw: number, pitch: number) => {
        const system = (window as any).__universalSystem;
        const ship = system?.getShipMovementSystem?.();
        if (ship) ship.testRotate(yaw, pitch);
        else console.log('❌ ShipMovementSystem not found');
    };
    console.log('✅ ShipController v4.2 загружен (с оптимизированными методами)');
    console.log('🎮 Управление: Q/E - крен | T/G - тангаж | Z/C - рыскание | W/S - вперёд/назад');
    console.log('⚡ Новые методы: copyPositionTo(), copyAnglesTo(), getSpeedValue()');
}

console.log('═'.repeat(70));
console.log('🚀 [ShipController] МОДУЛЬ ЗАГРУЖЕН v4.2');
console.log('   • copyPositionTo() - копирование позиции без создания объекта');
console.log('   • copyAnglesTo() - копирование углов без создания объекта');
console.log('   • getSpeedValue() - получение скорости без создания объекта');
console.log('   • Полная обратная совместимость с существующим кодом');
console.log('═'.repeat(70));