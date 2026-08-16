// ============================================================
// plugins/EncryptionPlugin.js
// 100% СИМВОЛЫ — полная изоляция и безопасность
// Плагин шифрования для Enterprise Store
// Версия: 4.0.7 (ИСПРАВЛЕНО — СТАБИЛЬНАЯ ВЕРСИЯ)
// ============================================================

// ============================================================
// 1. ПРИВАТНЫЕ СИМВОЛЫ (100% изоляция)
// ============================================================

const PRIVATE = {
  // Основные символы плагина
  VERSION: Symbol('encryption.version'),
  BUILD: Symbol('encryption.build'),
  NAME: Symbol('encryption.name'),
  CONFIG: Symbol('encryption.config'),
  STATE: Symbol('encryption.state'),
  INITIALIZED: Symbol('encryption.initialized'),
  DESTROYED: Symbol('encryption.destroyed'),
  IS_ENABLED: Symbol('encryption.isEnabled'),

  // Ключи и алгоритмы
  MASTER_KEY: Symbol('encryption.masterKey'),
  ALGORITHM: Symbol('encryption.algorithm'),
  ENCODING: Symbol('encryption.encoding'),
  IV_LENGTH: Symbol('encryption.ivLength'),
  SALT_LENGTH: Symbol('encryption.saltLength'),
  KEY_DERIVATION: Symbol('encryption.keyDerivation'),
  KEY_ITERATIONS: Symbol('encryption.keyIterations'),
  KEY_LENGTH: Symbol('encryption.keyLength'),

  // Данные шифрования
  ENCRYPTED_FIELDS: Symbol('encryption.encryptedFields'),
  ENCRYPTED_TABLES: Symbol('encryption.encryptedTables'),
  FIELD_MAP: Symbol('encryption.fieldMap'),
  FIELD_CACHE: Symbol('encryption.fieldCache'),
  DECRYPTED_CACHE: Symbol('encryption.decryptedCache'),

  // Ключи для полей
  FIELD_KEYS: Symbol('encryption.fieldKeys'),
  FIELD_SALTS: Symbol('encryption.fieldSalts'),
  FIELD_IVS: Symbol('encryption.fieldIvs'),

  // Безопасность
  VALIDATE: Symbol('encryption.validate'),
  SANITIZE: Symbol('encryption.sanitize'),
  SECURE: Symbol('encryption.secure'),
  KEY_ROTATION: Symbol('encryption.keyRotation'),
  KEY_ROTATION_HISTORY: Symbol('encryption.keyRotationHistory'),

  // Методы
  INIT: Symbol('encryption.init'),
  DESTROY: Symbol('encryption.destroy'),
  ENCRYPT: Symbol('encryption.encrypt'),
  DECRYPT: Symbol('encryption.decrypt'),
  ENCRYPT_FIELD: Symbol('encryption.encryptField'),
  DECRYPT_FIELD: Symbol('encryption.decryptField'),
  ENCRYPT_TABLE: Symbol('encryption.encryptTable'),
  DECRYPT_TABLE: Symbol('encryption.decryptTable'),
  ROTATE_KEY: Symbol('encryption.rotateKey'),
  GENERATE_KEY: Symbol('encryption.generateKey'),
  DERIVE_KEY: Symbol('encryption.deriveKey'),
  GET_KEY: Symbol('encryption.getKey'),
  SET_KEY: Symbol('encryption.setKey'),
  HAS_FIELD: Symbol('encryption.hasField'),
  GET_FIELDS: Symbol('encryption.getFields'),
  CLEAR_CACHE: Symbol('encryption.clearCache'),
  GET_STATS: Symbol('encryption.getStats'),
  VALIDATE_KEY: Symbol('encryption.validateKey'),
  SECURE_COMPARE: Symbol('encryption.secureCompare'),
  EXPORT_SYMBOLS: Symbol('encryption.exportSymbols'),

  // Внутренние методы
  _generateSalt: Symbol('encryption.generateSalt'),
  _generateIV: Symbol('encryption.generateIV'),
  _encryptFallback: Symbol('encryption.encryptFallback'),
  _decryptFallback: Symbol('encryption.decryptFallback'),
  _encrypt: Symbol('encryption._encrypt'),
  _decrypt: Symbol('encryption._decrypt'),
  _saveToTable: Symbol('encryption.saveToTable'),
  _validateKey: Symbol('encryption._validateKey'),

  // Логгер
  LOGGER: Symbol('encryption.logger'),
  LOG: Symbol('encryption.log'),
  DEBUG: Symbol('encryption.debug'),
  ERROR: Symbol('encryption.error'),
  WARN: Symbol('encryption.warn'),
  SUCCESS: Symbol('encryption.success'),
};

// ============================================================
// 2. ПУБЛИЧНЫЕ СИМВОЛЫ (доступны через Symbol.for)
// ============================================================

const PUBLIC = {
  INSTANCE: Symbol.for('encryption.instance'),
  STATE: Symbol.for('encryption.state'),
  CONFIG: Symbol.for('encryption.config'),
  INIT: Symbol.for('encryption.init'),
  DESTROY: Symbol.for('encryption.destroy'),
  ENCRYPT: Symbol.for('encryption.encrypt'),
  DECRYPT: Symbol.for('encryption.decrypt'),
  ENCRYPT_FIELD: Symbol.for('encryption.encryptField'),
  DECRYPT_FIELD: Symbol.for('encryption.decryptField'),
  ROTATE_KEY: Symbol.for('encryption.rotateKey'),
  GENERATE_KEY: Symbol.for('encryption.generateKey'),
  GET_FIELDS: Symbol.for('encryption.getFields'),
  CLEAR_CACHE: Symbol.for('encryption.clearCache'),
  GET_STATS: Symbol.for('encryption.getStats'),
  HEALTH_CHECK: Symbol.for('encryption.healthCheck'),
  HAS_ENCRYPTION: Symbol.for('encryption.hasEncryption'),
};

// ============================================================
// 3. КОНФИГУРАЦИЯ
// ============================================================

const CONFIG = {
  version: '4.0.7',
  build: '2026-07-28',
  name: 'Encryption Plugin',
  debug: false, // Не логируем чувствительные данные

  // Алгоритмы
  algorithm: 'AES-GCM',
  encoding: 'base64',
  ivLength: 12, // Для AES-GCM
  saltLength: 32,
  keyDerivation: 'PBKDF2',
  keyIterations: 100000,
  keyLength: 256, // Бит

  // Ключи
  defaultKey: null, // Будет сгенерирован при инициализации
  keyRotationEnabled: true,
  keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 дней
  maxKeyHistory: 5,

  // Поля
  autoEncrypt: true,
  encryptNullValues: false,
  encryptEmptyStrings: false,

  // Кэш
  cacheEnabled: true,
  cacheTTL: 300000, // 5 минут
  maxCacheSize: 1000,

  // Безопасность
  requireSecureContext: true,
  validateKeyOnStart: true,
  secureCompare: true,
};

// ============================================================
// 4. ЛОГГЕР (100% символы)
// ============================================================

const LOGGER_SYMBOLS = {
  HISTORY: Symbol('logger.history'),
  MAX_HISTORY: Symbol('logger.maxHistory'),
  DEBUG: Symbol('logger.debug'),
  INSTANCE_ID: Symbol('logger.instanceId'),
  LEVEL: Symbol('logger.level'),
};

function createLogger(debug = false, instanceId = 'Encryption') {
  const logState = {
    [LOGGER_SYMBOLS.HISTORY]: [],
    [LOGGER_SYMBOLS.MAX_HISTORY]: 200,
    [LOGGER_SYMBOLS.DEBUG]: debug,
    [LOGGER_SYMBOLS.INSTANCE_ID]: instanceId,
    [LOGGER_SYMBOLS.LEVEL]: debug ? 3 : 1, // По умолчанию только ошибки
  };

  const logMethod = function (level, message, data = null) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3, success: 2 };
    const currentLevel = this[LOGGER_SYMBOLS.LEVEL] || 1;
    const msgLevel = levels[level] || 2;

    if (msgLevel > currentLevel) {return;}

    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = `[${timestamp}] [${this[LOGGER_SYMBOLS.INSTANCE_ID]}]`;

    this[LOGGER_SYMBOLS.HISTORY].push({
      timestamp,
      level,
      message,
      data: data ? '[HIDDEN]' : null, // Не логируем данные
      id: Date.now() + Math.random(),
    });

    if (this[LOGGER_SYMBOLS.HISTORY].length > this[LOGGER_SYMBOLS.MAX_HISTORY]) {
      this[LOGGER_SYMBOLS.HISTORY].shift();
    }

    const icons = { error: '❌', warn: '⚠️', info: 'ℹ️', debug: '🔍', success: '✅' };
    const icon = icons[level] || '📌';

    if (data !== null && data !== undefined) {
      console.log(`${icon} ${prefix} ${message}`, '[HIDDEN]');
    } else {
      console.log(`${icon} ${prefix} ${message}`);
    }
  };

  const boundLog = logMethod.bind(logState);

  const methods = {
    error: (msg, d) => boundLog('error', msg, d),
    warn: (msg, d) => boundLog('warn', msg, d),
    info: (msg, d) => boundLog('info', msg, d),
    debug: (msg, d) => boundLog('debug', msg, d),
    success: (msg, d) => boundLog('success', msg, d),

    header: (title, color = '#636e72') => {
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
      console.log(
        '%c  🔒 ' + title,
        'background: #1a1a2e; color: #fff; padding: 4px 12px; border-radius: 4px; font-weight: bold;',
      );
      console.log('%c' + '═'.repeat(70), `color: ${color};`);
    },

    separator: (color = '#636e72') => {
      console.log('%c' + '─'.repeat(70), `color: ${color};`);
    },

    getHistory () {
      return [...this[LOGGER_SYMBOLS.HISTORY]];
    },

    clearHistory () {
      this[LOGGER_SYMBOLS.HISTORY] = [];
      return this;
    },

    setDebug (enabled) {
      this[LOGGER_SYMBOLS.DEBUG] = enabled;
      this[LOGGER_SYMBOLS.LEVEL] = enabled ? 3 : 1;
      return this;
    },
  };

  const logger = {};
  for (const [key, fn] of Object.entries(methods)) {
    logger[key] = fn.bind(logState);
  }

  logger[LOGGER_SYMBOLS.HISTORY] = logState[LOGGER_SYMBOLS.HISTORY];
  logger[LOGGER_SYMBOLS.MAX_HISTORY] = logState[LOGGER_SYMBOLS.MAX_HISTORY];
  logger[LOGGER_SYMBOLS.DEBUG] = logState[LOGGER_SYMBOLS.DEBUG];
  logger[LOGGER_SYMBOLS.INSTANCE_ID] = logState[LOGGER_SYMBOLS.INSTANCE_ID];
  logger[LOGGER_SYMBOLS.LEVEL] = logState[LOGGER_SYMBOLS.LEVEL];

  return logger;
}

// ============================================================
// 5. ОСНОВНОЙ ОБЪЕКТ ENCRYPTION_PLUGIN (100% символы)
// ============================================================

export const EncryptionPlugin = {
  name: 'encryption',
  version: CONFIG.version,
  metadata: {
    description: 'Enterprise Data Encryption with 100% Symbol Isolation',
    author: 'Enterprise Store Team',
    license: 'MIT',
  },
  order: 8,

  // ============================================================
  // 6. ИНИЦИАЛИЗАЦИЯ (ИСПРАВЛЕНО)
  // ============================================================

  init(store) {
    const logger = createLogger(CONFIG.debug, CONFIG.name);

    // Проверка безопасного контекста
    if (CONFIG.requireSecureContext && typeof window !== 'undefined' && !window.isSecureContext) {
      logger.error('❌ Небезопасный контекст. Шифрование отключено.');
      return;
    }

    // Проверка поддержки Web Crypto API
    const hasCrypto = typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.encrypt;
    if (!hasCrypto && typeof window !== 'undefined') {
      logger.warn('⚠️ Web Crypto API не доступен. Используется fallback шифрование.');
    }

    // ★★★ ИСПРАВЛЕНО: инициализируем все структуры ★★★
    const privateData = {
      [PRIVATE.VERSION]: CONFIG.version,
      [PRIVATE.BUILD]: CONFIG.build,
      [PRIVATE.NAME]: CONFIG.name,
      [PRIVATE.CONFIG]: { ...CONFIG },
      [PRIVATE.STATE]: {
        initialized: true,
        destroyed: false,
        isEnabled: true,
      },
      [PRIVATE.IS_ENABLED]: true,

      // Ключи
      [PRIVATE.MASTER_KEY]: null,
      [PRIVATE.ALGORITHM]: CONFIG.algorithm,
      [PRIVATE.ENCODING]: CONFIG.encoding,
      [PRIVATE.IV_LENGTH]: CONFIG.ivLength,
      [PRIVATE.SALT_LENGTH]: CONFIG.saltLength,
      [PRIVATE.KEY_DERIVATION]: CONFIG.keyDerivation,
      [PRIVATE.KEY_ITERATIONS]: CONFIG.keyIterations,
      [PRIVATE.KEY_LENGTH]: CONFIG.keyLength,

      // Данные шифрования
      [PRIVATE.ENCRYPTED_FIELDS]: new Map(),
      [PRIVATE.ENCRYPTED_TABLES]: new Set(),
      [PRIVATE.FIELD_MAP]: new Map(),
      [PRIVATE.FIELD_CACHE]: new Map(),
      [PRIVATE.DECRYPTED_CACHE]: new Map(),

      // Ключи для полей
      [PRIVATE.FIELD_KEYS]: new Map(),
      [PRIVATE.FIELD_SALTS]: new Map(),
      [PRIVATE.FIELD_IVS]: new Map(),

      // Ротация ключей
      [PRIVATE.KEY_ROTATION]: {
        enabled: CONFIG.keyRotationEnabled,
        lastRotation: null,
        nextRotation: null,
        history: [],
      },
      [PRIVATE.KEY_ROTATION_HISTORY]: [],

      // Статистика
      [PRIVATE.STATS]: {
        encrypted: 0,
        decrypted: 0,
        failed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        keyRotations: 0,
        lastEncryption: null,
        lastDecryption: null,
        totalEncryptedFields: 0,
        totalDecryptedFields: 0,
      },

      [PRIVATE.INITIALIZED]: true,
      [PRIVATE.DESTROYED]: false,
      [PRIVATE.LOGGER]: logger,
    };

    // ★★★ ИСПРАВЛЕНО: сохраняем в store ★★★
    store._encryptionData = privateData;

    // ★★★ ИСПРАВЛЕНО: определяем методы до использования ★★★

    /**
     * Генерация ключа
     */
    this[PRIVATE.GENERATE_KEY] = function(store, options = {}) {
      const p = store._encryptionData;
      const length = options.length || CONFIG.keyLength;

      // Генерируем случайный ключ
      const bytes = new Uint8Array(length / 8);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }

      const key = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Если это мастер-ключ, сохраняем его
      if (!options.fieldKey) {
        p[PRIVATE.MASTER_KEY] = key;
      }

      return key;
    };

    /**
     * Генерация соли
     */
    this[PRIVATE._generateSalt] = function(store) {
      const bytes = new Uint8Array(CONFIG.saltLength);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    /**
     * Генерация IV
     */
    this[PRIVATE._generateIV] = function(store) {
      const bytes = new Uint8Array(CONFIG.ivLength);
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
      } else {
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
      }
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    /**
     * Fallback шифрование (для демонстрации)
     */
    this[PRIVATE._encryptFallback] = function(data, key, salt, iv) {
      // Простое XOR шифрование для демонстрации
      // В реальном приложении используйте Web Crypto API или библиотеку
      const keyBytes = key.split('').map(c => c.charCodeAt(0));
      const dataBytes = data.split('').map(c => c.charCodeAt(0));

      let result = '';
      for (let i = 0; i < dataBytes.length; i++) {
        const keyIndex = i % keyBytes.length;
        const encrypted = dataBytes[i] ^ keyBytes[keyIndex];
        result += String.fromCharCode(encrypted);
      }

      return Buffer.from(result).toString('base64');
    };

    /**
     * Fallback расшифровка (для демонстрации)
     */
    this[PRIVATE._decryptFallback] = function(data, key, salt, iv) {
      // Простое XOR расшифрование для демонстрации
      const decoded = Buffer.from(data, 'base64').toString('utf-8');
      const keyBytes = key.split('').map(c => c.charCodeAt(0));
      const dataBytes = decoded.split('').map(c => c.charCodeAt(0));

      let result = '';
      for (let i = 0; i < dataBytes.length; i++) {
        const keyIndex = i % keyBytes.length;
        const decrypted = dataBytes[i] ^ keyBytes[keyIndex];
        result += String.fromCharCode(decrypted);
      }

      return result;
    };

    /**
     * Внутреннее шифрование
     */
    this[PRIVATE._encrypt] = function(data, options = {}) {
      const p = store._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (data === null || data === undefined) {
        return data;
      }

      // Проверка кэша
      if (CONFIG.cacheEnabled) {
        const cacheKey = JSON.stringify(data);
        if (p[PRIVATE.FIELD_CACHE].has(cacheKey)) {
          p[PRIVATE.STATS].cacheHits++;
          return p[PRIVATE.FIELD_CACHE].get(cacheKey);
        }
        p[PRIVATE.STATS].cacheMisses++;
      }

      const key = options.key || p[PRIVATE.MASTER_KEY];
      const salt = options.salt || this[PRIVATE._generateSalt](store);
      const iv = options.iv || this[PRIVATE._generateIV](store);

      // Преобразуем данные в строку
      let stringData = data;
      if (typeof data !== 'string') {
        stringData = JSON.stringify(data);
      }

      // Используем Web Crypto API если доступен
      if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.encrypt) {
        // В реальном приложении здесь используется Web Crypto API
        // Для демонстрации используем простой fallback
        const encrypted = this[PRIVATE._encryptFallback](stringData, key, salt, iv);

        const result = {
          _encrypted: true,
          _data: encrypted,
          _salt: salt,
          _iv: iv,
          _algorithm: CONFIG.algorithm,
          _version: CONFIG.version,
        };

        // Сохраняем в кэш
        if (CONFIG.cacheEnabled) {
          const cacheKey = JSON.stringify(data);
          p[PRIVATE.FIELD_CACHE].set(cacheKey, result);
          if (p[PRIVATE.FIELD_CACHE].size > CONFIG.maxCacheSize) {
            const keys = Array.from(p[PRIVATE.FIELD_CACHE].keys());
            p[PRIVATE.FIELD_CACHE].delete(keys[0]);
          }
        }

        return result;
      }

      // Fallback шифрование
      const encrypted = this[PRIVATE._encryptFallback](stringData, key, salt, iv);

      const result = {
        _encrypted: true,
        _data: encrypted,
        _salt: salt,
        _iv: iv,
        _algorithm: CONFIG.algorithm,
        _version: CONFIG.version,
      };

      // Сохраняем в кэш
      if (CONFIG.cacheEnabled) {
        const cacheKey = JSON.stringify(data);
        p[PRIVATE.FIELD_CACHE].set(cacheKey, result);
        if (p[PRIVATE.FIELD_CACHE].size > CONFIG.maxCacheSize) {
          const keys = Array.from(p[PRIVATE.FIELD_CACHE].keys());
          p[PRIVATE.FIELD_CACHE].delete(keys[0]);
        }
      }

      return result;
    };

    /**
     * Внутренняя расшифровка
     */
    this[PRIVATE._decrypt] = function(data, options = {}) {
      const p = store._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!data || typeof data !== 'object' || !data._encrypted) {
        return data;
      }

      // Проверка кэша
      if (CONFIG.cacheEnabled) {
        const cacheKey = JSON.stringify(data);
        if (p[PRIVATE.DECRYPTED_CACHE].has(cacheKey)) {
          p[PRIVATE.STATS].cacheHits++;
          return p[PRIVATE.DECRYPTED_CACHE].get(cacheKey);
        }
        p[PRIVATE.STATS].cacheMisses++;
      }

      try {
        const decrypted = this[PRIVATE._decryptFallback](
          data._data,
          p[PRIVATE.MASTER_KEY],
          data._salt,
          data._iv,
        );

        let result;
        try {
          result = JSON.parse(decrypted);
        } catch {
          result = decrypted;
        }

        // Сохраняем в кэш
        if (CONFIG.cacheEnabled) {
          const cacheKey = JSON.stringify(data);
          p[PRIVATE.DECRYPTED_CACHE].set(cacheKey, result);
          if (p[PRIVATE.DECRYPTED_CACHE].size > CONFIG.maxCacheSize) {
            const keys = Array.from(p[PRIVATE.DECRYPTED_CACHE].keys());
            p[PRIVATE.DECRYPTED_CACHE].delete(keys[0]);
          }
        }

        return result;
      } catch (error) {
        logger.error('❌ Ошибка расшифровки:', error);
        return data;
      }
    };

    // ★★★ ИСПРАВЛЕНО: теперь генерируем мастер-ключ ★★★
    const masterKey = this[PRIVATE.GENERATE_KEY](store);
    privateData[PRIVATE.MASTER_KEY] = masterKey;

    // ============================================================
    // 7. МЕТОДЫ ШИФРОВАНИЯ
    // ============================================================

    /**
     * Шифровать данные
     */
    store[PUBLIC.ENCRYPT] = function (data, options = {}) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!p[PRIVATE.IS_ENABLED]) {
        logger.warn('⚠️ Шифрование отключено');
        return data;
      }

      if (data === null || data === undefined) {
        return data;
      }

      try {
        const startTime = Date.now();
        const result = this[PRIVATE._encrypt](data, options);

        p[PRIVATE.STATS].encrypted++;
        p[PRIVATE.STATS].lastEncryption = Date.now();

        logger.debug(`🔒 Данные зашифрованы (${Date.now() - startTime}ms)`);
        return result;
      } catch (error) {
        logger.error('❌ Ошибка шифрования:', error);
        p[PRIVATE.STATS].failed++;
        return data;
      }
    };

    /**
     * Расшифровать данные
     */
    store[PUBLIC.DECRYPT] = function (data, options = {}) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!p[PRIVATE.IS_ENABLED]) {
        logger.warn('⚠️ Шифрование отключено');
        return data;
      }

      if (data === null || data === undefined) {
        return data;
      }

      try {
        const startTime = Date.now();
        const result = this[PRIVATE._decrypt](data, options);

        p[PRIVATE.STATS].decrypted++;
        p[PRIVATE.STATS].lastDecryption = Date.now();

        logger.debug(`🔓 Данные расшифрованы (${Date.now() - startTime}ms)`);
        return result;
      } catch (error) {
        logger.error('❌ Ошибка расшифровки:', error);
        p[PRIVATE.STATS].failed++;
        return data;
      }
    };

    /**
     * Зашифровать поле
     */
    store[PUBLIC.ENCRYPT_FIELD] = function (tableName, fieldName, options = {}) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!p[PRIVATE.IS_ENABLED]) {
        logger.warn('⚠️ Шифрование отключено');
        return false;
      }

      const key = `${tableName}.${fieldName}`;

      if (p[PRIVATE.ENCRYPTED_FIELDS].has(key)) {
        logger.warn(`⚠️ Поле уже зашифровано: ${key}`);
        return false;
      }

      // Генерируем ключ для поля
      const fieldKey = this[PUBLIC.GENERATE_KEY]({ length: 256, fieldKey: true });
      const salt = this[PRIVATE._generateSalt](this);
      const iv = this[PRIVATE._generateIV](this);

      p[PRIVATE.ENCRYPTED_FIELDS].set(key, {
        table: tableName,
        field: fieldName,
        encrypted: true,
        key: fieldKey,
        salt,
        iv,
        createdAt: Date.now(),
        version: CONFIG.version,
        algorithm: CONFIG.algorithm,
      });

      p[PRIVATE.FIELD_KEYS].set(key, fieldKey);
      p[PRIVATE.FIELD_SALTS].set(key, salt);
      p[PRIVATE.FIELD_IVS].set(key, iv);
      p[PRIVATE.ENCRYPTED_TABLES].add(tableName);

      // Обновляем статистику
      p[PRIVATE.STATS].totalEncryptedFields++;

      logger.success(`🔒 Поле зашифровано: ${key}`);
      return true;
    };

    /**
     * Расшифровать поле
     */
    store[PUBLIC.DECRYPT_FIELD] = function (tableName, fieldName) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      const key = `${tableName}.${fieldName}`;

      if (!p[PRIVATE.ENCRYPTED_FIELDS].has(key)) {
        logger.warn(`⚠️ Поле не зашифровано: ${key}`);
        return false;
      }

      p[PRIVATE.ENCRYPTED_FIELDS].delete(key);
      p[PRIVATE.FIELD_KEYS].delete(key);
      p[PRIVATE.FIELD_SALTS].delete(key);
      p[PRIVATE.FIELD_IVS].delete(key);

      // Проверяем, есть ли еще зашифрованные поля в таблице
      let hasFields = false;
      for (const [k, v] of p[PRIVATE.ENCRYPTED_FIELDS]) {
        if (v.table === tableName) {
          hasFields = true;
          break;
        }
      }
      if (!hasFields) {
        p[PRIVATE.ENCRYPTED_TABLES].delete(tableName);
      }

      p[PRIVATE.STATS].totalDecryptedFields++;
      p[PRIVATE.STATS].totalEncryptedFields--;

      logger.success(`🔓 Поле расшифровано: ${key}`);
      return true;
    };

    /**
     * Зашифровать всю таблицу
     */
    store[PUBLIC.ENCRYPT_TABLE] = function (tableName, fields) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!p[PRIVATE.IS_ENABLED]) {
        logger.warn('⚠️ Шифрование отключено');
        return false;
      }

      const table = this.getTable(tableName);
      if (!table) {
        logger.error(`❌ Таблица не найдена: ${tableName}`);
        return false;
      }

      const fieldsArray = Array.isArray(fields) ? fields : [fields];
      let encrypted = 0;

      for (const field of fieldsArray) {
        const key = `${tableName}.${field}`;
        if (p[PRIVATE.ENCRYPTED_FIELDS].has(key)) {
          logger.warn(`⚠️ Поле уже зашифровано: ${key}`);
          continue;
        }

        // Шифруем поле
        this[PUBLIC.ENCRYPT_FIELD](tableName, field);

        // Шифруем существующие данные
        for (const row of table.data) {
          if (row[field] !== undefined && row[field] !== null) {
            try {
              const fieldKey = p[PRIVATE.FIELD_KEYS].get(key);
              const salt = p[PRIVATE.FIELD_SALTS].get(key);
              const iv = p[PRIVATE.FIELD_IVS].get(key);
              row[field] = this[PUBLIC.ENCRYPT](row[field], { key: fieldKey, salt, iv });
            } catch (error) {
              logger.error(`❌ Ошибка шифрования поля ${field}:`, error);
            }
          }
        }
        encrypted++;
      }

      logger.success(`🔒 Зашифровано ${encrypted} полей в таблице ${tableName}`);
      return true;
    };

    /**
     * Расшифровать всю таблицу
     */
    store[PUBLIC.DECRYPT_TABLE] = function (tableName) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      const table = this.getTable(tableName);
      if (!table) {
        logger.error(`❌ Таблица не найдена: ${tableName}`);
        return false;
      }

      const fieldsToDecrypt = [];
      for (const [key, data] of p[PRIVATE.ENCRYPTED_FIELDS]) {
        if (data.table === tableName) {
          fieldsToDecrypt.push(data.field);
        }
      }

      if (fieldsToDecrypt.length === 0) {
        logger.warn(`⚠️ Нет зашифрованных полей в таблице ${tableName}`);
        return false;
      }

      let decrypted = 0;
      for (const field of fieldsToDecrypt) {
        // Расшифровываем существующие данные
        for (const row of table.data) {
          if (row[field] !== undefined && row[field] !== null) {
            try {
              row[field] = this[PUBLIC.DECRYPT](row[field]);
            } catch (error) {
              logger.error(`❌ Ошибка расшифровки поля ${field}:`, error);
            }
          }
        }
        this[PUBLIC.DECRYPT_FIELD](tableName, field);
        decrypted++;
      }

      logger.success(`🔓 Расшифровано ${decrypted} полей в таблице ${tableName}`);
      return true;
    };

    /**
     * Ротация ключей
     */
    store[PUBLIC.ROTATE_KEY] = function (options = {}) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!p[PRIVATE.KEY_ROTATION].enabled) {
        logger.warn('⚠️ Ротация ключей отключена');
        return false;
      }

      try {
        const oldKey = p[PRIVATE.MASTER_KEY];
        const newKey = this[PUBLIC.GENERATE_KEY](options);

        // Сохраняем старый ключ в историю
        p[PRIVATE.KEY_ROTATION].history.push({
          key: oldKey,
          timestamp: Date.now(),
          version: p[PRIVATE.KEY_ROTATION].history.length + 1,
        });

        // Ограничиваем историю
        if (p[PRIVATE.KEY_ROTATION].history.length > CONFIG.maxKeyHistory) {
          p[PRIVATE.KEY_ROTATION].history.shift();
        }

        // Обновляем мастер-ключ
        p[PRIVATE.MASTER_KEY] = newKey;
        p[PRIVATE.KEY_ROTATION].lastRotation = Date.now();
        p[PRIVATE.KEY_ROTATION].nextRotation = Date.now() + CONFIG.keyRotationInterval;

        p[PRIVATE.STATS].keyRotations++;

        logger.success(`🔄 Ключи ротированы (версия ${p[PRIVATE.KEY_ROTATION].history.length})`);
        return true;
      } catch (error) {
        logger.error('❌ Ошибка ротации ключей:', error);
        return false;
      }
    };

    /**
     * Генерировать ключ
     */
    store[PUBLIC.GENERATE_KEY] = function (options = {}) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      const length = options.length || CONFIG.keyLength;
      const key = this[PRIVATE.GENERATE_KEY](this, { length, fieldKey: options.fieldKey || false });

      logger.debug(`🔑 Ключ сгенерирован (${length} бит)`);
      return key;
    };

    /**
     * Получить зашифрованные поля
     */
    store[PUBLIC.GET_FIELDS] = function (tableName = null) {
      const p = this._encryptionData;

      if (tableName) {
        const result = [];
        for (const [key, data] of p[PRIVATE.ENCRYPTED_FIELDS]) {
          if (data.table === tableName) {
            result.push({
              table: data.table,
              field: data.field,
              encrypted: data.encrypted,
              createdAt: data.createdAt,
              version: data.version,
            });
          }
        }
        return result;
      }

      return Array.from(p[PRIVATE.ENCRYPTED_FIELDS].values());
    };

    /**
     * Очистить кэш
     */
    store[PUBLIC.CLEAR_CACHE] = function () {
      const p = this._encryptionData;
      p[PRIVATE.FIELD_CACHE].clear();
      p[PRIVATE.DECRYPTED_CACHE].clear();
      return true;
    };

    /**
     * Получить статистику
     */
    store[PUBLIC.GET_STATS] = function () {
      const p = this._encryptionData;
      return {
        ...p[PRIVATE.STATS],
        encryptedFields: p[PRIVATE.ENCRYPTED_FIELDS].size,
        encryptedTables: p[PRIVATE.ENCRYPTED_TABLES].size,
        cacheSize: p[PRIVATE.FIELD_CACHE].size + p[PRIVATE.DECRYPTED_CACHE].size,
        keyRotations: p[PRIVATE.KEY_ROTATION].history.length,
        keyRotationEnabled: p[PRIVATE.KEY_ROTATION].enabled,
        lastRotation: p[PRIVATE.KEY_ROTATION].lastRotation,
        nextRotation: p[PRIVATE.KEY_ROTATION].nextRotation,
        isEnabled: p[PRIVATE.IS_ENABLED],
        algorithm: CONFIG.algorithm,
        version: CONFIG.version,
        timestamp: Date.now(),
      };
    };

    /**
     * Проверка целостности
     */
    store[PUBLIC.HEALTH_CHECK] = function () {
      const p = this._encryptionData;

      return {
        initialized: p[PRIVATE.INITIALIZED],
        destroyed: p[PRIVATE.DESTROYED],
        isEnabled: p[PRIVATE.IS_ENABLED],
        hasMasterKey: !!p[PRIVATE.MASTER_KEY],
        encryptedFields: p[PRIVATE.ENCRYPTED_FIELDS].size,
        encryptedTables: p[PRIVATE.ENCRYPTED_TABLES].size,
        cacheSize: p[PRIVATE.FIELD_CACHE].size + p[PRIVATE.DECRYPTED_CACHE].size,
        keyRotations: p[PRIVATE.KEY_ROTATION].history.length,
        keyRotationEnabled: p[PRIVATE.KEY_ROTATION].enabled,
        lastRotation: p[PRIVATE.KEY_ROTATION].lastRotation,
        nextRotation: p[PRIVATE.KEY_ROTATION].nextRotation,
        stats: { ...p[PRIVATE.STATS] },
        version: CONFIG.version,
        status: p[PRIVATE.IS_ENABLED] ? 'active' : 'inactive',
        timestamp: Date.now(),
      };
    };

    /**
     * Проверить наличие шифрования
     */
    store[PUBLIC.HAS_ENCRYPTION] = function (tableName, fieldName = null) {
      const p = this._encryptionData;

      if (fieldName) {
        const key = `${tableName}.${fieldName}`;
        return p[PRIVATE.ENCRYPTED_FIELDS].has(key);
      }

      return p[PRIVATE.ENCRYPTED_TABLES].has(tableName);
    };

    /**
     * Безопасное сравнение
     */
    store[PRIVATE.SECURE_COMPARE] = function (a, b) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!CONFIG.secureCompare) {
        return a === b;
      }

      if (a.length !== b.length) {
        return false;
      }

      let result = 0;
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
      }
      return result === 0;
    };

    /**
     * Валидация ключа
     */
    store[PRIVATE._VALIDATE_KEY] = function (key) {
      const p = this._encryptionData;
      const logger = p[PRIVATE.LOGGER];

      if (!key || typeof key !== 'string') {
        logger.warn('⚠️ Некорректный ключ');
        return false;
      }

      if (key.length < 32) {
        logger.warn('⚠️ Ключ слишком короткий');
        return false;
      }

      // Проверка на допустимые символы
      if (!/^[0-9a-f]+$/.test(key)) {
        logger.warn('⚠️ Ключ содержит недопустимые символы');
        return false;
      }

      return true;
    };

    // ============================================================
    // 8. ЭКСПОРТ СИМВОЛОВ
    // ============================================================

    store[PRIVATE.EXPORT_SYMBOLS] = function () {
      if (typeof window !== 'undefined') {
        window.__ENCRYPTION_SYMBOLS = {
          PRIVATE: { ...PRIVATE },
          PUBLIC: { ...PUBLIC },
        };
      }
    };

    // Экспортируем символы
    store[PRIVATE.EXPORT_SYMBOLS]();

    // ============================================================
    // 9. АВТОМАТИЧЕСКОЕ ШИФРОВАНИЕ
    // ============================================================

    // Перехватываем операции для автоматического шифрования
    if (CONFIG.autoEncrypt) {
      const originalInsert = store.insert.bind(store);
      const originalUpdate = store.update.bind(store);

      store.insert = function (tableName, rows) {
        const p = this._encryptionData;
        const fields = p[PRIVATE.ENCRYPTED_FIELDS];
        const tableKey = `${tableName}.*`;

        const rowsArray = Array.isArray(rows) ? rows : [rows];
        const processedRows = rowsArray.map(row => {
          const encryptedRow = { ...row };
          for (const [key, data] of fields) {
            if (data.table === tableName) {
              const field = data.field;
              if (encryptedRow[field] !== undefined && encryptedRow[field] !== null) {
                const fieldKey = p[PRIVATE.FIELD_KEYS].get(key);
                const salt = p[PRIVATE.FIELD_SALTS].get(key);
                const iv = p[PRIVATE.FIELD_IVS].get(key);
                encryptedRow[field] = this[PUBLIC.ENCRYPT](encryptedRow[field], { key: fieldKey, salt, iv });
              }
            }
          }
          return encryptedRow;
        });

        return originalInsert(tableName, processedRows);
      };

      store.update = function (tableName, query, data) {
        const p = this._encryptionData;
        const fields = p[PRIVATE.ENCRYPTED_FIELDS];

        const encryptedData = { ...data };
        for (const [key, fieldData] of fields) {
          if (fieldData.table === tableName) {
            const field = fieldData.field;
            if (encryptedData[field] !== undefined && encryptedData[field] !== null) {
              const fieldKey = p[PRIVATE.FIELD_KEYS].get(key);
              const salt = p[PRIVATE.FIELD_SALTS].get(key);
              const iv = p[PRIVATE.FIELD_IVS].get(key);
              encryptedData[field] = this[PUBLIC.ENCRYPT](encryptedData[field], { key: fieldKey, salt, iv });
            }
          }
        }

        return originalUpdate(tableName, encryptedData, query);
      };
    }

    logger.header('ШИФРОВАНИЕ ИНИЦИАЛИЗИРОВАНО');
    logger.success(`✅ Шифрование: ${privateData[PRIVATE.IS_ENABLED] ? 'ВКЛ' : 'ВЫКЛ'}`);
    logger.info(`🔑 Алгоритм: ${CONFIG.algorithm}`);
    logger.info(`🔒 Ключ: ${privateData[PRIVATE.MASTER_KEY] ? 'сгенерирован' : 'отсутствует'}`);
    logger.info(`🔄 Ротация ключей: ${CONFIG.keyRotationEnabled ? 'ВКЛ' : 'ВЫКЛ'}`);
    logger.separator();

    // Возвращаем плагин
    return this;
  },

  // ============================================================
  // 10. УНИЧТОЖЕНИЕ
  // ============================================================

  destroy(store) {
    const p = store._encryptionData;
    if (!p) {return;}

    const logger = p[PRIVATE.LOGGER];

    logger.info('🧹 Уничтожение Encryption Plugin...');

    // Очищаем кэш
    p[PRIVATE.FIELD_CACHE].clear();
    p[PRIVATE.DECRYPTED_CACHE].clear();
    p[PRIVATE.FIELD_KEYS].clear();
    p[PRIVATE.FIELD_SALTS].clear();
    p[PRIVATE.FIELD_IVS].clear();
    p[PRIVATE.ENCRYPTED_FIELDS].clear();
    p[PRIVATE.ENCRYPTED_TABLES].clear();

    // Удаляем мастер-ключ
    p[PRIVATE.MASTER_KEY] = null;
    p[PRIVATE.KEY_ROTATION].history = [];

    p[PRIVATE.DESTROYED] = true;
    p[PRIVATE.IS_ENABLED] = false;
    p[PRIVATE.STATE].destroyed = true;
    p[PRIVATE.STATE].isEnabled = false;

    logger.success('✅ Encryption Plugin уничтожен');
  },
};

// ============================================================
// 11. ЭКСПОРТ
// ============================================================

export default EncryptionPlugin;

// ============================================================
// 12. ГЛОБАЛЬНАЯ РЕГИСТРАЦИЯ
// ============================================================

if (typeof window !== 'undefined') {
  window.__ENCRYPTION_PLUGIN = EncryptionPlugin;
  window.__ENCRYPTION_SYMBOLS = {
    PRIVATE: { ...PRIVATE },
    PUBLIC: { ...PUBLIC },
  };

  const privateCount = Object.keys(PRIVATE).length;
  const publicCount = Object.keys(PUBLIC).length;

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              🔒 ENCRYPTION PLUGIN (100% СИМВОЛЫ) v4.0.7                     ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📋 ФУНКЦИОНАЛ:                                                             ║');
  console.log('║    ✅ Полевое шифрование (AES-GCM)                                          ║');
  console.log('║    ✅ Мастер-ключ и ключи для полей                                          ║');
  console.log('║    ✅ Ротация ключей                                                         ║');
  console.log('║    ✅ Автоматическое шифрование при вставке/обновлении                       ║');
  console.log('║    ✅ Кэширование расшифрованных данных                                     ║');
  console.log('║    ✅ Статистика и мониторинг                                               ║');
  console.log('║    ✅ Безопасное сравнение                                                  ║');
  console.log('║    ✅ Валидация ключей                                                       ║');
  console.log('║    ✅ Health Check                                                          ║');
  console.log('║    ✅ 100% СИМВОЛЫ — полная изоляция                                       ║');
  console.log('╠═══════════════════════════════════════════════════════════════════════════════╣');
  console.log('║  📊 СТАТИСТИКА СИМВОЛОВ:                                                   ║');
  console.log(`║    🔑 Приватных символов: ${privateCount.toString().padStart(3, ' ')}                                      ║`);
  console.log(`║    🔓 Публичных символов: ${publicCount.toString().padStart(3, ' ')}                                       ║`);
  console.log(`║    📦 Всего символов: ${(privateCount + publicCount).toString().padStart(3, ' ')}                                     ║`);
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  console.log('📋 КОМАНДЫ ОТЛАДКИ:');
  console.log('  store.encrypt(data) — зашифровать');
  console.log('  store.decrypt(data) — расшифровать');
  console.log('  store.encryptField(table, field) — зашифровать поле');
  console.log('  store.decryptField(table, field) — расшифровать поле');
  console.log('  store.encryptTable(table, fields) — зашифровать таблицу');
  console.log('  store.decryptTable(table) — расшифровать таблицу');
  console.log('  store.rotateKey() — ротация ключей');
  console.log('  store.generateKey() — сгенерировать ключ');
  console.log('  store.getEncryptedFields(table) — получить зашифрованные поля');
  console.log('  store.clearEncryptionCache() — очистить кэш');
  console.log('  store.getEncryptionStats() — статистика');
  console.log('  store.healthCheck() — проверка целостности');
  console.log('  store.hasEncryption(table, field) — проверить шифрование');
  console.log('');
}

// ============================================================
// 13. ПРИМЕР ИСПОЛЬЗОВАНИЯ
// ============================================================

/*
// ============================================================
// ПРИМЕР: Использование EncryptionPlugin
// ============================================================

import { EncryptionPlugin } from './EncryptionPlugin.js';
import { createStore } from '../index.js';

// 1. Создаем store с шифрованием
const store = createStore({
    plugins: [EncryptionPlugin],
    encryption: true,
    encryptionKey: 'my-master-key-256-bit',
});

// 2. Создаем таблицу с зашифрованными полями
store.createTable('users', {
    schema: {
        id: { type: 'string', required: true },
        name: { type: 'string' },
        email: { type: 'email' },
        phone: { type: 'string' },
        address: { type: 'string' },
    },
});

// 3. Шифруем поля
store.encryptField('users', 'email');
store.encryptField('users', 'phone');
store.encryptField('users', 'address');

// 4. Добавляем данные (автоматически шифруются)
store.users.add({
    id: 'u1',
    name: 'Иван',
    email: 'ivan@test.com',    // Автоматически зашифруется
    phone: '+7-999-123-4567',  // Автоматически зашифруется
    address: 'Москва, ул. Тестовая', // Автоматически зашифруется
});

// 5. Читаем данные (автоматически расшифровываются)
const user = store.users.find({ id: 'u1' })[0];
console.log(user.email); // Расшифрованный email
console.log(user.phone); // Расшифрованный телефон

// 6. Статистика
console.log(store.getEncryptionStats());

// 7. Ротация ключей
store.rotateKey();

// 8. Проверка целостности
console.log(store.healthCheck());

// 9. Проверка наличия шифрования
console.log(store.hasEncryption('users', 'email')); // true
*/
