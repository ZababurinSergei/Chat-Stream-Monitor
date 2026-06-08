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
            "excluded": false
        },
        {
            "id": "12",
            "name": "Directory/12",
            "description": "Пользовательские файлы: исходники, шаблоны, проекты, пользовательские данные",
            "description_en": "User files: sources, templates, projects, user data",
            "required": false,
            "excluded": false
        }
    ],
    "scanOptions": {
        "recursive": true,
        "followSymlinks": false,
        "maxDepth": 100,
        "excludeExcludedDirs": true
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
        ".css", ".vue", ".src", ".app", ".args", ".erl", ".config",
        ".jsx", ".xml", ".iml", ".java", ".fodt", ".tsx", ".owl",
        ".txt", ".include", ".py", ".mmd", ".coffee", ".wasm", ".map",
        ".gitmodules", ".mod", ".yaml", ".sh", ".sql", ".go", ".c",
        ".h", ".js", ".mjs", ".md", ".json", ".proto", ".ts", ".options"
    ],
    "specialFiles": ["Dockerfile", "Makefile", ".gitmodules", ".env"],
    "descriptions": {
        "10": "Пользовательская документация: проектные описания, инструкции, чек-листы",
        "11": "Пользовательские функции: скрипты, расширения, пользовательские утилиты",
        "12": "Пользовательские файлы: исходники, шаблоны, проекты, пользовательские данные"
    },
    "descriptions_en": {
        "10": "User documentation: project descriptions, instructions, checklists",
        "11": "User functions: scripts, extensions, user utilities",
        "12": "User files: sources, templates, projects, user data"
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