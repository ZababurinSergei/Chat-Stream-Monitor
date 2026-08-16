import type { BuilderDetection, PackageType } from '../types/package.types';
export declare class PackageUtils {
    static detectBuilder(packagePath: string): BuilderDetection;
    static detectPackageType(packageName: string, packagePath: string): PackageType;
    static getExistingPackages(monorepoRoot: string): string[];
    static fileExists(path: string): boolean;
    static readJson<T>(path: string): T | null;
}
//# sourceMappingURL=package-utils.d.ts.map