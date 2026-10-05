// public/app.js - Точка входа

// Импорт D3
import 'd3';
window.d3 = window.d3 || d3;

// Импорт всех компонентов
import './components/api-client.js';
import './components/app-state.js';
import './components/quest-definitions.js';
import './components/app-shell.js';
import './components/app-header.js';
import './components/quest-log.js';
import './components/stats-dashboard.js';
import './components/quest-panel.js';
import './components/search-panel.js';
import './components/graph-visualization.js';
import './components/drop-zone.js';
import './components/app-footer.js';

// Экспорт для использования в других модулях
export { APIClient } from './components/api-client.js';
export { AppState } from './components/app-state.js';
export { QUEST_DEFINITIONS } from './components/quest-definitions.js';
