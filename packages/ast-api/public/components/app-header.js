// components/app-header.js
export class AppHeader extends HTMLElement {
  constructor() {
    super();
    console.log('[AppHeader] 🏗️ Конструктор');
    this.attachShadow({ mode: 'open' });
    this.isLoaded = false;
    this._statusInterval = null;
  }

  connectedCallback() {
    console.log('[AppHeader] 🔗 Подключен к DOM');
    this.render();
    this.checkStatus();
    this._statusInterval = setInterval(() => this.checkStatus(), 10000);
    this.setupEventListeners();
  }

  disconnectedCallback() {
    console.log('[AppHeader] 🔌 Отключен от DOM');
    if (this._statusInterval) {
      clearInterval(this._statusInterval);
    }
  }

  setupEventListeners() {
    console.log('[AppHeader] 🎧 Настройка слушателей');

    this.shadowRoot.addEventListener('click', e => {
      const btn = e.target.closest('button');
      if (!btn) {return;}

      const action = btn.dataset.action;
      console.log('[AppHeader] 👆 Клик по кнопке:', action);

      if (action === 'reset') {
        this.handleReset();
      } else if (action === 'build') {
        this.handleBuild();
      } else {
        console.log('[AppHeader] ⚠️ Неизвестное действие:', action);
      }
    });
  }

  async handleReset() {
    console.log('[AppHeader] 🔄 Сброс API');
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        console.log('[AppHeader] ✅ API сброшен успешно');
        this.dispatchEvent(new CustomEvent('reset-app', { bubbles: true, composed: true }));
        this.showStatus('🔄 API сброшен', 'info');
      } else {
        console.error('[AppHeader] ❌ Ошибка сброса:', response.status);
        this.showStatus('❌ Ошибка сброса', 'error');
      }
    } catch (error) {
      console.error('[AppHeader] ❌ Ошибка сброса:', error);
      this.showStatus('❌ Ошибка сброса', 'error');
    }
  }

  async handleBuild() {
    console.log('[AppHeader] 📦 Запуск сборки');
    try {
      this.showStatus('📦 Сборка...', 'loading');
      const response = await fetch('/api/package/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: 'build' }),
      });
      const data = await response.json();
      console.log('[AppHeader] 📦 Результат сборки:', data);
      if (data.success) {
        this.showStatus('✅ Сборка завершена', 'success');
      } else {
        this.showStatus('❌ Ошибка сборки', 'error');
      }
    } catch (error) {
      console.error('[AppHeader] ❌ Ошибка сборки:', error);
      this.showStatus('❌ Ошибка сборки', 'error');
    }
  }

  async checkStatus() {
    console.log('[AppHeader] 🔍 Проверка статуса');
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      this.isLoaded = data.loaded;
      console.log('[AppHeader] 🔍 Статус:', data);
      this.updateStatus(data);
    } catch (error) {
      console.error('[AppHeader] ❌ Ошибка проверки статуса:', error);
      this.isLoaded = false;
      this.updateStatus(null);
    }
  }

  updateStatus(data) {
    const dot = this.shadowRoot.getElementById('statusDot');
    const text = this.shadowRoot.getElementById('statusText');

    if (data && data.loaded) {
      dot.className = 'status-dot loaded';
      text.textContent = `✅ ${data.version || 'v?'}`;
      console.log('[AppHeader] 🔍 Статус: загружен', data.version);
    } else {
      dot.className = 'status-dot error';
      text.textContent = '❌ Не загружено';
      console.log('[AppHeader] 🔍 Статус: не загружен');
    }
  }

  showStatus(message, type = 'info') {
    console.log('[AppHeader] 📊 Статус:', message, type);
    const statusText = this.shadowRoot.getElementById('statusText');
    const dot = this.shadowRoot.getElementById('statusDot');
    if (statusText) {
      statusText.textContent = message;
    }
    if (dot) {
      dot.className = `status-dot ${type}`;
    }
    setTimeout(() => this.checkStatus(), 3000);
  }

  render() {
    console.log('[AppHeader] 🎨 Рендер');
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #111927;
          border-bottom: 1px solid #2a3a55;
          padding: 12px 30px;
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(10px);
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1600px;
          margin: 0 auto;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-icon {
          font-size: 28px;
        }
        
        .logo-text {
          font-size: 20px;
          font-weight: 600;
          background: linear-gradient(135deg, #4a8af4, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .logo-sub {
          font-size: 12px;
          color: #8899bb;
          -webkit-text-fill-color: #8899bb;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12px;
          background: #0f1624;
          border: 1px solid #2a3a55;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        
        .status-dot.loaded {
          background: #4ade80;
          animation: pulse 2s infinite;
        }
        
        .status-dot.loading {
          background: #fbbf24;
          animation: pulse 1s infinite;
        }
        
        .status-dot.error {
          background: #f87171;
        }
        
        .status-dot.success {
          background: #4ade80;
        }
        
        .status-dot.info {
          background: #4a8af4;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #2a3a55;
          background: #0f1624;
          color: #e8edf5;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s;
        }
        
        .btn:hover {
          border-color: #4a8af4;
          background: #1a2332;
        }
        
        .btn-primary {
          background: #4a8af4;
          border-color: #4a8af4;
          color: white;
        }
        
        .btn-primary:hover {
          opacity: 0.8;
        }
        
        .btn-danger {
          border-color: #f87171;
          color: #f87171;
        }
        
        .btn-danger:hover {
          background: rgba(248, 113, 113, 0.1);
        }
        
        @media (max-width: 768px) {
          .header {
            flex-wrap: wrap;
            gap: 8px;
          }
          .logo-sub {
            display: none;
          }
        }
      </style>
      
      <div class="header">
        <div class="logo">
          <span class="logo-icon">⚔️</span>
          <div>
            <div class="logo-text">AST-Квест</div>
            <div class="logo-sub">Интерактивный анализатор кода</div>
          </div>
        </div>
        <div class="header-right">
          <div class="status-badge">
            <span class="status-dot loading" id="statusDot"></span>
            <span id="statusText">Загрузка...</span>
          </div>
          <button class="btn btn-danger" data-action="reset">🔄 Сброс</button>
          <button class="btn btn-primary" data-action="build">📦 Сборка</button>
        </div>
      </div>
    `;
  }
}

customElements.define('app-header', AppHeader);
