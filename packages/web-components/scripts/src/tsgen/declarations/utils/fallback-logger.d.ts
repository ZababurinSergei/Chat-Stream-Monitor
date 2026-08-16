export declare class FallbackLogger {
    static logFallbackDecision(packageName: string, originalBuilder: string, fallbackBuilder: string, reason: string): void;
    static logBuilderSupport(builder: string, packageType: string, supported: boolean): void;
    static logDetectionDetails(packageName: string, detectedBy: 'config' | 'dependencies' | 'scripts' | 'fallback', confidence: 'high' | 'medium' | 'low', details: string): void;
    static logPackageTypeDecision(packageName: string, detectedType: string, method: 'name' | 'dependencies' | 'content' | 'fallback', confidence: number): void;
    static logCompositeDecision(packageName: string, isComposite: boolean, reasons: string[]): void;
    static logDependencyAnalysis(packageName: string, dependencies: string[], externalDeps: string[], internalDeps: string[]): void;
    static logFinalDecision(packageName: string, finalBuilder: string, finalType: string, isComposite: boolean, usedFallback: boolean): void;
    static warnUnsupportedCombination(packageName: string, builder: string, packageType: string): void;
    static infoFallbackApplied(packageName: string, fromBuilder: string, toBuilder: string, reason: string): void;
    static debugBuilderSelection(packageName: string, candidates: Array<{
        builder: string;
        score: number;
        reason: string;
    }>): void;
}
//# sourceMappingURL=fallback-logger.d.ts.map