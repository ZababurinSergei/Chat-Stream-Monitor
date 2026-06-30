// public/scripts/global-state.mjs
/**
 * Модуль для управления глобальным состоянием приложения
 * @version 2.1.0
 * @module GlobalState
 */

const state = {
    terminal: null,
    terminalInitialized: false,
    presets: [],
    activeApp: 'dynamic-parameter-addition',
    socket: null,
    config: {
        quantumBits: 256,
        entanglementLevel: 0.95,
        maxDimensions: 4,
        allowTemporalBranches: true
    },
    isFetching: false,
    middleware: (line) => line,
    activeTasks: new Map()
};

let terminalInitializationPromise = null;
let stateListeners = [];

// ====================== Core Methods ======================

export const initGlobalState = (initialState = {}) => {
    Object.assign(state, {
        ...initialState,
        middleware: typeof initialState.middleware === 'function'
            ? initialState.middleware
            : (line) => line
    });
    notifyStateChange();
};

const notifyStateChange = () => {
    const snapshot = getStateSnapshot();
    stateListeners.forEach(listener => {
        try {
            listener(snapshot);
        } catch (error) {
            console.error('[GlobalState] Listener error:', error);
        }
    });
};

// ====================== Terminal Methods ======================

export const setTerminal = (terminal) => {
    if (!terminal) throw new Error('Invalid terminal instance');
    state.terminal = terminal;
    state.terminalInitialized = true;

    if (terminalInitializationPromise) {
        terminalInitializationPromise.resolve(terminal);
        terminalInitializationPromise = null;
    }

    notifyStateChange();
};

export const getTerminal = () => {
    if (!state.terminalInitialized) {
        throw new Error('Terminal not initialized');
    }
    return state.terminal;
};

export const waitForTerminal = async (timeout = 10000) => {
    if (state.terminalInitialized) return state.terminal;

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Terminal initialization timeout'));
        }, timeout);

        const checkInterval = setInterval(() => {
            if (state.terminalInitialized) {
                clearTimeout(timer);
                clearInterval(checkInterval);
                resolve(state.terminal);
            }
        }, 100);
    });
};

// ====================== Middleware Methods ======================

export const setMiddleware = (middlewareFunc) => {
    if (middlewareFunc && typeof middlewareFunc !== 'function') {
        throw new TypeError('Middleware must be a function');
    }
    state.middleware = middlewareFunc || ((line) => line);
    notifyStateChange();
};

export const getMiddleware = () => state.middleware;

// ====================== App State Methods ======================

export const setActiveApp = (app) => {
    if (typeof app !== 'string') {
        throw new Error('App name must be a string');
    }
    state.activeApp = app;
    notifyStateChange();
};

export const getActiveApp = () => {
    return state.activeApp || 'dynamic-parameter-addition';
};

export const subscribeToActiveAppChanges = (callback) => {
    stateListeners.push(callback);
    return () => {
        stateListeners = stateListeners.filter(l => l !== callback);
    };
};

// ====================== Utility Methods ======================

export const getStateSnapshot = () => ({
    terminal: state.terminal,
    terminalInitialized: state.terminalInitialized,
    presets: [...state.presets],
    activeApp: state.activeApp,
    socket: state.socket,
    config: { ...state.config },
    isFetching: state.isFetching,
    middleware: state.middleware,
    activeTasks: new Map(state.activeTasks)
});

export const resetState = (keepTerminal = false) => {
    state.presets = [];
    state.activeApp = 'dynamic-parameter-addition';
    state.socket = null;
    state.isFetching = false;
    state.middleware = (line) => line;
    state.activeTasks = new Map();

    if (!keepTerminal) {
        state.terminal = null;
        state.terminalInitialized = false;
    }

    notifyStateChange();
};

// ====================== Module Exports ======================

export default {
    initGlobalState,
    getTerminal,
    setTerminal,
    waitForTerminal,
    setMiddleware,
    getMiddleware,
    setActiveApp,
    getActiveApp,
    subscribeToActiveAppChanges,
    getStateSnapshot,
    resetState,
    _testOnly: {
        notifyStateChange
    }
};