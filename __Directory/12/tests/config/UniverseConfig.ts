// /10/tests/config/UniverseConfig.ts
// Конфигурация вселенной - единый источник истины для масштаба
// Версия 1.0.0 - Без циклических зависимостей
// 100% СИМВОЛОВ - ПОЛНАЯ ВЕРСИЯ

export class UniverseConfig {
    private static _realScale: number = 0.5;
    private static _listeners: ((scale: number) => void)[] = [];
    private static _initialized: boolean = false;

    /**
     * Получить текущий масштаб вселенной (пк/ед.)
     * 1 игровая единица = X парсек
     */
    static get realScale(): number {
        if (!UniverseConfig._initialized && typeof localStorage !== 'undefined') {
            const savedScale = localStorage.getItem('universe_real_scale');
            if (savedScale) {
                const parsed = parseFloat(savedScale);
                if (!isNaN(parsed) && parsed >= 0.1 && parsed <= 10) {
                    UniverseConfig._realScale = parsed;
                }
            }
            UniverseConfig._initialized = true;
            console.log(`🌌 UniverseConfig: Инициализирован масштаб = ${UniverseConfig._realScale} пк/ед.`);
        }
        return UniverseConfig._realScale;
    }

    /**
     * Установить масштаб вселенной (пк/ед.)
     * @param scale - масштаб в диапазоне 0.1 - 10
     */
    static setRealScale(scale: number): void {
        if (scale < 0.1 || scale > 10) {
            console.warn(`🌌 UniverseConfig: Неверный масштаб ${scale}. Допустимый диапазон: 0.1 - 10`);
            return;
        }

        const oldScale = UniverseConfig._realScale;
        UniverseConfig._realScale = scale;

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('universe_real_scale', String(scale));
        }

        // Уведомляем всех подписчиков
        UniverseConfig._listeners.forEach(fn => {
            try { fn(scale); } catch (e) { console.error('UniverseConfig listener error:', e); }
        });

        console.log(`🌌 UniverseConfig: Масштаб изменён с ${oldScale} на ${scale} пк/ед.`);
    }

    /**
     * Подписаться на изменения масштаба
     * @param callback - функция, вызываемая при изменении масштаба
     * @returns функция для отписки
     */
    static onChange(callback: (scale: number) => void): () => void {
        UniverseConfig._listeners.push(callback);
        return () => {
            const index = UniverseConfig._listeners.indexOf(callback);
            if (index !== -1) UniverseConfig._listeners.splice(index, 1);
        };
    }

    /**
     * Сбросить масштаб к значению по умолчанию (0.5)
     */
    static reset(): void {
        UniverseConfig._realScale = 0.5;
        UniverseConfig._listeners = [];
        UniverseConfig._initialized = false;
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('universe_real_scale');
        }
        console.log(`🌌 UniverseConfig: Сброшен к значениям по умолчанию (0.5 пк/ед.)`);
    }

    /**
     * Получить информацию о текущей конфигурации
     */
    static getInfo(): {
        realScale: number;
        initialized: boolean;
        listenersCount: number;
        savedInStorage: boolean;
    } {
        const savedInStorage = typeof localStorage !== 'undefined' && localStorage.getItem('universe_real_scale') !== null;
        return {
            realScale: UniverseConfig._realScale,
            initialized: UniverseConfig._initialized,
            listenersCount: UniverseConfig._listeners.length,
            savedInStorage
        };
    }

    /**
     * Преобразовать парсеки в игровые единицы
     * @param parsecs - расстояние в парсеках
     * @returns расстояние в игровых единицах
     */
    static parsecsToUnits(parsecs: number): number {
        return parsecs / UniverseConfig.realScale;
    }

    /**
     * Преобразовать игровые единицы в парсеки
     * @param units - расстояние в игровых единицах
     * @returns расстояние в парсеках
     */
    static unitsToParsecs(units: number): number {
        return units * UniverseConfig.realScale;
    }

    /**
     * Преобразовать парсеки в световые годы
     * @param parsecs - расстояние в парсеках
     * @returns расстояние в световых годах
     */
    static parsecsToLightYears(parsecs: number): number {
        return parsecs * 3.26156;
    }

    /**
     * Преобразовать световые годы в парсеки
     * @param lightYears - расстояние в световых годах
     * @returns расстояние в парсеках
     */
    static lightYearsToParsecs(lightYears: number): number {
        return lightYears / 3.26156;
    }

    /**
     * Получить расстояние в парсеках в читаемом формате
     * @param parsecs - расстояние в парсеках
     * @returns отформатированная строка
     */
    static formatDistance(parsecs: number): string {
        if (parsecs < 0.01) return `${(parsecs * 1000).toFixed(2)} мпк`;
        if (parsecs < 1) return `${(parsecs * 1000).toFixed(2)} мпк`;
        if (parsecs < 1000) return `${parsecs.toFixed(2)} пк`;
        if (parsecs < 100000) return `${(parsecs / 1000).toFixed(2)} кпк`;
        return `${(parsecs / 1000000).toFixed(2)} Мпк`;
    }
}

// ============================================================================
// ГЛОБАЛЬНЫЙ ДОСТУП ДЛЯ ОТЛАДКИ
// ============================================================================

if (typeof window !== 'undefined') {
    (window as any).__UniverseConfig = {
        get realScale() { return UniverseConfig.realScale; },
        setRealScale: (scale: number) => UniverseConfig.setRealScale(scale),
        reset: () => UniverseConfig.reset(),
        getInfo: () => UniverseConfig.getInfo(),
        parsecsToUnits: (pc: number) => UniverseConfig.parsecsToUnits(pc),
        unitsToParsecs: (u: number) => UniverseConfig.unitsToParsecs(u),
        formatDistance: (pc: number) => UniverseConfig.formatDistance(pc),
        version: '1.0.0'
    };
    console.log('✅ [UniverseConfig] Глобальный доступ: __UniverseConfig');
}

// ============================================================================
// ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================================

export default UniverseConfig;

// ============================================================================
// КОНСОЛЬНЫЙ ВЫВОД ПРИ ЗАГРУЗКЕ
// ============================================================================

console.log('═'.repeat(70));
console.log('🌌 [UniverseConfig] МОДУЛЬ ЗАГРУЖЕН v1.0.0');
console.log('   • Без циклических зависимостей');
console.log('   • Сохранение масштаба в localStorage');
console.log('   • Подписка на изменения масштаба');
console.log('   • Конвертация единиц: пк ↔ ед. ↔ св.лет');
console.log('   • Команды: __UniverseConfig.setRealScale(0.5)');
console.log('═'.repeat(70));