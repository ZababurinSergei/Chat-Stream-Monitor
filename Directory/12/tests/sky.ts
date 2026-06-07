// /10/tests/sky.ts
// ВЕРСИЯ 11.3 - ИСПРАВЛЕНА ОШИБКА starBuffer НЕ СОЗДАН
// - Добавлена проверка shaderStars.length перед вызовом loadStars()
// - Добавлены повторные попытки загрузки при пустых данных
// - 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import {
    Engine3D,
    Scene3D,
    Camera3D,
    Object3D,
    Vector3,
    View3D,
    DirectLight,
    SkyRenderer,
    ShaderLib
} from '@orillusion/core';

import { ScientificStarfieldComponent, createScientificStarfield } from './modules/StarfieldModule.js';
import { starDataStore } from './core/StarDataStore.js';
import { ScientificStarCalculator } from './astronomy/ScientificStarCalculator.js';
import { SCIENTIFIC_CONFIG } from './config/scientificConfig.js';
import { convertAllStarsScientific } from './utils/starConverter.js';
import { ScientificStarExtended } from './types/StarTypes.js';
import { ShaderDataConverter } from './utils/shaderDataConverter.js';
import { getBestStars, Star } from './star-api.js';
import { StarFlightUI as StarFlightUIClass } from './ui/StarFlightUI.js';
import { UniversalSystem } from './core/UniversalSystem.js';
import { VoxelMonitorComponent } from './components/VoxelMonitorComponent.js';
import { registerAllShaders, verifyShaderRegistration, emergencyRegisterShaders } from './shaders/register-shaders.js';
import { UniverseConfig } from './config/UniverseConfig.js';
import {
    debugStarsFullVisibility,
    quickStarVisibilityCheck,
    forceShaderIntensity,
    applyEmergencyLODConfig
} from './config/debugConfig.js';

// ============================================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================================

let globalShipController: any = null;
let globalStarfieldComponent: ScientificStarfieldComponent | null = null;
let globalScene: Scene3D | null = null;
let globalView: View3D | null = null;
let rawStarsData: Star[] = [];
let isInitialized: boolean = false;
let starFlightUI: any = null;
let universalSystemInstance: UniversalSystem | null = null;

// ============================================================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ LOD MANAGER
// ============================================================================

/**
 * Получение LOD Manager из компонента звезд
 */
function getLODManagerFromComponent(component: ScientificStarfieldComponent | null): any {
    if (!component) return null;
    if (typeof (component as any).getLODManager === 'function') {
        return (component as any).getLODManager();
    }
    return null;
}

// ============================================================================
// ФУНКЦИЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ КАМЕРЫ
// ============================================================================

/**
 * Принудительное обновление камеры и ее матриц
 */
function forceCameraUpdate(): void {
    if (!universalSystemInstance) return;

    const camera = universalSystemInstance.getCamera();
    if (!camera) return;

    camera.object3D.transform.updateWorldMatrix(true);
    camera.updateProjection();

    camera.far = 2000000;
    camera.near = 0.1;

    if (camera.frustum) {
        camera.frustum.update(camera.pvMatrix);
    }

    console.log('📷 [forceCameraUpdate] Камера обновлена, far=', camera.far);
}

// ============================================================================
// ФУНКЦИЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ ЗВЕЗД
// ============================================================================

/**
 * Принудительное обновление звезд с максимальной яркостью
 */
function forceStarsUpdate(): void {
    if (!globalStarfieldComponent) return;

    console.log('⭐ [forceStarsUpdate] Принудительное обновление звезд...');

    try {
        if (typeof globalStarfieldComponent.forceUpdateAll === 'function') {
            globalStarfieldComponent.forceUpdateAll();
        }

        forceShaderIntensity(globalStarfieldComponent, 50);

        console.log('✅ [forceStarsUpdate] Звезды обновлены');
    } catch (error) {
        console.error('❌ [forceStarsUpdate] Ошибка:', error);
    }
}

// ============================================================================
// ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ ВИДИМОСТИ ЗВЕЗД
// ============================================================================

/**
 * Экстренное восстановление видимости звезд - отключает все ограничения
 */
function emergencyStarVisibility(): void {
    console.log('\n🚨 ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ ВИДИМОСТИ ЗВЕЗД');
    console.log('═'.repeat(60));

    const lodManager = getLODManagerFromComponent(globalStarfieldComponent);
    if (lodManager) {
        applyEmergencyLODConfig(lodManager);
        console.log('   ✅ Экстренная LOD конфигурация применена');
    } else {
        console.warn('   ⚠️ LOD Manager не доступен');
    }

    forceCameraUpdate();
    console.log('   ✅ Камера обновлена');

    if (globalStarfieldComponent) {
        forceShaderIntensity(globalStarfieldComponent, 100);
        if (typeof globalStarfieldComponent.forceUpdateAll === 'function') {
            globalStarfieldComponent.forceUpdateAll();
        }
        console.log('   ✅ Звезды обновлены с интенсивностью 100');
    }

    const camera = universalSystemInstance?.getCamera();
    if (camera) {
        camera.object3D.transform.localPosition = new Vector3(0, 200, 800);
        camera.object3D.transform.updateWorldMatrix(true);
        camera.lookAt(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
        camera.updateProjection();
        console.log('   ✅ Камера перемещена в (0, 200, 800)');
    }

    console.log('═'.repeat(60));
    console.log('✅ ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО');
    console.log('═'.repeat(60) + '\n');
}

// ============================================================================
// ТЕСТОВЫЕ ЗВЕЗДЫ
// ============================================================================

function createTestStars(count: number): ScientificStarExtended[] {
    const stars: ScientificStarExtended[] = [];
    const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const tempMap: Record<string, number> = {
        'O': 35000, 'B': 15000, 'A': 8000, 'F': 6500,
        'G': 5500, 'K': 4500, 'M': 3500
    };
    const colorMap: Record<string, [number, number, number]> = {
        'O': [0.6, 0.7, 1.0], 'B': [0.7, 0.8, 1.0], 'A': [0.9, 0.9, 1.0],
        'F': [1.0, 0.95, 0.8], 'G': [1.0, 0.9, 0.7], 'K': [1.0, 0.8, 0.5],
        'M': [1.0, 0.7, 0.4]
    };

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const radius = 150 + (i % 20) * 50;
        const spectralType = spectralTypes[i % spectralTypes.length];

        stars.push({
            sourceId: `test_star_${i}`,
            position: new Vector3(
                Math.cos(angle) * radius,
                Math.sin(angle * 2) * 80,
                Math.sin(angle) * radius
            ),
            distancePc: radius,
            magnitude: 2 + (i % 15) / 3,
            absoluteMagnitude: 0.5 + (i % 10) / 2,
            spectralType: spectralType,
            temperature: tempMap[spectralType],
            color: colorMap[spectralType],
            radius: 1,
            luminosity: 1,
            mass: 1,
            properMotionRa: 0,
            properMotionDec: 0,
            radialVelocity: 0,
            apparentMagnitude: 2 + (i % 15) / 3,
            metallicity: 0,
            logg: 4.5,
            radiusRsun: 1,
            massMsun: 1,
            luminosityLsun: 1,
            barycentricPosition: new Vector3(0, 0, 0),
            heliocentricPosition: new Vector3(0, 0, 0),
            colorRGB: colorMap[spectralType],
            renderPriority: 100 - i,
            currentBrightness: 1.5
        });
    }
    return stars;
}

// ============================================================================
// ФУНКЦИЯ ДЛЯ ПОВТОРНОЙ ПОПЫТКИ ЗАГРУЗКИ ЗВЕЗД
// ============================================================================

/**
 * Повторная попытка загрузки звезд с задержкой
 * @param shaderStars - данные звезд для шейдера
 * @param retryCount - номер попытки
 * @param maxRetries - максимальное количество попыток
 */
async function retryLoadStars(
    starfieldComponent: ScientificStarfieldComponent | null,
    shaderStars: any[],
    retryCount: number = 0,
    maxRetries: number = 5
): Promise<boolean> {
    if (!starfieldComponent) return false;
    if (retryCount >= maxRetries) {
        console.error(`❌ Не удалось загрузить звезды после ${maxRetries} попыток`);
        return false;
    }

    if (retryCount > 0) {
        console.log(`   🔄 Повторная попытка загрузки звезд (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        await starfieldComponent.loadStars(shaderStars);

        // Проверяем, что звезды загрузились
        const starCount = starfieldComponent.getStarCount();
        if (starCount > 0) {
            console.log(`   ✅ Звезды успешно загружены: ${starCount} звезд`);
            return true;
        } else {
            console.warn(`   ⚠️ Звезды не загрузились (0 звезд), повторяем...`);
            return retryLoadStars(starfieldComponent, shaderStars, retryCount + 1, maxRetries);
        }
    } catch (error) {
        console.error(`   ❌ Ошибка загрузки звезд:`, error);
        return retryLoadStars(starfieldComponent, shaderStars, retryCount + 1, maxRetries);
    }
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ ИНИЦИАЛИЗАЦИИ
// ============================================================================

async function initScientificAtlas(): Promise<void> {
    performance.mark('atlas-start');

    if (!navigator.gpu) {
        console.error('❌ WebGPU не поддерживается');
        return;
    }

    console.log('\n' + '═'.repeat(80));
    console.log('🔬 НАУЧНЫЙ АТЛАС ВЕРСИЯ 11.3 (ИСПРАВЛЕНА ЗАГРУЗКА ЗВЕЗД)');
    console.log('═'.repeat(80));

    // ========================================================================
    // ШАГ 1: ЗАГРУЗКА ДАННЫХ ЗВЕЗД
    // ========================================================================
    console.log('\n📡 [1/6] Загрузка звезд из Gaia DR3 API...');

    let validStars: ScientificStarExtended[] = [];

    try {
        const limit = Math.min(SCIENTIFIC_CONFIG.performance.maxStars, 500);
        console.log(`   Запрос ${limit} лучших звезд...`);

        const response = await getBestStars({
            limit: limit,
            withPhysics: true
        });

        if (response.success && response.data.length > 0) {
            rawStarsData = response.data;
            starDataStore.setRawStars(rawStarsData);
            console.log(`   ✅ Загружено ${rawStarsData.length} звезд из Gaia DR3`);

            const currentDate = new Date();
            const scientificStars = await convertAllStarsScientific(rawStarsData, currentDate);

            validStars = scientificStars.filter(star =>
                star.absoluteMagnitude !== undefined &&
                star.absoluteMagnitude !== null &&
                !isNaN(star.absoluteMagnitude)
            );

            starDataStore.setScientificStars(validStars);
            console.log(`   ✅ Отфильтровано ${validStars.length} звезд с absoluteMagnitude`);
        }
    } catch (error) {
        console.error('   ❌ Ошибка загрузки из API:', error);
    }

    if (validStars.length === 0) {
        console.warn('   ⚠️ Нет звезд, создаем тестовые данные');
        validStars = createTestStars(300);
        starDataStore.setScientificStars(validStars);
        console.log(`   ✅ Создано ${validStars.length} тестовых звезд`);
    }

    // ========================================================================
    // ШАГ 2: СОЗДАНИЕ UNIVERSAL SYSTEM
    // ========================================================================
    console.log('\n🚀 [2/6] Создание UniversalSystem...');
    universalSystemInstance = new UniversalSystem();
    if (typeof window !== 'undefined') {
        (window as any).__universalSystem = universalSystemInstance;
    }

    // ========================================================================
    // ШАГ 3: ИНИЦИАЛИЗАЦИЯ WEBSGPU
    // ========================================================================
    console.log('\n🎬 [3/6] Инициализация WebGPU...');
    await universalSystemInstance.initWebGPU('canvas');
    console.log('   ✅ WebGPU инициализирован, View создан');

    // ========================================================================
    // ШАГ 4: РЕГИСТРАЦИЯ ШЕЙДЕРОВ В SHADERLIB
    // ========================================================================
    console.log('\n🎨 [4/6] Регистрация шейдеров в ShaderLib...');

    try {
        await registerAllShaders();

        const { registered, missing } = verifyShaderRegistration();

        if (missing.length === 0) {
            console.log('   ✅ Все шейдеры успешно зарегистрированы в ShaderLib');
            console.log(`      Зарегистрировано: ${registered.join(', ')}`);
        } else {
            console.warn(`   ⚠️ Отсутствуют шейдеры: ${missing.join(', ')}`);
            console.log('   🔄 Выполняем экстренную регистрацию...');
            emergencyRegisterShaders();

            const { missing: stillMissing } = verifyShaderRegistration();
            if (stillMissing.length === 0) {
                console.log('   ✅ Экстренная регистрация успешна');
            } else {
                console.error(`   ❌ Критическая ошибка: шейдеры не зарегистрированы: ${stillMissing.join(', ')}`);
            }
        }

        const testVert = (ShaderLib as any).getShader?.('starfield_main_vert');
        const testFrag = (ShaderLib as any).getShader?.('starfield_main_frag');

        if (testVert && testFrag) {
            console.log('   ✅ starfield_main_vert/frag найдены в ShaderLib');
            console.log(`      vertex shader length: ${testVert.length} символов`);
            console.log(`      fragment shader length: ${testFrag.length} символов`);
        } else {
            console.error('   ❌ КРИТИЧЕСКАЯ ОШИБКА: шейдеры не найдены в ShaderLib!');
            console.log('   🔄 Последняя попытка прямой регистрации...');

            const { StarfieldShader_vert, StarfieldShader_frag } = await import('./shaders/StarfieldShader.wgsl.js');
            (ShaderLib as any).register?.('starfield_main_vert', StarfieldShader_vert);
            (ShaderLib as any).register?.('starfield_main_frag', StarfieldShader_frag);

            console.log('   ✅ Прямая регистрация выполнена');
        }

    } catch (error) {
        console.error('   ❌ Ошибка регистрации шейдеров:', error);
        console.log('   🔄 Попытка экстренного восстановления...');
        emergencyRegisterShaders();
    }

    // Дополнительная диагностика ShaderLib
    console.log('\n🔍 ДИАГНОСТИКА SHADERLIB:');
    const shaderLibAny = ShaderLib as any;
    if (shaderLibAny.shaders) {
        const allShaders: string[] = Array.from(shaderLibAny.shaders.keys());
        const starShaders: string[] = allShaders.filter((s: string) => s.includes('starfield'));
        console.log(`   Всего шейдеров в реестре: ${allShaders.length}`);
        console.log(`   Starfield шейдеров: ${starShaders.join(', ')}`);
    }

    // ========================================================================
    // ШАГ 5: СОЗДАНИЕ UI И КОМПОНЕНТОВ
    // ========================================================================
    console.log('\n⭐ [5/6] Создание UI и компонентов...');

    starFlightUI = await StarFlightUIClass.main(universalSystemInstance);

    const cameraObj = universalSystemInstance.getCamera()?.object3D;
    if (starFlightUI && cameraObj) {
        starFlightUI.setCamera(cameraObj);
        globalShipController = starFlightUI.getShipController();
        console.log('   ✅ Камера и ShipController настроены');
    } else {
        console.warn('   ⚠️ Камера не найдена, ShipController не создан');
    }

    const starfieldObj = createScientificStarfield(undefined, true);
    starfieldObj.name = 'ScientificStarfield_Kosmos';
    universalSystemInstance.getScene()?.addChild(starfieldObj);

    globalStarfieldComponent = starfieldObj.getComponent(ScientificStarfieldComponent);
    if (typeof window !== 'undefined') {
        (window as any).__starfieldComponent = globalStarfieldComponent;
    }

    if (globalStarfieldComponent && universalSystemInstance) {
        (globalStarfieldComponent as any).setUniversalSystem(universalSystemInstance);
    }

    if (starFlightUI && globalStarfieldComponent) {
        starFlightUI.setStarfieldComponentRef(globalStarfieldComponent);
        console.log('   ✅ StarfieldComponent передан в UI');
    }

    // ========================================================================
    // ШАГ 6: НАСТРОЙКА МАСШТАБА И ЗАГРУЗКА ЗВЕЗД
    // ========================================================================
    console.log('\n📏 [6/6] Настройка масштаба и загрузка звезд...');

    if (globalStarfieldComponent && validStars.length > 0) {
        const realScale = UniverseConfig.realScale;

        universalSystemInstance.onRenderStarted(async () => {
            console.log(`   🚀 Рендеринг запущен, загружаем звезды...`);

            if (globalStarfieldComponent) {
                await globalStarfieldComponent.setRealScaleAsync(realScale);
                console.log(`   📏 Масштаб установлен: ${realScale} пк/ед.`);

                const shaderStars = ShaderDataConverter.batchStarsToShaderData(validStars);

                // ⭐ ПРОВЕРКА: убедимся, что есть данные для загрузки
                if (shaderStars.length === 0) {
                    console.error('   ❌ Нет данных для загрузки в шейдер!');
                    return;
                }

                console.log(`   ⭐ Загрузка ${shaderStars.length} звезд в компонент...`);

                // ⭐ ИСПРАВЛЕНИЕ: используем retryLoadStars для надежной загрузки
                const loadSuccess = await retryLoadStars(globalStarfieldComponent, shaderStars, 0, 5);

                if (loadSuccess) {
                    console.log(`   ✅ Загружено ${globalStarfieldComponent.getStarCount()} звезд`);
                } else {
                    console.error(`   ❌ Не удалось загрузить звезды!`);
                }

                if (starFlightUI) {
                    starFlightUI.loadStarsDirectly();
                }

                setTimeout(() => {
                    console.log('\n🔧 Применение отладочной конфигурации...');
                    const lodManager = getLODManagerFromComponent(globalStarfieldComponent);
                    if (lodManager) {
                        applyEmergencyLODConfig(lodManager);
                    }
                    forceCameraUpdate();
                    forceStarsUpdate();
                }, 100);

                setTimeout(() => {
                    forceStarsUpdate();
                    if (globalStarfieldComponent) {
                        quickStarVisibilityCheck(globalStarfieldComponent);
                    }
                }, 500);

                setTimeout(() => {
                    forceStarsUpdate();
                    if (globalStarfieldComponent) {
                        globalStarfieldComponent.forceUpdateAll();
                    }
                }, 1000);
            }
        });

        const unsubscribeScale = UniverseConfig.onChange(async (newScale) => {
            if (globalStarfieldComponent) {
                await globalStarfieldComponent.setRealScaleAsync(newScale);
                console.log(`   📏 Масштаб обновлён: ${newScale} пк/ед.`);
                setTimeout(() => forceStarsUpdate(), 100);
            }
        });
        (window as any).__unsubscribeScale = unsubscribeScale;
    } else {
        console.warn('   ⚠️ Нет валидных звезд для загрузки!');
    }

    // ========================================================================
    // ЗАПУСК РЕНДЕРИНГА
    // ========================================================================
    console.log('\n▶️ Запуск рендеринга...');
    universalSystemInstance.startRender();
    isInitialized = true;
    console.log('   ✅ Рендеринг запущен');

    // ========================================================================
    // СОЗДАНИЕ И СИНХРОНИЗАЦИЯ VOXEL MONITOR
    // ========================================================================
    console.log('\n📡 Создание и синхронизация VoxelMonitor...');

    const voxelContainer = new Object3D();
    voxelContainer.name = 'VoxelMonitorContainer';
    universalSystemInstance.getScene()?.addChild(voxelContainer);
    const voxelMonitor = voxelContainer.addComponent(VoxelMonitorComponent);
    if (typeof window !== 'undefined') {
        (window as any).__voxelMonitor = voxelMonitor;
    }

    universalSystemInstance.onRenderStarted(() => {
        setTimeout(() => {
            if (universalSystemInstance) {
                const shipController = universalSystemInstance.getShipController();
                if (shipController && voxelMonitor && typeof voxelMonitor.setShipController === 'function') {
                    voxelMonitor.setShipController(shipController);
                    console.log('🔄 VoxelMonitor синхронизирован');
                }
            }
        }, 100);
    });

    performance.mark('atlas-end');
    performance.measure('initScientificAtlas', 'atlas-start', 'atlas-end');
    const measure = performance.getEntriesByType('measure')[0];
    console.log(`⏱️ Инициализация завершена за ${measure?.duration.toFixed(2) || '?'}ms`);

    // ========================================================================
    // ОТЛАДОЧНЫЕ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
    // ========================================================================
    (window as any).__scientificAtlas = {
        version: '11.3',
        status: {
            initialized: isInitialized,
            starsLoaded: validStars.length,
            shipControllerReady: !!globalShipController,
            uiReady: !!starFlightUI,
            componentReady: !!globalStarfieldComponent
        },
        ship: {
            getPosition: () => globalShipController?.getPosition(),
            getSpeed: () => globalShipController?.getSpeed(),
            reset: () => globalShipController?.resetPosition(),
            flyTo: (x: number, y: number, z: number) => {
                if (globalShipController) {
                    globalShipController.flyTo(new Vector3(x, y, z), 3);
                }
            }
        },
        stars: {
            getCount: () => globalStarfieldComponent?.getStarCount() || 0,
            forceUpdate: () => forceStarsUpdate(),
            forceCameraUpdate: () => forceCameraUpdate(),
            getRenderStats: () => globalStarfieldComponent?.getRenderStats(),
            setIntensity: (intensity: number) => {
                if (globalStarfieldComponent) {
                    forceShaderIntensity(globalStarfieldComponent, intensity);
                }
            },
            ensureVisible: () => {
                forceCameraUpdate();
                forceStarsUpdate();
            },
            emergencyFix: () => emergencyStarVisibility(),
            quickCheck: () => {
                if (globalStarfieldComponent) {
                    quickStarVisibilityCheck(globalStarfieldComponent);
                }
            },
            retryLoad: async () => {
                if (globalStarfieldComponent && validStars.length > 0) {
                    const shaderStars = ShaderDataConverter.batchStarsToShaderData(validStars);
                    return retryLoadStars(globalStarfieldComponent, shaderStars, 0, 5);
                }
                return false;
            }
        },
        camera: {
            getPosition: () => universalSystemInstance?.getCamera()?.object3D.transform.localPosition,
            setPosition: (x: number, y: number, z: number) => {
                const camera = universalSystemInstance?.getCamera();
                if (camera) {
                    camera.object3D.transform.localPosition = new Vector3(x, y, z);
                    camera.object3D.transform.updateWorldMatrix(true);
                    camera.updateProjection();
                    console.log(`📷 Камера перемещена: (${x}, ${y}, ${z})`);
                    forceStarsUpdate();
                }
            },
            lookAtCenter: () => {
                const camera = universalSystemInstance?.getCamera();
                if (camera) {
                    camera.lookAt(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
                    console.log(`📷 Камера смотрит в центр`);
                }
            },
            forceUpdate: () => forceCameraUpdate()
        },
        shaders: {
            verify: () => verifyShaderRegistration(),
            emergencyFix: () => emergencyRegisterShaders(),
            getRegisteredList: (): string[] => {
                const shaderLibAny = ShaderLib as any;
                if (shaderLibAny.shaders) {
                    return Array.from(shaderLibAny.shaders.keys()) as string[];
                }
                return [];
            }
        },
        debug: {
            logShipState: () => {
                const pos = globalShipController?.getPosition();
                console.log(`🚀 Корабль: (${pos?.x.toFixed(1)}, ${pos?.y.toFixed(1)}, ${pos?.z.toFixed(1)})`);
                const speed = globalShipController?.getSpeed();
                console.log(`⚡ Скорость: ${speed?.toFixed(1)} у.е./с`);
            },
            logStarfield: () => {
                if (globalStarfieldComponent) {
                    quickStarVisibilityCheck(globalStarfieldComponent);
                }
            },
            emergencyFix: () => emergencyStarVisibility()
        }
    };

    (window as any).__emergencyStarFix = emergencyStarVisibility;

    console.log('\n' + '═'.repeat(80));
    console.log('✅ НАУЧНЫЙ АТЛАС УСПЕШНО ЗАПУЩЕН (v11.3)');
    console.log('═'.repeat(80));
    console.log(`📊 Загружено звезд: ${validStars.length}`);
    console.log('🎮 Управление: W/S | A/D | Q/E | T/G | Z/C | F/V | Shift | X | B');
    console.log('');
    console.log('⭐ КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ ЗВЕЗДАМИ:');
    console.log('   __scientificAtlas.stars.setIntensity(100)  - установка яркости');
    console.log('   __scientificAtlas.stars.ensureVisible()   - проверка видимости');
    console.log('   __scientificAtlas.stars.forceUpdate()     - принудительное обновление');
    console.log('   __scientificAtlas.stars.emergencyFix()    - экстренное исправление');
    console.log('   __scientificAtlas.stars.quickCheck()      - быстрая диагностика');
    console.log('   __scientificAtlas.stars.retryLoad()       - повторная загрузка звезд');
    console.log('   __scientificAtlas.camera.forceUpdate()    - обновление камеры');
    console.log('');
    console.log('🎨 КОМАНДЫ ДЛЯ РАБОТЫ С ШЕЙДЕРАМИ:');
    console.log('   __scientificAtlas.shaders.verify()        - проверка регистрации');
    console.log('   __scientificAtlas.shaders.emergencyFix()  - экстренная регистрация');
    console.log('   __scientificAtlas.shaders.getRegisteredList() - список шейдеров');
    console.log('');
    console.log('📷 КОМАНДЫ ДЛЯ УПРАВЛЕНИЯ КАМЕРОЙ:');
    console.log('   __scientificAtlas.camera.setPosition(0, 200, 800)');
    console.log('   __scientificAtlas.camera.lookAtCenter()');
    console.log('');
    console.log('🚨 ЭКСТРЕННОЕ ВОССТАНОВЛЕНИЕ:');
    console.log('   __emergencyStarFix() - отключает все ограничения');
    console.log('   __debugStars.quickCheck() - детальная диагностика');
    console.log('═'.repeat(80) + '\n');

    setTimeout(() => {
        emergencyStarVisibility();
    }, 500);
}

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

export {
    initScientificAtlas,
    ScientificStarCalculator,
    SCIENTIFIC_CONFIG,
    forceStarsUpdate,
    forceCameraUpdate,
    emergencyStarVisibility,
    retryLoadStars
};

export default initScientificAtlas;

// ============================================================================
// ЗАПУСК
// ============================================================================

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initScientificAtlas().catch((error) => {
                console.error('\n' + '═'.repeat(80));
                console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ');
                console.error('═'.repeat(80));
                console.error(error);
                if (error?.stack) console.error(error.stack);
                console.error('═'.repeat(80));
            });
        });
    } else {
        initScientificAtlas().catch((error) => {
            console.error('\n' + '═'.repeat(80));
            console.error('❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ');
            console.error('═'.repeat(80));
            console.error(error);
            if (error?.stack) console.error(error.stack);
            console.error('═'.repeat(80));
        });
    }
}

console.log('═'.repeat(70));
console.log('📁 [sky.ts] МОДУЛЬ ЗАГРУЖЕН v11.3');
console.log('   • Регистрация шейдеров в ShaderLib');
console.log('   • Проверка успешности регистрации');
console.log('   • Экстренное восстановление');
console.log('   • ИСПРАВЛЕНА ОШИБКА starBuffer НЕ СОЗДАН');
console.log('   • Добавлена функция retryLoadStars()');
console.log('   • Команды: __scientificAtlas.stars.retryLoad()');
console.log('═'.repeat(70));