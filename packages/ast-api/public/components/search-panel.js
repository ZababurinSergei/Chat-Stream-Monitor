// components/search-panel.js
export class SearchPanel extends HTMLElement {
  constructor() {
    super();
    console.log('[SearchPanel] 🏗️ Конструктор');
    this.attachShadow({ mode: 'open' });
    this.results = [];
    this.appShell = null;
    this._searchTimeout = null;
  }

  connectedCallback() {
    console.log('[SearchPanel] 🔗 Подключен к DOM');
    this.render();
  }

  setAppShell(shell) {
    console.log('[SearchPanel] 🔗 Установка appShell');
    this.appShell = shell;
  }

  async search(query) {
    console.log('[SearchPanel] 🔍 Поиск:', query);
    if (!query || query.length < 2) {
      console.log('[SearchPanel] 🔍 Запрос слишком короткий');
      this.results = [];
      this.renderResults();
      return;
    }

    try {
      const response = await fetch(`/api/search/functions?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('[SearchPanel] 🔍 Результатов:', data.exactMatches?.length || 0);
      this.results = data.exactMatches || [];
      this.renderResults();
    } catch (error) {
      console.error('[SearchPanel] ❌ Ошибка поиска:', error);
      this.results = [];
      this.renderResults();
    }
  }

  render() {
    console.log('[SearchPanel] 🎨 Рендер');
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: #1a2332;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #2a3a55;
        }
        
        .search-container {
          display: flex;
          gap: 8px;
        }
        
        input {
          flex: 1;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid #2a3a55;
          background: #0f1624;
          color: #e8edf5;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s;
        }
        
        input:focus {
          border-color: #4a8af4;
        }
        
        input::placeholder {
          color: #4a5a7a;
        }
        
        .btn {
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: #4a8af4;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn:hover {
          opacity: 0.8;
        }
        
        .btn-secondary {
          background: #0f1624;
          border: 1px solid #2a3a55;
          color: #8899bb;
        }
        
        .btn-secondary:hover {
          border-color: #4a8af4;
        }
        
        .results {
          margin-top: 12px;
          max-height: 180px;
          overflow-y: auto;
        }
        
        .results::-webkit-scrollbar {
          width: 4px;
        }
        .results::-webkit-scrollbar-thumb {
          background: #2a3a55;
          border-radius: 4px;
        }
        
        .result-item {
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 4px;
          background: #0f1624;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .result-item:hover {
          background: #1a2332;
          transform: translateX(4px);
        }
        
        .result-name {
          font-weight: 500;
          font-size: 13px;
          color: #e8edf5;
        }
        
        .result-meta {
          font-size: 11px;
          color: #8899bb;
        }
        
        .no-results {
          color: #8899bb;
          text-align: center;
          padding: 20px;
          font-size: 13px;
        }
      </style>
      
      <div class="search-container">
        <input type="text" id="searchInput" placeholder="🔍 Поиск функций..." />
        <button class="btn" id="searchBtn">🔎</button>
        <button class="btn btn-secondary" id="clearBtn">✕</button>
      </div>
      <div class="results" id="resultsContainer">
        <div class="no-results">🔍 Введите запрос для поиска</div>
      </div>
    `;

    const input = this.shadowRoot.getElementById('searchInput');
    const searchBtn = this.shadowRoot.getElementById('searchBtn');
    const clearBtn = this.shadowRoot.getElementById('clearBtn');

    if (input) {
      input.addEventListener('input', e => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
          console.log('[SearchPanel] ⌨️ Ввод:', e.target.value);
          this.search(e.target.value);
        }, 300);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          console.log('[SearchPanel] ⌨️ Enter');
          this.search(e.target.value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const val = this.shadowRoot.getElementById('searchInput')?.value || '';
        console.log('[SearchPanel] 👆 Клик по кнопке "Поиск"');
        this.search(val);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        console.log('[SearchPanel] 👆 Клик по кнопке "Очистить"');
        this.clear();
      });
    }
  }

  renderResults() {
    const container = this.shadowRoot.getElementById('resultsContainer');
    if (!container) {return;}

    if (this.results.length === 0) {
      container.innerHTML = `<div class="no-results">🔍 Ничего не найдено</div>`;
      return;
    }

    console.log('[SearchPanel] 📊 Отображение результатов:', this.results.length);
    container.innerHTML = this.results
      .slice(0, 20)
      .map(
        item => `
        <div class="result-item" data-id="${item.id}">
          <div class="result-name">${item.name}</div>
          <div class="result-meta">${item.id} • ${item.module}</div>
        </div>
      `,
      )
      .join('');

    container.querySelectorAll('.result-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        console.log('[SearchPanel] 👆 Выбор результата:', id);
        this.dispatchEvent(
          new CustomEvent('function-select', {
            detail: { id },
            bubbles: true,
            composed: true,
          }),
        );
        if (this.appShell) {
          this.appShell.selectedFunctionId = id;
          this.appShell.updateGraph();
        }
      });
    });
  }

  clear() {
    console.log('[SearchPanel] 🧹 Очистка');
    const input = this.shadowRoot.getElementById('searchInput');
    if (input) {input.value = '';}
    this.results = [];
    this.renderResults();
  }
}

customElements.define('search-panel', SearchPanel);
