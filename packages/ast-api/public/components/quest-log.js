// components/quest-log.js
export class QuestLog extends HTMLElement {
  constructor() {
    super();
    console.log('[QuestLog] 🏗️ Конструктор');
    this.attachShadow({ mode: 'open' });
    this.quests = [];
    this.appShell = null;
    this._selectedId = null;
  }

  connectedCallback() {
    console.log('[QuestLog] 🔗 Подключен к DOM');
    this.appShell = document.querySelector('app-shell');
    if (this.appShell && this.appShell.state) {
      this.quests = this.appShell.state.quests || [];
      console.log('[QuestLog] 📜 Загружено квестов:', this.quests.length);
    }
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    console.log('[QuestLog] 🎧 Настройка слушателей');

    document.addEventListener('quests-updated', () => {
      console.log('[QuestLog] 📜 Событие quests-updated');
      if (this.appShell && this.appShell.state) {
        this.quests = this.appShell.state.quests || [];
        this.render();
      }
    });

    document.addEventListener('quest-completed', () => {
      console.log('[QuestLog] ✅ Событие quest-completed');
      if (this.appShell && this.appShell.state) {
        this.quests = this.appShell.state.quests || [];
        this.render();
      }
    });

    this.shadowRoot.addEventListener('click', e => {
      const item = e.target.closest('.quest-item');
      if (item) {
        const questId = item.dataset.questId;
        console.log('[QuestLog] 👆 Клик по квесту:', questId);
        if (questId) {
          this.selectQuest(questId);
        }
      }
    });
  }

  selectQuest(questId) {
    console.log('[QuestLog] 📜 Выбор квеста:', questId);

    if (!this.appShell) {
      console.warn('[QuestLog] ⚠️ appShell не найден');
      return;
    }

    const quest = this.quests.find(q => q.id === questId);
    if (!quest) {
      console.warn('[QuestLog] ⚠️ Квест не найден:', questId);
      return;
    }

    console.log('[QuestLog] 📜 Выбран квест:', quest.title);

    this.quests.forEach(q => {
      q.status = q.id === questId ? 'active' : q.status === 'completed' ? 'completed' : 'pending';
    });

    this.appShell.state.currentQuest = quest;
    this._selectedId = questId;

    console.log('[QuestLog] 📜 Отправка события quest-select');
    this.dispatchEvent(
      new CustomEvent('quest-select', {
        detail: { quest: questId },
        bubbles: true,
        composed: true,
      }),
    );

    this.render();

    const panel = document.querySelector('quest-panel');
    if (panel) {
      console.log('[QuestLog] 📜 Обновление панели квеста');
      panel.setQuest(quest);
    }
  }

  updateQuests(quests) {
    console.log('[QuestLog] 📜 Обновление квестов:', quests?.length);
    this.quests = quests;
    this.render();
  }

  render() {
    console.log('[QuestLog] 🎨 Рендер');
    const total = this.quests.length;
    const completed = this.quests.filter(q => q.status === 'completed').length;
    const active = this.quests.find(q => q.status === 'active');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #1a2332;
          border-radius: 16px;
          padding: 16px 18px;
          border: 1px solid #2a3a55;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
        }
        
        :host::-webkit-scrollbar {
          width: 4px;
        }
        :host::-webkit-scrollbar-thumb {
          background: #2a3a55;
          border-radius: 4px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        
        .title {
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #8899bb;
          font-weight: 600;
        }
        
        .progress {
          font-size: 11px;
          color: #8899bb;
          background: #0f1624;
          padding: 2px 10px;
          border-radius: 12px;
        }
        
        .quest-item {
          padding: 8px 10px;
          border-radius: 8px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid transparent;
          background: #0f1624;
          position: relative;
        }
        
        .quest-item:hover {
          border-color: rgba(74, 138, 244, 0.3);
          transform: translateX(3px);
        }
        
        .quest-item.active {
          border-color: #4a8af4;
          background: rgba(74, 138, 244, 0.1);
          box-shadow: 0 0 20px rgba(74, 138, 244, 0.05);
        }
        
        .quest-item.completed {
          border-color: rgba(74, 222, 128, 0.2);
          background: rgba(74, 222, 128, 0.05);
        }
        
        .quest-item .indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          border-radius: 0 3px 3px 0;
          transition: all 0.3s;
        }
        
        .quest-item.active .indicator {
          background: #4a8af4;
        }
        
        .quest-item.completed .indicator {
          background: #4ade80;
        }
        
        .quest-item.pending .indicator {
          background: #fbbf24;
        }
        
        .quest-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-left: 8px;
        }
        
        .quest-title {
          font-size: 13px;
          font-weight: 500;
          color: #e8edf5;
        }
        
        .quest-item.active .quest-title {
          color: #4a8af4;
        }
        
        .quest-item.completed .quest-title {
          color: #4ade80;
        }
        
        .quest-status-badge {
          font-size: 10px;
          padding: 1px 8px;
          border-radius: 10px;
          background: #0f1624;
          color: #8899bb;
          flex-shrink: 0;
        }
        
        .quest-status-badge.done {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
        }
        
        .quest-status-badge.active {
          background: rgba(74, 138, 244, 0.15);
          color: #4a8af4;
        }
        
        .quest-status-badge.pending {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }
        
        .quest-desc {
          font-size: 11px;
          color: #8899bb;
          margin-top: 2px;
          padding-left: 8px;
        }
        
        .quest-item.active .quest-desc {
          color: #9aaccc;
        }
        
        .empty {
          color: #8899bb;
          text-align: center;
          padding: 20px;
          font-size: 13px;
        }
      </style>
      
      <div class="header">
        <span class="title">📜 Журнал квеста</span>
        <span class="progress">${completed} / ${total}</span>
      </div>
      
      ${
  this.quests.length === 0
    ? `
        <div class="empty">Нет доступных квестов</div>
      `
    : `
        ${this.quests
    .map(
      quest => `
          <div class="quest-item ${quest.status}" data-quest-id="${quest.id}">
            <div class="indicator"></div>
            <div class="quest-title-row">
              <span class="quest-title">${quest.title}</span>
              <span class="quest-status-badge ${quest.status}">
                ${quest.status === 'completed' ? '✅' : quest.status === 'active' ? '▶️' : '⏳'}
              </span>
            </div>
            <div class="quest-desc">${quest.desc}</div>
          </div>
        `,
    )
    .join('')}
      `
}
    `;

    if (active) {
      const activeEl = this.shadowRoot.querySelector(`.quest-item[data-quest-id="${active.id}"]`);
      if (activeEl) {
        console.log('[QuestLog] 📜 Прокрутка к активному квесту:', active.title);
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }
}

customElements.define('quest-log', QuestLog);
