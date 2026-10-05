// components/app-shell.js
import { AppState } from './app-state.js';
import { QUEST_DEFINITIONS } from './quest-definitions.js';

export class AppShell extends HTMLElement {
  constructor() {
    super();
    console.log('[AppShell] 🏗️ Конструктор');
    this.state = new AppState();
    this.state.quests = JSON.parse(JSON.stringify(QUEST_DEFINITIONS));
    this.attachShadow({ mode: 'open' });
    this.selectedFunctionId = null;
    this._initialized = false;
  }

  connectedCallback() {
    console.log('[AppShell] 🔗 Подключен к DOM');
    this.render();
    this.setupEventListeners();
    this.initState();
  }

  async initState() {
    console.log('[AppShell] 🚀 Инициализация состояния');
    this.state.addEventListener('loaded', () => {
      console.log('[AppShell] ✅ Состояние загружено');
      this.hideLoading();
      this.updateUI();
      this.updateGraph();
    });

    this.state.addEventListener('loading', () => {
      console.log('[AppShell] ⏳ Загрузка...');
      this.showLoading();
    });

    this.state.addEventListener('error', () => {
      console.log('[AppShell] ❌ Ошибка');
      this.hideLoading();
      this.handleError();
    });

    this.state.addEventListener('function-selected', e => {
      console.log('[AppShell] 🎯 Выбрана функция:', e.detail?.id);
      this.selectedFunctionId = e.detail?.id || null;
      this.updateGraph();
      this.updateUI();
    });

    this.state.addEventListener('quest-complete', () => {
      console.log('[AppShell] ✅ Квест завершен');
      this.hideLoading();
      this.updateUI();
      this.updateQuestLog();
    });

    await this.state.initialize();
    this.updateQuestLog();
    console.log('[AppShell] ✅ Инициализация завершена');
  }

  setupEventListeners() {
    console.log('[AppShell] 🎧 Настройка слушателей событий');

    this.addEventListener('quest-select', e => {
      console.log('[AppShell] 📜 Событие quest-select:', e.detail);
      const questId = e.detail?.quest;
      const quest = this.state.quests.find(q => q.id === questId);
      if (quest) {
        console.log('[AppShell] 📜 Выбран квест:', quest.title);
        this.selectQuest(quest);
      } else {
        console.warn('[AppShell] ⚠️ Квест не найден:', questId);
      }
    });

    this.addEventListener('quest-execute', async () => {
      console.log('[AppShell] ⚔️ Событие quest-execute');
      if (this.state.currentQuest) {
        console.log('[AppShell] ⚔️ Выполнение квеста:', this.state.currentQuest.title);
        await this.executeCurrentQuest();
      } else {
        console.warn('[AppShell] ⚠️ Нет активного квеста');
      }
    });

    this.addEventListener('function-select', e => {
      const id = e.detail?.id;
      console.log('[AppShell] 🔍 Событие function-select:', id);
      if (id) {
        this.state.selectedFunctionId = id;
        this.selectedFunctionId = id;
        this.showFunctionDetail(id);
        this.updateGraph();
        this.updateUI();
      }
    });

    this.addEventListener('reset-app', async () => {
      console.log('[AppShell] 🔄 Событие reset-app');
      await this.state.api.reset();
      this.selectedFunctionId = null;
      this.state.selectedFunctionId = null;
      this.updateGraph();
      this.updateUI();
      this.showToast('🔄 API сброшен', 'info');
    });

    this.addEventListener('data-loaded', () => {
      console.log('[AppShell] 📊 Событие data-loaded');
      this.updateUI();
      this.updateGraph();
      this.updateQuestLog();
      this.showToast('✅ Данные обновлены', 'success');
    });
  }

  updateQuestLog() {
    console.log('[AppShell] 📜 Обновление журнала квестов');
    const questLog = this.shadowRoot.querySelector('quest-log');
    if (questLog) {
      questLog.updateQuests(this.state.quests);
    }
    document.dispatchEvent(new CustomEvent('quests-updated'));
  }

  async executeCurrentQuest() {
    console.log('[AppShell] ⚔️ Выполнение текущего квеста');
    if (!this.state.currentQuest) {
      console.warn('[AppShell] ⚠️ Нет текущего квеста');
      return;
    }

    const panel = this.shadowRoot.querySelector('quest-panel');
    if (panel) {panel.showLoading();}

    try {
      console.log('[AppShell] ⚔️ Запуск квеста:', this.state.currentQuest.title);
      const result = await this.state.executeQuest(this.state.currentQuest);
      console.log('[AppShell] ✅ Результат квеста:', result);
      if (panel) {
        panel.setResult(result);
        panel.hideLoading();
      }
      this.updateUI();
      this.updateQuestLog();
      document.dispatchEvent(new CustomEvent('quest-completed'));
    } catch (error) {
      console.error('[AppShell] ❌ Ошибка выполнения квеста:', error);
      if (panel) {
        panel.setResult({ success: false, message: error.message });
        panel.hideLoading();
      }
    }
  }

  selectQuest(quest) {
    console.log('[AppShell] 📜 Выбор квеста:', quest.title);
    this.state.quests.forEach(q => {
      q.status = q.id === quest.id ? 'active' : q.status === 'completed' ? 'completed' : 'pending';
    });
    this.state.currentQuest = quest;
    this.updateUI();
    this.updateQuestLog();
  }

  async showFunctionDetail(id) {
    console.log('[AppShell] 🔍 Детали функции:', id);
    try {
      const data = await this.state.api.getFunction(id);
      console.log('[AppShell] 🔍 Данные функции:', data?.name);
      const panel = this.shadowRoot.querySelector('quest-panel');
      if (panel) {
        const message =
          `🔍 Функция: ${data.name}\n` +
          `📁 Файл: ${data.file}\n` +
          `📦 Модуль: ${data.module}\n` +
          `📍 Строка: ${data.line}\n` +
          `${data.flags?.includes('e') ? '🔓 Экспортирована' : '🔒 Внутренняя'}`;
        panel.setResult({ success: true, message });
      }
    } catch (error) {
      console.error('[AppShell] ❌ Ошибка получения деталей функции:', error);
    }
  }

  updateGraph() {
    console.log('[AppShell] 📊 Обновление графа, выбрана нода:', this.selectedFunctionId);
    const graph = this.shadowRoot.querySelector('graph-visualization');
    if (graph) {
      graph.setSelectedNode(this.selectedFunctionId);
    } else {
      console.warn('[AppShell] ⚠️ Компонент graph-visualization не найден');
    }
  }

  showToast(message, type = 'info') {
    console.log('[AppShell] 🍞 Toast:', message, type);
    const toast = this.shadowRoot.getElementById('toast');
    if (toast) {
      toast.textContent = message;
      toast.className = `toast ${type}`;
      toast.style.display = 'block';
      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
      }, 5000);
    }
  }

  render() {
    console.log('[AppShell] 🎨 Рендер');
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background: #0a0e17;
          color: #e8edf5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .app-container {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 16px;
          padding: 16px 24px;
          max-width: 1600px;
          margin: 0 auto;
        }
        
        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        @media (max-width: 1024px) {
          .app-container {
            grid-template-columns: 1fr;
            padding: 12px;
          }
          .sidebar {
            order: 2;
          }
          .main-content {
            order: 1;
          }
        }
        
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 14, 23, 0.85);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .loading-overlay.show {
          display: flex;
        }
        
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #2a3a55;
          border-top-color: #4a8af4;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .toast {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13px;
          z-index: 2000;
          display: none;
          max-width: 90%;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        .toast.success {
          background: #1a3a2a;
          border: 1px solid #4ade80;
          color: #4ade80;
        }
        
        .toast.error {
          background: #3a1a1a;
          border: 1px solid #f87171;
          color: #f87171;
        }
        
        .toast.info {
          background: #1a2a3a;
          border: 1px solid #4a8af4;
          color: #4a8af4;
        }
      </style>
      
      <div class="loading-overlay" id="loadingOverlay">
        <div class="spinner"></div>
      </div>
      
      <div class="toast" id="toast"></div>
      
      <app-header></app-header>
      
      <div class="app-container">
        <div class="sidebar">
          <quest-log></quest-log>
          <drop-zone></drop-zone>
        </div>
        <div class="main-content">
          <stats-dashboard></stats-dashboard>
          <quest-panel></quest-panel>
          <search-panel></search-panel>
          <graph-visualization></graph-visualization>
        </div>
      </div>
      
      <app-footer></app-footer>
    `;
  }

  updateUI() {
    console.log('[AppShell] 🔄 Обновление UI');
    const questLog = this.shadowRoot.querySelector('quest-log');
    if (questLog) {
      questLog.updateQuests(this.state.quests);
    }

    const questPanel = this.shadowRoot.querySelector('quest-panel');
    if (questPanel && this.state.currentQuest) {
      questPanel.setQuest(this.state.currentQuest);
    }

    const searchPanel = this.shadowRoot.querySelector('search-panel');
    if (searchPanel) {
      searchPanel.setAppShell(this);
    }

    const stats = this.shadowRoot.querySelector('stats-dashboard');
    if (stats) {
      stats.fetchStats();
    }
  }

  showLoading() {
    console.log('[AppShell] ⏳ Показ загрузки');
    const overlay = this.shadowRoot.getElementById('loadingOverlay');
    if (overlay) {overlay.classList.add('show');}
  }

  hideLoading() {
    console.log('[AppShell] ✅ Скрытие загрузки');
    const overlay = this.shadowRoot.getElementById('loadingOverlay');
    if (overlay) {overlay.classList.remove('show');}
  }

  handleError() {
    console.log('[AppShell] ❌ Обработка ошибки:', this.state.error);
    this.hideLoading();
    this.showToast(`❌ Ошибка: ${this.state.error || 'Неизвестная ошибка'}`, 'error');
  }
}

customElements.define('app-shell', AppShell);
