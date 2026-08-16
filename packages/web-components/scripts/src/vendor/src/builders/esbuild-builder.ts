import * as esbuild from 'esbuild';
import type { BundleConfig, BuildResult } from '../core/types';
import { dirname } from 'path'
export class ESBuildBuilder {
    async build(config: BundleConfig): Promise<BuildResult> {
        const startTime = Date.now();

        try {
            const buildConfig: esbuild.BuildOptions = {
                entryPoints: [config.entryPoint],
                outfile: config.outfile,
                bundle: true,
                platform: config.platform,
                format: config.format,
                minify: config.minify,
                sourcemap: config.sourcemap,
                external: config.external ? [...config.external] : undefined,
                target: 'es2022',
                treeShaking: true,
                metafile: true,
                write: true,
                // Браузерные настройки
                ...(config.platform === 'browser' && {
                    supported: {
                        'dynamic-import': true,
                        'import-meta': true
                    }
                }),
                // Node.js настройки
                ...(config.platform === 'node' && {
                    banner: {
                        js: `// Built for Node.js ${process.version}\\n// Platform: ${process.platform}-${process.arch}\\n`
                    }
                }),
                // Настройки для CJS
                ...(config.format === 'cjs' && {
                    banner: {
                        js: `// CommonJS Bundle\\n'use strict';\\n`
                    }
                })
            };

            console.log(`🔨 Building ${config.platform} bundle (${config.format})...`);
            console.log(`   Entry: ${config.entryPoint}`);
            console.log(`   Output: ${config.outfile}`);
            console.log(`   Minify: ${config.minify}, Sourcemap: ${config.sourcemap}`);

            const result = await esbuild.build(buildConfig);
            const duration = Date.now() - startTime;

            // Анализ метаданных сборки
            const stats = this.analyzeBuildResult(result, duration);

            return {
                success: true,
                outputPath: config.outfile,
                stats
            };
        } catch (error) {
            console.error('❌ ESBuild build failed:', error);

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown build error'
            };
        }
    }

    private analyzeBuildResult(result: esbuild.BuildResult, duration: number) {
        const inputs = Object.keys(result.metafile?.inputs || {});
        const outputs = Object.keys(result.metafile?.outputs || {});

        let totalSize = 0;
        let entryPointSize = 0;

        // Расчет размеров
        if (result.metafile) {
            for (const output of Object.values(result.metafile.outputs)) {
                totalSize += output.bytes;
                // Определяем размер основного entry point
                if ((output as any).entryPoint) {
                    entryPointSize = output.bytes;
                }
            }
        }

        return {
            size: totalSize,
            entryPointSize,
            duration,
            dependencies: inputs.length,
            outputFiles: outputs,
            inputFiles: inputs,
            inputs: inputs.map(input => ({
                file: input,
                size: (result.metafile?.inputs as any)?.[input]?.bytes || 0
            })),
            outputs: outputs.map(output => ({
                file: output,
                size: (result.metafile?.outputs as any)?.[output]?.bytes || 0
            }))
        };
    }

    private calculateOutputSize(metafile: esbuild.Metafile): number {
        return Object.values(metafile.outputs).reduce(
            (total, output) => total + output.bytes,
            0
        );
    }

    // Специализированные методы для разных платформ
    async buildBrowserBundle(config: Omit<BundleConfig, 'platform' | 'format'>): Promise<BuildResult> {
        return this.build({
            ...config,
            platform: 'browser',
            format: 'esm'
        });
    }

    async buildNodeBundle(config: Omit<BundleConfig, 'platform' | 'format'>): Promise<BuildResult> {
        return this.build({
            ...config,
            platform: 'node',
            format: 'esm'
        });
    }

    async buildNodeCJS(config: Omit<BundleConfig, 'platform' | 'format'>): Promise<BuildResult> {
        return this.build({
            ...config,
            platform: 'node',
            format: 'cjs'
        });
    }

    // Watch mode для разработки
    async watch(config: BundleConfig, _onRebuild?: (result: BuildResult) => void): Promise<() => void> {
        const buildConfig: esbuild.BuildOptions = {
            entryPoints: [config.entryPoint],
            outfile: config.outfile,
            bundle: true,
            platform: config.platform,
            format: config.format,
            minify: config.minify,
            sourcemap: config.sourcemap,
            external: config.external ? [...config.external] : undefined,
            target: 'es2022',
            treeShaking: true,
            metafile: true,
            write: true,
        };

        try {
            const context = await esbuild.context(buildConfig);

            await context.watch();
            console.log(`👀 Watching for changes: ${config.entryPoint}`);

            // Возвращаем функцию для остановки watch
            return () => {
                context.dispose();
                console.log('🛑 Watch mode stopped');
            };
        } catch (error) {
            console.error('❌ Failed to start watch mode:', error);
            throw error;
        }
    }

    // Serve mode для разработки
    async serve(config: BundleConfig, serveOptions?: { port?: number; host?: string }): Promise<() => void> {
        const buildConfig: esbuild.BuildOptions = {
            entryPoints: [config.entryPoint],
            outfile: config.outfile,
            bundle: true,
            platform: config.platform,
            format: config.format,
            minify: config.minify,
            sourcemap: config.sourcemap,
            external: config.external ? [...config.external] : undefined,
            target: 'es2022',
            treeShaking: true,
            metafile: true,
            write: true,
        };

        const serveConfig: esbuild.ServeOptions = {
            port: serveOptions?.port || 3000,
            servedir: dirname(config.outfile)
        };

        try {
            const context = await esbuild.context(buildConfig);
            const { port } = await context.serve(serveConfig);

            console.log(`🌐 Serving at http://localhost:${port}`);
            console.log(`   Serving from: ${serveConfig.servedir}`);

            // Возвращаем функцию для остановки сервера
            return () => {
                context.dispose();
                console.log('🛑 Server stopped');
            };
        } catch (error) {
            console.error('❌ Failed to start server:', error);
            throw error;
        }
    }

    // Анализ бандла без сборки
    async analyze(config: BundleConfig): Promise<{
        dependencies: string[];
        sizeEstimate: number;
        warnings: string[];
    }> {
        try {
            const buildConfig: esbuild.BuildOptions = {
                entryPoints: [config.entryPoint],
                outfile: config.outfile,
                bundle: true,
                platform: config.platform,
                format: config.format,
                minify: config.minify,
                sourcemap: config.sourcemap,
                external: config.external ? [...config.external] : undefined,
                target: 'es2022',
                treeShaking: true,
                write: false,
                metafile: true
            };

            const result = await esbuild.build(buildConfig);

            const dependencies = new Set<string>();
            const warnings: string[] = [];

            // Анализ входных файлов
            if (result.metafile) {
                for (const [inputPath] of Object.entries(result.metafile.inputs)) {
                    if (inputPath.includes('node_modules')) {
                        const pkgMatch = inputPath.match(/node_modules\/(@[^\/]+\/[^\/]+|[^\/]+)/);
                        if (pkgMatch && pkgMatch[1]) {
                            dependencies.add(pkgMatch[1]);
                        }
                    }
                }
            }

            // Проверка предупреждений
            if (result.warnings.length > 0) {
                warnings.push(...result.warnings.map(w => w.text));
            }

            return {
                dependencies: Array.from(dependencies),
                sizeEstimate: this.calculateOutputSize(result.metafile!),
                warnings
            };
        } catch (error) {
            console.error('❌ Bundle analysis failed:', error);
            throw error;
        }
    }
}