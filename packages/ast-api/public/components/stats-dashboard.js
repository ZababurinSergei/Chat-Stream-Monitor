// components/stats-dashboard.js

export class StatsDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.stats = {
      summary: {},
      deadCode: { total: 0, percentage: '0' },
      isolated: { total: 0, percentage: '0' },
    };
  }

  connectedCallback() {
    this.render();
    this.fetchStats();
    setInterval(() => this.fetchStats(), 30000);
  }

  async fetchStats() {
    try {
      const response = await fetch('/api/stats');
      this.stats = await response.json();
      this.render();
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }

  render() {
    const s = this.stats.summary || {};
    const dead = this.stats.deadCode || { total: 0, percentage: '0' };
    const isolated = this.stats.isolated || { total: 0, percentage: '0' };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 10px;
        }
        
        .stat {
          background: #1a2332;
          border-radius: 12px;
          padding: 12px 14px;
          border: 1px solid #2a3a55;
          transition: all 0.3s;
        }
        
        .stat:hover {
          border-color: #4a8af4;
        }
        
        .value {
          font-size: 22px;
          font-weight: 700;
          background: linear-gradient(135deg, #4a8af4, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .label {
          font-size: 10px;
          color: #8899bb;
          margin-top: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .change {
          font-size: 10px;
          margin-top: 3px;
        }
        
        .change.up { color: #4ade80; }
        .change.down { color: #f87171; }
      </style>
      
      <div class="stat">
        <div class="value">${s.tf || 0}</div>
        <div class="label">Функции</div>
      </div>
      <div class="stat">
        <div class="value">${s.tm || 0}</div>
        <div class="label">Модули</div>
      </div>
      <div class="stat">
        <div class="value">${s.tfils || 0}</div>
        <div class="label">Файлы</div>
      </div>
      <div class="stat">
        <div class="value">${s.tc || 0}</div>
        <div class="label">Вызовы</div>
      </div>
      <div class="stat">
        <div class="value">${dead.total}</div>
        <div class="label">Мёртвый код</div>
        <div class="change up">${dead.percentage}%</div>
      </div>
      <div class="stat">
        <div class="value">${isolated.total}</div>
        <div class="label">Изолированных</div>
        <div class="change down">${isolated.percentage}%</div>
      </div>
    `;
  }
}

customElements.define('stats-dashboard', StatsDashboard);
