// ============================================================
// controllers/demo.js — 100% СИМВОЛЫ — демо-данные
// Версия: 4.0.8 (МОДУЛЬНАЯ — ИСПРАВЛЕНА)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { PRIVATE } from '../symbols.js';
import { CONFIG } from '../config.js';
import { getAppState, setPrivate, setSelectedTable } from '../state.js';
import { renderAll } from '../render/index.js';
import { addLog } from '../logger.js';
import { isFunction, safeCall, escapeHtml } from '../utils.js';
import { showAlertInModal, showModal, closeModal } from '../modal.js';

// ============================================================
// 2. КОНСТАНТЫ
// ============================================================

// Готовые наборы демо-данных
const DEMO_TEMPLATES = {
  // Шаблон "Проекты"
  projects: {
    tables: {
      projects: {
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'completed', 'archived'] },
          priority: { type: 'number', min: 1, max: 5 },
          created_at: { type: 'datetime' },
          updated_at: { type: 'datetime' },
          owner_id: { type: 'string' },
          team_size: { type: 'number', min: 1 },
          budget: { type: 'number', min: 0 },
        },
        data: [
          {
            id: 'p1',
            name: '🚀 Проект Alpha',
            description: 'Разработка основного продукта',
            status: 'active',
            priority: 1,
            created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
            owner_id: 'u1',
            team_size: 5,
            budget: 100000,
          },
          {
            id: 'p2',
            name: '📊 Проект Beta',
            description: 'Аналитика и отчетность',
            status: 'active',
            priority: 2,
            created_at: Date.now() - 20 * 24 * 60 * 60 * 1000,
            owner_id: 'u2',
            team_size: 3,
            budget: 50000,
          },
          {
            id: 'p3',
            name: '🔧 Проект Gamma',
            description: 'Технический долг и рефакторинг',
            status: 'inactive',
            priority: 3,
            created_at: Date.now() - 10 * 24 * 60 * 60 * 1000,
            owner_id: 'u3',
            team_size: 2,
            budget: 25000,
          },
          {
            id: 'p4',
            name: '📱 Проект Delta',
            description: 'Мобильное приложение',
            status: 'active',
            priority: 1,
            created_at: Date.now() - 45 * 24 * 60 * 60 * 1000,
            owner_id: 'u1',
            team_size: 8,
            budget: 200000,
          },
          {
            id: 'p5',
            name: '☁️ Проект Epsilon',
            description: 'Облачная инфраструктура',
            status: 'completed',
            priority: 2,
            created_at: Date.now() - 60 * 24 * 60 * 60 * 1000,
            owner_id: 'u2',
            team_size: 4,
            budget: 150000,
          },
        ],
        relations: {
          tasks: { foreignKey: 'projectId', type: 'hasMany' },
          users: { foreignKey: 'id', type: 'belongsTo', localKey: 'owner_id' },
        },
      },
      tasks: {
        schema: {
          id: { type: 'string', required: true },
          projectId: { type: 'string', required: true },
          title: { type: 'string', required: true },
          description: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'in-progress', 'done', 'blocked'] },
          priority: { type: 'number', min: 1, max: 5 },
          assignee_id: { type: 'string' },
          due_date: { type: 'datetime' },
          created_at: { type: 'datetime' },
          updated_at: { type: 'datetime' },
          estimated_hours: { type: 'number', min: 0 },
          actual_hours: { type: 'number', min: 0 },
        },
        data: [
          {
            id: 't1',
            projectId: 'p1',
            title: 'Настройка инфраструктуры',
            description: 'Настройка серверов и CI/CD',
            status: 'done',
            priority: 1,
            assignee_id: 'u1',
            due_date: Date.now() - 5 * 24 * 60 * 60 * 1000,
            estimated_hours: 40,
            actual_hours: 45,
          },
          {
            id: 't2',
            projectId: 'p1',
            title: 'Разработка API',
            description: 'REST API для основного продукта',
            status: 'in-progress',
            priority: 1,
            assignee_id: 'u2',
            due_date: Date.now() + 7 * 24 * 60 * 60 * 1000,
            estimated_hours: 80,
            actual_hours: 60,
          },
          {
            id: 't3',
            projectId: 'p2',
            title: 'Дизайн интерфейса',
            description: 'UI/UX дизайн дашборда',
            status: 'pending',
            priority: 2,
            assignee_id: 'u3',
            due_date: Date.now() + 14 * 24 * 60 * 60 * 1000,
            estimated_hours: 30,
            actual_hours: 0,
          },
          {
            id: 't4',
            projectId: 'p1',
            title: 'Тестирование',
            description: 'Написание юнит-тестов',
            status: 'in-progress',
            priority: 2,
            assignee_id: 'u1',
            due_date: Date.now() + 3 * 24 * 60 * 60 * 1000,
            estimated_hours: 20,
            actual_hours: 10,
          },
          {
            id: 't5',
            projectId: 'p2',
            title: 'Настройка аналитики',
            description: 'Интеграция с Google Analytics',
            status: 'done',
            priority: 3,
            assignee_id: 'u2',
            due_date: Date.now() - 2 * 24 * 60 * 60 * 1000,
            estimated_hours: 15,
            actual_hours: 18,
          },
          {
            id: 't6',
            projectId: 'p3',
            title: 'Рефакторинг кода',
            description: 'Улучшение архитектуры',
            status: 'blocked',
            priority: 1,
            assignee_id: 'u3',
            due_date: Date.now() + 10 * 24 * 60 * 60 * 1000,
            estimated_hours: 50,
            actual_hours: 20,
          },
          {
            id: 't7',
            projectId: 'p4',
            title: 'Дизайн мобильного приложения',
            description: 'Создание дизайн-системы',
            status: 'done',
            priority: 1,
            assignee_id: 'u1',
            due_date: Date.now() - 10 * 24 * 60 * 60 * 1000,
            estimated_hours: 60,
            actual_hours: 65,
          },
          {
            id: 't8',
            projectId: 'p4',
            title: 'Разработка iOS',
            description: 'Основной функционал',
            status: 'in-progress',
            priority: 1,
            assignee_id: 'u2',
            due_date: Date.now() + 20 * 24 * 60 * 60 * 1000,
            estimated_hours: 120,
            actual_hours: 80,
          },
          {
            id: 't9',
            projectId: 'p4',
            title: 'Разработка Android',
            description: 'Основной функционал',
            status: 'pending',
            priority: 1,
            assignee_id: 'u3',
            due_date: Date.now() + 25 * 24 * 60 * 60 * 1000,
            estimated_hours: 120,
            actual_hours: 0,
          },
        ],
        relations: {
          projects: { foreignKey: 'id', type: 'belongsTo', localKey: 'projectId' },
          users: { foreignKey: 'id', type: 'belongsTo', localKey: 'assignee_id' },
        },
      },
      users: {
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          email: { type: 'email', required: true },
          role: { type: 'string', enum: ['admin', 'manager', 'developer', 'designer', 'tester'] },
          avatar: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'busy'] },
          created_at: { type: 'datetime' },
          last_login: { type: 'datetime' },
          skills: { type: 'array' },
          projects: { type: 'array' },
        },
        data: [
          {
            id: 'u1',
            name: 'Иван Иванов',
            email: 'ivan@test.com',
            role: 'developer',
            status: 'active',
            created_at: Date.now() - 90 * 24 * 60 * 60 * 1000,
            last_login: Date.now() - 2 * 24 * 60 * 60 * 1000,
            skills: ['JavaScript', 'React', 'Node.js'],
            projects: ['p1', 'p4'],
          },
          {
            id: 'u2',
            name: 'Петр Петров',
            email: 'petr@test.com',
            role: 'developer',
            status: 'active',
            created_at: Date.now() - 85 * 24 * 60 * 60 * 1000,
            last_login: Date.now() - 1 * 24 * 60 * 60 * 1000,
            skills: ['Python', 'Django', 'PostgreSQL'],
            projects: ['p1', 'p2'],
          },
          {
            id: 'u3',
            name: 'Мария Сидорова',
            email: 'maria@test.com',
            role: 'manager',
            status: 'active',
            created_at: Date.now() - 95 * 24 * 60 * 60 * 1000,
            last_login: Date.now() - 3 * 24 * 60 * 60 * 1000,
            skills: ['Management', 'Agile', 'Scrum'],
            projects: ['p2', 'p3', 'p4'],
          },
          {
            id: 'u4',
            name: 'Алексей Смирнов',
            email: 'alex@test.com',
            role: 'designer',
            status: 'active',
            created_at: Date.now() - 80 * 24 * 60 * 60 * 1000,
            last_login: Date.now() - 5 * 24 * 60 * 60 * 1000,
            skills: ['Figma', 'Sketch', 'UX/UI'],
            projects: ['p2', 'p4'],
          },
          {
            id: 'u5',
            name: 'Ольга Козлова',
            email: 'olga@test.com',
            role: 'tester',
            status: 'busy',
            created_at: Date.now() - 75 * 24 * 60 * 60 * 1000,
            last_login: Date.now() - 1 * 24 * 60 * 60 * 1000,
            skills: ['Selenium', 'Jest', 'Cypress'],
            projects: ['p1'],
          },
        ],
        relations: {
          projects: { foreignKey: 'id', type: 'hasMany', through: 'members' },
          tasks: { foreignKey: 'id', type: 'hasMany', localKey: 'assignee_id' },
        },
      },
    },
  },

  // Шаблон "Интернет-магазин"
  ecommerce: {
    tables: {
      products: {
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          description: { type: 'string' },
          price: { type: 'number', required: true, min: 0 },
          category: { type: 'string' },
          stock: { type: 'number', min: 0 },
          rating: { type: 'number', min: 0, max: 5 },
          created_at: { type: 'datetime' },
        },
        data: [
          {
            id: 'prod1',
            name: 'Ноутбук Pro',
            description: 'Мощный ноутбук для разработки',
            price: 150000,
            category: 'electronics',
            stock: 15,
            rating: 4.8,
          },
          {
            id: 'prod2',
            name: 'Смартфон X',
            description: 'Флагманский смартфон',
            price: 80000,
            category: 'electronics',
            stock: 25,
            rating: 4.6,
          },
          {
            id: 'prod3',
            name: 'Наушники',
            description: 'Беспроводные наушники с шумоподавлением',
            price: 15000,
            category: 'audio',
            stock: 50,
            rating: 4.4,
          },
          {
            id: 'prod4',
            name: 'Клавиатура',
            description: 'Механическая клавиатура для геймеров',
            price: 8000,
            category: 'accessories',
            stock: 30,
            rating: 4.2,
          },
          {
            id: 'prod5',
            name: 'Монитор 4K',
            description: 'Профессиональный монитор 4K',
            price: 60000,
            category: 'electronics',
            stock: 10,
            rating: 4.7,
          },
        ],
      },
      orders: {
        schema: {
          id: { type: 'string', required: true },
          user_id: { type: 'string', required: true },
          products: { type: 'array' },
          total: { type: 'number', required: true },
          status: {
            type: 'string',
            enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
          },
          created_at: { type: 'datetime' },
          updated_at: { type: 'datetime' },
        },
        data: [
          {
            id: 'ord1',
            user_id: 'u1',
            products: [
              { id: 'prod1', qty: 1 },
              { id: 'prod3', qty: 2 },
            ],
            total: 180000,
            status: 'delivered',
            created_at: Date.now() - 10 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'ord2',
            user_id: 'u2',
            products: [{ id: 'prod2', qty: 1 }],
            total: 80000,
            status: 'processing',
            created_at: Date.now() - 2 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'ord3',
            user_id: 'u3',
            products: [
              { id: 'prod4', qty: 2 },
              { id: 'prod5', qty: 1 },
            ],
            total: 76000,
            status: 'shipped',
            created_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
          },
        ],
      },
      users: {
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          email: { type: 'email', required: true },
          address: { type: 'string' },
          phone: { type: 'string' },
          orders_count: { type: 'number' },
          created_at: { type: 'datetime' },
        },
        data: [
          {
            id: 'u1',
            name: 'Иван Иванов',
            email: 'ivan@shop.com',
            address: 'Москва, ул. Тверская 1',
            phone: '+7-999-111-2233',
            orders_count: 5,
          },
          {
            id: 'u2',
            name: 'Петр Петров',
            email: 'petr@shop.com',
            address: 'СПБ, Невский пр. 2',
            phone: '+7-999-222-3344',
            orders_count: 3,
          },
          {
            id: 'u3',
            name: 'Мария Сидорова',
            email: 'maria@shop.com',
            address: 'Казань, ул. Баумана 3',
            phone: '+7-999-333-4455',
            orders_count: 7,
          },
        ],
      },
    },
  },

  // Шаблон "Блог"
  blog: {
    tables: {
      posts: {
        schema: {
          id: { type: 'string', required: true },
          title: { type: 'string', required: true },
          content: { type: 'string', required: true },
          author_id: { type: 'string', required: true },
          status: { type: 'string', enum: ['draft', 'published', 'archived'] },
          tags: { type: 'array' },
          views: { type: 'number' },
          likes: { type: 'number' },
          created_at: { type: 'datetime' },
          published_at: { type: 'datetime' },
        },
        data: [
          {
            id: 'post1',
            title: 'Введение в Enterprise Store',
            content: 'Подробное руководство по использованию...',
            author_id: 'u1',
            status: 'published',
            tags: ['tutorial', 'store'],
            views: 1500,
            likes: 45,
            created_at: Date.now() - 30 * 24 * 60 * 60 * 1000,
            published_at: Date.now() - 28 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'post2',
            title: 'Плагины в Global Store',
            content: 'Как создавать и использовать плагины...',
            author_id: 'u2',
            status: 'published',
            tags: ['plugins', 'advanced'],
            views: 800,
            likes: 28,
            created_at: Date.now() - 20 * 24 * 60 * 60 * 1000,
            published_at: Date.now() - 18 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'post3',
            title: '100% Символы в JavaScript',
            content: 'Полная изоляция через символы...',
            author_id: 'u1',
            status: 'draft',
            tags: ['symbols', 'security'],
            views: 0,
            likes: 0,
            created_at: Date.now() - 5 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'post4',
            title: 'Оптимизация производительности',
            content: 'Советы по оптимизации...',
            author_id: 'u3',
            status: 'published',
            tags: ['performance', 'optimization'],
            views: 1200,
            likes: 52,
            created_at: Date.now() - 45 * 24 * 60 * 60 * 1000,
            published_at: Date.now() - 43 * 24 * 60 * 60 * 1000,
          },
        ],
      },
      authors: {
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          email: { type: 'email' },
          bio: { type: 'string' },
          posts_count: { type: 'number' },
          joined_at: { type: 'datetime' },
        },
        data: [
          {
            id: 'u1',
            name: 'Иван Иванов',
            email: 'ivan@blog.com',
            bio: 'Senior Developer',
            posts_count: 12,
            joined_at: Date.now() - 365 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'u2',
            name: 'Петр Петров',
            email: 'petr@blog.com',
            bio: 'Tech Lead',
            posts_count: 8,
            joined_at: Date.now() - 300 * 24 * 60 * 60 * 1000,
          },
          {
            id: 'u3',
            name: 'Мария Сидорова',
            email: 'maria@blog.com',
            bio: 'UX Designer',
            posts_count: 5,
            joined_at: Date.now() - 250 * 24 * 60 * 60 * 1000,
          },
        ],
      },
    },
  },
};

// ============================================================
// 3. ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ ДЕМО-ДАННЫХ
// ============================================================

/**
 * Инициализация демо-данных
 * 100% символы — полная изоляция
 */
export function initDemoData() {
  const state = getAppState();

  // Проверка: уже загружены
  if (state[PRIVATE.DEMO_LOADED]) {
    addLog('📦 Демо-данные уже загружены', 'info');
    showAlertInModal('ℹ️ Информация', 'Демо-данные уже загружены.', 'info');
    return;
  }

  // Проверка доступности хранилища
  if (!db) {
    addLog('⚠️ Хранилище не доступно, пропускаем загрузку демо-данных', 'warn');
    showAlertInModal('⚠️ Ошибка', 'Хранилище не доступно. Перезагрузите страницу.', 'error');
    return;
  }

  if (!isFunction(db.listTables)) {
    addLog('⚠️ Метод listTables не доступен, пропускаем загрузку демо-данных', 'warn');
    showAlertInModal('⚠️ Ошибка', 'Метод listTables не доступен.', 'error');
    return;
  }

  try {
    // Проверка: есть ли уже данные
    const tables = db.listTables();
    if (tables && tables.length > 0) {
      addLog('📦 Данные уже существуют, пропускаем загрузку', 'info');

      // ★★★ ИСПРАВЛЕНО: ПРАВИЛЬНАЯ ПЕРЕДАЧА КОЛБЭКОВ ★★★
      showAlertInModal(
        'ℹ️ Информация',
        'В хранилище уже есть данные. Хотите загрузить демо-данные поверх существующих?',
        // ★★★ ПЕРВЫЙ КОЛБЭК — ПРИ НАЖАТИИ "ПОДТВЕРДИТЬ" ★★★
        function onConfirm() {
          addLog('✅ Загрузка демо-данных подтверждена', 'info');
          loadDemoData();
          // После загрузки данных обновляем интерфейс
          renderAll();
          addLog('🔄 Интерфейс обновлен после загрузки демо-данных', 'info');
        },
        // ★★★ ВТОРОЙ КОЛБЭК — ПРИ НАЖАТИИ "ОТМЕНА" ★★★
        function onCancel() {
          state[PRIVATE.DEMO_LOADED] = true;
          addLog('ℹ️ Загрузка демо-данных пропущена', 'info');
          // Обновляем интерфейс, чтобы показать существующие таблицы
          renderAll();
          addLog('🔄 Интерфейс обновлен (демо-данные не загружены)', 'info');
        }
      );
      return;
    }

    // Загружаем демо-данные (если таблиц нет)
    loadDemoData();
  } catch (error) {
    addLog(`⚠️ Ошибка проверки таблиц: ${error.message}`, 'warn');
    showAlertInModal('❌ Ошибка', `Не удалось загрузить демо-данные: ${error.message}`, 'error');
  }
}

// ============================================================
// 4. ЗАГРУЗКА ДЕМО-ДАННЫХ
// ============================================================

function loadDemoData() {
  const state = getAppState();

  addLog('📦 Начинаем загрузку демо-данных...', 'info');

  try {
    // Загружаем стандартный шаблон
    const template = DEMO_TEMPLATES.projects;

    // Проверяем наличие необходимых методов
    if (!isFunction(db.createTable)) {
      addLog('⚠️ Метод createTable не доступен', 'warn');
      showAlertInModal('⚠️ Ошибка', 'Метод createTable не доступен.', 'error');
      return;
    }

    if (!isFunction(db.insert)) {
      addLog('⚠️ Метод insert не доступен', 'warn');
      showAlertInModal('⚠️ Ошибка', 'Метод insert не доступен.', 'error');
      return;
    }

    // Создаем таблицы и заполняем данными
    let createdCount = 0;
    let insertedCount = 0;

    for (const [tableName, tableDef] of Object.entries(template.tables)) {
      // Создаем таблицу
      db.createTable(tableName, {
        schema: tableDef.schema || {},
        metadata: { description: `Демо-данные: ${tableName}` },
      });
      createdCount++;

      // Вставляем данные
      if (tableDef.data && tableDef.data.length > 0) {
        db.insert(tableName, tableDef.data);
        insertedCount += tableDef.data.length;
        addLog(`✅ Вставлено ${tableDef.data.length} записей в ${tableName}`, 'debug');
      }

      // Настраиваем связи
      if (tableDef.relations) {
        for (const [relTable, relDef] of Object.entries(tableDef.relations)) {
          if (isFunction(db.link)) {
            try {
              db.link(tableName, relTable, relDef.foreignKey || 'id');
              addLog(`🔗 Создана связь: ${tableName} → ${relTable}`, 'debug');
            } catch (error) {
              addLog(
                `⚠️ Ошибка создания связи ${tableName} → ${relTable}: ${error.message}`,
                'warn'
              );
            }
          }
        }
      }
    }

    // Выбираем первую таблицу
    if (isFunction(db.select) && template.tables.projects) {
      try {
        db.select('projects', 'p1');
      } catch (error) {
        // Игнорируем
      }
    }

    // Устанавливаем выбранную таблицу
    setSelectedTable('projects');
    state[PRIVATE.DEMO_LOADED] = true;

    addLog(`✅ Демо-данные загружены: ${createdCount} таблиц, ${insertedCount} записей`, 'success');

    // ★★★ ОБНОВЛЯЕМ ИНТЕРФЕЙС ★★★
    renderAll();

    // Показываем сообщение об успехе
    showAlertInModal(
      '✅ Демо-данные загружены',
      `Создано ${createdCount} таблиц, добавлено ${insertedCount} записей.`,
      'success'
    );
  } catch (error) {
    addLog(`⚠️ Ошибка загрузки демо-данных: ${error.message}`, 'warn');
    console.warn('⚠️ Ошибка загрузки демо-данных:', error);
    showAlertInModal('❌ Ошибка', `Не удалось загрузить демо-данные: ${error.message}`, 'error');
  }
}

// ============================================================
// 5. ЗАГРУЗКА КОНКРЕТНОГО ШАБЛОНА
// ============================================================

/**
 * Загрузка конкретного шаблона демо-данных
 */
export function loadDemoTemplate(templateName) {
  const state = getAppState();

  if (!templateName || !DEMO_TEMPLATES[templateName]) {
    showAlertInModal('⚠️ Ошибка', `Шаблон "${templateName}" не найден`, 'warning');
    return false;
  }

  // Проверка: данные уже загружены
  if (state[PRIVATE.DEMO_LOADED]) {
    showModal(
      '⚠️ Данные уже загружены',
      `<p style="color:var(--es-text-muted);">Демо-данные уже загружены. Загрузить другой шаблон?</p>
       <p style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">Текущие данные будут заменены.</p>`,
      () => {
        // Очищаем существующие данные
        clearAllTables();
        // Загружаем новый шаблон
        loadTemplateData(templateName);
      },
      () => {
        showAlertInModal('ℹ️ Отменено', 'Загрузка шаблона отменена', 'info');
      }
    );
    return false;
  }

  // Загружаем шаблон
  return loadTemplateData(templateName);
}

/**
 * Внутренняя функция загрузки шаблона
 */
function loadTemplateData(templateName) {
  const state = getAppState();
  const template = DEMO_TEMPLATES[templateName];

  if (!template) {
    showAlertInModal('❌ Ошибка', `Шаблон "${templateName}" не найден`, 'error');
    return false;
  }

  addLog(`📦 Загрузка шаблона: ${templateName}`, 'info');

  try {
    let createdCount = 0;
    let insertedCount = 0;

    for (const [tableName, tableDef] of Object.entries(template.tables)) {
      // Создаем таблицу
      if (isFunction(db.createTable)) {
        db.createTable(tableName, {
          schema: tableDef.schema || {},
          metadata: { description: `Демо-данные: ${tableName} (${templateName})` },
        });
        createdCount++;
      }

      // Вставляем данные
      if (tableDef.data && tableDef.data.length > 0) {
        if (isFunction(db.insert)) {
          db.insert(tableName, tableDef.data);
          insertedCount += tableDef.data.length;
        }
      }

      // Настраиваем связи
      if (tableDef.relations && isFunction(db.link)) {
        for (const [relTable, relDef] of Object.entries(tableDef.relations)) {
          try {
            db.link(tableName, relTable, relDef.foreignKey || 'id');
          } catch (error) {
            addLog(`⚠️ Ошибка создания связи ${tableName} → ${relTable}: ${error.message}`, 'warn');
          }
        }
      }
    }

    // Выбираем первую таблицу
    const firstTable = Object.keys(template.tables)[0];
    if (firstTable) {
      setSelectedTable(firstTable);
    }

    state[PRIVATE.DEMO_LOADED] = true;
    state[PRIVATE.DEMO_TEMPLATE] = templateName;

    addLog(
      `✅ Шаблон "${templateName}" загружен: ${createdCount} таблиц, ${insertedCount} записей`,
      'success'
    );

    // ★★★ ОБНОВЛЯЕМ ИНТЕРФЕЙС ★★★
    renderAll();

    showAlertInModal(
      '✅ Шаблон загружен',
      `"${templateName}": ${createdCount} таблиц, ${insertedCount} записей.`,
      'success'
    );

    return true;
  } catch (error) {
    addLog(`❌ Ошибка загрузки шаблона "${templateName}": ${error.message}`, 'error');
    showAlertInModal('❌ Ошибка', `Не удалось загрузить шаблон: ${error.message}`, 'error');
    return false;
  }
}

// ============================================================
// 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Очистка всех таблиц
 */
function clearAllTables() {
  try {
    if (isFunction(db.listTables)) {
      const tables = db.listTables();
      for (const name of tables) {
        if (isFunction(db.dropTable)) {
          db.dropTable(name);
        } else if (isFunction(db.clearTable)) {
          db.clearTable(name);
        }
      }
      addLog(`🧹 Очищено ${tables.length} таблиц`, 'info');
    }
  } catch (error) {
    addLog(`⚠️ Ошибка очистки таблиц: ${error.message}`, 'warn');
  }
}

/**
 * Получение списка доступных шаблонов
 */
export function getDemoTemplates() {
  return Object.keys(DEMO_TEMPLATES).map(name => ({
    name,
    tables: Object.keys(DEMO_TEMPLATES[name].tables),
    totalRecords: Object.values(DEMO_TEMPLATES[name].tables).reduce(
      (sum, table) => sum + (table.data ? table.data.length : 0),
      0
    ),
  }));
}

/**
 * Показать диалог выбора шаблона
 */
export function showTemplateSelector() {
  const templates = getDemoTemplates();

  let html = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="color:var(--es-text-muted);font-size:13px;">Выберите шаблон для загрузки демо-данных:</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
  `;

  for (const template of templates) {
    html += `
      <button class="btn btn-secondary template-btn" data-template="${template.name}" style="text-align:center;padding:12px;flex-direction:column;gap:4px;">
        <div style="font-size:16px;font-weight:500;">📦 ${template.name}</div>
        <div style="font-size:11px;color:var(--es-text-dim);">
          ${template.tables.length} таблиц, ${template.totalRecords} записей
        </div>
      </button>
    `;
  }

  html += `
      </div>
    </div>
  `;

  showModal(
    '📦 Выбор шаблона демо-данных',
    html,
    data => {
      // Обработка выбора через делегирование
    },
    () => {
      addLog('ℹ️ Выбор шаблона отменен', 'info');
    }
  );

  // Добавляем обработчики после рендеринга
  setTimeout(() => {
    const buttons = document.querySelectorAll('.template-btn');
    for (const btn of buttons) {
      btn.addEventListener('click', () => {
        const templateName = btn.dataset.template;
        closeModal(templateName);
        loadDemoTemplate(templateName);
      });
    }
  }, 100);
}

/**
 * Сброс демо-данных
 */
export function resetDemoData() {
  const state = getAppState();

  if (!state[PRIVATE.DEMO_LOADED]) {
    showAlertInModal('ℹ️ Информация', 'Демо-данные не загружены', 'info');
    return;
  }

  showModal(
    '🔄 Сброс демо-данных',
    `<p style="color:var(--es-text-muted);">Вы уверены, что хотите сбросить демо-данные?</p>
     <p style="font-size:11px;color:var(--es-text-dim);margin-top:4px;">Все данные будут удалены.</p>`,
    () => {
      clearAllTables();
      state[PRIVATE.DEMO_LOADED] = false;
      state[PRIVATE.DEMO_TEMPLATE] = null;
      setSelectedTable(null);
      renderAll();
      addLog('🔄 Демо-данные сброшены', 'info');
      showAlertInModal('🔄 Сброшено', 'Демо-данные сброшены', 'success');
    },
    () => {
      addLog('ℹ️ Сброс демо-данных отменен', 'info');
    }
  );
}

// ============================================================
// 7. ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЙ API
// ============================================================

// Добавляем функции в глобальный объект app
if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};

  window.app.initDemoData = initDemoData;
  window.app.loadDemoTemplate = loadDemoTemplate;
  window.app.getDemoTemplates = getDemoTemplates;
  window.app.showTemplateSelector = showTemplateSelector;
  window.app.resetDemoData = resetDemoData;

  window.app.getDemoStatus = () => {
    const state = getAppState();
    return {
      loaded: state[PRIVATE.DEMO_LOADED] || false,
      template: state[PRIVATE.DEMO_TEMPLATE] || null,
      tables: isFunction(db.listTables) ? db.listTables() : [],
    };
  };

  console.log('📋 Команды для демо-данных:');
  console.log('  window.app.initDemoData() — загрузить стандартные демо-данные');
  console.log('  window.app.loadDemoTemplate(name) — загрузить шаблон');
  console.log('  window.app.getDemoTemplates() — список шаблонов');
  console.log('  window.app.showTemplateSelector() — выбрать шаблон через UI');
  console.log('  window.app.resetDemoData() — сбросить демо-данные');
  console.log('  window.app.getDemoStatus() — статус демо-данных');
}

// ============================================================
// 8. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  initDemoData,
  loadDemoTemplate,
  getDemoTemplates,
  showTemplateSelector,
  resetDemoData,
  DEMO_TEMPLATES,
  getDemoStatus: () => {
    const state = getAppState();
    return {
      loaded: state[PRIVATE.DEMO_LOADED] || false,
      template: state[PRIVATE.DEMO_TEMPLATE] || null,
      tables: isFunction(db.listTables) ? db.listTables() : [],
    };
  },
};

// ============================================================
// 9. СТАТИСТИКА СИМВОЛОВ
// ============================================================

if (typeof console !== 'undefined') {
  console.log('📊 DEMO CONTROLLER SYMBOLS STATS:');
  console.log('  🔑 Приватных символов: используется PRIVATE из symbols.js');
  console.log('  📦 Шаблонов: ' + Object.keys(DEMO_TEMPLATES).length);
  console.log(
    '  📋 Всего таблиц: ' +
      Object.keys(DEMO_TEMPLATES).reduce((acc, name) => {
        return acc + Object.keys(DEMO_TEMPLATES[name].tables).length;
      }, 0)
  );
  console.log(
    '  📝 Всего записей: ' +
      Object.keys(DEMO_TEMPLATES).reduce((acc, name) => {
        const tables = DEMO_TEMPLATES[name].tables;
        let count = 0;
        for (const table of Object.values(tables)) {
          count += table.data ? table.data.length : 0;
        }
        return acc + count;
      }, 0)
  );
}

// ============================================================
// 10. КОНЕЦ ФАЙЛА
// ============================================================
