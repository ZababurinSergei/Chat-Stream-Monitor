import type { TSConfig, BuilderConfig, PackageType, BuilderType, ModuleFormat } from '../types/config.types';
import type { PackageInfo } from '../types/package.types';
export declare abstract class BaseBuilder {
    protected packageInfo: PackageInfo;
    abstract readonly name: BuilderType;
    abstract readonly supportedPackageTypes: PackageType[];
    constructor(packageInfo: PackageInfo);
    abstract generateConfig(): BuilderConfig;
    protected getBaseCompilerOptions(): TSConfig['compilerOptions'];
    protected generatePaths(): Record<string, string[]>;
    protected getIncludePatterns(): string[];
    protected getExcludePatterns(): string[];
    protected generateReferences(): Array<{
        path: string;
    }>;
    protected shouldUseComposite(): boolean;
    protected getModuleFormat(): ModuleFormat;
    protected getPackageJsonUpdates(): Record<string, unknown>;
    isSupported(): boolean;
    getPackageInfo(): PackageInfo;
}
//# sourceMappingURL=base-builder.d.ts.map