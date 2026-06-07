document.addEventListener("DOMContentLoaded", () => {
  const DEEPSEEK_ORIGIN = "https://chat.deepseek.com";
  const DEEPSEEK_URL = `${DEEPSEEK_ORIGIN}/`;
  const DEEPSEEK_AUTH_URL = `${DEEPSEEK_ORIGIN}/login`;
  const DEEPSEEK_HOST_SUFFIX = ".deepseek.com";
  const EMBEDDED_PAGE_STATE_KEY = "deepseekPageState:embedded";

  const body = document.body;
  const chatFrame = document.getElementById("chat-frame");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");
  const authHint = document.getElementById("auth-hint");
  const openLoginButton = document.getElementById("open-login-button");
  const reloadButton = document.getElementById("reload-button");

  let isFrameReady = false;
  let deepseekPageState = "loading";

  chatFrame.addEventListener("load", () => {
    isFrameReady = true;

    if (deepseekPageState !== "auth-required" && deepseekPageState !== "checking-session") {
      setPanelState("loading");
    }

    requestEmbeddedDeepSeekState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "DEEPSEEK_PAGE_STATE") {
      if (request.pageContext === "embedded") {
        handleEmbeddedDeepSeekPageState(request.state);
        return;
      }

      handleExternalDeepSeekPageState(request.state, request.pageContext);
    }
  });

  window.addEventListener("message", (event) => {
    if (!isAllowedDeepSeekOrigin(event.origin)) {
      return;
    }

    if (event.source !== chatFrame.contentWindow) {
      return;
    }

    if (!event.data || typeof event.data !== "object") {
      return;
    }

    if (event.data.type === "DEEPSEEK_EMBEDDED_PAGE_STATE") {
      handleEmbeddedDeepSeekPageState(event.data.state);
    }
  });

  openLoginButton.addEventListener("click", () => {
    chrome.tabs.create({ url: DEEPSEEK_AUTH_URL });
  });

  reloadButton.addEventListener("click", () => {
    reloadDeepSeekFrame(deepseekPageState === "auth-required" || deepseekPageState === "checking-session");
  });

  setPanelState("loading");
  restoreEmbeddedPageState();

  function handleExternalDeepSeekPageState(state, pageContext) {
    if (!state || pageContext !== "top-level") {
      return;
    }
  }

  function isAllowedDeepSeekOrigin(origin) {
    try {
      const { protocol, hostname } = new URL(origin);
      return protocol === "https:" && (hostname === "chat.deepseek.com" || hostname.endsWith(DEEPSEEK_HOST_SUFFIX));
    } catch (error) {
      return false;
    }
  }

  function handleEmbeddedDeepSeekPageState(state) {
    if (!state) {
      return;
    }

    if (state === "auth-required") {
      setPanelState("auth-required");
      return;
    }

    if (state === "ready") {
      setPanelState("ready");
      return;
    }

    if (state === "loading" && deepseekPageState !== "checking-session") {
      setPanelState("loading");
    }
  }

  function requestEmbeddedDeepSeekState() {
    if (!chatFrame.contentWindow) {
      return;
    }

    const sendRequest = () => {
      try {
        chatFrame.contentWindow.postMessage(
            {
              type: "DEEPSEEK_REQUEST_PAGE_STATE"
            },
            "*"
        );
      } catch (error) {
        console.error("Unable to request DeepSeek page state:", error);
      }
    };

    sendRequest();

    [250, 750, 1500].forEach((delay) => {
      window.setTimeout(sendRequest, delay);
    });
  }

  function setPanelState(state) {
    deepseekPageState = state;
    body.dataset.panelState = state;
    renderState(state);
  }

  function renderState(state) {
    if (state === "checking-session") {
      authTitle.textContent = "Checking your DeepSeek session";
      authDescription.textContent = "Sign-in was completed in another tab. Waiting for the panel to refresh and open the chat.";
      authHint.textContent = "The login screen will disappear as soon as the embedded page confirms your session.";
      openLoginButton.hidden = true;
      reloadButton.textContent = "Reload panel";
      return;
    }

    authTitle.textContent = "Sign in manually to continue";
    authDescription.textContent = "Open the DeepSeek login page in a regular tab and complete sign-in there. When the session is ready, reload the panel and continue chatting.";
    authHint.textContent = "The extension does not log in automatically.";
    openLoginButton.hidden = false;
    openLoginButton.textContent = "Open login page";
    reloadButton.textContent = "Reload panel";
  }

  function reloadDeepSeekFrame(keepOverlayVisible = false) {
    isFrameReady = false;
    setPanelState(keepOverlayVisible ? "checking-session" : "loading");
    chatFrame.src = DEEPSEEK_URL;
  }

  function restoreEmbeddedPageState() {
    chrome.storage.local.get(EMBEDDED_PAGE_STATE_KEY, (data) => {
      const restoredState = data?.[EMBEDDED_PAGE_STATE_KEY];

      if (!restoredState || deepseekPageState !== "loading") {
        return;
      }

      handleEmbeddedDeepSeekPageState(restoredState);
    });
  }
});