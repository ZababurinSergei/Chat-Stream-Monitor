// /10/tests/shaders/register-shaders.ts
// ВЕРСИЯ 4.1 - ПОЛНАЯ РЕГИСТРАЦИЯ В SHADERLIB
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

import { ShaderLib } from '@orillusion/core';
import {
    StarfieldShader_vert,
    StarfieldShader_frag,
    StarfieldShaderLQ_vert,
    StarfieldShaderLQ_frag
} from './StarfieldShader.wgsl.js';
import {
    PlanetfieldShader_vert,
    PlanetfieldShader_frag
} from './PlanetfieldShader.wgsl.js';
import {
    PlanetNearMeshShader_vert,
    PlanetNearMeshShader_frag
} from './PlanetNearMeshShader.wgsl.js';
import {
    PlanetFarMeshShader_vert,
    PlanetFarMeshShader_frag,
    PlanetFarMeshShaderLQ_vert,
    PlanetFarMeshShaderLQ_frag
} from './PlanetFarMeshShader.wgsl.js';
import {
    NormalMapGeneratorShader_cs,
    FarMapGeneratorShader_cs,
    NearMapGeneratorShader_cs
} from './index.js';

// ============================================================================
// КОНФИГУРАЦИЯ ШЕЙДЕРОВ
// ============================================================================

export const SHADER_CONFIG = {
    starfield: {
        main: { vert: 'starfield_main_vert', frag: 'starfield_main_frag' },
        lq: { vert: 'starfield_lq_vert', frag: 'starfield_lq_frag' }
    },
    planet: {
        field: { vert: 'planetfield_vert', frag: 'planetfield_frag' },
        near: { vert: 'planet_near_vert', frag: 'planet_near_frag' },
        far: { vert: 'planet_far_vert', frag: 'planet_far_frag' },
        farLq: { vert: 'planet_far_lq_vert', frag: 'planet_far_lq_frag' }
    },
    compute: {
        normalMap: 'normal_map_generator_cs',
        farMap: 'far_map_generator_cs',
        nearMap: 'near_map_generator_cs'
    }
};

// ============================================================================
// РЕГИСТРАЦИЯ ВСЕХ ШЕЙДЕРОВ
// ============================================================================

let isRegistered = false;

export function registerAllShadersToLib(): void {
    if (isRegistered) {
        console.log('⚠️ Шейдеры уже зарегистрированы');
        return;
    }

    console.log('\n' + '═'.repeat(70));
    console.log('📝 РЕГИСТРАЦИЯ ШЕЙДЕРОВ В ShaderLib');
    console.log('═'.repeat(70));

    const shaderMap: Map<string, string> = new Map();

    // Звездные шейдеры
    shaderMap.set('starfield_main_vert', StarfieldShader_vert);
    shaderMap.set('starfield_main_frag', StarfieldShader_frag);
    shaderMap.set('starfield_lq_vert', StarfieldShaderLQ_vert);
    shaderMap.set('starfield_lq_frag', StarfieldShaderLQ_frag);

    // Планетарные шейдеры
    shaderMap.set('planetfield_vert', PlanetfieldShader_vert);
    shaderMap.set('planetfield_frag', PlanetfieldShader_frag);
    shaderMap.set('planet_near_vert', PlanetNearMeshShader_vert);
    shaderMap.set('planet_near_frag', PlanetNearMeshShader_frag);
    shaderMap.set('planet_far_vert', PlanetFarMeshShader_vert);
    shaderMap.set('planet_far_frag', PlanetFarMeshShader_frag);
    shaderMap.set('planet_far_lq_vert', PlanetFarMeshShaderLQ_vert);
    shaderMap.set('planet_far_lq_frag', PlanetFarMeshShaderLQ_frag);

    // Compute шейдеры
    shaderMap.set('normal_map_generator_cs', NormalMapGeneratorShader_cs);
    shaderMap.set('far_map_generator_cs', FarMapGeneratorShader_cs);
    shaderMap.set('near_map_generator_cs', NearMapGeneratorShader_cs);

    let successCount = 0;
    let failCount = 0;

    for (const [name, code] of shaderMap) {
        try {
            // Проверяем, не зарегистрирован ли уже
            const existing = (ShaderLib as any).getShader?.(name);
            if (!existing) {
                ShaderLib.register(name, code);
                console.log(`   ✅ ${name}`);
                successCount++;
            } else {
                console.log(`   ⏭️ ${name} (уже есть)`);
                successCount++;
            }
        } catch (error) {
            console.error(`   ❌ ${name}:`, error);
            failCount++;
        }
    }

    // Сохраняем в window для прямого доступа
    const windowShaders: Record<string, string> = {};
    for (const [name, code] of shaderMap) {
        windowShaders[name] = code;
    }
    (window as any).__shaderLibShaders = windowShaders;

    console.log('═'.repeat(70));
    console.log(`📊 РЕЗУЛЬТАТ: ${successCount} успешно, ${failCount} ошибок`);
    console.log('═'.repeat(70) + '\n');

    isRegistered = true;
}

// ============================================================================
// ПРОВЕРКА РЕГИСТРАЦИИ
// ============================================================================

export function verifyShaderRegistration(): { registered: string[]; missing: string[] } {
    const requiredShaders = [
        'starfield_main_vert',
        'starfield_main_frag',
        'starfield_lq_vert',
        'starfield_lq_frag'
    ];

    const registered: string[] = [];
    const missing: string[] = [];

    for (const name of requiredShaders) {
        const exists = !!(ShaderLib as any).getShader?.(name);
        if (exists) {
            registered.push(name);
        } else {
            missing.push(name);
        }
    }

    console.log('\n🔍 ПРОВЕРКА РЕГИСТРАЦИИ ШЕЙДЕРОВ:');
    console.log('═'.repeat(50));
    for (const name of requiredShaders) {
        const exists = registered.includes(name);
        console.log(`   ${exists ? '✅' : '❌'} ${name}`);
    }
    console.log('═'.repeat(50) + '\n');

    return { registered, missing };
}

// ============================================================================
// ЭКСТРЕННАЯ РЕГИСТРАЦИЯ (ЕСЛИ ОБЫЧНАЯ НЕ СРАБОТАЛА)
// ============================================================================

export function emergencyRegisterShaders(): void {
    console.log('\n🚨 ЭКСТРЕННАЯ РЕГИСТРАЦИЯ ШЕЙДЕРОВ');
    console.log('═'.repeat(50));

    const emergencyShaders: Record<string, string> = {
        'starfield_main_vert': StarfieldShader_vert,
        'starfield_main_frag': StarfieldShader_frag,
        'starfield_lq_vert': StarfieldShaderLQ_vert,
        'starfield_lq_frag': StarfieldShaderLQ_frag,
    };

    for (const [name, code] of Object.entries(emergencyShaders)) {
        try {
            // Прямая запись во внутренний реестр
            if ((ShaderLib as any).shaders) {
                (ShaderLib as any).shaders.set(name, code);
                console.log(`   ✅ ${name} (прямая запись)`);
            } else if ((ShaderLib as any).shaderMap) {
                (ShaderLib as any).shaderMap.set(name, code);
                console.log(`   ✅ ${name} (shaderMap)`);
            } else {
                // Последняя попытка
                ShaderLib.register(name, code);
                console.log(`   ✅ ${name} (register)`);
            }
        } catch (error) {
            console.error(`   ❌ ${name}:`, error);
        }
    }

    console.log('═'.repeat(50) + '\n');
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ
// ============================================================================

export async function registerAllShaders(): Promise<void> {
    console.log('\n' + '═'.repeat(70));
    console.log('📝 [registerAllShaders] НАЧАЛО РЕГИСТРАЦИИ v4.1');
    console.log('═'.repeat(70));

    // 1. Нормальная регистрация
    registerAllShadersToLib();

    // 2. Проверка
    const { missing } = verifyShaderRegistration();

    // 3. Если что-то пропущено - экстренная регистрация
    if (missing.length > 0) {
        console.warn(`⚠️ Отсутствуют шейдеры: ${missing.join(', ')}`);
        emergencyRegisterShaders();
        verifyShaderRegistration();
    }

    // 4. Сохраняем в window
    (window as any).__shaderRegistry = {
        version: '4.1',
        isRegistered,
        verify: verifyShaderRegistration,
        emergency: emergencyRegisterShaders,
        config: SHADER_CONFIG
    };

    console.log('✅ Регистрация завершена');
    console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// ПОЛУЧЕНИЕ КОДА ШЕЙДЕРА ПО ИМЕНИ
// ============================================================================

export function getShaderCode(name: string): string | null {
    // Сначала пробуем через ShaderLib
    const fromLib = (ShaderLib as any).getShader?.(name);
    if (fromLib) return fromLib;

    // Потом через window
    const fromWindow = (window as any)[`__shader_${name}`];
    if (fromWindow) return fromWindow;

    // Потом через __shaderLibShaders
    const fromMap = (window as any).__shaderLibShaders?.[name];
    if (fromMap) return fromMap;

    return null;
}

// ============================================================================
// ПРОВЕРКА НАЛИЧИЯ ШЕЙДЕРА
// ============================================================================

export function hasShader(name: string): boolean {
    return getShaderCode(name) !== null;
}

// ============================================================================
// ПОЛУЧЕНИЕ ВСЕХ ЗАРЕГИСТРИРОВАННЫХ ШЕЙДЕРОВ
// ============================================================================

export function getAllRegisteredShaders(): string[] {
    const shaders: string[] = [];

    // Из ShaderLib
    const libShaders = (ShaderLib as any).shaders;
    if (libShaders && typeof libShaders.keys === 'function') {
        for (const key of libShaders.keys()) {
            shaders.push(key);
        }
    }

    // Из window
    for (const key in (window as any).__shaderLibShaders) {
        if (!shaders.includes(key)) {
            shaders.push(key);
        }
    }

    return shaders;
}

// ============================================================================
// ДИАГНОСТИКА
// ============================================================================

export function diagnoseShaders(): void {
    console.log('\n' + '═'.repeat(70));
    console.log('🔍 ДИАГНОСТИКА РЕГИСТРАЦИИ ШЕЙДЕРОВ');
    console.log('═'.repeat(70));

    const registered = getAllRegisteredShaders();
    console.log(`📊 Всего зарегистрировано: ${registered.length}`);

    const required = [
        'starfield_main_vert',
        'starfield_main_frag',
        'starfield_lq_vert',
        'starfield_lq_frag'
    ];

    console.log('\n⭐ КРИТИЧЕСКИЕ ШЕЙДЕРЫ:');
    for (const name of required) {
        const exists = hasShader(name);
        console.log(`   ${exists ? '✅' : '❌'} ${name}`);
        if (!exists) {
            // Пробуем найти в window
            const fromWindow = (window as any)[`__shader_${name}`];
            if (fromWindow) {
                console.log(`      → Найден в window, но не в ShaderLib`);
            }
        }
    }

    console.log('\n📋 ВСЕ ЗАРЕГИСТРИРОВАННЫЕ ШЕЙДЕРЫ:');
    const sorted = registered.sort();
    for (let i = 0; i < Math.min(sorted.length, 20); i++) {
        console.log(`   • ${sorted[i]}`);
    }
    if (sorted.length > 20) {
        console.log(`   ... и еще ${sorted.length - 20} шейдеров`);
    }

    console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// СБРОС РЕГИСТРАЦИИ (ДЛЯ ТЕСТИРОВАНИЯ)
// ============================================================================

export function resetShaderRegistration(): void {
    isRegistered = false;
    console.log('🔄 Сброс флага регистрации шейдеров');
}

// ============================================================================
// ЭКСПОРТЫ
// ============================================================================

export default {
    registerAllShaders,
    registerAllShadersToLib,
    verifyShaderRegistration,
    emergencyRegisterShaders,
    getShaderCode,
    hasShader,
    getAllRegisteredShaders,
    diagnoseShaders,
    resetShaderRegistration,
    SHADER_CONFIG
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

if (typeof window !== 'undefined') {
    console.log('═'.repeat(70));
    console.log('📝 [register-shaders] МОДУЛЬ ЗАГРУЖЕН v4.1');
    console.log('   • Регистрация в ShaderLib (основной метод)');
    console.log('   • Экстренная регистрация (резервный метод)');
    console.log('   • Проверка и диагностика');
    console.log('   • Команды: __shaderRegistry.verify(), .diagnose()');
    console.log('═'.repeat(70));
}