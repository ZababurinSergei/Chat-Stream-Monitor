// background.js - Полная версия с обновлениями для клика по селектору

// Хранилище активных отладчиков
const activeDebuggers = new Map();

// Функция для прикрепления отладчика
async function attachDebugger(tabId) {
    if (activeDebuggers.has(tabId)) {
        console.log(`[Background] Debugger already attached to tab ${tabId}`);
        return true;
    }

    try {
        await new Promise((res, rej) => {
            chrome.debugger.attach({ tabId: tabId }, "1.3", () => {
                if (chrome.runtime.lastError) {
                    rej(new Error(chrome.runtime.lastError.message));
                } else {
                    res();
                }
            });
        });

        activeDebuggers.set(tabId, true);
        console.log(`[Background] 🔗 Debugger attached to tab ${tabId}`);
        return true;
    } catch (error) {
        console.error(`[Background] Failed to attach debugger to tab ${tabId}:`, error);
        throw error;
    }
}

// Функция для открепления отладчика
async function detachDebugger(tabId) {
    if (!activeDebuggers.has(tabId)) {
        return;
    }

    try {
        await new Promise((res, rej) => {
            chrome.debugger.detach({ tabId: tabId }, () => {
                if (chrome.runtime.lastError) {
                    if (!chrome.runtime.lastError.message.includes("not attached")) {
                        rej(new Error(chrome.runtime.lastError.message));
                    } else {
                        res();
                    }
                } else {
                    res();
                }
            });
        });

        activeDebuggers.delete(tabId);
        console.log(`[Background] 🔌 Debugger detached from tab ${tabId}`);
    } catch (error) {
        console.warn(`[Background] Could not detach debugger from tab ${tabId}:`, error);
        activeDebuggers.delete(tabId);
    }
}

// Функция для выполнения клика по координатам
async function performClickAtCoordinates(tabId, x, y) {
    return new Promise(async (resolve, reject) => {
        try {
            // Включаем события мыши
            await new Promise((res, rej) => {
                chrome.debugger.sendCommand({ tabId: tabId }, "Input.setIgnoreInputEvents", {
                    ignore: false
                }, () => {
                    if (chrome.runtime.lastError) {
                        rej(new Error(chrome.runtime.lastError.message));
                    } else {
                        res();
                    }
                });
            });

            // Небольшая задержка перед кликом
            await new Promise(resolve => setTimeout(resolve, 100));

            // Отправляем mousePressed (нажатие)
            await new Promise((res, rej) => {
                chrome.debugger.sendCommand({ tabId: tabId }, "Input.dispatchMouseEvent", {
                    type: "mousePressed",
                    x: Math.round(x),
                    y: Math.round(y),
                    button: "left",
                    clickCount: 1,
                    modifiers: 0
                }, () => {
                    if (chrome.runtime.lastError) {
                        rej(new Error(chrome.runtime.lastError.message));
                    } else {
                        res();
                    }
                });
            });

            // Небольшая задержка между нажатием и отпусканием
            await new Promise(resolve => setTimeout(resolve, 50));

            // Отправляем mouseReleased (отпускание)
            await new Promise((res, rej) => {
                chrome.debugger.sendCommand({ tabId: tabId }, "Input.dispatchMouseEvent", {
                    type: "mouseReleased",
                    x: Math.round(x),
                    y: Math.round(y),
                    button: "left",
                    clickCount: 1,
                    modifiers: 0
                }, () => {
                    if (chrome.runtime.lastError) {
                        rej(new Error(chrome.runtime.lastError.message));
                    } else {
                        res();
                    }
                });
            });

            console.log(`[Background] ✅ Trusted click at (${Math.round(x)}, ${Math.round(y)})`);
            resolve({ success: true, x: Math.round(x), y: Math.round(y) });

        } catch (error) {
            console.error("[Background] ❌ Trusted click failed:", error);
            reject(error);
        }
    });
}

// Функция для получения координат элемента через content script
async function getElementCoordinates(tabId, selector) {
    return new Promise((resolve) => {
        // Используем chrome.tabs.sendMessage для коммуникации с content script
        chrome.tabs.sendMessage(tabId, {
            action: "getElementCoordinates",
            selector: selector
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("[Background] Error getting element coordinates:", chrome.runtime.lastError.message);
                resolve({ error: chrome.runtime.lastError.message });
                return;
            }

            if (response && response.success) {
                resolve(response.coordinates);
            } else {
                resolve({ error: response?.error || "Unknown error" });
            }
        });
    });
}

// Функция для выполнения клика по элементу через селектор
async function performTrustedClickOnElement(tabId, selector, options = {}) {
    const { scrollToElement = true } = options;

    // Проверяем, прикреплен ли отладчик
    if (!activeDebuggers.has(tabId)) {
        try {
            await attachDebugger(tabId);
        } catch (error) {
            return { success: false, error: `Failed to attach debugger: ${error.message}` };
        }
    }

    // Получаем координаты элемента через content script
    const coords = await getElementCoordinates(tabId, selector);

    if (coords.error) {
        return { success: false, error: coords.error };
    }

    if (coords.scrolled) {
        // Если скроллили - ждем немного и получаем координаты снова
        await new Promise(resolve => setTimeout(resolve, 200));

        const retryCoords = await getElementCoordinates(tabId, selector);
        if (retryCoords.error) {
            return { success: false, error: retryCoords.error };
        }

        return performClickAtCoordinates(tabId, retryCoords.x, retryCoords.y);
    }

    // Выполняем клик по полученным координатам
    return performClickAtCoordinates(tabId, coords.x, coords.y);
}

// Функция для выполнения клика по координатам (старый метод)
async function performTrustedClickAtCoordinates(tabId, x, y) {
    if (!activeDebuggers.has(tabId)) {
        try {
            await attachDebugger(tabId);
        } catch (error) {
            return { success: false, error: `Failed to attach debugger: ${error.message}` };
        }
    }

    return performClickAtCoordinates(tabId, x, y);
}

function applyIframeRules() {
    try {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: {
                        type: "modifyHeaders",
                        responseHeaders: [
                            { header: "content-security-policy", operation: "remove" },
                            { header: "x-frame-options", operation: "remove" },
                            { header: "frame-options", operation: "remove" },
                            { header: "frame-ancestors", operation: "remove" },
                            { header: "X-Content-Type-Options", operation: "remove" },
                            {
                                header: "access-control-allow-origin",
                                operation: "set",
                                value: "*"
                            }
                        ]
                    },
                    condition: {
                        urlFilter: "||deepseek.com",
                        resourceTypes: ["main_frame", "sub_frame"]
                    }
                }
            ]
        });
    } catch (error) {
        console.error("[Background] Error applying iframe rules:", error);
    }
}

function initiate() {
    console.log("[Background] Initializing DeepSeek Sidebar extension");

    // Слушаем отсоединение отладчика
    chrome.debugger.onDetach.addListener((source, reason) => {
        const tabId = source.tabId;
        if (activeDebuggers.has(tabId)) {
            activeDebuggers.delete(tabId);
            console.log(`[Background] Debugger detached from tab ${tabId}, reason: ${reason}`);
        }
    });

    // Check if chrome.sidePanel is available
    if (chrome.sidePanel) {
        chrome.sidePanel
            .setPanelBehavior({ openPanelOnActionClick: true })
            .catch((error) => console.error("[Background] Error setting side panel behavior:", error));
    } else {
        console.warn("[Background] chrome.sidePanel not available");
    }

    applyIframeRules();

    chrome.runtime.onInstalled.addListener((details) => {
        console.log("[Background] Extension installed/updated:", details.reason);
        applyIframeRules();

        if (details.reason === "install") {
            console.log("[Background] First time installation, opening welcome page");
            chrome.tabs.create({
                url: "https://chat.deepseek.com/"
            });
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        // Handle page state updates
        if (request.type === "DEEPSEEK_PAGE_STATE") {
            const pageContext = request.pageContext || "unknown";

            console.debug(`[Background] Received page state: ${request.state} for context: ${pageContext}`);

            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(
                    {
                        [`deepseekPageState:${pageContext}`]: request.state,
                        [`deepseekPageState:${pageContext}:timestamp`]: Date.now()
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.error("[Background] Storage set error:", chrome.runtime.lastError);
                            sendResponse({ success: false, error: chrome.runtime.lastError.message });
                            return;
                        }

                        try {
                            chrome.runtime.sendMessage(
                                {
                                    type: "DEEPSEEK_PAGE_STATE",
                                    state: request.state,
                                    pageContext,
                                    timestamp: Date.now()
                                },
                                () => {
                                    if (chrome.runtime.lastError) {
                                        console.debug("[Background] No listeners for message:", chrome.runtime.lastError.message);
                                    }
                                }
                            );
                        } catch (e) {
                            console.debug("[Background] Could not broadcast message:", e);
                        }

                        sendResponse({ success: true });
                    }
                );
            } else {
                console.warn("[Background] chrome.storage.local not available");
                try {
                    chrome.runtime.sendMessage(
                        {
                            type: "DEEPSEEK_PAGE_STATE",
                            state: request.state,
                            pageContext,
                            timestamp: Date.now()
                        },
                        () => {
                            if (chrome.runtime.lastError) {
                                console.debug("[Background] No listeners for message:", chrome.runtime.lastError.message);
                            }
                        }
                    );
                } catch (e) {
                    console.debug("[Background] Could not send message:", e);
                }
                sendResponse({ success: true, storageUnavailable: true });
            }
            return true;
        }

        // Handle shortcut update
        if (request.action === "updateShortcut") {
            if (chrome.commands) {
                chrome.commands.update(
                    {
                        name: "_execute_action",
                        shortcut: request.shortcut
                    },
                    () => {
                        if (chrome.runtime.lastError) {
                            console.error("[Background] Shortcut update error:", chrome.runtime.lastError);
                            sendResponse({
                                success: false,
                                error: chrome.runtime.lastError.message
                            });
                        } else {
                            console.log("[Background] Shortcut updated to:", request.shortcut);
                            sendResponse({ success: true });
                        }
                    }
                );
            } else {
                console.warn("[Background] chrome.commands not available");
                sendResponse({ success: false, error: "chrome.commands not available" });
            }
            return true;
        }

        // Handle get shortcut
        if (request.action === "getShortcut") {
            if (chrome.commands) {
                chrome.commands.getAll((commands) => {
                    const command = commands.find((item) => item.name === "_execute_action");
                    const shortcut = command ? command.shortcut : "Alt+D";
                    console.debug("[Background] Returning shortcut:", shortcut);
                    sendResponse({ shortcut: shortcut });
                });
            } else {
                console.warn("[Background] chrome.commands not available");
                sendResponse({ shortcut: "Alt+D", error: "chrome.commands not available" });
            }
            return true;
        }

        // Handle get page state
        if (request.action === "getPageState") {
            const pageContext = request.pageContext || "embedded";

            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.get([`deepseekPageState:${pageContext}`], (result) => {
                    if (chrome.runtime.lastError) {
                        console.error("[Background] Storage get error:", chrome.runtime.lastError);
                        sendResponse({ state: "loading", error: chrome.runtime.lastError.message });
                    } else {
                        const state = result[`deepseekPageState:${pageContext}`] || "loading";
                        console.debug(`[Background] Retrieved page state for ${pageContext}:`, state);
                        sendResponse({ state: state });
                    }
                });
            } else {
                sendResponse({ state: "loading", error: "storage not available" });
            }
            return true;
        }

        // Handle clear storage (for debugging)
        if (request.action === "clearStorage") {
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.clear(() => {
                    if (chrome.runtime.lastError) {
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        console.log("[Background] Storage cleared");
                        sendResponse({ success: true });
                    }
                });
            } else {
                sendResponse({ success: false, error: "storage not available" });
            }
            return true;
        }

        // Handle get extension info
        if (request.action === "getExtensionInfo") {
            const manifest = chrome.runtime.getManifest();
            sendResponse({
                name: manifest.name,
                version: manifest.version,
                id: chrome.runtime.id
            });
            return true;
        }

        // Обработка запроса на доверенный клик по координатам
        if (request.action === "performTrustedClickAtCoordinates") {
            const tabId = sender.tab?.id;

            if (!tabId) {
                sendResponse({ success: false, error: "No tab ID available" });
                return true;
            }

            const { x, y } = request;

            performTrustedClickAtCoordinates(tabId, x, y)
                .then(result => {
                    sendResponse({ success: true, ...result });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });

            return true;
        }

        // Обработка запроса на клик по элементу через селектор
        if (request.action === "performTrustedClickOnElement") {
            const tabId = sender.tab?.id;

            if (!tabId) {
                sendResponse({ success: false, error: "No tab ID available" });
                return true;
            }

            const { selector, scrollToElement = true } = request;

            if (!selector) {
                sendResponse({ success: false, error: "Selector is required" });
                return true;
            }

            performTrustedClickOnElement(tabId, selector, { scrollToElement })
                .then(result => {
                    sendResponse({ success: true, ...result });
                })
                .catch(error => {
                    sendResponse({ success: false, error: error.message });
                });

            return true;
        }

        // Обработка запроса на прикрепление отладчика
        if (request.action === "attachDebugger") {
            const tabId = sender.tab?.id;

            if (!tabId) {
                sendResponse({ success: false, error: "No tab ID available" });
                return true;
            }

            attachDebugger(tabId)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));

            return true;
        }

        // Обработка запроса на открепление отладчика
        if (request.action === "detachDebugger") {
            const tabId = sender.tab?.id;

            if (!tabId) {
                sendResponse({ success: false, error: "No tab ID available" });
                return true;
            }

            detachDebugger(tabId)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ success: false, error: error.message }));

            return true;
        }

        return false;
    });

    // Set uninstall URL with error handling
    if (chrome.runtime.setUninstallURL) {
        chrome.runtime.setUninstallURL("https://forms.gle/HtAMmbJRYxfekfqd9").catch((error) => {
            console.error("[Background] Error setting uninstall URL:", error);
        });
    }

    // Handle extension update
    if (chrome.runtime.onUpdateAvailable) {
        chrome.runtime.onUpdateAvailable.addListener((details) => {
            console.log("[Background] Update available:", details.version);
            // Reload the extension to apply update
            chrome.runtime.reload();
        });
    }

    // Handle connection errors
    if (chrome.runtime.onConnect) {
        chrome.runtime.onConnect.addListener((port) => {
            console.debug("[Background] Port connected:", port.name);

            port.onDisconnect.addListener(() => {
                console.debug("[Background] Port disconnected:", port.name);
                if (chrome.runtime.lastError) {
                    console.debug("[Background] Disconnect error:", chrome.runtime.lastError.message);
                }
            });
        });
    }

    console.log("[Background] DeepSeek Sidebar extension fully initialized");
}

// Safe initialization with retry
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

function safeInitiate() {
    try {
        // Check if we're in a valid extension context
        if (chrome.runtime && chrome.runtime.id) {
            initiate();
        } else {
            console.warn("[Background] Extension context not ready, attempt:", initAttempts + 1);
            initAttempts++;
            if (initAttempts < MAX_INIT_ATTEMPTS) {
                setTimeout(safeInitiate, 1000);
            } else {
                console.error("[Background] Failed to initialize after", MAX_INIT_ATTEMPTS, "attempts");
            }
        }
    } catch (error) {
        console.error("[Background] Initiation error:", error);
        initAttempts++;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            setTimeout(safeInitiate, 1000);
        }
    }
}

// Start initialization
safeInitiate();

// Export for debugging (not actually used, but helpful)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { applyIframeRules, initiate, performTrustedClickAtCoordinates, performTrustedClickOnElement, attachDebugger, detachDebugger };
}