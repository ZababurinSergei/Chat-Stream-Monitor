// components/app-footer.js

export class AppFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          text-align: center;
          padding: 16px 20px;
          border-top: 1px solid #2a3a55;
          color: #4a5a7a;
          font-size: 12px;
          background: #111927;
        }
        
        .footer-content {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        
        .version {
          color: #4a5a7a;
        }
        
        .link {
          color: #4a5a7a;
          text-decoration: none;
          transition: color 0.3s;
        }
        
        .link:hover {
          color: #4a8af4;
        }
        
        .separator {
          color: #2a3a55;
        }
      </style>
      
      <div class="footer-content">
        <span class="version">⚔️ AST-Квест v1.0</span>
        <span class="separator">•</span>
        <span>Интерактивный анализатор кода</span>
        <span class="separator">•</span>
        <a href="/api/export/all" class="link" target="_blank">📊 Экспорт</a>
        <span class="separator">•</span>
        <a href="/api/package" class="link" target="_blank">📦 Package.json</a>
      </div>
    `;
  }
}

customElements.define('app-footer', AppFooter);
