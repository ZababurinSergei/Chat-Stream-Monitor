// /tsgen-refactored/src/utils/logger.ts
export class Logger {
    static info(message: string): void {
        console.log(`ℹ️ ${message}`);
    }

    static success(message: string): void {
        console.log(`✅ ${message}`);
    }

    static warn(message: string): void {
        console.log(`⚠️ ${message}`);
    }

    static error(message: string): void {
        console.log(`❌ ${message}`);
    }

    static debug(message: string): void {
        if (process.env['DEBUG']) {
            console.log(`🐛 ${message}`);
        }
    }

    static section(title: string): void {
        console.log(`\n📁 ${title.toUpperCase()}`);
        console.log('─'.repeat(title.length + 4));
    }

    static package(packageName: string, builder: string, type: string): void {
        console.log(`📦 ${packageName} (${builder} - ${type})`);
    }

    static config(filePath: string): void {
        console.log(`   📄 ${filePath}`);
    }

    static dependency(from: string, to: string): void {
        console.log(`   🔗 ${from} → ${to}`);
    }

    static composite(enabled: boolean): void {
        const status = enabled ? '✅ включен' : '❌ выключен';
        console.log(`   🧩 Composite mode: ${status}`);
    }

    static stats(generated: number, total: number, skipped: number = 0): void {
        console.log(`\n📊 Статистика:`);
        console.log(`   ✅ Успешно: ${generated}`);
        console.log(`   ⏭️  Пропущено: ${skipped}`);
        console.log(`   📦 Всего: ${total}`);

        if (total > 0) {
            const percentage = ((generated / total) * 100).toFixed(1);
            console.log(`   📈 Завершено: ${percentage}%`);
        }
    }

    static builderDetection(builder: string, confidence: 'high' | 'medium' | 'low'): void {
        const confidenceIcons = {
            high: '🎯',
            medium: '🎪',
            low: '🎭'
        };
        console.log(`   ${confidenceIcons[confidence]} Определен сборщик: ${builder}`);
    }

    static packageTypeDetection(type: string, method: 'name' | 'dependencies' | 'fallback'): void {
        const methodIcons = {
            name: '🏷️',
            dependencies: '📦',
            fallback: '🔍'
        };
        console.log(`   ${methodIcons[method]} Тип пакета: ${type}`);
    }
}