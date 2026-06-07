// /10/map/server-imcce-bz2-utils.mjs
// Утилиты для работы с BZ2 сжатыми файлами (Skybot3D)

import axios from 'axios';
import { createBrotliDecompress, createGunzip } from 'zlib.js';
import { Readable } from 'stream.js';
import { colors } from './server-imcce-utils.mjs';  // ИСПРАВЛЕНО: было test-imcce-utils.js

// Динамический импорт unbzip2-stream (чистый ESM подход)
let unbzip2Stream;
const getUnbzip2Stream = async () => {
    if (!unbzip2Stream) {
        const module = await import('unbzip2-stream');
        unbzip2Stream = module.default;
    }
    return unbzip2Stream;
};

/**
 * Определение типа сжатия по URL и Content-Type
 * @param {string} url - URL файла
 * @param {string} contentType - Content-Type заголовок (опционально)
 * @returns {string} Тип сжатия: 'bz2' | 'gz' | 'br' | 'none'
 */
export function detectCompression(url, contentType = '') {
    const urlLower = url.toLowerCase();

    // По расширению файла
    if (urlLower.endsWith('.bz2')) return 'bz2';
    if (urlLower.endsWith('.gz')) return 'gz';
    if (urlLower.endsWith('.br')) return 'br';

    // По Content-Type
    if (contentType) {
        if (contentType.includes('bzip2') || contentType.includes('x-bzip2')) return 'bz2';
        if (contentType.includes('gzip')) return 'gz';
        if (contentType.includes('brotli')) return 'br';
    }

    return 'none';
}

/**
 * Распаковка BZ2 данных
 * @param {Buffer} data - Сжатые BZ2 данные
 * @returns {Promise<Buffer>} Распакованные данные
 */
async function decompressBZ2(data) {
    const unbz2 = await getUnbzip2Stream();
    const chunks = [];

    return new Promise((resolve, reject) => {
        const readable = Readable.from(data);
        const decompressor = unbz2();

        decompressor.on('data', (chunk) => chunks.push(chunk));
        decompressor.on('end', () => resolve(Buffer.concat(chunks)));
        decompressor.on('error', (err) => reject(err));

        readable.pipe(decompressor);
    });
}

/**
 * Распаковка GZIP данных
 * @param {Buffer} data - Сжатые GZIP данные
 * @returns {Promise<Buffer>} Распакованные данные
 */
function decompressGZIP(data) {
    return new Promise((resolve, reject) => {
        const gunzip = createGunzip();
        const chunks = [];

        gunzip.on('data', (chunk) => chunks.push(chunk));
        gunzip.on('end', () => resolve(Buffer.concat(chunks)));
        gunzip.on('error', reject);

        gunzip.end(data);
    });
}

/**
 * Распаковка Brotli данных
 * @param {Buffer} data - Сжатые Brotli данные
 * @returns {Promise<Buffer>} Распакованные данные
 */
function decompressBrotli(data) {
    return new Promise((resolve, reject) => {
        const brotli = createBrotliDecompress();
        const chunks = [];

        brotli.on('data', (chunk) => chunks.push(chunk));
        brotli.on('end', () => resolve(Buffer.concat(chunks)));
        brotli.on('error', reject);

        brotli.end(data);
    });
}

/**
 * Универсальная функция для скачивания и распаковки файла
 * @param {string} url - URL файла для скачивания
 * @param {Object} options - Опции
 * @param {number} options.timeout - Таймаут в мс (по умолчанию 60000)
 * @param {boolean} options.returnBuffer - Вернуть Buffer вместо строки (по умолчанию false)
 * @returns {Promise<Object>} Распакованные данные
 */
export async function downloadAndExtractFile(url, options = {}) {
    const { timeout = 60000, returnBuffer = false } = options;

    console.log(`${colors.fg.cyan}📥 Скачивание файла: ${url}${colors.reset}`);

    try {
        // Скачиваем файл
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            timeout: timeout,
            headers: {
                'User-Agent': 'GaiaDR3-StarMap/2.0',
                'Accept-Encoding': 'gzip, deflate, br'
            },
            maxContentLength: 100 * 1024 * 1024 // 100 MB
        });

        const compressionType = detectCompression(url, response.headers['content-type']);
        console.log(`   📦 Тип сжатия: ${compressionType}, размер: ${response.data.length} байт`);

        let decompressedData;

        switch (compressionType) {
            case 'bz2':
                decompressedData = await decompressBZ2(response.data);
                break;
            case 'gz':
                decompressedData = await decompressGZIP(response.data);
                break;
            case 'br':
                decompressedData = await decompressBrotli(response.data);
                break;
            case 'none':
            default:
                decompressedData = response.data;
                break;
        }

        console.log(`   ✅ Распаковано: ${decompressedData.length} байт`);

        if (returnBuffer) {
            return decompressedData;
        }

        // Пытаемся распарсить как JSON
        const dataStr = decompressedData.toString('utf-8');
        try {
            const jsonData = JSON.parse(dataStr);
            console.log(`   ✅ Успешно распарсен JSON`);
            return jsonData;
        } catch (e) {
            // Если не JSON, возвращаем строку
            console.log(`   ⚠️ Не JSON формат, возвращаю как строку`);
            return dataStr;
        }

    } catch (error) {
        console.error(`${colors.fg.red}❌ Ошибка при скачивании/распаковке файла:${colors.reset}`, error.message);
        throw error;
    }
}

/**
 * Проверка необходимости файлового режима
 * @param {number} limit - Запрошенный лимит
 * @param {string} downloadData - Параметр downloadData
 * @param {number} threshold - Порог для автоматического включения (по умолчанию 10)
 * @returns {boolean} Нужно ли использовать файловый режим
 */
export function shouldUseFileMode(limit, downloadData, threshold = 10) {
    return downloadData === '1' || downloadData === 'true' || limit > threshold;
}

/**
 * Извлечение данных из ответа Skybot3D согласно документации
 * @param {Object} metadata - Метаданные от API
 * @param {string} dataType - Тип данных ('planets', 'asteroids', 'comets', 'all')
 * @returns {Promise<Object>} Объект с данными
 */
export async function extractSkybot3DData(metadata, dataType = 'planets') {
    if (!metadata || metadata.flag !== 1) {
        return {
            success: false,
            error: 'Invalid metadata or flag != 1',
            metadata
        };
    }

    if (!metadata.file) {
        return {
            success: false,
            error: 'No file URL in metadata',
            metadata
        };
    }

    try {
        // Скачиваем и распаковываем файл
        const fileData = await downloadAndExtractFile(metadata.file);

        // Для 'all' возвращаем весь объект
        if (dataType === 'all') {
            return {
                success: true,
                metadata: {
                    flag: metadata.flag,
                    ticket: metadata.ticket,
                    status: metadata.status,
                    nbsso: metadata.nbsso || fileData.nbsso,
                    refdate: metadata.refdate || fileData.refdate,
                    file: metadata.file,
                    size: metadata['size(bytes)']
                },
                data: fileData[dataType] || [],
                rawFileData: fileData
            };
        }

        // Извлекаем нужный массив данных
        const dataArray = fileData[dataType] || [];

        return {
            success: true,
            metadata: {
                flag: metadata.flag,
                ticket: metadata.ticket,
                status: metadata.status,
                nbsso: metadata.nbsso || fileData.nbsso,
                refdate: metadata.refdate || fileData.refdate,
                file: metadata.file,
                size: metadata['size(bytes)']
            },
            data: dataArray,
            rawFileData: fileData
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            metadata
        };
    }
}

export {
    decompressBZ2,
    decompressGZIP,
    decompressBrotli
}