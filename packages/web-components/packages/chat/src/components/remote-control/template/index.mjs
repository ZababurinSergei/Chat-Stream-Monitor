/**
 * Шаблоны для компонента RemoteControl
 * @module components/remote-control/template
 * @version 1.0.0
 * @author Your Name
 * @description HTML-шаблоны компонента удалённого управления с поддержкой частичного рендеринга
 */

/**
 * Основной шаблон компонента RemoteControl
 * @function defaultTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.mode='viewer'] - Режим: 'controller' или 'viewer'
 * @param {boolean} [params.state.isConnected=false] - Состояние подключения
 * @param {string|null} [params.state.targetPeer=null] - ID удалённого пира
 * @param {boolean} [params.state.videoEnabled=false] - Включено ли видео
 * @param {boolean} [params.state.focusOnCursor=false] - Следить ли за курсором
 * @returns {string} HTML строка
 */
export function defaultTemplate({ state = {} } = {}) {
    const { mode = 'viewer', isConnected = false, videoEnabled = false, focusOnCursor = false } = state;

    return `
<div class="remote-control">
  <div class="control-header">
    <h3 class="control-title">
      ${mode === 'controller' ? 'Управление экраном' : 'Удалённый экран'}
    </h3>
  </div>

  <div class="screen" id="remote-screen">
    ${mode === 'controller' || mode === 'viewer' ? `
     <div id="video-status" class="video-status"></div>
      <video id="remote-video" autoplay playsinline muted style="width:100%;height:100%;background:black;"></video>
    ` : ''}
    ${mode === 'viewer' ? '<div id="remote-cursor" class="remote-cursor">🖱️</div>' : ''}
  </div>
</div>
`;
}

/**
 * Рендер курсора удалённого управления
 * @function renderCursor
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {Object} params.state.cursorPosition - Позиция курсора { x, y }
 * @returns {string} HTML строка
 */
export function renderCursor({ state = {} } = {}) {
    const { cursorPosition = { x: 0, y: 0 } } = state;
    return `
    <div id="remote-cursor" class="remote-cursor" style="left:${cursorPosition.x}px;top:${cursorPosition.y}px;">
      🖱️
    </div>
  `;
}