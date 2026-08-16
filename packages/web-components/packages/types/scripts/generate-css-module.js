#!/usr/bin/env node

import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync, readdirSync } from 'fs';
import { join, dirname, relative, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CSSModuleGenerator {
    constructor() {
        this.projectRoot = process.cwd();
        this.distDir = join(this.projectRoot, 'dist');
        this.srcDir = join(this.projectRoot, 'src');
        this.htmlFiles = [];
    }

    async generate(options = {}) {
        console.log('🎨 Генерация CSS модуля...');

        this.ensureDirectory(this.distDir);

        // Ищем HTML файлы если включен флаг
        if (options.checkHtml) {
            this.htmlFiles = await this.findHTMLFiles();
            console.log(`📄 Найдено HTML файлов: ${this.htmlFiles.length}`);
        }

        const cssBundler = new CSSBundler(this.projectRoot);

        try {
            // Ищем CSS файлы
            const cssFiles = await cssBundler.findCSSFiles(this.srcDir);

            if (cssFiles.length === 0) {
                console.log('❌ CSS файлы не найдены');
                return;
            }

            console.log(`📁 Найдено ${cssFiles.length} CSS файлов:`);
            cssFiles.forEach(file => console.log(`   - ${relative(this.projectRoot, file)}`));

            // Обрабатываем CSS файлы
            await cssBundler.processCSSFiles(cssFiles);

            // Генерируем TypeScript модуль
            const tsModule = this.generateTSModule(cssBundler);

            // Генерируем JavaScript модуль
            const jsModule = this.generateJSModule(cssBundler);

            // Сохраняем модули
            writeFileSync(join(this.distDir, 'virtual-css.ts'), tsModule);
            writeFileSync(join(this.distDir, 'virtual-css.js'), jsModule);

            // Создаем package.json для ESM
            writeFileSync(join(this.distDir, 'virtual-css.mjs'), jsModule);

            // Создаем CommonJS версию (упрощенную)
            const cjsModule = this.generateSimpleCJSModule(cssBundler);
            writeFileSync(join(this.distDir, 'virtual-css.cjs'), cjsModule);

            console.log('\n✅ CSS модуль создан:');
            console.log(`   📄 dist/virtual-css.ts    (TypeScript)`);
            console.log(`   📄 dist/virtual-css.js    (ES Module)`);
            console.log(`   📄 dist/virtual-css.mjs   (ES Module)`);
            console.log(`   📄 dist/virtual-css.cjs   (CommonJS)`);

            // Добавляем importmap в HTML файлы если нужно
            if (options.checkHtml && this.htmlFiles.length > 0) {
                await this.addImportMapToHTML(options);
            }

            // Показываем статистику
            this.showStats(cssBundler);

        } catch (error) {
            console.error('❌ Ошибка генерации CSS модуля:', error);
            process.exit(1);
        }
    }

    async findHTMLFiles() {
        const htmlFiles = [];
        const projectRoot = this.projectRoot;

        // Функция для поиска HTML файлов ТОЛЬКО в dist
        const scanDirectory = (dir) => {
            try {
                if (!existsSync(dir)) {
                    return;
                }

                const entries = readdirSync(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(dir, entry.name);

                    if (entry.isDirectory()) {
                        // Рекурсивно сканируем только dist
                        if (dir.includes('/dist') || dir.includes('\\dist')) {
                            scanDirectory(fullPath);
                        }
                    } else if (entry.isFile() && extname(entry.name) === '.html') {
                        const relativePath = relative(projectRoot, fullPath);
                        // Только файлы в dist/
                        if (fullPath.includes('/dist/') || fullPath.includes('\\dist\\')) {
                            htmlFiles.push({
                                path: fullPath,
                                relativePath: relativePath
                            });
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Не удалось просканировать директорию ${dir}:`, error.message);
            }
        };

        // Сканируем только dist папку
        scanDirectory(this.distDir);

        return htmlFiles;
    }

    async addImportMapToHTML(options) {
        console.log('\n📝 Добавление importmap в HTML файлы...');

        let updatedCount = 0;
        let skippedCount = 0;

        for (const htmlFile of this.htmlFiles) {
            try {
                const content = readFileSync(htmlFile.path, 'utf-8');

                // Проверяем, есть ли тег head
                if (!content.includes('</head>')) {
                    console.log(`   ⚠️  ${htmlFile.relativePath}: нет закрывающего тега </head>`);
                    skippedCount++;
                    continue;
                }

                // Генерируем наш importmap
                const ourImportMap = this.generateOurImportMap();

                // Проверяем, есть ли уже importmap в файле
                const existingImportMap = this.extractExistingImportMap(content);

                if (existingImportMap) {
                    // Объединяем существующий importmap с нашим
                    const mergedImportMap = this.mergeImportMaps(existingImportMap, ourImportMap);

                    if (mergedImportMap !== existingImportMap) {
                        // Заменяем существующий importmap на объединенный
                        const updatedContent = content.replace(existingImportMap, mergedImportMap);
                        writeFileSync(htmlFile.path, updatedContent, 'utf-8');
                        console.log(`   🔄 ${htmlFile.relativePath}: importmap объединен с существующим`);
                        updatedCount++;
                    } else {
                        console.log(`   ⚠️  ${htmlFile.relativePath}: importmap для virtual:css уже существует`);
                        skippedCount++;
                    }
                } else {
                    // Вставляем новый importmap перед закрывающим </head>
                    const updatedContent = content.replace(
                        '</head>',
                        `\n    ${ourImportMap}\n</head>`
                    );

                    writeFileSync(htmlFile.path, updatedContent, 'utf-8');
                    console.log(`   ✅ ${htmlFile.relativePath}: importmap добавлен`);
                    updatedCount++;
                }

            } catch (error) {
                console.error(`   ❌ Ошибка обновления ${htmlFile.relativePath}:`, error.message);
                skippedCount++;
            }
        }

        console.log(`   📊 Результат: ${updatedCount} обновлено, ${skippedCount} пропущено, всего ${this.htmlFiles.length}`);
    }

    extractExistingImportMap(content) {
        // Ищем script type="importmap" в head
        const importMapRegex = /<script\s+type="importmap"[^>]*>([\s\S]*?)<\/script>/i;
        const match = content.match(importMapRegex);

        if (match) {
            // Возвращаем полный script тег
            return match[0];
        }

        return null;
    }

    mergeImportMaps(existingImportMap, ourImportMap) {
        try {
            // Извлекаем JSON из существующего importmap
            const existingJsonMatch = existingImportMap.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (!existingJsonMatch) return existingImportMap;

            const existingJsonStr = existingJsonMatch[1];
            const existingObj = JSON.parse(existingJsonStr.trim());

            // Извлекаем JSON из нашего importmap
            const ourJsonMatch = ourImportMap.match(/<script[^>]*>([\s\S]*?)<\/script>/);
            if (!ourJsonMatch) return existingImportMap;

            const ourJsonStr = ourJsonMatch[1];
            const ourObj = JSON.parse(ourJsonStr.trim());

            // Объединяем imports
            if (!existingObj.imports) {
                existingObj.imports = {};
            }

            // Проверяем, нет ли уже virtual:css
            if (existingObj.imports['virtual:css']) {
                console.log(`   ℹ️  virtual:css уже существует в importmap`);
                return existingImportMap;
            }

            // Добавляем наш virtual:css
            existingObj.imports['virtual:css'] = ourObj.imports['virtual:css'];

            // Объединяем scopes
            if (ourObj.scopes) {
                if (!existingObj.scopes) {
                    existingObj.scopes = {};
                }

                Object.keys(ourObj.scopes).forEach(scope => {
                    if (!existingObj.scopes[scope]) {
                        existingObj.scopes[scope] = {};
                    }
                    Object.assign(existingObj.scopes[scope], ourObj.scopes[scope]);
                });
            }

            // Форматируем обратно в JSON
            const mergedJson = JSON.stringify(existingObj, null, 2);

            // Создаем новый script тег
            return `<script type="importmap">
${mergedJson}
</script>`;

        } catch (error) {
            console.error(`   ⚠️  Ошибка объединения importmap: ${error.message}, будет заменен`);
            return ourImportMap;
        }
    }

    generateOurImportMap() {
        // virtual-css.mjs в той же папке что и HTML (dist/)
        const cssModulePath = './virtual-css.mjs';

        return `<script type="importmap">
{
  "imports": {
    "virtual:css": "${cssModulePath}"
  },
  "scopes": {
    "./": {
      "virtual:css": "${cssModulePath}"
    }
  }
}
</script>`;
    }

    generateTSModule(cssBundler) {
        const cssBundle = cssBundler.generateCSSBundle();
        const cssPaths = Array.from(cssBundler.cssContent.keys());
        const componentMap = Object.fromEntries(cssBundler.componentCSSMap);

        return `
// TypeScript модуль virtual:css
// Автоматически сгенерирован ${new Date().toISOString()}

export interface CSSModule {
    injectCSS(): void;
    getCSSByPath(filePath: string): string | null;
    getCSSForComponent(componentName: string): string | null;
    getAllCSS(): string;
    getCSSPaths(): string[];
    getMultipleCSS(paths: string[]): string;
    getComponentCSSMap(): Record<string, string[]>;
}

const cssContent = ${JSON.stringify(cssBundle, null, 2)};
const cssPaths = ${JSON.stringify(cssPaths, null, 2)};
const componentCSSMap = ${JSON.stringify(componentMap, null, 2)};

export function getCSSByPath(filePath: string): string | null {
    const normalizedPath = filePath.replace(/\\\\/g, "/");
    const entry = cssPaths.find(path => path.replace(/\\\\/g, "/").includes(normalizedPath));
    
    if (entry) {
        const startMarker = "/* " + entry + " */";
        const startIndex = cssContent.indexOf(startMarker) + startMarker.length;
        let endIndex = cssContent.length;
        
        for (let i = cssPaths.indexOf(entry) + 1; i < cssPaths.length; i++) {
            const nextMarker = "/* " + cssPaths[i] + " */";
            const nextIndex = cssContent.indexOf(nextMarker);
            if (nextIndex !== -1) {
                endIndex = nextIndex;
                break;
            }
        }
        
        return cssContent.substring(startIndex, endIndex).trim();
    }
    return null;
}

export function getCSSForComponent(componentName: string): string | null {
    const componentPaths = componentCSSMap[componentName];
    if (!componentPaths) return null;
    
    return componentPaths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

export function getAllCSS(): string {
    return cssContent;
}

export function injectCSS(): void {
    if (typeof document !== "undefined") {
        const style = document.createElement("style");
        style.textContent = cssContent;
        document.head.appendChild(style);
    }
}

export function getCSSPaths(): string[] {
    return cssPaths;
}

export function getMultipleCSS(paths: string[]): string {
    return paths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

export function getComponentCSSMap(): Record<string, string[]> {
    return componentCSSMap;
}

export default {
    injectCSS,
    getCSSByPath,
    getCSSForComponent,
    getAllCSS,
    getCSSPaths,
    getMultipleCSS,
    getComponentCSSMap
};
`;
    }

    generateJSModule(cssBundler) {
        const cssBundle = cssBundler.generateCSSBundle();
        const cssPaths = Array.from(cssBundler.cssContent.keys());
        const componentMap = Object.fromEntries(cssBundler.componentCSSMap);

        return `
// JavaScript модуль virtual:css
// Автоматически сгенерирован ${new Date().toISOString()}

const cssContent = ${JSON.stringify(cssBundle)};
const cssPaths = ${JSON.stringify(cssPaths)};
const componentCSSMap = ${JSON.stringify(componentMap)};

export function getCSSByPath(filePath) {
    const normalizedPath = filePath.replace(/\\\\/g, "/");
    const entry = cssPaths.find(path => path.replace(/\\\\/g, "/").includes(normalizedPath));
    
    if (entry) {
        const startMarker = "/* " + entry + " */";
        const startIndex = cssContent.indexOf(startMarker) + startMarker.length;
        let endIndex = cssContent.length;
        
        for (let i = cssPaths.indexOf(entry) + 1; i < cssPaths.length; i++) {
            const nextMarker = "/* " + cssPaths[i] + " */";
            const nextIndex = cssContent.indexOf(nextMarker);
            if (nextIndex !== -1) {
                endIndex = nextIndex;
                break;
            }
        }
        
        return cssContent.substring(startIndex, endIndex).trim();
    }
    return null;
}

export function getCSSForComponent(componentName) {
    const componentPaths = componentCSSMap[componentName];
    if (!componentPaths) return null;
    
    return componentPaths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

export function getAllCSS() {
    return cssContent;
}

export function injectCSS() {
    if (typeof document !== "undefined") {
        const style = document.createElement("style");
        style.textContent = cssContent;
        document.head.appendChild(style);
    }
}

export function getCSSPaths() {
    return cssPaths;
}

export function getMultipleCSS(paths) {
    return paths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

export function getComponentCSSMap() {
    return componentCSSMap;
}

export default {
    injectCSS,
    getCSSByPath,
    getCSSForComponent,
    getAllCSS,
    getCSSPaths,
    getMultipleCSS,
    getComponentCSSMap
};
`;
    }

    generateSimpleCJSModule(cssBundler) {
        const cssBundle = cssBundler.generateCSSBundle();
        const cssPaths = Array.from(cssBundler.cssContent.keys());
        const componentMap = Object.fromEntries(cssBundler.componentCSSMap);

        return `
// CommonJS модуль virtual:css
// Автоматически сгенерирован ${new Date().toISOString()}

const cssContent = ${JSON.stringify(cssBundle)};
const cssPaths = ${JSON.stringify(cssPaths)};
const componentCSSMap = ${JSON.stringify(componentMap)};

function getCSSByPath(filePath) {
    const normalizedPath = filePath.replace(/\\\\/g, "/");
    const entry = cssPaths.find(path => path.replace(/\\\\/g, "/").includes(normalizedPath));
    
    if (entry) {
        const startMarker = "/* " + entry + " */";
        const startIndex = cssContent.indexOf(startMarker) + startMarker.length;
        let endIndex = cssContent.length;
        
        for (let i = cssPaths.indexOf(entry) + 1; i < cssPaths.length; i++) {
            const nextMarker = "/* " + cssPaths[i] + " */";
            const nextIndex = cssContent.indexOf(nextMarker);
            if (nextIndex !== -1) {
                endIndex = nextIndex;
                break;
            }
        }
        
        return cssContent.substring(startIndex, endIndex).trim();
    }
    return null;
}

function getCSSForComponent(componentName) {
    const componentPaths = componentCSSMap[componentName];
    if (!componentPaths) return null;
    
    return componentPaths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

function getAllCSS() {
    return cssContent;
}

function injectCSS() {
    if (typeof document !== "undefined") {
        const style = document.createElement("style");
        style.textContent = cssContent;
        document.head.appendChild(style);
    }
}

function getCSSPaths() {
    return cssPaths;
}

function getMultipleCSS(paths) {
    return paths.map(path => getCSSByPath(path)).filter(Boolean).join("\\n");
}

function getComponentCSSMap() {
    return componentCSSMap;
}

module.exports = {
    injectCSS,
    getCSSByPath,
    getCSSForComponent,
    getAllCSS,
    getCSSPaths,
    getMultipleCSS,
    getComponentCSSMap
};
`;
    }

    showStats(cssBundler) {
        console.log('\n📊 Статистика CSS:');
        console.log(`   Всего CSS файлов: ${cssBundler.cssContent.size}`);
        console.log(`   Компонентов с CSS: ${cssBundler.componentCSSMap.size}`);

        const totalSize = Array.from(cssBundler.cssContent.values())
            .reduce((sum, content) => sum + content.length, 0);
        console.log(`   Общий размер CSS: ${(totalSize / 1024).toFixed(2)} KB`);

        console.log('\n🎯 Компоненты с CSS:');
        cssBundler.componentCSSMap.forEach((paths, component) => {
            const componentSize = paths.reduce((sum, path) => {
                const content = cssBundler.cssContent.get(path);
                return sum + (content ? content.length : 0);
            }, 0);
            console.log(`   - ${component}: ${paths.length} файл(ов), ${(componentSize / 1024).toFixed(2)} KB`);
        });
    }

    ensureDirectory(path) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
    }
}

// Копируем CSSBundler из оригинального скрипта
class CSSBundler {
    constructor(basePath) {
        this.basePath = basePath;
        this.cssContent = new Map();
        this.componentCSSMap = new Map();
    }

    async findCSSFiles(dir) {
        const files = [];

        const scanDirectory = (currentDir) => {
            try {
                const entries = readdirSync(currentDir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = join(currentDir, entry.name);

                    if (entry.isDirectory()) {
                        // Пропускаем node_modules и скрытые папки
                        if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                            scanDirectory(fullPath);
                        }
                    } else if (entry.isFile() && extname(entry.name) === '.css') {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot scan directory ${currentDir}:`, error.message);
            }
        };

        scanDirectory(dir);
        return files;
    }

    async processCSSFiles(cssFiles) {
        for (const filePath of cssFiles) {
            try {
                const content = readFileSync(filePath, 'utf-8');
                const relativePath = relative(this.basePath, filePath);

                this.cssContent.set(relativePath, content);

                // Определяем к какому компоненту относится CSS
                const componentName = this.extractComponentName(relativePath);
                if (componentName) {
                    if (!this.componentCSSMap.has(componentName)) {
                        this.componentCSSMap.set(componentName, []);
                    }
                    this.componentCSSMap.get(componentName).push(relativePath);
                }
            } catch (error) {
                console.warn(`⚠️ Cannot read CSS file ${filePath}:`, error.message);
            }
        }
    }

    extractComponentName(cssPath) {
        const patterns = [
            /components\/([^\/]+)\/css\//,
            /src\/components\/([^\/]+)\/css\//,
            /components\/([^\/]+)\//,
            /([^\/]+)\/css\//
        ];

        for (const pattern of patterns) {
            const match = cssPath.match(pattern);
            if (match) {
                return match[1];
            }
        }

        // Если не нашли паттерн, используем имя директории
        const dirName = dirname(cssPath);
        return basename(dirName);
    }

    generateCSSBundle() {
        let bundle = '/* CSS Bundle - Generated by CSS Module Generator */\n';
        bundle += `/* Generated: ${new Date().toISOString()} */\n\n`;

        for (const [filePath, content] of this.cssContent) {
            bundle += `/* ${filePath} */\n`;
            bundle += content;
            bundle += '\n\n';
        }

        return bundle;
    }
}

// CLI обработчик
async function main() {
    const args = process.argv.slice(2);
    const options = {
        checkHtml: false,
        force: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
            case '-h':
                showHelp();
                return;

            case '--check-html':
            case '--html':
            case '-H':
                options.checkHtml = true;
                break;

            case '--force':
            case '-f':
                options.force = true;
                break;

            default:
                console.warn(`⚠️ Неизвестный аргумент: ${arg}`);
                break;
        }
    }

    console.log('🎨 Конфигурация генератора:');
    console.log(`   Проверка HTML: ${options.checkHtml ? 'Да' : 'Нет'}`);
    console.log(`   Принудительное обновление: ${options.force ? 'Да' : 'Нет'}`);

    const generator = new CSSModuleGenerator();
    await generator.generate(options);
}

function showHelp() {
    console.log(`
🎨 CSS Module Generator

ИСПОЛЬЗОВАНИЕ:
  node scripts/generate-css-module.js [options]

ОПЦИИ:
  -h, --help           Показать эту справку
  -H, --html           Проверить HTML файлы и добавить importmap
  --check-html         Алиас для --html
  -f, --force          Принудительно обновить importmap даже если он уже существует

ПРИМЕРЫ:
  # Генерация CSS модуля без проверки HTML
  node scripts/generate-css-module.js

  # Генерация с добавлением importmap в HTML
  node scripts/generate-css-module.js --html

  # Принудительное обновление importmap
  node scripts/generate-css-module.js --html --force

СОЗДАВАЕМЫЕ ФАЙЛЫ:
  • dist/virtual-css.ts    - TypeScript модуль
  • dist/virtual-css.js    - ES Module
  • dist/virtual-css.mjs   - ES Module с расширением .mjs
  • dist/virtual-css.cjs   - CommonJS модуль

ДОБАВЛЯЕТ В HTML:
  <script type="importmap">
  {
    "imports": {
      "virtual:css": "./virtual-css.mjs"
    },
    "scopes": {
      "./": {
        "virtual:css": "./virtual-css.mjs"
      }
    }
  }
  </script>

  Если уже есть importmap, будет объединен с существующим

ФУНКЦИИ МОДУЛЯ:
  • injectCSS()           - инжектит CSS в документ
  • getCSSForComponent()  - получает CSS для компонента
  • getCSSByPath()        - получает CSS по пути к файлу
  • getAllCSS()           - получает весь CSS
  • getCSSPaths()         - получает пути ко всем CSS файлам
  • getComponentCSSMap()  - получает мапу компонент->CSS файлы
    `.trim());
}

// Запуск
main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

export { CSSModuleGenerator };