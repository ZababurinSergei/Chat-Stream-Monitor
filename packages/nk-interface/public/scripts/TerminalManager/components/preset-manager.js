// public/scripts/TerminalManager/components/preset-manager.js
export class PresetManager {
  constructor(terminal) {
    this.terminal = terminal;
    this.presets = [];
    this.scriptsPanel = null;
    this._state = new WeakMap();
    this.activePresetIndex = 0;
    this._isSaving = false;
  }

  async init() {
    this.scriptsPanel = this.terminal.scriptsPanel || document.getElementById('scripts-panel');

    if (!this.scriptsPanel) {
      throw new Error('Элемент scripts-panel не найден в DOM');
    }

    await this.loadScripts();
    await this.loadPresets();
    this.setupSavePresetHandlers();
    return this;
  }

  async loadScripts() {
    try {
      const response = await fetch('/api/scripts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const scripts = await response.json();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@', scripts);
      this.renderScripts(scripts);
    } catch (error) {
      console.error('Ошибка загрузки скриптов:', error);
      this.terminal?.addTerminalLine?.(`Ошибка загрузки скриптов: ${error.message}`, 'error');
      throw error;
    }
  }

  renderScripts(scriptsData) {
    if (!this.scriptsPanel) {return;}

    const showPrivate = this.terminal?.togglePrivate?.checked ?? false;
    const scripts = typeof scriptsData === 'string'
      ? JSON.parse(scriptsData).scripts
      : scriptsData.scripts;

    this.scriptsPanel.innerHTML = '';
    const publicGroup = this.createGroup('Публичные скрипты', 'public');
    const privateGroup = this.createGroup('Приватные скрипты', 'private');
    let currentMainGroup = null;
    let currentSubGroup = null;

    for (const [name, command] of Object.entries(scripts)) {
      if (name.includes('=== public ===')) {
        currentMainGroup = publicGroup;
        currentSubGroup = null;
        continue;
      }

      if (name.includes('=== private ===')) {
        currentMainGroup = privateGroup;
        currentSubGroup = null;
        continue;
      }

      if (name.startsWith('===') && name.endsWith('===')) {
        const subgroupName = name.replace(/=/g, '').trim();
        currentSubGroup = this.createGroup(subgroupName);
        currentSubGroup.element.classList.add('subgroup');
        if (currentMainGroup) {
          currentMainGroup.content.appendChild(currentSubGroup.element);
        }
        continue;
      }

      const targetGroup = currentSubGroup || currentMainGroup;
      if (targetGroup) {
        const btn = this.createScriptButton(name, command);
        targetGroup.content.appendChild(btn);
      }
    }

    if (publicGroup.content.childNodes.length > 0) {
      this.scriptsPanel.appendChild(publicGroup.element);
    }
    if (privateGroup.content.childNodes.length > 0) {
      this.scriptsPanel.appendChild(privateGroup.element);
      privateGroup.element.style.display = showPrivate ? '' : 'none';
    }
  }

  createGroup(name, type = null) {
    const groupElement = document.createElement('div');
    groupElement.className = `script-group ${type ? type + '-group' : ''}`;

    const header = document.createElement('div');
    header.className = 'group-header';
    header.innerHTML = `
            <i class="fas fa-caret-down"></i>
            <span>${name}</span>
        `;

    const content = document.createElement('div');
    content.className = 'group-content';

    header.addEventListener('click', () => {
      const isCollapsed = content.style.display === 'none';
      content.style.display = isCollapsed ? '' : 'none';
      header.querySelector('i').className = isCollapsed
        ? 'fas fa-caret-down'
        : 'fas fa-caret-right';
    });

    groupElement.appendChild(header);
    groupElement.appendChild(content);

    return {
      element: groupElement,
      content,
    };
  }

  createScriptButton(name, command) {
    const btn = document.createElement('button');
    btn.className = 'script-btn';
    btn.innerHTML = `
            <i class="fas fa-play"></i>
            <span class="script-name">${name}</span>
            <span class="script-command">${command}</span>
        `;

    btn.addEventListener('click', () => {
      this.terminal.executeCommand(`npm run ${name}`);
    });

    btn.draggable = true;
    btn.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', name);
      btn.classList.add('dragging-source');
    });

    btn.addEventListener('dragend', () => {
      btn.classList.remove('dragging-source');
    });

    return btn;
  }

  async loadPresets() {
    try {
      const response = await fetch('/api/presets');
      const data = await response.json();

      this.presets = Object.values(data) || [];

      if (this.presets.length === 0) {
        this.presets = [{
          name: "Пустой объект",
          scripts: [],
          layout: {
            leftPanel: { width: 350, visible: true },
            rightPanel: { width: 350, visible: true },
          },
        }];
      }

      this.renderPresets();
      this.setActivePreset(0);

    } catch (error) {
      console.error('Ошибка загрузки пресетов:', error);
      this.presets = [{
        name: "Пустой объект",
        scripts: [],
      }];
      this.renderPresets();
    }
  }

  renderPresets() {
    this.terminal.presetsContent.innerHTML = '';
    this.presets.forEach((preset, index) => {
      const presetItem = document.createElement('div');
      presetItem.className = 'preset-item';
      presetItem.dataset.index = index;

      const presetHeader = document.createElement('div');
      presetHeader.className = 'preset-header';
      presetHeader.innerHTML = `
                <span class="preset-name">${preset.name}</span>
                <span class="preset-count">(${preset.scripts.length})</span>
                <i class="fas fa-trash delete-preset" data-index="${index}"></i>
            `;

      presetHeader.addEventListener('click', e => {
        if (!e.target.classList.contains('delete-preset')) {
          this.setActivePreset(index);
          this.togglePresetsDropdown();
        }
      });

      presetHeader.querySelector('.delete-preset').addEventListener('click', async e => {
        e.stopPropagation();

        if (preset.name === "Пустой объект") {
          this.terminal.addTerminalLine('Нельзя удалить стандартный пресет', 'error');
          return;
        }

        if (confirm(`Удалить пресет "${preset.name}"?`)) {
          const success = await this.deletePresetOnServer(preset.name);
          if (success) {
            this.presets.splice(index, 1);
            await this.loadPresets();
            this.terminal.addTerminalLine(`Пресет "${preset.name}" удалён`);
          }
        }
      });

      presetItem.appendChild(presetHeader);
      this.terminal.presetsContent.appendChild(presetItem);
    });

    this.updatePresetHeader();
  }

  async deletePresetOnServer(presetName) {
    try {
      const response = await fetch(`/api/presets/${encodeURIComponent(presetName)}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Delete preset error:', error);
      this.terminal.addTerminalLine(`Ошибка удаления: ${error.message}`, 'error');
      return false;
    }
  }

  setActivePreset(index) {
    if (index >= 0 && index < this.presets.length) {
      this.activePresetIndex = index;
      localStorage.setItem('activePresetIndex', index);
      this.updateDndZone(this.presets[index].scripts);
      this.updatePresetHeader();
    }
  }

  updatePresetHeader() {
    const presetsHeader = this.terminal.presetsContainer.querySelector('.presets-header');
    if (this.activePresetIndex >= 0 && this.activePresetIndex < this.presets.length) {
      const preset = this.presets[this.activePresetIndex];
      const count = preset.scripts.length;
      presetsHeader.innerHTML = `
                <span>Пресет: <span class="preset-name">${preset.name}</span> (${count} скриптов)</span>
                <i class="fas fa-caret-down"></i>
            `;
    }
  }

  togglePresetsDropdown() {
    const content = this.terminal.presetsContent;
    const isVisible = content.style.display === 'block';
    content.style.display = isVisible ? 'none' : 'block';

    const icon = this.terminal.presetsContainer.querySelector('.presets-header i');
    if (icon) {
      icon.className = isVisible ? 'fas fa-caret-down' : 'fas fa-caret-up';
    }
  }

  async saveCurrentPreset(presetName = null) {
    if (this._isSaving) {return;}
    this._isSaving = true;

    try {
      const currentPreset = this.getActivePreset();
      let name = presetName;

      if (!name) {
        name = prompt('Введите имя пресета:', currentPreset.name || 'Новый пресет');
        if (!name) {return null;}
      }

      const scripts = Array.from(this.terminal.dndZone.querySelectorAll('.dnd-script'))
        .filter(el => !el.classList.contains('placeholder'))
        .map(el => el.dataset.script);

      const presetData = {
        name,
        scripts,
        layout: this.getCurrentPanelConfig(),
        timestamp: new Date().toISOString(),
      };

      await this.savePresetToServer(name, presetData);
      await this.loadPresets();

      const newIndex = this.presets.findIndex(p => p.name === name);
      if (newIndex >= 0) {this.setActivePreset(newIndex);}

      this.terminal.addTerminalLine(`Пресет "${name}" сохранен`, 'success');
      return true;
    } finally {
      this._isSaving = false;
    }
  }

  async savePresetToServer(presetName, presetData) {
    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presetName,
          presetData,
        }),
      });

      if (!response.ok) {throw new Error('Ошибка сохранения');}

      return response.json();
    } catch (error) {
      console.error('Ошибка сохранения пресета:', error);
      this.terminal.addTerminalLine(`Ошибка сохранения: ${error.message}`, 'error');
      throw error;
    }
  }

  getActivePreset() {
    if (this.activePresetIndex >= 0 && this.activePresetIndex < this.presets.length) {
      return this.presets[this.activePresetIndex];
    }
    return {
      name: "Пустой объект",
      scripts: [],
      layout: {
        leftPanel: { width: 350, visible: true },
        rightPanel: { width: 350, visible: true },
      },
    };
  }

  getCurrentPanelConfig() {
    const left = document.querySelector('.left-column');
    const right = document.querySelector('.right-column');

    return {
      leftPanel: {
        width: parseInt(getComputedStyle(left).width) || 350,
        visible: left.style.display !== 'none',
      },
      rightPanel: {
        width: parseInt(getComputedStyle(right).width) || 350,
        visible: right.style.display !== 'none',
      },
    };
  }

  updateDndZone(scripts) {
    if (scripts.length === 0) {
      this.terminal.getManager('dragDrop').showDndPlaceholder();
      return;
    }

    this.terminal.dndZone.innerHTML = '';
    scripts.forEach(script => this.addScriptToDndZone(script));
  }

  addScriptToDndZone(scriptName) {
    if (this.terminal.dndZone.querySelector('.dnd-script.placeholder')) {
      this.terminal.dndZone.innerHTML = '';
    }

    const scriptEl = document.createElement('div');
    scriptEl.className = 'dnd-script';
    scriptEl.draggable = true;
    scriptEl.dataset.script = scriptName;
    scriptEl.innerHTML = `
            <div class="status-indicators">
                <div class="status-indicator"></div>
                <div class="status-indicator"></div>
                <div class="status-indicator"></div>
                <div class="status-indicator"></div>
                <div class="status-indicator"></div>
            </div>
            <i class="fas fa-grip-vertical"></i>
            <span>${scriptName}</span>
            <i class="fas fa-times remove-btn"></i>
        `;

    scriptEl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', scriptName);
      scriptEl.classList.add('dragging');
    });

    scriptEl.querySelector('.remove-btn').addEventListener('click', e => {
      e.stopPropagation();
      scriptEl.remove();
      if (this.terminal.dndZone.children.length === 0) {
        this.terminal.getManager('dragDrop').showDndPlaceholder();
      }
      this.saveActivePreset();
    });

    this.terminal.dndZone.appendChild(scriptEl);
  }

  saveActivePreset() {
    if (this.activePresetIndex >= 0 && this.activePresetIndex < this.presets.length) {
      const scripts = Array.from(this.terminal.dndZone.querySelectorAll('.dnd-script'))
        .filter(el => !el.classList.contains('placeholder'))
        .map(el => el.dataset.script);

      this.presets[this.activePresetIndex].scripts = scripts;
      this.savePresets();
    }
  }

  savePresets() {
    localStorage.setItem('quantum-terminal-presets', JSON.stringify(this.presets));
  }

  setupSavePresetHandlers() {
    const handleSave = () => this.saveCurrentPreset();
    this.terminal.saveBtn?.addEventListener('click', handleSave);
    this.terminal.saveBtnLeft?.addEventListener('click', handleSave);
  }
}
