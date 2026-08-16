/**
 * Excluded Packages Configuration
 * Centralized configuration for packages that should be excluded from vendor bundles
 */

export const EXCLUDED_PACKAGES = {
    // Always excluded (both browser and node)
    always: [
        '@types/*',
        'node:*',
        'fs', 'path', 'url', 'child_process', 'os', 'crypto', 'http', 'https',
        'net', 'dns', 'util', 'stream', 'buffer', 'events', 'module', 'assert',
        'querystring', 'zlib', 'tls', 'cluster', 'vm', 'perf_hooks', 'readline',
        'repl', 'timers', 'string_decoder', 'worker_threads'
    ],

    // Browser-only exclusions (Node.js specific packages)
    browser: [
        'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
        'jest', 'mocha', 'chai', 'ava', 'tape',
        'nodemon', 'pm2', 'forever',
        'sass', 'less', 'stylus', 'postcss',
        'fs-extra', 'chokidar'
    ],

    // Node.js-only exclusions (build tools and dev dependencies)
    node: [
        'esbuild', 'typescript', 'webpack', 'rollup', 'vite',
        'jest', 'mocha', 'chai', 'ava', 'tape',
        'nodemon', 'pm2', 'forever',
        'sass', 'less', 'stylus', 'postcss',
        'fs-extra', 'chokidar'
    ]
} as const;

/**
 * Check if a package should be excluded from vendor bundle
 */
export function isPackageExcluded(packageName: string, platform: 'browser' | 'node'): boolean {
    // Check always excluded patterns
    for (const pattern of EXCLUDED_PACKAGES.always) {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            if (regex.test(packageName)) return true;
        } else if (packageName === pattern) {
            return true;
        }
    }

    // Check platform-specific exclusions
    const platformExclusions = EXCLUDED_PACKAGES[platform];
    for (const pattern of platformExclusions) {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            if (regex.test(packageName)) return true;
        } else if (packageName === pattern) {
            return true;
        }
    }

    return false;
}

/**
 * Get list of excluded packages for a specific platform
 */
export function getExcludedPackages(platform: 'browser' | 'node'): string[] {
    return [
        ...EXCLUDED_PACKAGES.always,
        ...EXCLUDED_PACKAGES[platform]
    ];
}

/**
 * Filter dependencies map to remove excluded packages
 */
export function filterExcludedDependencies<T>(
    dependencies: Map<string, T>,
    platform: 'browser' | 'node'
): Map<string, T> {
    const filtered = new Map<string, T>();

    for (const [pkgName, dep] of dependencies) {
        if (!isPackageExcluded(pkgName, platform)) {
            filtered.set(pkgName, dep);
        }
    }

    return filtered;
}

/**
 * Log excluded packages for debugging
 */
export function logExcludedPackages(dependencies: Map<string, unknown>, platform: 'browser' | 'node'): void {
    const excluded: string[] = [];

    for (const [pkgName] of dependencies) {
        if (isPackageExcluded(pkgName, platform)) {
            excluded.push(pkgName);
        }
    }

    if (excluded.length > 0) {
        console.log(`🚫 Excluded ${excluded.length} packages from ${platform} vendor bundle:`);
        excluded.forEach(pkg => console.log(`   - ${pkg}`));
    }
}