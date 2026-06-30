/**
 * Module for handling component rendering
 * @module render
 */

import { getStateSnapshot } from '../global-state.mjs';

/**
 * Renders component template with current state
 * @param {HTMLElement} component - Component instance
 * @param {Function} template - Template function (state => string)
 * @param {Object} state - Component state
 * @throws {Error} If invalid parameters provided
 */
export const renderTemplate = (component, template, state) => {
    if (!component || typeof template !== 'function') {
        throw new Error('Invalid render parameters');
    }

    // Safe state fallback
    const componentState = state || getStateSnapshot() || {};

    try {
        // Show loading state if terminal not ready
        if (!componentState.terminalReady) {
            component.innerHTML = `
                <div class="terminal-loading">
                    <div class="loading-spinner"></div>
                    <p>Initializing quantum terminal...</p>
                </div>
            `;
            return;
        }

        // Render main template
        component.innerHTML = template(componentState);

        // Additional render steps
        renderSpecialElements(component, componentState);

        // Force update event handlers
        if (component.terminal?._managers?.event) {
            component.terminal._managers.event.setupPanelParamsHandlers(component);
        }
    } catch (error) {
        console.error('Render error:', error);
        component.innerHTML = `
            <div class="render-error">
                <p>Render failed</p>
                <small>${error.message}</small>
                <button class="retry-btn">Retry</button>
            </div>
        `;
        component.querySelector('.retry-btn')?.addEventListener('click', () => {
            component.connectedCallback();
        });
        throw error;
    }
};

/**
 * Handles special element rendering
 * @private
 * @param {HTMLElement} component - Component instance
 * @param {Object} state - Component state
 */
const renderSpecialElements = (component, state) => {
    // Render task status if exists
    if (state.currentTask) {
        const container = component.querySelector('.task-status-container');
        if (container) {
            container.innerHTML = renderTaskStatus(state.currentTask);
        }
    }

    // Render quantum state indicators
    if (state.quantumParameters) {
        const quantumContainer = component.querySelector('.quantum-state-container');
        if (quantumContainer) {
            quantumContainer.innerHTML = renderQuantumState(state.quantumParameters);
        }
    }

    // Handle input focus after render
    const firstInput = component.querySelector('input[type="text"]');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 50);
    }
};

/**
 * Renders task status element
 * @param {Object} task - Task object
 * @returns {string} HTML string
 */
const renderTaskStatus = (task) => `
    <div class="task-status ${task.status}">
        <span class="task-name">${task.name}</span>
        <progress value="${task.progress}" max="100"></progress>
        ${task.error ? `<div class="error">${task.error}</div>` : ''}
    </div>
`;

/**
 * Renders quantum state indicators
 * @param {Object} params - Quantum parameters
 * @returns {string} HTML string
 */
const renderQuantumState = (params) => `
    <div class="quantum-state">
        <div class="quantum-param">
            <span>Entanglement:</span>
            <span class="value">${params.entanglementLevel}</span>
        </div>
        <div class="quantum-param">
            <span>Dimensions:</span>
            <span class="value">${params.maxDimensions}</span>
        </div>
    </div>
`;

export default {
    renderTemplate,
    renderTaskStatus,
    renderQuantumState
};