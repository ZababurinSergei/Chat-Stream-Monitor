// ============================================================
// render/plugins.js — 100% СИМВОЛЫ — рендеринг плагинов
// Версия: 4.0.8 (МОДУЛЬНАЯ)
// ============================================================

// ============================================================
// 1. ИМПОРТЫ
// ============================================================

import { db } from '../../index.js';
import { DOM } from '../dom.js';
import { PRIVATE } from '../symbols.js';
import { isFunction, formatJson, escapeHtml, safeCall } from '../utils.js';
import { showAlertInModal, showModal } from '../modal.js';
import { addLog } from '../logger.js';

// ============================================================
// 2. ОСНОВНАЯ ФУНКЦИЯ РЕНДЕРИНГА
// ============================================================

/**
 * Рендеринг списка плагинов
 * 100% символы — полная изоляция
 */
export function renderPlugins() {
  try {
    const container = DOM.pluginsContainer;
    if (!container) {
      console.warn('⚠️ pluginsContainer не найден в DOM');
      return;
    }

    // Получаем список плагинов
    const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];

    if (plugins.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="emoji">🔌</span>
          Нет плагинов
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">
            Плагины расширяют функциональность хранилища
          </div>
        </div>
      `;
      if (DOM.pluginSymbols) {
        DOM.pluginSymbols.textContent = '🔑 0';
      }
      return;
    }

    // ============================================================
    // 3. ПОСТРОЕНИЕ HTML
    // ============================================================

    let html = `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;background:var(--es-bg-tertiary);border-radius:4px;font-size:11px;color:var(--es-text-muted);">
          <span>Всего плагинов: <strong style="color:var(--es-text-secondary);">${plugins.length}</strong></span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-xs" id="refreshPluginsBtn">🔄 Обновить</button>
            <button class="btn btn-success btn-xs" id="registerPluginBtn">➕ Зарегистрировать</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:6px;">
    `;

    // ============================================================
    // 4. РЕНДЕРИНГ КАЖДОГО ПЛАГИНА
    // ============================================================

    let activeCount = 0;
    let errorCount = 0;

    for (const name of plugins) {
      const plugin = isFunction(db.getPlugin) ? db.getPlugin(name) : null;
      const isActive = plugin && plugin._isActive !== false;
      const hasError = plugin && plugin._hasError;

      if (isActive) activeCount++;
      if (hasError) errorCount++;

      // Получаем метаданные плагина
      const metadata = plugin?.metadata || {};
      const version = plugin?.version || metadata?.version || '1.0.0';
      const description = metadata?.description || plugin?.description || 'Нет описания';
      const author = metadata?.author || plugin?.author || 'Неизвестен';
      const dependencies = plugin?.dependencies || metadata?.dependencies || [];

      // Получаем состояние плагина
      const state = plugin?._state || {};
      const initialized = state?.initialized !== false;
      const registered = plugin?._registered || Date.now();

      // Получаем статистику плагина (если есть)
      const stats = safeCall(() => {
        if (isFunction(plugin.getStats)) return plugin.getStats();
        if (isFunction(plugin.stats)) return plugin.stats();
        return null;
      });

      html += `
        <div style="background:var(--es-bg-tertiary);border-radius:6px;border:1px solid ${isActive ? 'var(--es-border-primary)' : 'var(--es-accent-red)'};padding:10px 12px;transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;">${isActive ? '🔌' : '⛔'}</span>
              <span style="font-weight:600;color:var(--es-text-secondary);font-size:13px;">${escapeHtml(name)}</span>
              ${version ? `<span style="font-size:10px;color:var(--es-text-muted);background:var(--es-bg-primary);padding:1px 8px;border-radius:10px;">v${escapeHtml(version)}</span>` : ''}
            </div>
            <div style="display:flex;gap:4px;">
              <span style="font-size:10px;color:${isActive ? 'var(--es-accent-green)' : 'var(--es-accent-red)'};background:${isActive ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)'};padding:1px 8px;border-radius:10px;border:1px solid ${isActive ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)'};">
                ${isActive ? '✅ Активен' : '❌ Неактивен'}
              </span>
              ${hasError ? `<span style="font-size:10px;color:var(--es-accent-red);background:rgba(239,68,68,0.1);padding:1px 8px;border-radius:10px;border:1px solid rgba(239,68,68,0.2);">⚠️ Ошибка</span>` : ''}
              ${initialized ? `<span style="font-size:10px;color:var(--es-accent-blue-light);background:rgba(96,165,250,0.1);padding:1px 8px;border-radius:10px;border:1px solid rgba(96,165,250,0.2);">✅ Инициализирован</span>` : ''}
            </div>
          </div>

          <div style="font-size:11px;color:var(--es-text-muted);margin-bottom:4px;line-height:1.5;">
            ${escapeHtml(description)}
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px;color:var(--es-text-dim);margin-top:4px;">
            ${author ? `<span>👤 ${escapeHtml(author)}</span>` : ''}
            ${dependencies.length > 0 ? `<span>📦 Зависимости: ${dependencies.map(d => escapeHtml(d)).join(', ')}</span>` : ''}
            ${registered ? `<span>📅 ${new Date(registered).toLocaleString()}</span>` : ''}
          </div>

          ${
            stats
              ? `
            <div style="margin-top:6px;padding:6px 8px;background:var(--es-bg-primary);border-radius:4px;font-size:10px;font-family:monospace;color:var(--es-text-muted);border:1px solid var(--es-border-secondary);">
              <div style="display:flex;flex-wrap:wrap;gap:8px;">
                ${Object.entries(stats)
                  .slice(0, 4)
                  .map(
                    ([key, value]) =>
                      `<span><span style="color:var(--es-accent-blue-light);">${escapeHtml(key)}</span>: ${escapeHtml(String(value).substring(0, 30))}</span>`
                  )
                  .join('')}
                ${Object.keys(stats).length > 4 ? `<span style="color:var(--es-text-dim);">+${Object.keys(stats).length - 4} еще</span>` : ''}
              </div>
            </div>
          `
              : ''
          }

          ${
            hasError && plugin?.error
              ? `
            <div style="margin-top:6px;padding:4px 8px;background:rgba(239,68,68,0.1);border-radius:4px;font-size:10px;color:var(--es-accent-red);border:1px solid rgba(239,68,68,0.2);">
              ❌ ${escapeHtml(plugin.error)}
            </div>
          `
              : ''
          }

          <div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-xs" data-plugin="${escapeHtml(name)}" data-action="info">ℹ️ Информация</button>
            ${
              isActive
                ? `<button class="btn btn-warning btn-xs" data-plugin="${escapeHtml(name)}" data-action="disable">⏸ Отключить</button>`
                : `<button class="btn btn-success btn-xs" data-plugin="${escapeHtml(name)}" data-action="enable">▶ Включить</button>`
            }
            <button class="btn btn-secondary btn-xs" data-plugin="${escapeHtml(name)}" data-action="reload">🔄 Перезагрузить</button>
            <button class="btn btn-danger btn-xs" data-plugin="${escapeHtml(name)}" data-action="unregister">🗑 Удалить</button>
            ${
              isFunction(plugin?.execute)
                ? `<button class="btn btn-primary btn-xs" data-plugin="${escapeHtml(name)}" data-action="execute">⚡ Выполнить</button>`
                : ''
            }
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // ============================================================
    // 5. ОБНОВЛЕНИЕ СТАТИСТИКИ
    // ============================================================

    if (DOM.pluginSymbols) {
      DOM.pluginSymbols.textContent = `🔑 ${plugins.length} плагинов (${activeCount} активных)`;
    }

    // ============================================================
    // 6. ОБРАБОТЧИКИ СОБЫТИЙ
    // ============================================================

    // Кнопка обновления
    const refreshBtn = container.querySelector('#refreshPluginsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        renderPlugins();
        addLog('🔄 Список плагинов обновлен', 'info');
      });
    }

    // Кнопка регистрации плагина
    const registerBtn = container.querySelector('#registerPluginBtn');
    if (registerBtn) {
      registerBtn.addEventListener('click', showRegisterPluginModal);
    }

    // Обработчики для кнопок плагинов
    container.querySelectorAll('[data-plugin]').forEach(btn => {
      btn.addEventListener('click', e => {
        const pluginName = btn.dataset.plugin;
        const action = btn.dataset.action;
        handlePluginAction(pluginName, action);
      });
    });

    // ============================================================
    // 7. ИНИЦИАЛИЗАЦИЯ ДОПОЛНИТЕЛЬНЫХ ФУНКЦИЙ
    // ============================================================

    // Добавляем возможность перетаскивания для сортировки плагинов
    initializeDragAndDrop(container);
  } catch (error) {
    console.warn('⚠️ Ошибка рендеринга плагинов:', error);
    const container = DOM.pluginsContainer;
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="color:#ef4444;">
          <span class="emoji">❌</span>
          Ошибка загрузки плагинов
          <div style="font-size:11px;color:#4a5a7a;margin-top:4px;">${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }
}

// ============================================================
// 8. ОБРАБОТКА ДЕЙСТВИЙ С ПЛАГИНАМИ
// ============================================================

/**
 * Обработка действий с плагином
 */
function handlePluginAction(pluginName, action) {
  const plugin = isFunction(db.getPlugin) ? db.getPlugin(pluginName) : null;

  if (!plugin && action !== 'register') {
    showAlertInModal('⚠️ Плагин не найден', `Плагин "${pluginName}" не найден.`, 'warning');
    return;
  }

  switch (action) {
    case 'info':
      showPluginInfo(pluginName, plugin);
      break;
    case 'disable':
      disablePlugin(pluginName, plugin);
      break;
    case 'enable':
      enablePlugin(pluginName, plugin);
      break;
    case 'reload':
      reloadPlugin(pluginName, plugin);
      break;
    case 'unregister':
      unregisterPlugin(pluginName, plugin);
      break;
    case 'execute':
      executePlugin(pluginName, plugin);
      break;
    default:
      console.warn(`⚠️ Неизвестное действие: ${action}`);
  }
}

// ============================================================
// 9. ПОКАЗ ИНФОРМАЦИИ О ПЛАГИНЕ
// ============================================================

function showPluginInfo(pluginName, plugin) {
  const metadata = plugin?.metadata || {};
  const state = plugin?._state || {};
  const stats = safeCall(() => {
    if (isFunction(plugin.getStats)) return plugin.getStats();
    if (isFunction(plugin.stats)) return plugin.stats();
    return null;
  });

  const infoHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:32px;">🔌</span>
        <div>
          <div style="font-size:18px;font-weight:600;color:var(--es-text-secondary);">${escapeHtml(pluginName)}</div>
          <div style="font-size:12px;color:var(--es-text-muted);">${escapeHtml(metadata?.description || plugin?.description || 'Нет описания')}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Версия</div>
          <div style="font-size:13px;color:var(--es-text-secondary);">${escapeHtml(plugin?.version || metadata?.version || '1.0.0')}</div>
        </div>
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Автор</div>
          <div style="font-size:13px;color:var(--es-text-secondary);">${escapeHtml(metadata?.author || plugin?.author || 'Неизвестен')}</div>
        </div>
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Состояние</div>
          <div style="font-size:13px;color:${plugin?._isActive !== false ? 'var(--es-accent-green)' : 'var(--es-accent-red)'};">
            ${plugin?._isActive !== false ? '✅ Активен' : '❌ Неактивен'}
          </div>
        </div>
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Инициализация</div>
          <div style="font-size:13px;color:${state?.initialized !== false ? 'var(--es-accent-green)' : 'var(--es-accent-red)'};">
            ${state?.initialized !== false ? '✅ Инициализирован' : '❌ Не инициализирован'}
          </div>
        </div>
      </div>

      ${
        plugin?.dependencies?.length > 0
          ? `
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Зависимости</div>
          <div style="font-size:12px;color:var(--es-text-secondary);">${plugin.dependencies.map(d => escapeHtml(d)).join(', ')}</div>
        </div>
      `
          : ''
      }

      ${
        stats
          ? `
        <div style="background:var(--es-bg-tertiary);padding:8px;border-radius:4px;border:1px solid var(--es-border-secondary);">
          <div style="font-size:10px;color:var(--es-text-dim);">Статистика</div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(120px, 1fr));gap:4px;margin-top:4px;">
            ${Object.entries(stats)
              .map(
                ([key, value]) => `
              <div style="font-size:11px;color:var(--es-text-muted);">
                <span style="color:var(--es-accent-blue-light);">${escapeHtml(key)}</span>: ${escapeHtml(String(value).substring(0, 20))}
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        plugin?.error
          ? `
        <div style="background:rgba(239,68,68,0.1);padding:8px;border-radius:4px;border:1px solid rgba(239,68,68,0.2);">
          <div style="font-size:10px;color:var(--es-accent-red);">⚠️ Ошибка</div>
          <div style="font-size:12px;color:var(--es-text-secondary);">${escapeHtml(plugin.error)}</div>
        </div>
      `
          : ''
      }
    </div>
  `;

  showModal(
    `🔌 Информация о плагине: ${pluginName}`,
    infoHtml,
    () => {
      addLog(`ℹ️ Информация о плагине "${pluginName}" закрыта`, 'info');
    },
    () => {
      addLog(`ℹ️ Информация о плагине "${pluginName}" закрыта`, 'info');
    }
  );
}

// ============================================================
// 10. УПРАВЛЕНИЕ ПЛАГИНАМИ
// ============================================================

function disablePlugin(pluginName, plugin) {
  showModal(
    `⏸ Отключить плагин "${pluginName}"?`,
    `<p style="color:var(--es-text-muted);">Плагин будет отключен. Вы сможете включить его позже.</p>`,
    () => {
      if (isFunction(plugin.disable)) {
        plugin.disable();
      } else if (plugin._isActive !== undefined) {
        plugin._isActive = false;
      } else {
        showAlertInModal('⚠️ Метод не найден', 'У плагина нет метода disable.', 'warning');
        return;
      }
      renderPlugins();
      addLog(`⏸ Плагин "${pluginName}" отключен`, 'warn');
      showAlertInModal('✅ Отключено', `Плагин "${pluginName}" успешно отключен.`, 'success');
    },
    () => {
      addLog(`ℹ️ Отключение плагина "${pluginName}" отменено`, 'info');
    }
  );
}

function enablePlugin(pluginName, plugin) {
  showModal(
    `▶ Включить плагин "${pluginName}"?`,
    `<p style="color:var(--es-text-muted);">Плагин будет включен и инициализирован.</p>`,
    () => {
      if (isFunction(plugin.enable)) {
        plugin.enable();
      } else if (plugin._isActive !== undefined) {
        plugin._isActive = true;
        if (isFunction(plugin.init)) {
          try {
            plugin.init(db);
          } catch (error) {
            showAlertInModal(
              '❌ Ошибка',
              `Не удалось инициализировать плагин: ${error.message}`,
              'error'
            );
            return;
          }
        }
      } else {
        showAlertInModal('⚠️ Метод не найден', 'У плагина нет метода enable.', 'warning');
        return;
      }
      renderPlugins();
      addLog(`▶ Плагин "${pluginName}" включен`, 'success');
      showAlertInModal('✅ Включено', `Плагин "${pluginName}" успешно включен.`, 'success');
    },
    () => {
      addLog(`ℹ️ Включение плагина "${pluginName}" отменено`, 'info');
    }
  );
}

function reloadPlugin(pluginName, plugin) {
  showModal(
    `🔄 Перезагрузить плагин "${pluginName}"?`,
    `<p style="color:var(--es-text-muted);">Плагин будет перезагружен. Это может занять несколько секунд.</p>`,
    () => {
      if (isFunction(plugin.reload)) {
        plugin.reload();
      } else if (isFunction(plugin.destroy) && isFunction(plugin.init)) {
        try {
          plugin.destroy();
          plugin.init(db);
        } catch (error) {
          showAlertInModal(
            '❌ Ошибка',
            `Не удалось перезагрузить плагин: ${error.message}`,
            'error'
          );
          return;
        }
      } else {
        showAlertInModal(
          '⚠️ Метод не найден',
          'У плагина нет метода reload или destroy/init.',
          'warning'
        );
        return;
      }
      renderPlugins();
      addLog(`🔄 Плагин "${pluginName}" перезагружен`, 'success');
      showAlertInModal(
        '✅ Перезагружено',
        `Плагин "${pluginName}" успешно перезагружен.`,
        'success'
      );
    },
    () => {
      addLog(`ℹ️ Перезагрузка плагина "${pluginName}" отменена`, 'info');
    }
  );
}

function unregisterPlugin(pluginName, plugin) {
  showModal(
    `🗑 Удалить плагин "${pluginName}"?`,
    `<p style="color:var(--es-text-muted);">Плагин будет полностью удален из системы. Это действие необратимо.</p>`,
    () => {
      if (isFunction(db.unregisterPlugin)) {
        db.unregisterPlugin(pluginName);
      } else if (isFunction(plugin.destroy)) {
        plugin.destroy();
      } else {
        showAlertInModal('⚠️ Метод не найден', 'Невозможно удалить плагин.', 'warning');
        return;
      }
      renderPlugins();
      addLog(`🗑 Плагин "${pluginName}" удален`, 'warn');
      showAlertInModal('✅ Удалено', `Плагин "${pluginName}" успешно удален.`, 'success');
    },
    () => {
      addLog(`ℹ️ Удаление плагина "${pluginName}" отменено`, 'info');
    }
  );
}

function executePlugin(pluginName, plugin) {
  if (!isFunction(plugin.execute)) {
    showAlertInModal('⚠️ Метод не найден', 'У плагина нет метода execute.', 'warning');
    return;
  }

  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:12px;color:var(--es-text-muted);">
        Введите аргументы для выполнения метода <strong>execute</strong> плагина <strong>${escapeHtml(pluginName)}</strong>
      </div>
      <div class="form-group">
        <label>Аргументы (JSON)</label>
        <textarea id="executeArgs" rows="4" style="width:100%;background:#0b0e14;border:1px solid #1e2633;border-radius:4px;color:#c8d0e0;font-size:12px;font-family:monospace;padding:8px;">{}</textarea>
        <div style="font-size:10px;color:#4a5a7a;margin-top:4px;">Аргументы будут переданы в метод execute</div>
      </div>
    </div>
  `;

  showModal(
    `⚡ Выполнить плагин: ${pluginName}`,
    formHtml,
    data => {
      let args = {};
      try {
        const argsText = data.executeArgs || '{}';
        args = JSON.parse(argsText);
      } catch (error) {
        showAlertInModal('❌ Ошибка парсинга', `Неверный формат JSON: ${error.message}`, 'error');
        return;
      }

      try {
        const result = plugin.execute(args);
        renderPlugins();
        addLog(`⚡ Плагин "${pluginName}" выполнен`, 'success');

        // Показываем результат
        showAlertInModal(
          '✅ Выполнено',
          `Плагин "${pluginName}" успешно выполнен.\nРезультат: ${JSON.stringify(result, null, 2).substring(0, 200)}`,
          'success'
        );
      } catch (error) {
        showAlertInModal('❌ Ошибка', `Не удалось выполнить плагин: ${error.message}`, 'error');
      }
    },
    () => {
      addLog(`ℹ️ Выполнение плагина "${pluginName}" отменено`, 'info');
    }
  );
}

// ============================================================
// 11. РЕГИСТРАЦИЯ НОВОГО ПЛАГИНА
// ============================================================

function showRegisterPluginModal() {
  const formHtml = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:12px;color:var(--es-text-muted);">
        Зарегистрируйте новый плагин. Плагин может быть функцией, объектом или классом.
      </div>
      <div class="form-group">
        <label>Имя плагина *</label>
        <input type="text" id="pluginName" placeholder="my-plugin" value="plugin_${Date.now().toString(36)}">
      </div>
      <div class="form-group">
        <label>Тип плагина</label>
        <select id="pluginType">
          <option value="function">Функция</option>
          <option value="object">Объект</option>
          <option value="class">Класс</option>
        </select>
      </div>
      <div class="form-group">
        <label>Код плагина (JavaScript)</label>
        <textarea id="pluginCode" rows="10" style="width:100%;background:#0b0e14;border:1px solid #1e2633;border-radius:4px;color:#c8d0e0;font-size:12px;font-family:monospace;padding:8px;">{
  name: 'my-plugin',
  version: '1.0.0',
  description: 'Мой плагин',
  init(store) {
    console.log('✅ Плагин инициализирован');
  },
  destroy() {
    console.log('🧹 Плагин уничтожен');
  },
  getStats() {
    return { initialized: true, version: '1.0.0' };
  }
}</textarea>
        <div style="font-size:10px;color:#4a5a7a;margin-top:4px;">Код будет выполнен через new Function()</div>
      </div>
    </div>
  `;

  showModal(
    '➕ Зарегистрировать плагин',
    formHtml,
    data => {
      const name = data.pluginName || '';
      const type = data.pluginType || 'object';
      const code = data.pluginCode || '';

      if (!name) {
        showAlertInModal('⚠️ Ошибка', 'Введите имя плагина.', 'warning');
        return;
      }

      if (!code) {
        showAlertInModal('⚠️ Ошибка', 'Введите код плагина.', 'warning');
        return;
      }

      try {
        let plugin;

        if (type === 'function') {
          // Создаем функцию из кода
          const fn = new Function('store', `return (${code})(store)`);
          plugin = fn(db);
        } else if (type === 'class') {
          // Создаем класс из кода
          const cls = new Function('store', `return ${code}`);
          const PluginClass = cls(db);
          plugin = new PluginClass();
        } else {
          // Объект
          const obj = new Function('store', `return ${code}`);
          plugin = obj(db);
        }

        // Добавляем имя если его нет
        if (!plugin.name) {
          plugin.name = name;
        }

        // Регистрируем плагин
        if (isFunction(db.registerPlugin)) {
          db.registerPlugin(plugin);
        } else if (isFunction(db.use)) {
          db.use(plugin);
        } else {
          showAlertInModal(
            '⚠️ Метод не найден',
            'Метод registerPlugin или use не доступен.',
            'warning'
          );
          return;
        }

        renderPlugins();
        addLog(`🔌 Плагин "${name}" зарегистрирован`, 'success');
        showAlertInModal(
          '✅ Зарегистрировано',
          `Плагин "${name}" успешно зарегистрирован.`,
          'success'
        );
      } catch (error) {
        showAlertInModal(
          '❌ Ошибка',
          `Не удалось зарегистрировать плагин: ${error.message}`,
          'error'
        );
      }
    },
    () => {
      addLog('ℹ️ Регистрация плагина отменена', 'info');
    }
  );
}

// ============================================================
// 12. DRAG AND DROP ДЛЯ ПЛАГИНОВ
// ============================================================

function initializeDragAndDrop(container) {
  // Простая реализация для демонстрации
  // В реальном приложении можно использовать полноценную библиотеку
  const items = container.querySelectorAll('[data-plugin]');
  let draggedItem = null;

  items.forEach(item => {
    item.draggable = true;
    item.style.cursor = 'grab';

    item.addEventListener('dragstart', e => {
      draggedItem = item;
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', () => {
      if (draggedItem) {
        draggedItem.style.opacity = '1';
        draggedItem = null;
      }
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (draggedItem && draggedItem !== item) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          item.parentNode.insertBefore(draggedItem, item);
        } else {
          item.parentNode.insertBefore(draggedItem, item.nextSibling);
        }
      }
    });
  });
}

// ============================================================
// 13. ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Получение детальной информации о плагинах
 */
export function getPluginsInfo() {
  const plugins = isFunction(db.listPlugins) ? db.listPlugins() : [];
  const result = [];

  for (const name of plugins) {
    const plugin = isFunction(db.getPlugin) ? db.getPlugin(name) : null;
    result.push({
      name,
      plugin,
      isActive: plugin && plugin._isActive !== false,
      hasError: plugin && plugin._hasError,
      metadata: plugin?.metadata || {},
      version: plugin?.version || '1.0.0',
      description: plugin?.metadata?.description || plugin?.description || 'Нет описания',
      author: plugin?.metadata?.author || plugin?.author || 'Неизвестен',
      dependencies: plugin?.dependencies || [],
      state: plugin?._state || {},
      stats: safeCall(() => {
        if (isFunction(plugin.getStats)) return plugin.getStats();
        if (isFunction(plugin.stats)) return plugin.stats();
        return null;
      }),
    });
  }

  return result;
}

/**
 * Экспорт информации о плагинах
 */
export function exportPluginsInfo() {
  const data = getPluginsInfo();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plugins_info_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  addLog('📤 Информация о плагинах экспортирована', 'success');
  return data;
}

/**
 * Проверка статуса плагина
 */
export function checkPluginStatus(pluginName) {
  const plugin = isFunction(db.getPlugin) ? db.getPlugin(pluginName) : null;
  if (!plugin) {
    return { exists: false, active: false, initialized: false };
  }

  return {
    exists: true,
    active: plugin._isActive !== false,
    initialized: plugin._state?.initialized !== false,
    hasError: !!plugin._hasError,
    error: plugin.error || null,
    version: plugin.version || '1.0.0',
  };
}

// ============================================================
// 14. ЭКСПОРТ В ГЛОБАЛЬНЫЙ ОБЪЕКТ
// ============================================================

if (typeof window !== 'undefined') {
  if (!window.app) window.app = {};
  window.app.renderPlugins = renderPlugins;
  window.app.getPluginsInfo = getPluginsInfo;
  window.app.exportPluginsInfo = exportPluginsInfo;
  window.app.checkPluginStatus = checkPluginStatus;
  window.app.registerPlugin = showRegisterPluginModal;
}

// ============================================================
// 15. ЭКСПОРТ ПО УМОЛЧАНИЮ
// ============================================================

export default {
  renderPlugins,
  getPluginsInfo,
  exportPluginsInfo,
  checkPluginStatus,
  showRegisterPluginModal,
};
