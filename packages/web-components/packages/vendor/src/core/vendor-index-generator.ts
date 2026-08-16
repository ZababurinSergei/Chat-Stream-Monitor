import { FileUtils } from '../utils/file-utils';
import type { VendorDependency, Platform } from './types';
import { isPackageExcluded } from './excluded-packages';

export class VendorIndexGenerator {
    constructor(private projectRoot: string) {}

    async generateVendorIndex(dependencies: Map<string, VendorDependency>, platform: Platform = 'browser'): Promise<string> {
        if (dependencies.size === 0) {
            return this.generateFallbackIndex(platform);
        }

        // Filter out invalid dependencies
        const validDependencies = new Map<string, VendorDependency>();
        for (const [pkgName, dep] of dependencies) {
            if (this.isValidForBundle(pkgName, platform)) {
                validDependencies.set(pkgName, dep);
            } else {
                console.log(`🚫 Excluding ${pkgName} from ${platform} vendor bundle`);
            }
        }

        if (validDependencies.size === 0) {
            return this.generateFallbackIndex(platform);
        }

        const imports: string[] = [];
        const exports: string[] = [];
        const namedExports: string[] = [];
        const infoExports: string[] = [];

        for (const [pkgName] of validDependencies) {
            const varName = this.toValidIdentifier(pkgName);

            // Skip reserved words and invalid identifiers
            if (this.isReservedWord(varName)) {
                console.warn(`⚠️ Skipping reserved word: ${pkgName} -> ${varName}`);
                continue;
            }

            // Special handling for known packages with specific exports
            if (pkgName === '@libp2p/logger') {
                imports.push(`import { logger } from '@libp2p/logger';`);
                exports.push(`export { logger };`);
                exports.push(`export const ${varName} = { logger };`);
            } else {
                // Standard imports for other packages
                imports.push(`import * as ${varName} from '${pkgName}';`);
                exports.push(`export { ${varName} };`);

                // Export individual named exports for common packages
                if (pkgName === 'react') {
                    namedExports.push(`export const { useState, useEffect, useRef, createElement } = ${varName};`);
                } else if (pkgName === 'react-dom') {
                    namedExports.push(`export const { render, createRoot, hydrate } = ${varName};`);
                }
            }
        }

        // Vendor metadata
        infoExports.push(`export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: ${JSON.stringify(Array.from(validDependencies.keys()))},
  totalDependencies: ${validDependencies.size},
  buildType: 'vendor-bundle',
  platform: '${platform}'
};`);

        // Utility functions
        infoExports.push(`
// Utility to check if a dependency is available
export function hasDependency(name) {
  return VENDOR_INFO.dependencies.includes(name);
}

// Vendor initialization status
export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: ${validDependencies.size}
};`);

        const exportNames = Array.from(validDependencies.keys())
            .map(pkg => {
                const varName = this.toValidIdentifier(pkg);
                return this.isReservedWord(varName) ? null : (pkg === '@libp2p/logger' ? 'logger' : varName);
            })
            .filter(Boolean);

        const content = `// Vendor Index - Auto-generated
// External dependencies for the project
// Generated: ${new Date().toISOString()}
// Project: ${this.projectRoot}
// Platform: ${platform}

${imports.join('\n')}

${exports.join('\n')}

${namedExports.filter(exp => !exp.startsWith('//')).join('\n')}

${infoExports.join('\n')}

// Vendor initialization
console.log('✅ Vendor index loaded with ${validDependencies.size} dependencies:', VENDOR_INFO.dependencies);

// Export everything as a namespace
export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency,
  ${exportNames.join(',\n  ')}
};
`;

        return content;
    }

    private isValidForBundle(packageName: string, platform: Platform): boolean {
        return !isPackageExcluded(packageName, platform);
    }

    private toValidIdentifier(str: string): string {
        // Убираем специальные символы и создаем валидный идентификатор
        return str
            .replace(/^@/, '') // Убираем @ в начале
            .replace(/[\/\-@\.]/g, '_') // Заменяем /, -, @, . на _
            .replace(/^(\d)/, '_$1') // Если начинается с цифры, добавляем _
            .replace(/\s+/g, '_') // Заменяем пробелы на _
            .replace(/_{2,}/g, '_') // Убираем двойные _
            .replace(/_+$/, ''); // Убираем _ в конце
    }

    private isReservedWord(word: string): boolean {
        const reservedWords = [
            'package', 'function', 'class', 'return', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'default', 'break', 'continue', 'var', 'let',
            'const', 'import', 'export', 'from', 'as', 'in', 'of', 'typeof', 'void',
            'delete', 'new', 'this', 'super', 'extends', 'instanceof', 'try', 'catch',
            'finally', 'throw', 'debugger', 'with', 'yield', 'await', 'async', 'static',
            'public', 'private', 'protected', 'interface', 'implements', 'enum'
        ];
        return reservedWords.includes(word);
    }

    private generateFallbackIndex(platform: Platform): string {
        return `// Fallback Vendor Index
// Auto-generated: ${new Date().toISOString()}
// No external dependencies found in project: ${this.projectRoot}
// Platform: ${platform}

// Mock implementations for common dependencies
export const libp2pLogger = {
  info: (...args) => console.log('[libp2p]', ...args),
  warn: (...args) => console.warn('[libp2p]', ...args),
  error: (...args) => console.error('[libp2p]', ...args),
  debug: (...args) => console.debug('[libp2p]', ...args),
  trace: (...args) => console.trace('[libp2p]', ...args)
};

export const react = {
  createElement: (...args) => {
    console.warn('⚠️ Using React mock - install react package for full functionality');
    return { type: 'mock-element', props: args[1], children: args[2] };
  },
  useState: (initial) => [initial, () => {}],
  useEffect: (fn, deps) => fn(),
  useRef: (initial) => ({ current: initial })
};

export const VENDOR_INFO = {
  generatedAt: '${new Date().toISOString()}',
  dependencies: [],
  totalDependencies: 0,
  buildType: 'fallback-vendor',
  platform: '${platform}',
  usingMocks: true
};

export const VENDOR_STATUS = {
  initialized: true,
  timestamp: Date.now(),
  dependenciesLoaded: 0,
  usingFallback: true
};

// Utility functions
export function hasDependency(name) {
  return false;
}

export function getDependencyInfo(name) {
  return { available: false };
}

// Fallback initialization
console.warn('⚠️ Using fallback vendor index - no external dependencies found in package.json or source files');

export default {
  VENDOR_INFO,
  VENDOR_STATUS,
  hasDependency,
  getDependencyInfo,
  libp2pLogger,
  react
};
`;
    }

    async saveVendorIndex(content: string, platform: Platform = 'browser'): Promise<string> {
        // Используем ту же директорию, что и для vendor bundle
        const outputDir = platform === 'node' ? './dist/node' : './dist/browser';
        const vendorDir = `${outputDir}/vendor`;
        const indexPath = `${vendorDir}/index.js`;

        FileUtils.ensureDir(vendorDir);
        FileUtils.writeFile(indexPath, content);

        console.log(`📁 Vendor directory: ${vendorDir}`);
        console.log(`📄 Vendor index saved: ${indexPath}`);
        console.log(`🎯 Platform: ${platform}`);
        console.log(`📏 File size: ${(content.length / 1024).toFixed(2)} KB`);

        return indexPath;
    }

    async saveVendorIndexToDir(content: string, outputDir: string, platform: Platform = 'browser'): Promise<string> {
        const vendorDir = `${outputDir}/vendor`;
        const indexPath = `${vendorDir}/index.js`;

        FileUtils.ensureDir(vendorDir);
        FileUtils.writeFile(indexPath, content);

        console.log(`📁 Vendor directory: ${vendorDir}`);
        console.log(`📄 Vendor index saved: ${indexPath}`);
        console.log(`🎯 Platform: ${platform}`);
        console.log(`📏 File size: ${(content.length / 1024).toFixed(2)} KB`);

        return indexPath;
    }

    async generateAndSave(dependencies: Map<string, VendorDependency>, platform: Platform = 'browser'): Promise<{
        indexPath: string;
        content: string;
        dependenciesCount: number;
    }> {
        const content = await this.generateVendorIndex(dependencies, platform);
        const indexPath = await this.saveVendorIndex(content, platform);

        return {
            indexPath,
            content,
            dependenciesCount: dependencies.size
        };
    }
}