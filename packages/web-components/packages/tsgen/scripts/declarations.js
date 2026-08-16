#!/usr/bin/env node

import { unlinkSync, rmSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, relative, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FixedDeclarationCollector {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.sourceDirs = options.sourceDirs || ['src', 'lib', 'packages'];
        this.outputDir = options.outputDir || join(this.projectRoot, 'declarations');
        this.excludePatterns = options.excludePatterns || [
            'node_modules',
            'dist',
            'build',
            'coverage',
            'declarations',
            '**/*.test.*',
            '**/*.spec.*',
            '**/__tests__/**',
            '**/__mocks__/**'
        ];
        this.verbose = options.verbose || false;
        this.autoGenerate = options.autoGenerate !== false;
        this.stats = {
            filesFound: 0,
            filesCopied: 0,
            filesGenerated: 0,
            directoriesCreated: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    async collectAllDeclarations() {
        console.log('📦 Collecting TypeScript declaration files...\n');
        console.log(`📁 Project root: ${this.projectRoot}`);
        console.log(`📁 Output directory: ${relative(this.projectRoot, this.outputDir)}`);
        console.log(`🔍 Source directories: ${this.sourceDirs.join(', ')}`);

        // Создаем выходную директорию
        this.ensureDirectory(this.outputDir);

        console.log('ℹ️ Generating declarations...');
        await this.generateDeclarations();
    }

    async generateDeclarations() {
        console.log('\n🔨 Generating TypeScript declarations...');

        try {
            // Создаем временный tsconfig для генерации деклараций
            const tempTsConfig = {
                compilerOptions: {
                    declaration: true,
                    declarationMap: true,
                    emitDeclarationOnly: true,
                    outDir: './declarations',
                    rootDir: './src',
                    strict: true,
                    skipLibCheck: true,
                    sourceMap: true,
                    incremental: false,
                    tsBuildInfoFile: undefined
                },
                include: ['src/**/*'],
                exclude: ['node_modules', 'dist', 'test', '**/*.test.*', 'declarations']
            };

            const tempConfigPath = join(this.projectRoot, 'tsconfig.declarations.json');

            if (this.verbose) {
                console.log(`   📄 Creating temporary config: ${relative(this.projectRoot, tempConfigPath)}`);
            }

            writeFileSync(tempConfigPath, JSON.stringify(tempTsConfig, null, 2));

            // Используем TypeScript компилятор
            const { execSync } = await import('child_process');

            try {
                // Очищаем целевую директорию перед генерацией
                this.cleanDeclarationsDirectory();

                if (this.verbose) {
                    console.log('   🔧 Running TypeScript compiler for declarations...');
                }

                execSync('npx tsc --project tsconfig.declarations.json', {
                    cwd: this.projectRoot,
                    stdio: this.verbose ? 'inherit' : 'pipe'
                });

                // Проверяем результат генерации
                this.validateGeneratedDeclarations();

            } catch (error) {
                console.log('   ❌ TypeScript compilation failed:', error.message);
            } finally {
                // Удаляем временный конфиг
                if (existsSync(tempConfigPath)) {
                    unlinkSync(tempConfigPath);

                    if (this.verbose) {
                        console.log('   🗑️  Temporary config cleaned up');
                    }
                }
            }

        } catch (error) {
            console.log('   ❌ Declaration generation failed:', error.message);
        }
    }

    /**
     * Проверяет сгенерированные декларации
     */
    validateGeneratedDeclarations() {
        const declarationsDir = join(this.projectRoot, 'declarations');

        if (!existsSync(declarationsDir)) {
            console.log('   ⚠️  Declarations directory was not created');
            return;
        }

        // Ищем сгенерированные файлы
        const dtsFiles = this.findDeclarationFiles(declarationsDir, /\.d\.ts$/);
        const dtsMapFiles = this.findDeclarationFiles(declarationsDir, /\.d\.ts\.map$/);

        console.log(`   📊 Generated: ${dtsFiles.length} .d.ts files, ${dtsMapFiles.length} .d.ts.map files`);

        if (dtsFiles.length === 0) {
            console.log('   ⚠️  No .d.ts files were generated');
        } else if (this.verbose) {
            console.log('   📝 Generated declaration files:');
            dtsFiles.forEach(file => {
                const relativePath = relative(this.projectRoot, file);
                console.log(`     • ${relativePath}`);
            });
        }

        if (dtsMapFiles.length === 0) {
            console.log('   ⚠️  No .d.ts.map files were generated');
        } else if (this.verbose) {
            console.log('   🗺️  Generated declaration map files:');
            dtsMapFiles.forEach(file => {
                const relativePath = relative(this.projectRoot, file);
                console.log(`     • ${relativePath}`);
            });
        }
    }

    /**
     * Находит файлы деклараций в директории
     */
    findDeclarationFiles(dir, pattern) {
        const files = [];

        const scanDirectory = (currentDir) => {
            if (!existsSync(currentDir)) return;

            try {
                const items = readdirSync(currentDir, { withFileTypes: true });

                for (const item of items) {
                    const fullPath = join(currentDir, item.name);

                    if (item.isDirectory()) {
                        scanDirectory(fullPath);
                    } else if (item.isFile() && pattern.test(item.name)) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️  Error scanning directory ${currentDir}: ${error.message}`);
            }
        };

        scanDirectory(dir);
        return files;
    }

    /**
     * Очищает директорию declarations перед генерацией
     */
    cleanDeclarationsDirectory() {
        const declarationsDir = join(this.projectRoot, 'declarations');

        if (existsSync(declarationsDir)) {
            try {
                rmSync(declarationsDir, { recursive: true, force: true });
                if (this.verbose) {
                    console.log('   🧹 Cleared declarations directory');
                }
            } catch (error) {
                console.log('   ⚠️  Could not clear declarations directory:', error.message);
            }
        }

        // Создаем чистую директорию
        mkdirSync(declarationsDir, { recursive: true });
    }

    ensureDirectory(path) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
            this.stats.directoriesCreated++;
            if (this.verbose) {
                console.log(`   📁 Created directory: ${relative(this.projectRoot, path)}`);
            }
        }
    }
}

// CLI обработчик
async function main() {
    const args = process.argv.slice(2);
    const options = {};

    // Парсим аргументы командной строки
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                showHelp();
                return;

            case '--verbose':
            case '-v':
                options.verbose = true;
                break;

            case '--output':
            case '-o':
                options.outputDir = args[++i];
                break;

            case '--source':
            case '-s':
                const sources = args[++i].split(',').map(s => s.trim());
                options.sourceDirs = sources;
                break;

            case '--no-generate':
                options.autoGenerate = false;
                break;

            case '--project-root':
                options.projectRoot = args[++i];
                break;
        }
    }

    const collector = new FixedDeclarationCollector(options);
    await collector.collectAllDeclarations();
}

function showHelp() {
    console.log(`
📦 Fixed TypeScript Declaration Files Collector

Утилита для сбора всех .d.ts файлов проекта без рекурсивных проблем.

ИСПОЛЬЗОВАНИЕ:
  npx collect-declarations [options]

ОПЦИИ:
  -h, --help                    Показать эту справку
  -v, --verbose                 Подробный вывод
  -o, --output <dir>            Выходная директория (по умолчанию: ./declarations)
  -s, --source <dirs>           Исходные директории через запятую
  --no-generate                 Не генерировать декларации автоматически
  --project-root <path>         Корневая директория проекта

ПРИМЕРЫ:
  # Автоматическая сборка с генерацией
  npx collect-declarations

  # Только сборка существующих файлов
  npx collect-declarations --no-generate

  # Подробный вывод
  npx collect-declarations --verbose
    `.trim());
}

// Запуск
main().catch(console.error);

export { FixedDeclarationCollector };