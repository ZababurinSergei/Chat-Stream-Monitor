// components/drop-zone.js
export class DropZone extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isDragging = false;
    this.fileName = null;
    this.appShell = null;
  }

  connectedCallback() {
    this.appShell = document.querySelector('app-shell');
    this.render();
    this.setupDropZone();
  }

  setupDropZone() {
    const zone = this.shadowRoot.getElementById('dropZone');
    if (!zone) {return;}

    // Drag events
    zone.addEventListener('dragenter', e => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = true;
      zone.classList.add('dragging');
    });

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = true;
      zone.classList.add('dragging');
    });

    zone.addEventListener('dragleave', e => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      zone.classList.remove('dragging');
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      zone.classList.remove('dragging');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    // Click to upload
    zone.addEventListener('click', () => {
      const input = this.shadowRoot.getElementById('fileInput');
      if (input) {input.click();}
    });

    // File input
    const input = this.shadowRoot.getElementById('fileInput');
    if (input) {
      input.addEventListener('change', e => {
        const files = e.target.files;
        if (files && files.length > 0) {
          this.handleFile(files[0]);
        }
        // Reset input
        e.target.value = '';
      });
    }

    // Prevent default drag behaviors on document
    document.addEventListener('dragover', e => e.preventDefault());
    document.addEventListener('drop', e => e.preventDefault());
  }

  async handleFile(file) {
    if (!file.name.endsWith('.json')) {
      this.showStatus('❌ Пожалуйста, загрузите JSON файл', 'error');
      return;
    }

    this.fileName = file.name;
    this.showStatus(`📤 Загрузка ${file.name}...`, 'loading');

    // Try to use appShell state
    if (this.appShell && this.appShell.state) {
      const result = await this.appShell.state.uploadJSON(file);
      if (result.success) {
        this.showStatus(`✅ ${file.name} успешно загружен`, 'success');
        this.updateFileName(file.name);
        // Обновляем граф
        if (this.appShell) {
          this.appShell.updateGraph();
        }
        // Обновляем статистику
        this.dispatchEvent(
          new CustomEvent('data-loaded', {
            bubbles: true,
            composed: true,
          }),
        );
      } else {
        this.showStatus(`❌ Ошибка: ${result.error}`, 'error');
      }
    } else {
      // Fallback: direct upload via API
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const response = await fetch('/api/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.success) {
          this.showStatus(`✅ ${file.name} успешно загружен`, 'success');
          this.updateFileName(file.name);
          // Перезагружаем данные
          setTimeout(() => location.reload(), 1000);
        } else {
          this.showStatus(`❌ Ошибка: ${result.error}`, 'error');
        }
      } catch (error) {
        this.showStatus(`❌ Ошибка: ${error.message}`, 'error');
      }
    }
  }

  showStatus(message, type = 'info') {
    const status = this.shadowRoot.getElementById('status');
    if (status) {
      status.textContent = message;
      status.className = `status ${type}`;
    }
  }

  updateFileName(name) {
    const fileNameEl = this.shadowRoot.getElementById('fileName');
    if (fileNameEl) {
      fileNameEl.textContent = `📄 ${name}`;
      fileNameEl.style.display = 'block';
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: transparent;
          border-radius: 12px;
          padding: 8px 0;
          margin-top: 8px;
          max-height: 120px;
          overflow: hidden;
        }
        
        .drop-zone {
          border: 1.5px dashed #2a3a55;
          border-radius: 10px;
          padding: 12px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: rgba(15, 22, 36, 0.6);
          position: relative;
        }
        
        .drop-zone:hover {
          border-color: #4a5a7a;
          background: rgba(15, 22, 36, 0.8);
        }
        
        .drop-zone.dragging {
          border-color: #4a8af4;
          background: rgba(74, 138, 244, 0.08);
          transform: scale(1.01);
        }
        
        .drop-zone .icon {
          font-size: 22px;
          display: inline-block;
          margin-right: 8px;
          vertical-align: middle;
        }
        
        .drop-zone .title {
          font-size: 12px;
          font-weight: 500;
          color: #e8edf5;
          display: inline-block;
          vertical-align: middle;
        }
        
        .drop-zone .subtitle {
          font-size: 10px;
          color: #8899bb;
          display: inline-block;
          margin-left: 6px;
          vertical-align: middle;
        }
        
        .drop-zone .file-name {
          margin-top: 4px;
          font-size: 11px;
          color: #4ade80;
          display: none;
          font-weight: 500;
          text-align: center;
          word-break: break-all;
        }
        
        .status {
          margin-top: 6px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(15, 22, 36, 0.5);
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        
        .status.success {
          color: #4ade80;
          border: 1px solid rgba(74, 222, 128, 0.15);
        }
        
        .status.error {
          color: #f87171;
          border: 1px solid rgba(248, 113, 113, 0.15);
        }
        
        .status.loading {
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.15);
          animation: pulse 1.5s infinite;
        }
        
        .status.info {
          color: #8899bb;
          border: 1px solid rgba(136, 153, 187, 0.08);
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        input[type="file"] {
          display: none;
        }
        
        @media (max-width: 768px) {
          :host {
            max-height: 100px;
          }
          .drop-zone {
            padding: 8px 12px;
          }
          .drop-zone .icon {
            font-size: 18px;
          }
          .drop-zone .title {
            font-size: 11px;
          }
          .drop-zone .subtitle {
            display: none;
          }
        }
      </style>
      
      <div class="drop-zone" id="dropZone">
        <span class="icon">📂</span>
        <span class="title">Загрузить JSON</span>
        <span class="subtitle">перетащите или кликните</span>
        <div class="file-name" id="fileName">${this.fileName ? `📄 ${this.fileName}` : ''}</div>
        <input type="file" id="fileInput" accept=".json">
      </div>
      <div class="status info" id="status">💡 Загрузите отчет для анализа</div>
    `;
  }
}

customElements.define('drop-zone', DropZone);
