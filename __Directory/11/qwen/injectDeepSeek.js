if (!window.__qwenExtensionInjected) {
    window.__qwenExtensionInjected = true;

    const pageContext = window.top === window ? "top-level" : "embedded";
    const AUTH_TEXT_PATTERNS = [
        /log in to qwen/i,
        /enter your email/i,
        /enter your password/i,
        /continue with google/i,
        /continue with github/i,
        /forgot password/i,
        /forget password/i,
        /\bdon't have an account\?\s*sign up\b/i
    ];
    const READY_SELECTORS = [
        "#chat-input",
        "textarea",
        '[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]'
    ];

    let lastPageState = null;
    let lastParentFrameState = null;
    let syncScheduled = false;

    function canUseRuntimeMessaging() {
        return typeof chrome !== "undefined" &&
            Boolean(chrome.runtime?.id) &&
            typeof chrome.runtime.sendMessage === "function";
    }

    function isVisible(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function hasVisibleActionLabel(label) {
        const pattern = new RegExp(`^\\s*${label}\\s*$`, "i");
        return Array.from(document.querySelectorAll("button, a, [role='button']"))
            .some((element) => isVisible(element) && pattern.test(element.textContent || ""));
    }

    function isAuthPage() {
        const pathname = window.location.pathname || "";
        const bodyText = document.body?.innerText || "";
        const hasLoginCta =
            hasVisibleActionLabel("Log in") ||
            hasVisibleActionLabel("Login") ||
            hasVisibleActionLabel("Sign up") ||
            hasVisibleActionLabel("Sign in");
        const hasPasswordField = Boolean(document.querySelector('input[type="password"]'));
        const hasEmailField = Boolean(
            document.querySelector('input[type="email"]') ||
            document.querySelector('input[placeholder*="Email" i]') ||
            document.querySelector('input[placeholder*="Mail" i]')
        );
        const hasSocialAuthButton = Array
            .from(document.querySelectorAll("button, a, [role='button']"))
            .some((element) => {
                if (!(element instanceof HTMLElement)) {
                    return false;
                }

                const text = element.textContent || "";
                return /continue with google|continue with github/i.test(text);
            });
        const matchedPatterns = AUTH_TEXT_PATTERNS.filter((pattern) => pattern.test(bodyText)).length;

        if (pathname === "/auth" || pathname.startsWith("/auth/")) {
            return true;
        }

        if (hasPasswordField && (hasEmailField || hasSocialAuthButton || matchedPatterns >= 1)) {
            return true;
        }

        if (matchedPatterns >= 2) {
            return true;
        }

        return hasLoginCta;
    }

    function findChatInputElement() {
        for (const selector of READY_SELECTORS) {
            const elements = Array.from(document.querySelectorAll(selector));
            const visibleElement = elements.find((element) => isVisible(element));
            if (visibleElement) {
                return visibleElement;
            }
        }

        return null;
    }

    function detectPageState() {
        if (isAuthPage()) {
            return "auth-required";
        }

        if (findChatInputElement()) {
            return "ready";
        }

        return "loading";
    }

    function notifyPageState(state) {
        if (!canUseRuntimeMessaging() || state === lastPageState) {
            return;
        }

        lastPageState = state;

        chrome.runtime.sendMessage(
            {
                type: "QWEN_PAGE_STATE",
                state,
                pageContext
            },
            () => {
                void chrome.runtime.lastError;
            }
        );
    }

    function notifyParentFrameState(state) {
        if (window.parent === window || state === lastParentFrameState) {
            return;
        }

        lastParentFrameState = state;

        window.parent.postMessage(
            {
                type: "QWEN_EMBEDDED_PAGE_STATE",
                state
            },
            "*"
        );
    }

    function syncPageState() {
        const state = detectPageState();
        notifyPageState(state);
        notifyParentFrameState(state);
    }

    function schedulePageStateSync() {
        if (syncScheduled) {
            return;
        }

        syncScheduled = true;
        window.requestAnimationFrame(() => {
            syncScheduled = false;
            syncPageState();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", schedulePageStateSync, { once: true });
    } else {
        schedulePageStateSync();
    }

    window.addEventListener("message", (event) => {
        if (!event.data || typeof event.data !== "object") {
            return;
        }

        if (event.data.type !== "QWEN_REQUEST_PAGE_STATE") {
            return;
        }

        syncPageState();
    });

    const observer = new MutationObserver(() => {
        schedulePageStateSync();
    });

    if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
}
