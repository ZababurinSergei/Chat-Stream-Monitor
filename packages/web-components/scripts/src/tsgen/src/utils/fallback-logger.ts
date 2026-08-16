// /10/src/utils/fallback-logger.ts
export class FallbackLogger {
    static logFallbackDecision(
        packageName: string,
        originalBuilder: string,
        fallbackBuilder: string,
        reason: string
    ): void {
        console.log(`🔄 ${packageName}:`);
        console.log(`   📋 Исходный сборщик: ${originalBuilder}`);
        console.log(`   🎯 Fallback сборщик: ${fallbackBuilder}`);
        console.log(`   💡 Причина: ${reason}`);
    }

    static logBuilderSupport(builder: string, packageType: string, supported: boolean): void {
        const status = supported ? '✅ поддерживается' : '❌ не поддерживается';
        console.log(`   🔧 ${builder} для ${packageType}: ${status}`);
    }

    static logDetectionDetails(
        packageName: string,
        detectedBy: 'config' | 'dependencies' | 'scripts' | 'fallback',
        confidence: 'high' | 'medium' | 'low',
        details: string
    ): void {
        const confidenceIcons = {
            high: '🎯',
            medium: '🎪',
            low: '🎭'
        };

        const detectionMethods = {
            config: '📄 конфиг файлы',
            dependencies: '📦 зависимости',
            scripts: '🔧 скрипты',
            fallback: '🔄 автоматический выбор'
        };

        console.log(`🔍 ${packageName}:`);
        console.log(`   ${confidenceIcons[confidence]} Определено по: ${detectionMethods[detectedBy]}`);
        console.log(`   📝 Детали: ${details}`);
    }

    static logPackageTypeDecision(
        packageName: string,
        detectedType: string,
        method: 'name' | 'dependencies' | 'content' | 'fallback',
        confidence: number
    ): void {
        const methodIcons = {
            name: '🏷️',
            dependencies: '📦',
            content: '📁',
            fallback: '🔍'
        };

        const confidenceLevel = confidence >= 0.8 ? 'высокая' :
            confidence >= 0.5 ? 'средняя' : 'низкая';

        console.log(`📦 ${packageName}:`);
        console.log(`   ${methodIcons[method]} Тип пакета: ${detectedType}`);
        console.log(`   📊 Уверенность: ${confidenceLevel} (${Math.round(confidence * 100)}%)`);
    }

    static logCompositeDecision(
        packageName: string,
        isComposite: boolean,
        reasons: string[]
    ): void {
        const status = isComposite ? '✅ включен' : '❌ выключен';
        console.log(`🧩 ${packageName}: Composite mode ${status}`);

        if (reasons.length > 0) {
            reasons.forEach(reason => {
                console.log(`   • ${reason}`);
            });
        }
    }

    static logDependencyAnalysis(
        packageName: string,
        dependencies: string[],
        externalDeps: string[],
        internalDeps: string[]
    ): void {
        console.log(`📊 ${packageName}: Анализ зависимостей`);

        if (internalDeps.length > 0) {
            console.log(`   🔗 Внутренние: ${internalDeps.join(', ')}`);
        }

        if (externalDeps.length > 0) {
            console.log(`   📦 Внешние: ${externalDeps.join(', ')}`);
        }

        console.log(`   📈 Всего зависимостей: ${dependencies.length}`);
    }

    static logFinalDecision(
        packageName: string,
        finalBuilder: string,
        finalType: string,
        isComposite: boolean,
        usedFallback: boolean
    ): void {
        console.log(`🎯 ${packageName}: Финальное решение`);
        console.log(`   🔧 Сборщик: ${finalBuilder} ${usedFallback ? '(fallback)' : ''}`);
        console.log(`   📦 Тип: ${finalType}`);
        console.log(`   🧩 Composite: ${isComposite ? 'да' : 'нет'}`);
    }

    static warnUnsupportedCombination(
        packageName: string,
        builder: string,
        packageType: string
    ): void {
        console.log(`⚠️ ${packageName}: Неподдерживаемая комбинация`);
        console.log(`   ❌ ${builder} + ${packageType} = не поддерживается`);
        console.log(`   🔄 Пробуем найти альтернативу...`);
    }

    static infoFallbackApplied(
        packageName: string,
        fromBuilder: string,
        toBuilder: string,
        reason: string
    ): void {
        console.log(`🔄 ${packageName}: Применен fallback`);
        console.log(`   📋 Было: ${fromBuilder}`);
        console.log(`   🎯 Стало: ${toBuilder}`);
        console.log(`   💡 Причина: ${reason}`);
    }

    static debugBuilderSelection(
        packageName: string,
        candidates: Array<{builder: string, score: number, reason: string}>
    ): void {
        console.log(`🐛 ${packageName}: Отладка выбора сборщика`);
        candidates.sort((a, b) => b.score - a.score);

        candidates.forEach(candidate => {
            const scorePercent = Math.round(candidate.score * 100);
            console.log(`   ${candidate.builder}: ${scorePercent}% - ${candidate.reason}`);
        });
    }
}