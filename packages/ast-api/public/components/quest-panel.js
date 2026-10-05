// components/quest-panel.js
export class QuestPanel extends HTMLElement {
  constructor() {
    super();
    console.log('[QuestPanel] 🏗️ Конструктор');
    this.attachShadow({ mode: 'open' });
    this.quest = null;
    this.result = null;
    this._isLoading = false;
    this.appShell = null;
  }

  connectedCallback() {
    console.log('[QuestPanel] 🔗 Подключен к DOM');
    this.appShell = document.querySelector('app-shell');
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('[QuestPanel] 🎧 Настройка слушателей');

    this.shadowRoot.addEventListener('click', e => {
      const btn = e.target.closest('.btn-execute');
      if (btn && !btn.disabled) {
        console.log('[QuestPanel] 👆 Клик по кнопке "Выполнить"');
        this.executeQuest();
      }
    });

    document.addEventListener('quest-select', e => {
      const questId = e.detail?.quest;
      console.log('[QuestPanel] 📜 Событие quest-select:', questId);
      if (questId && this.appShell) {
        const quest = this.appShell.state?.quests?.find(q => q.id === questId);
        if (quest) {
          console.log('[QuestPanel] 📜 Установка квеста:', quest.title);
          this.setQuest(quest);
        }
      }
    });
  }

  setQuest(quest) {
    console.log('[QuestPanel] 📜 Установка квеста:', quest?.title);
    this.quest = quest;
    this.result = null;
    this._isLoading = false;
    this.render();
  }

  setResult(result) {
    console.log('[QuestPanel] 📊 Установка результата:', result?.success ? '✅' : '❌');
    this.result = result;
    this._isLoading = false;
    this.render();
  }

  showLoading() {
    console.log('[QuestPanel] ⏳ Показ загрузки');
    this._isLoading = true;
    this.render();
  }

  hideLoading() {
    console.log('[QuestPanel] ✅ Скрытие загрузки');
    this._isLoading = false;
    this.render();
  }

  executeQuest() {
    console.log('[QuestPanel] ⚔️ Выполнение квеста');
    if (this._isLoading) {
      console.warn('[QuestPanel] ⚠️ Уже выполняется');
      return;
    }
    if (this.quest?.status === 'completed') {
      console.warn('[QuestPanel] ⚠️ Квест уже выполнен');
      return;
    }

    this.showLoading();

    console.log('[QuestPanel] 📤 Отправка события quest-execute');
    this.dispatchEvent(
      new CustomEvent('quest-execute', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    console.log('[QuestPanel] 🎨 Рендер');

    if (!this.quest) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            background: #1a2332;
            border-radius: 16px;
            padding: 20px;
            border: 1px solid #2a3a55;
            min-height: 100px;
          }
          .placeholder {
            color: #8899bb;
            text-align: center;
            padding: 20px;
            font-size: 14px;
          }
          .placeholder-icon {
            font-size: 40px;
            display: block;
            margin-bottom: 8px;
          }
        </style>
        <div class="placeholder">
          <span class="placeholder-icon">🎯</span>
          <div>Выберите задание из журнала квеста</div>
        </div>
      `;
      return;
    }

    const isCompleted = this.quest.status === 'completed';
    const isActive = this.quest.status === 'active';
    const isPending = this.quest.status === 'pending';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #1a2332;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #2a3a55;
        }
        
        .quest-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }
        
        .quest-title {
          font-size: 16px;
          font-weight: 600;
          color: ${isActive ? '#4a8af4' : isCompleted ? '#4ade80' : '#e8edf5'};
        }
        
        .quest-status-label {
          font-size: 11px;
          padding: 3px 12px;
          border-radius: 12px;
          background: #0f1624;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .quest-status-label.completed {
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.2);
        }
        
        .quest-status-label.pending {
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        
        .quest-status-label.active {
          color: #4a8af4;
          border: 1px solid rgba(74, 138, 244, 0.2);
        }
        
        .quest-desc {
          color: #8899bb;
          font-size: 13px;
          margin-bottom: 14px;
          line-height: 1.5;
        }
        
        .quest-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn-execute {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          background: #4a8af4;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 13px;
        }
        
        .btn-execute:hover:not(:disabled) {
          opacity: 0.8;
          transform: scale(0.98);
        }
        
        .btn-execute:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn-execute.completed {
          background: #4ade80;
          color: #0a0e17;
        }
        
        .btn-execute.loading {
          background: #fbbf24;
          color: #0a0e17;
        }
        
        .btn-execute.pending {
          background: #4a8af4;
        }
        
        .loading-indicator {
          display: ${this._isLoading ? 'flex' : 'none'};
          align-items: center;
          gap: 10px;
          margin-top: 10px;
          color: #8899bb;
          font-size: 13px;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #2a3a55;
          border-top-color: #4a8af4;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .result {
          margin-top: 14px;
          background: #0f1624;
          border-radius: 10px;
          padding: 14px 16px;
          border-left: 4px solid #4ade80;
          white-space: pre-wrap;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          line-height: 1.6;
          max-height: 300px;
          overflow-y: auto;
          color: #e8edf5;
        }
        
        .result.error {
          border-left-color: #f87171;
        }
        
        .result::-webkit-scrollbar {
          width: 4px;
        }
        .result::-webkit-scrollbar-thumb {
          background: #2a3a55;
          border-radius: 4px;
        }
        
        .result .result-title {
          color: #4ade80;
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 6px;
        }
        
        .result.error .result-title {
          color: #f87171;
        }
        
        @media (max-width: 768px) {
          .quest-header {
            flex-wrap: wrap;
          }
          .quest-title {
            font-size: 14px;
          }
        }
      </style>
      
      <div class="quest-header">
        <span class="quest-title">${this.quest.title}</span>
        <span class="quest-status-label ${this.quest.status}">
          ${isCompleted ? '✅ Выполнено' : isActive ? '▶️ В процессе' : '⏳ Ожидает'}
        </span>
      </div>
      <div class="quest-desc">${this.quest.desc}</div>
      
      <div class="quest-actions">
        <button class="btn-execute ${this.quest.status} ${this._isLoading ? 'loading' : ''}" 
                ${isCompleted || this._isLoading ? 'disabled' : ''}>
          ${this._isLoading ? '⏳ Выполнение...' : isCompleted ? '✅ Выполнено' : '⚔️ Выполнить'}
        </button>
      </div>
      
      <div class="loading-indicator">
        <div class="loading-spinner"></div>
        <span>Выполнение задания...</span>
      </div>
      
      ${
  this.result
    ? `
        <div class="result ${this.result.success ? '' : 'error'}">
          <div class="result-title">${this.result.success ? '✅ Результат' : '❌ Ошибка'}</div>
          ${this.result.message}
        </div>
      `
    : ''
}
    `;
  }
}

customElements.define('quest-panel', QuestPanel);
