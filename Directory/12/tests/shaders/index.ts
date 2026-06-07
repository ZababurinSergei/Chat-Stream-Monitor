// /10/tests/shaders/index.ts
// Централизованный экспорт всех шейдеров из kosmos
// Версия 3.3.2 - ДОБАВЛЕН ЭКСПОРТ LQ ВЕРСИЙ ДЛЯ РЕГИСТРАЦИИ
// - Экспорт StarfieldShaderLQ_vert и StarfieldShaderLQ_frag
// - Полная совместимость с shader-registry.ts
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

// ============================================================================
// ИМПОРТ ВСЕХ ШЕЙДЕРОВ ИЗ KOSMOS
// ============================================================================

// Звездное поле (адаптирован под Gaia DR3)
import { StarfieldShader_vert, StarfieldShader_frag, StarfieldShaderLQ_vert, StarfieldShaderLQ_frag } from './StarfieldShader.wgsl.js';

// Планеты (базовый, адаптирован)
import { PlanetfieldShader_vert, PlanetfieldShader_frag } from './PlanetfieldShader.wgsl.js';

// Планеты ближние (LOD 0-2, высокое разрешение)
import { PlanetNearMeshShader_vert, PlanetNearMeshShader_frag } from './PlanetNearMeshShader.wgsl.js';

// Планеты дальние (LOD 3-4, низкое разрешение)
import { PlanetFarMeshShader_vert, PlanetFarMeshShader_frag, PlanetFarMeshShaderLQ_vert, PlanetFarMeshShaderLQ_frag } from './PlanetFarMeshShader.wgsl.js';

// Compute шейдеры для генерации текстур
import { NormalMapGeneratorShader_cs } from './NormalMapGeneratorShader.wgsl.js';
import { FarMapGeneratorShader_cs } from './FarMapGeneratorShader.wgsl.js';
import { NearMapGeneratorShader_cs } from './NearMapGeneratorShader.wgsl.js';

// Вспомогательные функции (из kosmos)
import { NoiseShader } from './NoiseShader.wgsl.js';
import {
    HEIGHT_FUNCTIONS,
    HEIGHT_FUNCTION_0,
    HEIGHT_FUNCTION_1,
    HEIGHT_FUNCTION_2,
    FAR_HEIGHT_FUNCTION,
    MICRO_DETAIL_FUNCTION,
    ATMOSPHERIC_SCATTERING
} from './HeightFunctions.wgsl.js';
import {
    WindowsCompatibilityUglyHacks,
    RANDOM_SEED
} from './WindowsCompatibilityUglyHacks.wgsl.js';

// ============================================================================
// ⭐ НОВЫЕ АЛИАСЫ ДЛЯ LOD ШЕЙДЕРОВ (ИСПРАВЛЕНИЕ ОШИБОК)
// ============================================================================

// Алиасы для Planet LOD шейдеров
export const PlanetLOD_vert = PlanetNearMeshShader_vert;
export const PlanetLOD_frag = PlanetNearMeshShader_frag;

// Алиасы для Starfield LOD шейдеров
export const StarfieldLOD_vert = StarfieldShader_vert;
export const StarfieldLOD_frag = StarfieldShader_frag;

// ============================================================================
// ⭐ ЭКСПОРТ LQ ВЕРСИЙ ДЛЯ РЕГИСТРАЦИИ В SHADER-LIB
// ============================================================================

// Starfield LQ (Low Quality) - для дальних LOD уровней
export { StarfieldShaderLQ_vert, StarfieldShaderLQ_frag };

// Planet Far LQ - для очень дальних планет
export { PlanetFarMeshShaderLQ_vert, PlanetFarMeshShaderLQ_frag };

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

export const SHADERS_VERSION = '3.3.2';
export const SHADERS_SOURCE = 'kosmos (John Judnich, 2013) -> WGSL, адаптировано под Gaia DR3';
export const SHADERS_TOTAL = 12;

export const REGISTERED_SHADERS = [
    { name: 'StarfieldShader', type: 'starfield', file: 'StarfieldShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'StarfieldShaderLQ', type: 'starfield', file: 'StarfieldShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'PlanetfieldShader', type: 'planet', file: 'PlanetfieldShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'PlanetNearMeshShader', type: 'planet_near', file: 'PlanetNearMeshShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'PlanetFarMeshShader', type: 'planet_far', file: 'PlanetFarMeshShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'PlanetFarMeshShaderLQ', type: 'planet_far', file: 'PlanetFarMeshShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'NormalMapGeneratorShader', type: 'compute', file: 'NormalMapGeneratorShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'FarMapGeneratorShader', type: 'compute', file: 'FarMapGeneratorShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'NearMapGeneratorShader', type: 'compute', file: 'NearMapGeneratorShader.wgsl.ts', source: 'kosmos', adapted: true, status: 'active' },
    { name: 'NoiseShader', type: 'utility', file: 'NoiseShader.wgsl.ts', source: 'kosmos', adapted: false, status: 'active' },
    { name: 'HeightFunctions', type: 'utility', file: 'HeightFunctions.wgsl.ts', source: 'kosmos', adapted: false, status: 'active' },
    { name: 'WindowsCompatibilityUglyHacks', type: 'utility', file: 'WindowsCompatibilityUglyHacks.wgsl.ts', source: 'kosmos', adapted: false, status: 'active' }
];

// ============================================================================
// ФУНКЦИЯ ЛОГИРОВАНИЯ (С ПОДДЕРЖКОЙ ЦВЕТОВ)
// ============================================================================

const colors = {
    reset: '\x1b[0m',
    fg: {
        green: '\x1b[32m',
        cyan: '\x1b[36m',
        yellow: '\x1b[33m',
        red: '\x1b[31m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m'
    }
};

const hasColors = typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;

export function logShaderRegistration(): void {
    const c = hasColors ? colors : { fg: { green: '', cyan: '', yellow: '', red: '', blue: '', magenta: '' }, reset: '' };

    console.log('\n' + '═'.repeat(70));
    console.log(`${c.fg.cyan}🎨 ШЕЙДЕРЫ ИЗ KOSMOS - ПОЛНОЕ ПОДКЛЮЧЕНИЕ${c.reset}`);
    console.log('═'.repeat(70));
    console.log(`Версия: ${SHADERS_VERSION}`);
    console.log(`Источник: ${SHADERS_SOURCE}`);
    console.log(`Всего шейдеров: ${REGISTERED_SHADERS.length}`);

    console.log(`\n${c.fg.blue}📋 ПОЛНЫЙ СПИСОК ШЕЙДЕРОВ:${c.reset}`);

    for (const shader of REGISTERED_SHADERS) {
        let typeIcon = '';
        let typeColor = '';

        switch(shader.type) {
            case 'starfield':
                typeIcon = '⭐';
                typeColor = c.fg.yellow;
                break;
            case 'planet':
            case 'planet_near':
            case 'planet_far':
                typeIcon = '🪐';
                typeColor = c.fg.green;
                break;
            case 'compute':
                typeIcon = '🔧';
                typeColor = c.fg.magenta;
                break;
            case 'utility':
                typeIcon = '📊';
                typeColor = c.fg.blue;
                break;
            default:
                typeIcon = '📄';
                typeColor = c.fg.cyan;
        }

        const adaptedMark = shader.adapted ? `${c.fg.green}✅${c.reset}` : `${c.fg.yellow}📄${c.reset}`;
        console.log(`   ${typeIcon} ${typeColor}${shader.name}${c.reset} (${shader.type}) - ${shader.file} ${adaptedMark}`);
    }

    console.log(`\n${c.fg.magenta}📊 СТАТИСТИКА:${c.reset}`);
    const adaptedCount = REGISTERED_SHADERS.filter(s => s.adapted).length;
    const originalCount = REGISTERED_SHADERS.filter(s => !s.adapted).length;
    const activeCount = REGISTERED_SHADERS.filter(s => s.status === 'active').length;

    console.log(`   • Адаптировано под Gaia DR3: ${adaptedCount}/${SHADERS_TOTAL}`);
    console.log(`   • Оригинальные (универсальные): ${originalCount}/${SHADERS_TOTAL}`);
    console.log(`   • Активных шейдеров: ${activeCount}/${SHADERS_TOTAL}`);

    console.log(`\n${c.fg.cyan}🔗 МОДУЛИ-ПОТРЕБИТЕЛИ:${c.reset}`);
    console.log(`   • StarfieldModule.ts - использует StarfieldShader`);
    console.log(`   • PlanetLODModule.ts - использует Planet шейдеры`);
    console.log(`   • TextureGenerator.ts - использует Compute шейдеры`);

    console.log('═'.repeat(70) + '\n');
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ШЕЙДЕРОВ (1:1 С KOSMOS)
// ============================================================================

// Звездное поле (включая LQ версии)
export { StarfieldShader_vert, StarfieldShader_frag };

// Планеты
export { PlanetfieldShader_vert, PlanetfieldShader_frag };
export { PlanetNearMeshShader_vert, PlanetNearMeshShader_frag };
export { PlanetFarMeshShader_vert, PlanetFarMeshShader_frag };

// Compute шейдеры
export { NormalMapGeneratorShader_cs };
export { FarMapGeneratorShader_cs };
export { NearMapGeneratorShader_cs };

// Вспомогательные функции
export { NoiseShader };
export {
    HEIGHT_FUNCTIONS,
    HEIGHT_FUNCTION_0,
    HEIGHT_FUNCTION_1,
    HEIGHT_FUNCTION_2,
    FAR_HEIGHT_FUNCTION,
    MICRO_DETAIL_FUNCTION,
    ATMOSPHERIC_SCATTERING
};
export { WindowsCompatibilityUglyHacks, RANDOM_SEED };

// ============================================================================
// ТИПЫ ДЛЯ TYPESCRIPT
// ============================================================================

export type ShaderName =
    | 'StarfieldShader'
    | 'StarfieldShaderLQ'
    | 'PlanetfieldShader'
    | 'PlanetNearMeshShader'
    | 'PlanetFarMeshShader'
    | 'PlanetFarMeshShaderLQ'
    | 'NormalMapGeneratorShader'
    | 'FarMapGeneratorShader'
    | 'NearMapGeneratorShader'
    | 'NoiseShader'
    | 'HeightFunctions'
    | 'WindowsCompatibilityUglyHacks';

export type ShaderType = 'starfield' | 'planet' | 'planet_near' | 'planet_far' | 'compute' | 'utility';

export interface ShaderInfo {
    name: ShaderName;
    type: ShaderType;
    file: string;
    source: string;
    adapted: boolean;
    status: 'active' | 'deprecated' | 'testing';
}

// ============================================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ИНФОРМАЦИИ О ШЕЙДЕРЕ
// ============================================================================

export function getShaderInfo(name: ShaderName): ShaderInfo | undefined {
    return REGISTERED_SHADERS.find(s => s.name === name) as ShaderInfo | undefined;
}

// ============================================================================
// ФУНКЦИЯ ПРОВЕРКИ СУЩЕСТВОВАНИЯ ШЕЙДЕРА
// ============================================================================

export function hasShader(name: ShaderName): boolean {
    return REGISTERED_SHADERS.some(s => s.name === name);
}

// ============================================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ВСЕХ АДАПТИРОВАННЫХ ШЕЙДЕРОВ
// ============================================================================

export function getAdaptedShaders(): ShaderInfo[] {
    return REGISTERED_SHADERS.filter(s => s.adapted) as ShaderInfo[];
}

// ============================================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ШЕЙДЕРОВ ПО ТИПУ
// ============================================================================

export function getShadersByType(type: ShaderType): ShaderInfo[] {
    return REGISTERED_SHADERS.filter(s => s.type === type) as ShaderInfo[];
}

// ============================================================================
// ФУНКЦИЯ ПОЛУЧЕНИЯ ШЕЙДЕРА ПО ФАЙЛУ
// ============================================================================

export function getShaderByFile(filename: string): ShaderInfo | undefined {
    return REGISTERED_SHADERS.find(s => s.file === filename) as ShaderInfo | undefined;
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ (ДЛЯ УДОБСТВА)
// ============================================================================

export default {
    // Метаданные
    SHADERS_VERSION,
    SHADERS_SOURCE,
    SHADERS_TOTAL,
    REGISTERED_SHADERS,
    logShaderRegistration,

    // LOD алиасы
    PlanetLOD_vert,
    PlanetLOD_frag,
    StarfieldLOD_vert,
    StarfieldLOD_frag,

    // Звездное поле (основные + LQ)
    StarfieldShader_vert,
    StarfieldShader_frag,
    StarfieldShaderLQ_vert,
    StarfieldShaderLQ_frag,

    // Планеты (основные + LQ)
    PlanetfieldShader_vert,
    PlanetfieldShader_frag,
    PlanetNearMeshShader_vert,
    PlanetNearMeshShader_frag,
    PlanetFarMeshShader_vert,
    PlanetFarMeshShader_frag,
    PlanetFarMeshShaderLQ_vert,
    PlanetFarMeshShaderLQ_frag,

    // Compute шейдеры
    NormalMapGeneratorShader_cs,
    FarMapGeneratorShader_cs,
    NearMapGeneratorShader_cs,

    // Вспомогательные функции
    NoiseShader,
    HEIGHT_FUNCTIONS,
    HEIGHT_FUNCTION_0,
    HEIGHT_FUNCTION_1,
    HEIGHT_FUNCTION_2,
    FAR_HEIGHT_FUNCTION,
    MICRO_DETAIL_FUNCTION,
    ATMOSPHERIC_SCATTERING,
    WindowsCompatibilityUglyHacks,
    RANDOM_SEED,

    // Типизированные функции
    getShaderInfo,
    hasShader,
    getAdaptedShaders,
    getShadersByType,
    getShaderByFile
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ (ТОЛЬКО В СРЕДЕ РАЗРАБОТКИ)
// ============================================================================

if (typeof window !== 'undefined' && (window as any).__DEBUG_SHADERS) {
    console.log('═'.repeat(70));
    console.log('🎨 SHADERS INDEX v3.3.2 LOADED');
    console.log('═'.repeat(70));
    console.log(`Total shaders: ${SHADERS_TOTAL}`);
    console.log(`Adapted: ${getAdaptedShaders().length}`);
    console.log(`Source: ${SHADERS_SOURCE}`);
    console.log('═'.repeat(70));

    // Добавляем глобальный доступ для отладки
    (window as any).__kosmosShadersInfo = {
        list: REGISTERED_SHADERS,
        getShaderInfo,
        getAdaptedShaders,
        getShadersByType,
        logShaderRegistration
    };
}

// ============================================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// ============================================================================

// Автоматический лог при загрузке в режиме разработки
if (typeof window !== 'undefined' && (window as any).__DEV_MODE) {
    logShaderRegistration();
}

console.log('═'.repeat(70));
console.log('🎨 [SHADERS INDEX] v3.3.2 ЗАГРУЖЕН');
console.log('   • Экспортировано 12 шейдеров (включая LQ версии)');
console.log('   • Готов к регистрации в ShaderLib');
console.log('   • StarfieldShaderLQ - для дальних LOD уровней');
console.log('   • PlanetFarMeshShaderLQ - для очень дальних планет');
console.log('═'.repeat(70));