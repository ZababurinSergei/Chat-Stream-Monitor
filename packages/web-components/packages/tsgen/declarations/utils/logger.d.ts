export declare class Logger {
    static info(message: string): void;
    static success(message: string): void;
    static warn(message: string): void;
    static error(message: string): void;
    static debug(message: string): void;
    static section(title: string): void;
    static package(packageName: string, builder: string, type: string): void;
    static config(filePath: string): void;
    static dependency(from: string, to: string): void;
    static composite(enabled: boolean): void;
    static stats(generated: number, total: number, skipped?: number): void;
    static builderDetection(builder: string, confidence: 'high' | 'medium' | 'low'): void;
    static packageTypeDetection(type: string, method: 'name' | 'dependencies' | 'fallback'): void;
}
//# sourceMappingURL=logger.d.ts.map