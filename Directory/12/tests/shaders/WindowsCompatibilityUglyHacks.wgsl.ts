// /10/tests/shaders/WindowsCompatibilityUglyHacks.wgsl.ts
// Портировано из kosmos WindowsCompatibilityUglyHacks.coffee
// Для Windows фиксация randomSeed (не используется в WebGPU)
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ
// АДАПТИРОВАНО ДЛЯ ПРОЕКТА GAIA DR3

// ============================================================================
// ОРИГИНАЛЬНЫЙ КОММЕНТАРИЙ ИЗ KOSMOS:
// ============================================================================
// For some reason, Windows messes with GLSL shaders and sometimes, unexpectedly,
// with NO WARNING, NO ERROR, and NO reason whatsoever -- just fails to output
// anything from the shader.
//
// The hilarious part: What seems to make it work just fine is removing one of
// the GLSL uniforms definitions and replacing it with constants. It can't be
// that we're exceeding the max uniforms because *we only use one vec3 and one
// vec2* at MOST, for the planet map generation shaders.
//
// A prime suspect is Google's ANGLE "compatibility layer" for Windows only,
// which changes OpenGL calls into Direct3D calls, and recompiles GLSL code
// into HLSL code. I suspect that's (ANGLE) where things are going horribly,
// horribly wrong in Chrome, but I'm still unsure why Firefox also suffers
// these issues.
//
// In any case, the fix is unfortunate: We have to disable randomSeed on
// Windows entirely. What does this mean? It means that on Windows, you only
// get three types of planets (one from each unique height function), instead
// of trillions that you get on Mac and Linux. :(
//
// That is, until Firefox/Chrome or whoever is responsible fixes the broken
// GLSL compiler on Windows. There's nothing else that can be done really
// other than recompiling the shader for EACH planet, which would have
// prohibitively bad performance.
// ============================================================================

// ============================================================================
// АДАПТАЦИЯ ДЛЯ ПРОЕКТА GAIA DR3:
// ============================================================================
// В WebGPU эта проблема не проявляется, так как используется WGSL вместо GLSL.
// Однако для совместимости с оригинальным kosmos кодом и возможного
// портирования на WebGL, мы сохраняем эту константу.
//
// Для проекта Gaia DR3 мы используем фиксированное значение randomSeed,
// так как процедурная генерация планет пока не используется. В будущем,
// при добавлении процедурных планет, можно будет использовать uniform
// для динамической генерации.
// ============================================================================

// ============================================================================
// RANDOM SEED ДЛЯ WINDOWS СОВМЕСТИМОСТИ
// ============================================================================

// Фиксированное значение randomSeed для всех платформ
// В оригинальном kosmos:
// - На Windows: const vec3 randomSeed = vec3(0.75, 0.5, 0.25);
// - На других платформах: uniform vec3 randomSeed;
// В WebGPU/WebGL2 мы используем фиксированное значение для единообразия
export const RANDOM_SEED: string = `
const randomSeed = vec3<f32>(0.75, 0.5, 0.25);
`;

// Альтернативный вариант с возможностью изменения через uniform
// Раскомментировать для динамической генерации планет
export const RANDOM_SEED_UNIFORM: string = `
@group(0) @binding(0) var<uniform> randomSeed: vec3<f32>;
`;

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ ФИКСЫ ДЛЯ WINDOWS СОВМЕСТИМОСТИ
// ============================================================================

// Фикс для точности вычислений на Windows
// Некоторые GPU на Windows имеют проблемы с высокой точностью в шейдерах
export const WINDOWS_PRECISION_FIX: string = `
// Принудительное использование mediump для Windows
// В WGSL это контролируется через тип f32 (всегда 32-битный)
// Дополнительные меры предосторожности:
fn safe_sqrt(x: f32) -> f32 {
    return sqrt(max(x, 0.0));
}

fn safe_acos(x: f32) -> f32 {
    return acos(clamp(x, -0.999999, 0.999999));
}

fn safe_pow(base: f32, exponent: f32) -> f32 {
    if (base <= 0.0) { return 0.0; }
    return pow(base, exponent);
}
`;

// Фикс для textureLod на Windows
export const WINDOWS_TEXTURE_FIX: string = `
// На некоторых Windows драйверах textureSampleLevel может давать артефакты
// Используем стандартную выборку с mipmap
fn safe_texture_sample(texture: texture_2d<f32>, sampler: sampler, uv: vec2<f32>, lod: f32) -> vec4<f32> {
    // Для совместимости с Windows используем textureSample вместо textureSampleLevel
    // если lod близок к 0
    if (lod < 0.1) {
        return textureSample(texture, sampler, uv);
    } else {
        return textureSampleLevel(texture, sampler, uv, lod);
    }
}
`;

// ============================================================================
// ОСНОВНОЙ ЭКСПОРТ (ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ)
// ============================================================================

export const WindowsCompatibilityUglyHacks: string = RANDOM_SEED;

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ ДЛЯ ОТЛАДКИ НА WINDOWS
// ============================================================================

// Функция для проверки необходимости Windows-фиксов
export function isWindowsPlatform(): boolean {
    if (typeof navigator === 'undefined') return false;
    const platform = navigator.platform?.toLowerCase() || '';
    return platform.includes('win') || platform.includes('windows');
}

// Функция для логирования статуса совместимости
export function logWindowsCompatibilityStatus(): void {
    const isWindows = isWindowsPlatform();
    console.log(`\n🪟 WINDOWS СОВМЕСТИМОСТЬ:`);
    console.log(`   Платформа: ${isWindows ? 'Windows' : 'Не Windows'}`);
    console.log(`   randomSeed: ${isWindows ? 'Фиксированный (const)' : 'Может быть uniform'}`);
    console.log(`   Меры предосторожности: ${isWindows ? 'Активны' : 'Стандартные'}`);
    console.log(`   Рекомендация: ${isWindows ? 'Использовать const randomSeed' : 'Можно использовать uniform'}`);
}

// ============================================================================
// ЭКСПОРТ ВСЕХ КОМПОНЕНТОВ
// ============================================================================

export default {
    RANDOM_SEED,
    RANDOM_SEED_UNIFORM,
    WindowsCompatibilityUglyHacks,
    WINDOWS_PRECISION_FIX,
    WINDOWS_TEXTURE_FIX,
    isWindowsPlatform,
    logWindowsCompatibilityStatus
};

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ (ДЛЯ ОТЛАДКИ)
// ============================================================================

if (typeof window !== 'undefined') {
    const isWindows = isWindowsPlatform();
    console.log(`🪟 [WindowsCompatibilityUglyHacks] Загружен`);
    console.log(`   Платформа: ${isWindows ? 'Windows 🪟' : 'Другая'}`);
    console.log(`   randomSeed: const vec3<f32>(0.75, 0.5, 0.25)`);
    if (isWindows) {
        console.log(`   ⚠️ Активны дополнительные меры совместимости для Windows`);
    }
}