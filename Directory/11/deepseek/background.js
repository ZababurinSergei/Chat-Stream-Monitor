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

            // Check if chrome.storage is available
            if (chrome.storage && chrome.storage.local) {
                chrome.storage.local.set(
                    {
                        [`deepseekPageState:${pageContext}`]: request.state,
                        [`deepseekPageState:${pageContext}:timestamp`]: Date.now()
                    },
                    () => {
                        // Check for errors
                        if (chrome.runtime.lastError) {
                            console.error("[Background] Storage set error:", chrome.runtime.lastError);
                            sendResponse({ success: false, error: chrome.runtime.lastError.message });
                            return;
                        }

                        // Broadcast to other parts of the extension (like sidepanel)
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
                // Still try to send message even without storage
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
    module.exports = { applyIframeRules, initiate };
}