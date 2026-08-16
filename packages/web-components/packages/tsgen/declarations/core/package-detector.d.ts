import type { PackageInfo } from '../types/config.types';
export declare class PackageDetector {
    static detectPackageInfo(monorepoRoot: string, packageName: string): PackageInfo;
    private static getExistingDependencies;
    private static isDependencyOfOtherPackages;
    static detectAllPackages(monorepoRoot: string): PackageInfo[];
    static validatePackageStructure(packageInfo: PackageInfo): {
        isValid: boolean;
        issues: string[];
    };
}
//# sourceMappingURL=package-detector.d.ts.map