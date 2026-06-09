import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultConfig = {
    "directories": [
        {
            "id": "10",
            "name": "Directory/10",
            "description": "Пользовательская документация: проектные описания, инструкции, чек-листы",
            "description_en": "User documentation: project descriptions, instructions, checklists",
            "required": false,
            "excluded": false
        },
        {
            "id": "11",
            "name": "Directory/11",
            "description": "Пользовательские функции: скрипты, расширения, пользовательские утилиты",
            "description_en": "User functions: scripts, extensions, user utilities",
            "required": false,
            "excluded": true
        },
        {
            "id": "12",
            "name": "Directory/12",
            "description": "Пользовательские файлы: исходники, шаблоны, проекты, пользовательские данные",
            "description_en": "User files: sources, templates, projects, user data",
            "required": false,
            "excluded": true
        }
    ],
    "excludePatterns": {
        "directories": [
            "cache", ".github", ".idea", "node_modules", ".git",
            "dist", "build", "coverage", ".nyc_output", "__pycache__", ".cache", "logs"
        ],
        "files": [
            "README.md", "LICENSE.md", "package-lock.json", "yarn.lock",
            "pnpm-lock.yaml", ".DS_Store", "Thumbs.db", "*.log", "*.tmp", "*.swp"
        ]
    },
    "scanOptions": {
        "recursive": true,
        "followSymlinks": false,
        "maxDepth": 100,
        "excludeExcludedDirs": true,
        "respectExcludePatterns": true
    },
    "output": {
        "fileName": "./fs/fs.json",
        "prettyPrint": true,
        "includeMetadata": true
    },
    "report": {
        "enabled": true,
        "path": "./logs/scan_report.log",
        "append": false,
        "includeTimestamp": true,
        "includeSystemInfo": true,
        "language": "russian"
    },
    "supportedExtensions": [
        ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".vue", ".json",
        ".css", ".html", ".md", ".txt", ".py", ".java", ".go", ".c", ".h"
    ],
    "specialFiles": [
        "Dockerfile", "Makefile", ".gitmodules", ".env"
    ],
    "madge": {
        "description": "Конфигурация для сканера зависимостей madge",
        "defaults": {
            "targetDir": "./Directory/11/deepseek",
            "entryFile": "chatMonitor.js",
            "depth": "all",
            "outputJsonDir": "./fs",
            "svgOutputDir": "./fs",
            "outputFileName": "dependency.json",
            "svgFileName": "dependency.svg"
        },
        "presets": {
            "deps-only": {
                "description": "Только анализ зависимостей (без визуализации)",
                "args": {
                    "svg": false,
                    "depth": "all",
                    "output-name": "dependency.json"
                }
            },
            "svg-only": {
                "description": "Только генерация SVG графа зависимостей",
                "args": {
                    "svg": true,
                    "depth": "2",
                    "output-name": "dependency.json",
                    "svg-name": "dependency.svg"
                }
            },
            "quick": {
                "description": "Быстрое сканирование (глубина 1, без npm)",
                "args": {
                    "depth": "1",
                    "include-npm": false,
                    "svg": false,
                    "output-name": "dependency.json"
                }
            },
            "deep": {
                "description": "Глубокое сканирование с визуализацией",
                "args": {
                    "depth": "all",
                    "include-npm": true,
                    "svg": true,
                    "output-name": "dependency.json",
                    "svg-name": "dependency.svg"
                }
            },
            "with-npm": {
                "description": "Сканирование с включением npm зависимостей",
                "args": {
                    "include-npm": true,
                    "depth": "3",
                    "output-name": "dependency.json"
                }
            },
            "circular-only": {
                "description": "Только поиск циклических зависимостей",
                "args": {
                    "circular-only": true,
                    "svg": false,
                    "depth": "all",
                    "output-name": "circular_dependencies.json"
                }
            },
            "visualize": {
                "description": "Полная визуализация (SVG + граф)",
                "args": {
                    "svg": true,
                    "depth": "3",
                    "include-npm": false,
                    "output-name": "dependency.json",
                    "svg-name": "dependency.svg"
                }
            },
            "minimal": {
                "description": "Минимальное сканирование (быстрое, без лишнего)",
                "args": {
                    "depth": "1",
                    "svg": false,
                    "include-npm": false,
                    "output-name": "dependency.json"
                }
            },
            "full": {
                "description": "Полное сканирование (всё включено)",
                "args": {
                    "depth": "all",
                    "include-npm": true,
                    "svg": true,
                    "output-name": "dependency.json",
                    "svg-name": "dependency.svg"
                }
            }
        },
        "cli": {
            "defaultPreset": "deps-only",
            "mergeStrategy": "override"
        }
    }
};

const configPath = path.join(__dirname, 'config.json');

if (fs.existsSync(configPath)) {
    console.warn('⚠️  Файл config.json уже существует!');
    console.log('💡 Для перезаписи удалите его вручную и запустите скрипт снова.');
    console.log(`📁 Путь: ${configPath}`);
} else {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    console.log('✅ Создан файл конфигурации: config.json');
    console.log('📁 Путь:', configPath);
    console.log('📝 Вы можете отредактировать его под свои нужды.');
}