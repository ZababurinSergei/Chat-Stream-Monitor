function applyIframeRules() {
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
                    urlFilter: "||qwen.ai",
                    resourceTypes: ["main_frame", "sub_frame"]
                }
            }
        ]
    });
}

function initiate() {
    chrome.sidePanel
        .setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error("Error setting side panel behavior:", error));

    applyIframeRules();

    chrome.runtime.onInstalled.addListener((details) => {
        applyIframeRules();

        if (details.reason === "install") {
            chrome.tabs.create({
                url: "https://swaponline.notion.site/Qwen-is-installed-18f91437ef0a808aae35f9814bf5fa19?pvs=73"
            });
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "QWEN_PAGE_STATE") {
            const pageContext = request.pageContext || "unknown";
            chrome.storage.local.set(
                {
                    [`qwenPageState:${pageContext}`]: request.state
                },
                () => {
                    chrome.runtime.sendMessage(
                        {
                            type: "QWEN_PAGE_STATE",
                            state: request.state,
                            pageContext
                        },
                        () => {
                            void chrome.runtime.lastError;
                        }
                    );

                    sendResponse({ success: true });
                }
            );
            return true;
        }

        if (request.action === "updateShortcut") {
            chrome.commands.update(
                {
                    name: "_execute_action",
                    shortcut: request.shortcut
                },
                () => {
                    if (chrome.runtime.lastError) {
                        sendResponse({
                            success: false,
                            error: chrome.runtime.lastError.message
                        });
                    } else {
                        sendResponse({ success: true });
                    }
                }
            );
            return true;
        }

        if (request.action === "getShortcut") {
            chrome.commands.getAll((commands) => {
                const command = commands.find((item) => item.name === "_execute_action");
                sendResponse({ shortcut: command ? command.shortcut : "Alt+Q" });
            });
            return true;
        }

        return false;
    });

    chrome.runtime.setUninstallURL("https://forms.gle/HtAMmbJRYxfekfqd9");
}

initiate();
