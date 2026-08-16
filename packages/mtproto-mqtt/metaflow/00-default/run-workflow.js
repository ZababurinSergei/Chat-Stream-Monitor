// run-workflow.js
import { HttpWorkflow } from './http-workflow.js';
import { parseHttpFile, saveResults } from './http-parser.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Metaflow стиль выполнения
 */
async function metaflowRun() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║              🚀 Metaflow Workflow - MTProto MQTT                 ║
║                 HTTP запросы из request.http                      ║
╚═══════════════════════════════════════════════════════════════════╝
    `);

    const workflow = new HttpWorkflow();
    await workflow.run();
}

/**
 * Metaflow стиль показа структуры
 */
function metaflowShow() {
    const workflow = new HttpWorkflow();
    workflow.show();
}

/**
 * Проверка соответствия INTERFACE.md
 */
async function metaflowValidate() {
    console.log('🔍 Валидация соответствия INTERFACE.md...');

    const httpFilePath = path.join(process.cwd(), 'request.http');
    if (!fs.existsSync(httpFilePath)) {
        console.log('❌ Файл request.http не найден');
        console.log('📝 Создайте файл request.http с HTTP запросами');
        return;
    }

    const requests = parseHttpFile(httpFilePath);

    console.log(`\n📋 Найдено ${requests.length} запросов`);
    console.log('\nПроверка соответствия командам из INTERFACE.md:');
    console.log('═'.repeat(60));

    // Ожидаемые команды из INTERFACE.md
    const expectedCommands = [
        {
            num: 1,
            name: 'Авторизация',
            endpoint: '/common',
            api: 'auth./auth/user/login',
            description: 'POST http://localhost:3100/common'
        },
        {
            num: 2,
            name: 'Получение активных сессий',
            endpoint: '/api',
            api: 'auth./active-user/get',
            description: 'POST http://localhost:3100/api'
        },
        {
            num: 3,
            name: 'Время последнего входа',
            endpoint: '/api',
            api: 'auth./login-attempt/last-success/get',
            description: 'POST http://localhost:3100/api'
        },
        {
            num: 4,
            name: 'Информация о всех пользователях',
            endpoint: '/api',
            api: 'auth./active-users-with-last-login/get',
            description: 'POST http://localhost:3100/api'
        }
    ];

    let allFound = true;
    let foundCommands = [];

    expectedCommands.forEach(cmd => {
        const found = requests.find(r => {
            try {
                const body = r.body ? JSON.parse(r.body) : null;
                return body && body.api && body.api.includes(cmd.api || '');
            } catch (e) {
                return false;
            }
        });

        if (found) {
            console.log(`✅ Команда ${cmd.num}: ${cmd.name} - найдена`);
            foundCommands.push({ ...cmd, found: true });
        } else {
            console.log(`❌ Команда ${cmd.num}: ${cmd.name} - НЕ найдена`);
            console.log(`   Ожидалось: ${cmd.description}`);
            allFound = false;
            foundCommands.push({ ...cmd, found: false });
        }
    });

    // Вывод дополнительной информации
    console.log('\n📊 Детали найденных запросов:');
    console.log('═'.repeat(60));
    requests.forEach((req, index) => {
        console.log(`\nЗапрос ${index + 1}:`);
        console.log(`  Метод: ${req.method}`);
        console.log(`  URL: ${req.url}`);
        console.log(`  Описание: ${req.description || 'Без описания'}`);
        if (req.command) {
            console.log(`  Команда: ${req.command}`);
        }
        if (req.type) {
            console.log(`  Тип: ${req.type}`);
        }
        if (req.body) {
            try {
                const body = JSON.parse(req.body);
                console.log(`  API: ${body.api || 'не указан'}`);
            } catch (e) {
                console.log(`  Тело: ${req.body.substring(0, 50)}...`);
            }
        }
    });

    if (allFound) {
        console.log('\n✅ Все команды из INTERFACE.md присутствуют в request.http');
        console.log('📝 Workflow готов к выполнению');
        console.log('▶️  Запустите: npm start');
    } else {
        console.log('\n⚠️ Некоторые команды отсутствуют. Проверьте request.http');
        console.log('📝 Убедитесь, что файл содержит все запросы из интерфейса');
        console.log('\nОжидаемые команды:');
        expectedCommands.forEach(cmd => {
            const status = foundCommands.find(c => c.num === cmd.num)?.found ? '✅' : '❌';
            console.log(`  ${status} ${cmd.num}. ${cmd.name}`);
        });
    }
}

/**
 * Запуск с дополнительными опциями
 */
async function metaflowWithOptions() {
    const args = process.argv.slice(3);
    const options = {};

    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.substring(2).split('=');
            options[key] = value || true;
        }
    });

    console.log('⚙️ Опции:', options);

    if (options.verbose) {
        console.log('📢 Подробный режим включен');
        process.env.VERBOSE = 'true';
    }

    if (options.host) {
        console.log(`🌐 Хост: ${options.host}`);
        process.env.API_HOST = options.host;
    }

    if (options.port) {
        console.log(`🔌 Порт: ${options.port}`);
        process.env.API_PORT = options.port;
    }

    await metaflowRun();
}

/**
 * Проверка наличия зависимостей
 */
function checkDependencies() {
    console.log('🔍 Проверка зависимостей...');
    console.log('═'.repeat(50));

    const deps = [
        { name: 'Node.js', check: () => process.version },
        { name: 'axios', check: () => {
                try {
                    require.resolve('axios');
                    return true;
                } catch (e) {
                    return false;
                }
            }},
        { name: 'http-parser.js', check: () => fs.existsSync('http-parser.js') },
        { name: 'http-workflow.js', check: () => fs.existsSync('http-workflow.js') },
        { name: 'request.http', check: () => fs.existsSync('request.http') }
    ];

    deps.forEach(dep => {
        const result = dep.check();
        const status = result ? '✅' : '❌';
        console.log(`${status} ${dep.name}: ${result || 'не найдено'}`);
    });

    // Проверка npm пакетов
    console.log('\n📦 Проверка npm пакетов:');
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        const deps = pkg.dependencies || {};
        Object.keys(deps).forEach(dep => {
            const installed = fs.existsSync(`node_modules/${dep}`);
            const status = installed ? '✅' : '❌';
            console.log(`  ${status} ${dep}@${deps[dep]}`);
        });
    } catch (e) {
        console.log('❌ Не найден package.json');
    }
}

/**
 * Очистка результатов
 */
function cleanResults() {
    console.log('🧹 Очистка результатов...');

    const files = ['results.json', 'data.json', 'token.json'];
    let cleaned = 0;

    files.forEach(file => {
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
            console.log(`  ✅ Удален: ${file}`);
            cleaned++;
        }
    });

    // Очистка директории results
    if (fs.existsSync('results')) {
        fs.rmSync('results', { recursive: true, force: true });
        console.log('  ✅ Удалена директория: results/');
        cleaned++;
    }

    console.log(`\n🧹 Очищено ${cleaned} файлов/директорий`);
}

/**
 * Показать справку
 */
function showHelp() {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                MTProto MQTT HTTP Workflow                         ║
║                    Metaflow стиль выполнения                      ║
╚═══════════════════════════════════════════════════════════════════╝

📖 ИСПОЛЬЗОВАНИЕ:
  node run-workflow.js <command> [options]

📋 КОМАНДЫ:
  show           - Показать структуру workflow
  run            - Выполнить workflow (по умолчанию)
  validate       - Проверить соответствие INTERFACE.md
  check          - Проверить зависимости
  clean          - Очистить результаты выполнения
  help           - Показать эту справку

⚙️ ОПЦИИ (для run):
  --verbose      - Подробный вывод
  --host=HOST    - Указать хост API (по умолчанию: localhost)
  --port=PORT    - Указать порт API (по умолчанию: 3100)
  --token=TOKEN  - Использовать указанный токен

📝 ПРИМЕРЫ:
  # Показать структуру workflow
  node run-workflow.js show

  # Выполнить workflow
  node run-workflow.js run

  # Выполнить с подробным выводом
  node run-workflow.js run --verbose

  # Выполнить на другом хосте
  node run-workflow.js run --host=192.168.1.100 --port=8080

  # Проверить соответствие INTERFACE.md
  node run-workflow.js validate

  # Проверить зависимости
  node run-workflow.js check

  # Очистить результаты
  node run-workflow.js clean

📁 ФАЙЛЫ:
  request.http   - Файл с HTTP запросами (обязателен)
  results.json   - Результаты выполнения (генерируется)
  data.json      - Только данные из результатов (генерируется)
  token.json     - Сохраненный токен (генерируется)

🔗 ИНТЕГРАЦИЯ С INTERFACE.md:
  Команды из INTERFACE.md должны соответствовать запросам в request.http
  
  Команды:
  1. Авторизация                 - POST /common
  2. Получение активных сессий   - POST /api (auth./active-user/get)
  3. Время последнего входа      - POST /api (auth./login-attempt/last-success/get)
  4. Информация о всех пользователях - POST /api (auth./active-users-with-last-login/get)
    `);
}

// Аргументы командной строки
const args = process.argv.slice(2);
const command = args[0] || 'run';

// Обработка команд
switch (command) {
    case 'show':
        metaflowShow();
        break;

    case 'run':
        // Проверяем наличие дополнительных опций
        if (args.length > 1) {
            metaflowWithOptions();
        } else {
            metaflowRun();
        }
        break;

    case 'validate':
        metaflowValidate();
        break;

    case 'check':
        checkDependencies();
        break;

    case 'clean':
        cleanResults();
        break;

    case 'help':
    case '--help':
    case '-h':
        showHelp();
        break;

    default:
        console.log(`❌ Неизвестная команда: ${command}`);
        console.log('▶️  Используйте "node run-workflow.js help" для справки');
        process.exit(1);
}

// Экспорт функций для использования в других модулях
export {
    metaflowRun,
    metaflowShow,
    metaflowValidate,
    metaflowWithOptions,
    checkDependencies,
    cleanResults,
    showHelp
};
