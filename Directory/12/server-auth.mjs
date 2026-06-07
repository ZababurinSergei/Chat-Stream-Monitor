// /10/map/server-auth.mjs - Аутентификация для ESA TAP сервиса (ПОЛНАЯ ВЕРСИЯ)

import axios from 'axios';
import { DATA_SOURCES, sessions, setSessions, colors } from './server-config.mjs';

/**
 * Получение cookie сессии ESA через прямой login
 * Соответствует рабочему curl запросу:
 * curl -k -c cookies.txt -X POST --data-urlencode "username=..." --data-urlencode "password=..." "https://gea.esac.esa.int/tap-server/login"
 * @returns {Promise<boolean>} Успешность входа
 */
export async function loginToEsa() {
    const esa = DATA_SOURCES.esa;

    try {
        console.log(`${colors.fg.yellow}🔐 Выполнение входа в ESA...${colors.reset}`);
        console.log(`   Используется username: ${esa.auth.username}`);

        // Используем URLSearchParams для корректной формы (как в curl --data-urlencode)
        const formData = new URLSearchParams();
        formData.append('username', esa.auth.username);
        formData.append('password', esa.auth.password);

        // Отправляем запрос как браузер (имитируем curl)
        const response = await axios({
            method: 'POST',
            url: esa.auth.loginUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://gea.esac.esa.int',
                'Referer': 'https://gea.esac.esa.int/tap-server/login'
            },
            data: formData.toString(),
            maxRedirects: 5, // Разрешаем редиректы как в curl с -L
            withCredentials: true,
            validateStatus: status => status >= 200 && status < 400
        });

        // ИЗВЛЕКАЕМ COOKIE ИЗ ЗАГОЛОВКОВ (КАК curl -c cookies.txt)
        const setCookie = response.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
            const newSessions = { ...sessions };
            newSessions.esa.cookies = setCookie.join('; ');
            newSessions.esa.lastLogin = Date.now();
            setSessions(newSessions);

            // Парсим JSESSIONID для определения времени жизни
            const jsessionMatch = setCookie.find(c => c.includes('JSESSIONID'));
            if (jsessionMatch) {
                // Сессия обычно живет 30 минут
                const expiresMatch = jsessionMatch.match(/Expires=([^;]+)/);
                if (expiresMatch) {
                    newSessions.esa.expiry = new Date(expiresMatch[1]).getTime();
                } else {
                    // Если нет Expires, ставим 25 минут
                    newSessions.esa.expiry = Date.now() + 25 * 60 * 1000;
                }
                setSessions(newSessions);
            }

            console.log(`${colors.fg.green}✅ Вход в ESA выполнен успешно${colors.reset}`);
            console.log(`   Cookie JSESSIONID получен: ${sessions.esa.cookies.substring(0, 50)}...`);
            console.log(`   Сессия истекает: ${new Date(sessions.esa.expiry).toLocaleString()}`);

            // Небольшая задержка после логина (как рекомендуется в документации)
            await new Promise(resolve => setTimeout(resolve, 1000));

            return true;
        } else {
            console.warn(`${colors.fg.yellow}⚠️ Нет cookie в ответе ESA. Возможно, неверный логин/пароль${colors.reset}`);

            // Проверяем, не страница ли это с ошибкой
            if (response.data) {
                const dataStr = response.data.toString();
                if (dataStr.includes('Invalid username or password')) {
                    console.error(`${colors.fg.red}❌ Сервер ESA вернул: Invalid username or password${colors.reset}`);
                } else if (dataStr.includes('Please sign in')) {
                    console.error(`${colors.fg.red}❌ Сервер ESA вернул страницу входа - вероятно, неверные учетные данные${colors.reset}`);
                }
            }
            return false;
        }

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка входа в ESA:${colors.reset}`, error.message);
        if (error.response) {
            console.error(`   Статус: ${error.response.status}`);

            // Логируем часть ответа для отладки
            if (error.response.data) {
                const dataStr = error.response.data.toString().substring(0, 300);
                console.error(`   Первые 300 символов ответа: ${dataStr}`);
            }
        }
        return false;
    }
}

/**
 * Проверка и обновление сессии ESA при необходимости
 * @returns {Promise<boolean>} Валидность сессии
 */
export async function ensureEsaSession() {
    // Если нет cookie или сессия истекла (или истечет через 5 минут)
    if (!sessions.esa.cookies ||
        !sessions.esa.expiry ||
        Date.now() >= (sessions.esa.expiry - 5 * 60 * 1000)) {

        console.log(`${colors.fg.cyan}🔄 Сессия ESA истекла или отсутствует, выполняем повторный вход...${colors.reset}`);
        return await loginToEsa();
    }

    // Сессия валидна
    return true;
}

/**
 * Принудительный выход из ESA
 * @returns {Promise<Object>} Результат выхода
 */
export async function logoutFromEsa() {
    try {
        if (sessions.esa.cookies) {
            // Отправляем запрос на logout
            await axios({
                method: 'POST',
                url: DATA_SOURCES.esa.auth.logoutUrl,
                headers: {
                    'Cookie': sessions.esa.cookies,
                    'User-Agent': 'GaiaDR3-StarMap/1.0'
                },
                withCredentials: true,
                timeout: 5000
            });

            console.log(`${colors.fg.green}✅ Запрос на logout отправлен${colors.reset}`);
        }
    } catch (error) {
        console.warn(`${colors.fg.yellow}⚠️ Ошибка при logout из ESA:${colors.reset}`, error.message);
    }

    // Очищаем сессию в любом случае
    const newSessions = { ...sessions };
    newSessions.esa.cookies = null;
    newSessions.esa.expiry = null;
    newSessions.esa.lastLogin = null;
    setSessions(newSessions);

    return {
        success: true,
        message: 'Выход выполнен, сессия очищена'
    };
}

/**
 * Получение статуса аутентификации ESA
 * @returns {Object} Статус аутентификации
 */
export function getEsaAuthStatus() {
    return {
        authenticated: !!sessions.esa.cookies,
        expiry: sessions.esa.expiry ? new Date(sessions.esa.expiry).toISOString() : null,
        lastLogin: sessions.esa.lastLogin ? new Date(sessions.esa.lastLogin).toISOString() : null,
        username: DATA_SOURCES.esa.auth.username
    };
}

/**
 * Обновление учетных данных ESA
 * @param {string} username - Новое имя пользователя
 * @param {string} password - Новый пароль
 */
export function updateEsaCredentials(username, password) {
    DATA_SOURCES.esa.auth.username = username;
    DATA_SOURCES.esa.auth.password = password;

    console.log(`${colors.fg.cyan}📝 Обновлены учетные данные ESA: ${username}${colors.reset}`);
}

/**
 * Тестирование соединения с ESA (без сохранения сессии)
 * @param {string} username - Имя пользователя
 * @param {string} password - Пароль
 * @returns {Promise<Object>} Результат теста
 */
export async function testEsaConnection(username, password) {
    try {
        console.log(`${colors.fg.cyan}🧪 Тестирование соединения с ESA...${colors.reset}`);

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await axios({
            method: 'POST',
            url: DATA_SOURCES.esa.auth.loginUrl,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            },
            data: formData.toString(),
            maxRedirects: 0,
            validateStatus: status => true,
            withCredentials: true
        });

        const setCookie = response.headers['set-cookie'];

        return {
            success: !!(setCookie && setCookie.length > 0),
            status: response.status,
            hasCookies: !!(setCookie && setCookie.length > 0),
            cookieCount: setCookie ? setCookie.length : 0,
            headers: {
                'content-type': response.headers['content-type'],
                'location': response.headers['location']
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Получение информации о сессии
 * @returns {Object} Детальная информация о сессии
 */
export function getSessionInfo() {
    const now = Date.now();
    const expiry = sessions.esa.expiry;

    let timeRemaining = null;
    if (expiry) {
        const remainingMs = expiry - now;
        timeRemaining = {
            ms: remainingMs,
            minutes: Math.floor(remainingMs / 60000),
            seconds: Math.floor((remainingMs % 60000) / 1000),
            expired: remainingMs <= 0
        };
    }

    return {
        authenticated: !!sessions.esa.cookies,
        cookiesPresent: !!sessions.esa.cookies,
        cookieLength: sessions.esa.cookies ? sessions.esa.cookies.length : 0,
        lastLogin: sessions.esa.lastLogin ? new Date(sessions.esa.lastLogin).toISOString() : null,
        expiry: expiry ? new Date(expiry).toISOString() : null,
        timeRemaining,
        username: DATA_SOURCES.esa.auth.username,
        sourceEnabled: DATA_SOURCES.esa.enabled,
        sourceStatus: DATA_SOURCES.esa.status
    };
}

/**
 * Очистка сессии ESA
 */
export function clearEsaSession() {
    const newSessions = { ...sessions };
    newSessions.esa.cookies = null;
    newSessions.esa.expiry = null;
    newSessions.esa.lastLogin = null;
    setSessions(newSessions);

    console.log(`${colors.fg.yellow}🧹 Сессия ESA очищена${colors.reset}`);
}

export default {
    loginToEsa,
    ensureEsaSession,
    logoutFromEsa,
    getEsaAuthStatus,
    updateEsaCredentials,
    testEsaConnection,
    getSessionInfo,
    clearEsaSession
};