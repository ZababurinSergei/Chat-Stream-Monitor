// FileSystemScanner.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загрузка конфигурации
let config = null;
let directoryConfigs = [];

// Языковые шаблоны
const languageTemplates = {
  russian: {
    reportHeader: 'ОТЧЕТ СКАНИРОВАНИЯ ФАЙЛОВОЙ СИСТЕМЫ',
    scanDate: 'Дата',
    systemInfo: 'СИСТЕМНАЯ ИНФОРМАЦИЯ',
    nodeVersion: 'Node.js версия',
    platform: 'Платформа',
    architecture: 'Архитектура',
    workingDir: 'Рабочая директория',
    additionalScan: 'ДОПОЛНИТЕЛЬНОЕ СКАНИРОВАНИЕ',
    scanStatistics: 'СТАТИСТИКА СКАНИРОВАНИЯ',
    totalDirectories: '📁 Всего директорий в конфигурации',
    excludedFromScan: '🚫 Исключено из сканирования',
    successfullyScanned: '✅ Успешно отсканировано',
    missingWithWarning: '⚠️  Отсутствует (с предупреждением)',
    errors: '❌ Ошибок',
    excludedDirectories: 'ИСКЛЮЧЕННЫЕ ДИРЕКТОРИИ',
    missingDirectories: 'ОТСУТСТВУЮЩИЕ ДИРЕКТОРИИ',
    required: '(обязательная)',
    successfullyScannedDirectories: 'УСПЕШНО ОТСКАНИРОВАННЫЕ ДИРЕКТОРИИ',
    files: 'Файлов',
    endOfReport: 'КОНЕЦ ОТЧЕТА',
    reportSaved: '📄 Отчет сканирования сохранен в',
    reportSize: '📏 Размер отчета',
    reportSavingDisabled: '📄 Сохранение отчета отключено в конфигурации',
    errorSavingReport: '❌ Ошибка при сохранении отчета',
    noDescription: 'Нет описания',
  },
  english: {
    reportHeader: 'FILE SYSTEM SCAN REPORT',
    scanDate: 'Date',
    systemInfo: 'SYSTEM INFORMATION',
    nodeVersion: 'Node.js version',
    platform: 'Platform',
    architecture: 'Architecture',
    workingDir: 'Working directory',
    additionalScan: 'ADDITIONAL SCAN',
    scanStatistics: 'SCAN STATISTICS',
    totalDirectories: '📁 Total directories in config',
    excludedFromScan: '🚫 Excluded from scan',
    successfullyScanned: '✅ Successfully scanned',
    missingWithWarning: '⚠️  Missing (with warning)',
    errors: '❌ Errors',
    excludedDirectories: 'EXCLUDED DIRECTORIES',
    missingDirectories: 'MISSING DIRECTORIES',
    required: '(required)',
    successfullyScannedDirectories: 'SUCCESSFULLY SCANNED DIRECTORIES',
    files: 'Files',
    endOfReport: 'END OF REPORT',
    reportSaved: '📄 Scan report saved to',
    reportSize: '📏 Report size',
    reportSavingDisabled: '📄 Report saving is disabled in configuration',
    errorSavingReport: '❌ Error saving report',
    noDescription: 'No description',
  },
};

// Значения по умолчанию (вынесены в константы, чтобы избежать циклических вызовов)
const DEFAULT_SUPPORTED_EXTENSIONS = [
  '.js',
  '.mjs',
  '.html',
  '.css',
  '.json',
  '.md',
  '.txt',
  '.jsx',
  '.ts',
  '.tsx',
  '.vue',
  '.py',
  '.java',
  '.go',
  '.c',
  '.h',
];

const DEFAULT_SPECIAL_FILES = ['Dockerfile', 'Makefile', '.gitmodules', '.env'];

/**
 * Получает текущий язык из конфигурации
 * @returns {string} текущий язык ('russian' или 'english')
 */
function getCurrentLanguage() {
  const language = config?.report?.language || 'russian';
  return language === 'english' ? 'english' : 'russian';
}

/**
 * Получает локализованную строку
 * @param {string} key - ключ строки
 * @returns {string} локализованная строка
 */
function t(key) {
  const lang = getCurrentLanguage();
  return languageTemplates[lang][key] || languageTemplates.russian[key] || key;
}

/**
 * Получает локализованное описание директории
 * @param {Object} dirConfig - конфигурация директории
 * @returns {string} локализованное описание
 */
function getLocalizedDescription(dirConfig) {
  const lang = getCurrentLanguage();
  if (lang === 'english' && dirConfig.description_en) {
    return dirConfig.description_en;
  }
  return dirConfig.description || t('noDescription');
}

/**
 * Проверяет, должен ли файл или директория быть исключены
 * @param {string} name - имя файла/директории
 * @param {string} type - тип ('file' или 'directory')
 * @param {string} fullPath - полный путь (для проверки вложенных путей)
 * @returns {boolean} true если элемент должен быть исключен
 */
function isExcluded(name, type, fullPath = '') {
  const excludePatterns = config?.excludePatterns || {};
  const respectExcludePatterns =
    config?.scanOptions?.respectExcludePatterns !== false;

  if (!respectExcludePatterns) {
    return false;
  }

  // Проверка исключенных директорий
  const excludedDirs = excludePatterns.directories || [];
  if (type === 'directory') {
    // Точное совпадение имени
    if (excludedDirs.includes(name)) {
      return true;
    }
    // Проверка на вложенные пути (например, node_modules глубоко в структуре)
    if (
      fullPath &&
      excludedDirs.some(
        (dir) => fullPath.includes(`/${dir}/`) || fullPath.endsWith(`/${dir}`),
      )
    ) {
      return true;
    }
  }

  // Проверка исключенных файлов
  if (type === 'file') {
    const excludedFiles = excludePatterns.files || [];
    // Точное совпадение имени
    if (excludedFiles.includes(name)) {
      return true;
    }
    // Проверка на паттерны с звездочкой (*.log, *.tmp)
    for (const pattern of excludedFiles) {
      if (pattern.includes('*')) {
        const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`);
        if (regex.test(name)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Загружает конфигурацию из файла
 * @param {string} configPath - путь к конфигурационному файлу
 * @returns {Object} объект конфигурации
 */
export function loadConfig(configPath = './config.json') {
  try {
    const configFile = path.join(__dirname, configPath);
    if (!fs.existsSync(configFile)) {
      console.warn(
        `⚠️  Configuration file ${configPath} not found. Using default configuration.`,
      );
      return getDefaultConfig();
    }

    const configContent = fs.readFileSync(configFile, 'utf-8');
    config = JSON.parse(configContent);

    // Фильтруем исключенные директории
    const excludeExcludedDirs =
      config.scanOptions?.excludeExcludedDirs !== false;
    if (excludeExcludedDirs) {
      directoryConfigs = (config.directories || []).filter(
        (dir) => !dir.excluded,
      );
      const excludedCount =
        (config.directories || []).length - directoryConfigs.length;
      if (excludedCount > 0) {
        const lang = getCurrentLanguage();
        console.log(
          lang === 'english'
            ? `🚫 Excluded directories from scan: ${excludedCount}`
            : `🚫 Исключено директорий из сканирования: ${excludedCount}`,
        );
      }
    } else {
      directoryConfigs = config.directories || [];
    }

    const lang = getCurrentLanguage();
    console.log(
      lang === 'english'
        ? `✅ Configuration loaded from ${configPath}`
        : `✅ Конфигурация загружена из ${configPath}`,
    );
    console.log(
      lang === 'english'
        ? `📁 Directories configured: ${(config.directories || []).length}, will be scanned: ${directoryConfigs.length}`
        : `📁 Настроено директорий: ${(config.directories || []).length}, отсканировано будет: ${directoryConfigs.length}`,
    );

    return config;
  } catch (error) {
    console.error(`❌ Error loading configuration: ${error.message}`);
    console.log('🔄 Using default configuration');
    return getDefaultConfig();
  }
}

/**
 * Возвращает стандартную конфигурацию по умолчанию
 * @returns {Object} стандартная конфигурация
 */
function getDefaultConfig() {
  return {
    directories: [
      {
        id: '10',
        name: 'Directory/10',
        description: 'Пользовательская документация',
        description_en: 'User documentation',
        required: false,
        excluded: false,
      },
      {
        id: '11',
        name: 'Directory/11',
        description: 'Пользовательские функции',
        description_en: 'User functions',
        required: false,
        excluded: false,
      },
      {
        id: '12',
        name: 'Directory/12',
        description: 'Пользовательские файлы',
        description_en: 'User files',
        required: false,
        excluded: false,
      },
    ],
    excludePatterns: {
      directories: [
        'node_modules',
        '.git',
        'dist',
        'build',
        'coverage',
        '.nyc_output',
        '__pycache__',
        '.cache',
        'logs',
      ],
      files: [
        'README.md',
        'LICENSE.md',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.DS_Store',
        'Thumbs.db',
        '*.log',
        '*.tmp',
        '*.swp',
      ],
    },
    scanOptions: {
      recursive: true,
      followSymlinks: false,
      maxDepth: 100,
      excludeExcludedDirs: true,
      respectExcludePatterns: true,
    },
    report: {
      enabled: true,
      path: 'scan_report.log',
      append: false,
      includeTimestamp: true,
      includeSystemInfo: true,
      language: 'russian',
    },
    supportedExtensions: [...DEFAULT_SUPPORTED_EXTENSIONS],
    specialFiles: [...DEFAULT_SPECIAL_FILES],
  };
}

/**
 * Получает список директорий для сканирования из конфигурации
 * @returns {Array} массив объектов директорий
 */
export function getDirectoriesToScan() {
  if (!config) {
    loadConfig();
  }
  return directoryConfigs;
}

/**
 * Проверяет, нужно ли исключить директорию из сканирования
 * @param {Object} dirConfig - конфигурация директории
 * @returns {boolean} true если директория исключена
 */
export function isDirectoryExcluded(dirConfig) {
  const excludeExcludedDirs =
    config?.scanOptions?.excludeExcludedDirs !== false;
  return excludeExcludedDirs && dirConfig.excluded === true;
}

/**
 * Проверяет, поддерживается ли расширение файла (БЕЗ вызова getDefaultConfig)
 * @param {string} extension - расширение файла
 * @param {string} fileName - имя файла
 * @returns {boolean} true если поддерживается
 */
function isSupportedFile(extension, fileName) {
  // Используем загруженную конфигурацию или значения по умолчанию из констант
  const supportedExtensions =
    config?.supportedExtensions || DEFAULT_SUPPORTED_EXTENSIONS;
  const specialFiles = config?.specialFiles || DEFAULT_SPECIAL_FILES;

  return (
    supportedExtensions.includes(extension.toLowerCase()) ||
    specialFiles.includes(fileName)
  );
}

// Парсеры для разных расширений файлов
const fileParsers = {
  '.js': (content) => escapeContent(content),
  '.mjs': (content) => escapeContent(content),
  '.html': (content) => escapeHtmlContent(content),
  '.css': (content) => escapeContent(content),
  '.json': (content) => escapeContent(content),
  '.md': (content) => escapeContent(content),
  '.txt': (content) => escapeContent(content),
};

/**
 * Экранирует содержимое для безопасного JSON
 * @param {string} content - исходное содержимое
 * @returns {string} экранированное содержимое
 */
function escapeContent(content) {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/"/g, '\\"');
}

/**
 * Экранирует HTML содержимое
 * @param {string} content - исходное содержимое
 * @returns {string} экранированное содержимое
 */
function escapeHtmlContent(content) {
  return escapeContent(content).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Рекурсивно сканирует директорию и создает объект файловой системы
 * @param {string} dirPath - путь к директории для сканирования
 * @param {string} virtualPath - виртуальный путь в файловой системе
 * @param {number} currentDepth - текущая глубина сканирования
 * @returns {Object} объект, представляющий директорию
 */
function scanDirectory(dirPath, virtualPath = '', currentDepth = 0) {
  const maxDepth = config?.scanOptions?.maxDepth || 100;

  if (currentDepth > maxDepth) {
    return {
      '@type': 'Directory',
      type: 'directory',
      path: virtualPath,
      status: '[max depth exceeded]',
      children: {},
    };
  }

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = {
      '@type': 'Directory',
      type: 'directory',
      path: virtualPath || '/',
      description: getDirectoryDescription(path.basename(dirPath)),
      children: {},
    };

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      const itemVirtualPath = virtualPath
        ? `${virtualPath}/${item.name}`
        : `/${item.name}`;

      // Проверка на исключение по паттерну
      if (
        isExcluded(
          item.name,
          item.isDirectory() ? 'directory' : 'file',
          fullPath,
        )
      ) {
        const lang = getCurrentLanguage();
        if (item.isDirectory()) {
          result.children[item.name] = {
            '@type': 'Directory',
            type: 'directory',
            path: itemVirtualPath,
            status:
              lang === 'english'
                ? '[excluded by pattern]'
                : '[исключено по паттерну]',
            excludedPattern: true,
            children: {},
          };
        } else {
          result.children[item.name] = {
            type: 'file',
            path: itemVirtualPath,
            status:
              lang === 'english'
                ? '[excluded by pattern]'
                : '[исключено по паттерну]',
            reason: 'File matches exclude pattern',
          };
        }
        continue;
      }

      if (item.isDirectory()) {
        if (config?.scanOptions?.recursive !== false) {
          result.children[item.name] = scanDirectory(
            fullPath,
            itemVirtualPath,
            currentDepth + 1,
          );
        } else {
          result.children[item.name] = {
            '@type': 'Directory',
            type: 'directory',
            path: itemVirtualPath,
            status: '[non-recursive]',
            children: {},
          };
        }
      } else if (item.isFile()) {
        const ext = path.extname(item.name).toLowerCase();

        if (isSupportedFile(ext, item.name)) {
          result.children[item.name] = processFile(
            fullPath,
            itemVirtualPath,
            ext,
          );
        } else {
          result.children[item.name] = {
            type: 'file',
            path: itemVirtualPath,
            status: '[skipped]',
            reason: 'Unsupported extension',
          };
        }
      }
    }

    return result;
  } catch (error) {
    return {
      '@type': 'Directory',
      type: 'directory',
      path: virtualPath,
      status: '[error]',
      error: error.message,
      children: {},
    };
  }
}

/**
 * Обрабатывает файл: читает содержимое и применяет соответствующий парсер
 * @param {string} filePath - физический путь к файлу
 * @param {string} virtualPath - виртуальный путь в файловой системе
 * @param {string} extension - расширение файла
 * @returns {Object} объект, представляющий файл
 */
function processFile(filePath, virtualPath, extension) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parser = fileParsers[extension] || fileParsers['.txt'];
    const parsedContent = parser ? parser(content) : escapeContent(content);

    return {
      type: 'file',
      path: virtualPath,
      extension,
      content: parsedContent,
      size: fs.statSync(filePath).size,
      status: '[ok]',
    };
  } catch (error) {
    return {
      type: 'file',
      path: virtualPath,
      extension,
      status: '[corrupted]',
      error: error.message,
    };
  }
}

/**
 * Генерирует описание для директории на основе ее имени
 * @param {string} dirName - имя директории
 * @returns {string} описание директории
 */
function getDirectoryDescription(dirName) {
  const lang = getCurrentLanguage();
  const descriptions =
    lang === 'english' ? config?.descriptions_en : config?.descriptions;
  return (descriptions && descriptions[dirName]) || `Directory ${dirName}`;
}

/**
 * Сохраняет отчет сканирования в файл
 * @param {Object} stats - статистика сканирования
 * @param {string} outputPath - путь для сохранения отчета
 * @param {boolean} append - добавлять к существующему файлу или перезаписывать
 */
export function saveScanReport(stats, outputPath, append = false) {
  try {
    const reportConfig = config?.report || { enabled: false };

    if (!reportConfig.enabled) {
      console.log(t('reportSavingDisabled'));
      return;
    }

    const actualPath = reportConfig.path || outputPath || 'scan_report.log';

    // Создаем директорию для отчета, если она не существует
    const reportDir = path.dirname(actualPath);
    if (reportDir !== '.' && !fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
      const lang = getCurrentLanguage();
      console.log(
        `📁 ${lang === 'english' ? 'Created directory' : 'Создана директория'}: ${reportDir}`,
      );
    }

    const shouldAppend =
      reportConfig.append !== undefined ? reportConfig.append : append;
    const includeTimestamp = reportConfig.includeTimestamp !== false;
    const includeSystemInfo = reportConfig.includeSystemInfo !== false;

    let reportContent = '';

    if (!shouldAppend || !fs.existsSync(actualPath)) {
      // Создаем новый отчет
      if (includeTimestamp) {
        reportContent += `========================================\n`;
        reportContent += `${t('reportHeader')}\n`;
        reportContent += `${t('scanDate')}: ${new Date().toLocaleString(getCurrentLanguage() === 'english' ? 'en-US' : 'ru-RU')}\n`;
        reportContent += `========================================\n\n`;
      }

      if (includeSystemInfo) {
        reportContent += `${t('systemInfo')}:\n`;
        reportContent += `  ${t('nodeVersion')}: ${process.version}\n`;
        reportContent += `  ${t('platform')}: ${process.platform}\n`;
        reportContent += `  ${t('architecture')}: ${process.arch}\n`;
        reportContent += `  ${t('workingDir')}: ${process.cwd()}\n\n`;
      }
    } else {
      reportContent += `\n========================================\n`;
      reportContent += `${t('additionalScan')}\n`;
      reportContent += `${t('scanDate')}: ${new Date().toLocaleString(getCurrentLanguage() === 'english' ? 'en-US' : 'ru-RU')}\n`;
      reportContent += `========================================\n\n`;
    }

    // Добавляем статистику
    reportContent += `${t('scanStatistics')}:\n`;
    reportContent += `  ${t('totalDirectories')}: ${stats.totalDirectories || 0}\n`;
    reportContent += `  ${t('excludedFromScan')}: ${stats.excludedCount || 0}\n`;
    reportContent += `  ${t('successfullyScanned')}: ${stats.scannedCount || 0}\n`;
    reportContent += `  ${t('missingWithWarning')}: ${stats.warningCount || 0}\n`;
    reportContent += `  ${t('errors')}: ${stats.errors || 0}\n\n`;

    if (stats.excludedDirectories && stats.excludedDirectories.length > 0) {
      reportContent += `${t('excludedDirectories')}:\n`;
      stats.excludedDirectories.forEach((dir) => {
        reportContent += `  🚫 ${dir.name} - ${dir.description}\n`;
      });
      reportContent += `\n`;
    }

    if (stats.missingDirectories && stats.missingDirectories.length > 0) {
      reportContent += `${t('missingDirectories')}:\n`;
      stats.missingDirectories.forEach((dir) => {
        const required = dir.required ? ` ${t('required')}` : '';
        reportContent += `  ⚠️  ${dir.name}${required} - ${dir.description}\n`;
      });
      reportContent += `\n`;
    }

    if (stats.scannedDirectories && stats.scannedDirectories.length > 0) {
      reportContent += `${t('successfullyScannedDirectories')}:\n`;
      stats.scannedDirectories.forEach((dir) => {
        reportContent += `  ✅ ${dir.name} - ${dir.description}\n`;
        if (dir.filesCount !== undefined) {
          reportContent += `     ${t('files')}: ${dir.filesCount}\n`;
        }
      });
      reportContent += `\n`;
    }

    reportContent += `========================================\n`;
    reportContent += `${t('endOfReport')}\n`;
    reportContent += `========================================\n`;

    // Записываем в файл
    const flag = shouldAppend ? 'a' : 'w';
    fs.writeFileSync(actualPath, reportContent, { flag, encoding: 'utf8' });

    console.log(`\n${t('reportSaved')}: ${actualPath}`);
    console.log(
      `${t('reportSize')}: ${(fs.statSync(actualPath).size / 1024).toFixed(2)} KB`,
    );

    return true;
  } catch (error) {
    console.error(`${t('errorSavingReport')}: ${error.message}`);
    return false;
  }
}

/**
 * Собирает статистику сканирования
 * @param {Object} fileSystem - объект файловой системы
 * @returns {Object} статистика
 */
export function collectScanStats(fileSystem) {
  const stats = {
    totalDirectories: 0,
    excludedCount: 0,
    scannedCount: 0,
    warningCount: 0,
    errors: 0,
    excludedDirectories: [],
    missingDirectories: [],
    scannedDirectories: [],
  };

  if (fileSystem['.'] && fileSystem['.'].children) {
    const children = fileSystem['.'].children;

    for (const [name, dir] of Object.entries(children)) {
      stats.totalDirectories++;

      // Проверяем на исключенную директорию (разные возможные статусы)
      const isExcluded =
        dir.status === '[excluded]' ||
        dir.status === '[исключена]' ||
        dir.status === '[excluded by pattern]' ||
        dir.status === '[исключено по паттерну]' ||
        dir.excluded === true;

      // Проверяем на отсутствующую директорию
      const isMissing =
        dir.status === '[missing]' || dir.status === '[отсутствует]';

      // Проверяем на ошибку
      const isError = dir.status === '[error]' || dir.status === '[ошибка]';

      if (isExcluded) {
        stats.excludedCount++;
        stats.excludedDirectories.push({
          name,
          description: dir.description || t('noDescription'),
        });
      } else if (isMissing) {
        stats.warningCount++;
        stats.missingDirectories.push({
          name,
          description: dir.description || t('noDescription'),
          required: dir.required || false,
        });
      } else if (isError) {
        stats.errors++;
      } else if (
        dir.type === 'directory' &&
        (!dir.status ||
          dir.status === '[ok]' ||
          dir.status === '[целый]' ||
          dir.status === undefined)
      ) {
        stats.scannedCount++;

        // Подсчитываем количество файлов в директории
        let filesCount = 0;
        if (dir.children) {
          filesCount = Object.values(dir.children).filter(
            (child) =>
              child.type === 'file' &&
              child.status !== '[skipped]' &&
              child.status !== '[пропущен]' &&
              child.status !== '[excluded by pattern]' &&
              child.status !== '[исключено по паттерну]',
          ).length;
        }

        stats.scannedDirectories.push({
          name,
          description: dir.description || t('noDescription'),
          filesCount,
        });
      }
    }
  }

  return stats;
}

/**
 * Основная функция для создания JSON объекта файловой системы
 * @param {string} configPath - путь к конфигурационному файлу
 * @returns {Object} объект файловой системы
 */
export function createFileSystemJSON(configPath = './config.json') {
  // Загружаем конфигурацию
  loadConfig(configPath);

  const directories = getDirectoriesToScan();
  const fileSystem = {
    '.': {
      type: 'directory',
      children: {},
      metadata:
        config?.includeMetadata !== false
          ? {
              scanDate: new Date().toISOString(),
              configVersion: '1.0',
              language: getCurrentLanguage(),
              totalDirectories: (config?.directories || []).length,
              scannedDirectories: directories.length,
              excludedDirectories:
                (config?.directories || []).length - directories.length,
            }
          : undefined,
    },
  };

  let missingCount = 0;
  let warningCount = 0;
  let excludedCount = 0;

  // Сканируем директории из конфигурации
  for (const dirConfig of directories) {
    const realPath = path.join(__dirname, dirConfig.name);
    const virtualPath = `/${dirConfig.name}`;

    // Проверяем, исключена ли директория
    if (isDirectoryExcluded(dirConfig)) {
      excludedCount++;
      const lang = getCurrentLanguage();
      const excludedStatus = lang === 'english' ? '[excluded]' : '[исключена]';

      fileSystem['.'].children[dirConfig.name] = {
        '@type': 'Directory',
        type: 'directory',
        path: virtualPath,
        status: excludedStatus,
        description: getLocalizedDescription(dirConfig),
        excluded: true,
        children: {},
      };

      console.log(
        lang === 'english'
          ? `🚫 Excluded from scan: ${dirConfig.name} - ${getLocalizedDescription(dirConfig)}`
          : `🚫 Исключена из сканирования: ${dirConfig.name} - ${getLocalizedDescription(dirConfig)}`,
      );
      continue;
    }

    try {
      if (fs.existsSync(realPath)) {
        fileSystem['.'].children[dirConfig.name] = scanDirectory(
          realPath,
          virtualPath,
        );
        const lang = getCurrentLanguage();
        console.log(
          lang === 'english'
            ? `✅ Scanned: ${dirConfig.name}`
            : `✅ Отсканирована: ${dirConfig.name}`,
        );
      } else {
        missingCount++;
        const isRequired = dirConfig.required || false;

        if (!isRequired) {
          warningCount++;
          const lang = getCurrentLanguage();
          console.warn(
            lang === 'english'
              ? `⚠️  [WARNING] Directory missing: ${dirConfig.name} - ${getLocalizedDescription(dirConfig)}`
              : `⚠️  [ПРЕДУПРЕЖДЕНИЕ] Директория отсутствует: ${dirConfig.name} - ${getLocalizedDescription(dirConfig)}`,
          );
        }

        const lang = getCurrentLanguage();
        const missingStatus =
          lang === 'english' ? '[missing]' : '[отсутствует]';

        fileSystem['.'].children[dirConfig.name] = {
          '@type': 'Directory',
          type: 'directory',
          path: virtualPath,
          status: missingStatus,
          description: getLocalizedDescription(dirConfig),
          required: isRequired,
          warning: !isRequired
            ? lang === 'english'
              ? 'Directory not found on disk'
              : 'Директория не найдена на диске'
            : undefined,
          children: {},
        };
      }
    } catch (error) {
      console.error(`❌ Error scanning ${dirConfig.name}: ${error.message}`);
      const lang = getCurrentLanguage();
      const errorStatus = lang === 'english' ? '[error]' : '[ошибка]';

      fileSystem['.'].children[dirConfig.name] = {
        '@type': 'Directory',
        type: 'directory',
        path: virtualPath,
        status: errorStatus,
        error: error.message,
        children: {},
      };
    }
  }

  // Выводим итоговый отчёт
  const lang = getCurrentLanguage();
  console.log(
    `\n📊 ${lang === 'english' ? 'SCAN RESULTS' : 'ИТОГИ СКАНИРОВАНИЯ'}:`,
  );
  console.log(
    `   ${t('totalDirectories')}: ${(config?.directories || []).length}`,
  );
  console.log(`   ${t('excludedFromScan')}: ${excludedCount}`);
  console.log(
    `   ${t('successfullyScanned')}: ${directories.length - excludedCount - missingCount}`,
  );
  console.log(`   ${t('missingWithWarning')}: ${warningCount}`);

  if (excludedCount > 0) {
    console.log(
      `\n💡 ${lang === 'english' ? 'Information' : 'Информация'}: ${excludedCount} ${lang === 'english' ? 'directories excluded from scan' : 'директорий исключены из сканирования'}.`,
    );
    console.log(
      `   ${lang === 'english' ? 'To include them, change "excluded" parameter in config.json' : 'Чтобы включить их, измените параметр "excluded" в config.json'}`,
    );
  }

  if (missingCount > 0) {
    console.log(
      `\n💡 ${lang === 'english' ? 'Information' : 'Информация'}: ${lang === 'english' ? 'Scanning continued with partial data' : 'Сканирование продолжено с частичными данными'}.`,
    );
    console.log(
      `   ${lang === 'english' ? 'To add missing directories, create them in Directory/ folder' : 'Чтобы добавить отсутствующие директории, создайте их в папке Directory/'}`,
    );
  }

  return fileSystem;
}

/**
 * Сохраняет файловую систему в JSON файл
 * @param {string} outputPath - путь для сохранения JSON файла
 * @param {Object} fileSystem - объект файловой системы
 * @param {boolean} prettyPrint - форматировать ли вывод
 */
export function saveFileSystemJSON(outputPath, fileSystem, prettyPrint = true) {
  try {
    // Создаем директорию, если она не существует
    const outputDir = path.dirname(outputPath);
    if (outputDir !== '.' && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      const lang = getCurrentLanguage();
      console.log(
        `📁 ${lang === 'english' ? 'Created directory' : 'Создана директория'}: ${outputDir}`,
      );
    }

    const jsonString = prettyPrint
      ? JSON.stringify(fileSystem, null, 2)
      : JSON.stringify(fileSystem);
    fs.writeFileSync(outputPath, jsonString, 'utf-8');
    const lang = getCurrentLanguage();
    console.log(
      `\n💾 ${lang === 'english' ? 'File system saved to' : 'Файловая система сохранена в'}: ${outputPath}`,
    );
    console.log(
      `📏 ${lang === 'english' ? 'File size' : 'Размер файла'}: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`,
    );
  } catch (error) {
    console.error('❌ Error saving JSON:', error);
  }
}
