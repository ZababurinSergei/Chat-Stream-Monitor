import { logger as libp2pLogger } from '@libp2p/logger';

// Цветовые константы
const COLORS = {
    WARN: '\x1b[33m',     // Темно-желтый
    INFO: '\x1b[36m',     // Голубой
    DEBUG: '\x1b[90m',    // Серый
    ERROR: '\x1b[31m',    // Красный
    RESET: '\x1b[0m'      // Сброс
};

export interface EnhancedLogger {
    (...args: any[]): void;
    trace: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
    debug: (...args: any[]) => void;
    error: (...args: any[]) => void;
}

export function createLogger(prefix: string): EnhancedLogger {
    const baseLogger = libp2pLogger(prefix);

    const enhancedLogger = (...args: any[]): void => {
        // Преобразуем аргументы в строку для совместимости
        if (args.length === 0) {
            baseLogger('');
        } else {
            const message = args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ');
            baseLogger(message);
        }
    };

    // Копируем существующие методы
    enhancedLogger.trace = baseLogger.trace;

    // Переопределяем с цветами - используем простой подход
    enhancedLogger.warn = (...args: any[]): void => {
        baseLogger(`${COLORS.WARN}⚠️ WARN:${COLORS.RESET}`, ...args);
    };

    enhancedLogger.info = (...args: any[]): void => {
        baseLogger(`${COLORS.INFO}ℹ️ INFO:${COLORS.RESET}`, ...args);
    };

    enhancedLogger.debug = (...args: any[]): void => {
        baseLogger(`${COLORS.DEBUG}🔍 DEBUG:${COLORS.RESET}`, ...args);
    };

    enhancedLogger.error = (...args: any[]): void => {
        baseLogger(`${COLORS.ERROR}❌ ERROR:${COLORS.RESET}`, ...args);
    };

    return enhancedLogger;
}