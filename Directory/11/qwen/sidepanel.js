document.addEventListener("DOMContentLoaded", () => {
  const QWEN_ORIGIN = "https://chat.qwen.ai";
  const QWEN_URL = `${QWEN_ORIGIN}/`;
  const QWEN_AUTH_URL = `${QWEN_ORIGIN}/auth`;
  const QWEN_HOST_SUFFIX = ".qwen.ai";
  const EMBEDDED_PAGE_STATE_KEY = "qwenPageState:embedded";

  const body = document.body;
  const chatFrame = document.getElementById("chat-frame");
  const authTitle = document.getElementById("auth-title");
  const authDescription = document.getElementById("auth-description");
  const authHint = document.getElementById("auth-hint");
  const openLoginButton = document.getElementById("open-login-button");
  const reloadButton = document.getElementById("reload-button");

  let isFrameReady = false;
  let qwenPageState = "loading";

  chatFrame.addEventListener("load", () => {
    isFrameReady = true;

    if (qwenPageState !== "auth-required" && qwenPageState !== "checking-session") {
      setPanelState("loading");
    }

    requestEmbeddedQwenState();
  });

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "QWEN_PAGE_STATE") {
      if (request.pageContext === "embedded") {
        handleEmbeddedQwenPageState(request.state);
        return;
      }

      handleExternalQwenPageState(request.state, request.pageContext);
    }
  });

  window.addEventListener("message", (event) => {
    if (!isAllowedQwenOrigin(event.origin)) {
      return;
    }

    if (event.source !== chatFrame.contentWindow) {
      return;
    }

    if (!event.data || typeof event.data !== "object") {
      return;
    }

    if (event.data.type === "QWEN_EMBEDDED_PAGE_STATE") {
      handleEmbeddedQwenPageState(event.data.state);
    }
  });

  openLoginButton.addEventListener("click", () => {
    chrome.tabs.create({ url: QWEN_AUTH_URL });
  });

  reloadButton.addEventListener("click", () => {
    reloadQwenFrame(qwenPageState === "auth-required" || qwenPageState === "checking-session");
  });

  setPanelState("loading");
  restoreEmbeddedPageState();

  function handleExternalQwenPageState(state, pageContext) {
    if (!state || pageContext !== "top-level") {
      return;
    }
  }

  function isAllowedQwenOrigin(origin) {
    try {
      const { protocol, hostname } = new URL(origin);
      return protocol === "https:" && (hostname === "chat.qwen.ai" || hostname.endsWith(QWEN_HOST_SUFFIX));
    } catch (error) {
      return false;
    }
  }

  function handleEmbeddedQwenPageState(state) {
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

    if (state === "loading" && qwenPageState !== "checking-session") {
      setPanelState("loading");
    }
  }

  function requestEmbeddedQwenState() {
    if (!chatFrame.contentWindow) {
      return;
    }

    const sendRequest = () => {
      try {
        chatFrame.contentWindow.postMessage(
          {
            type: "QWEN_REQUEST_PAGE_STATE"
          },
          "*"
        );
      } catch (error) {
        console.error("Unable to request Qwen page state:", error);
      }
    };

    sendRequest();

    [250, 750, 1500].forEach((delay) => {
      window.setTimeout(sendRequest, delay);
    });
  }

  function setPanelState(state) {
    qwenPageState = state;
    body.dataset.panelState = state;
    renderState(state);
  }

  function renderState(state) {
    if (state === "checking-session") {
      authTitle.textContent = "Checking your Qwen session";
      authDescription.textContent = "Sign-in was completed in another tab. Waiting for the panel to refresh and open the chat.";
      authHint.textContent = "The login screen will disappear as soon as the embedded page confirms your session.";
      openLoginButton.hidden = true;
      reloadButton.textContent = "Reload panel";
      return;
    }

    authTitle.textContent = "Sign in manually to continue";
    authDescription.textContent = "Open the Qwen login page in a regular tab and complete sign-in there. When the session is ready, reload the panel and continue chatting.";
    authHint.textContent = "The extension does not log in automatically.";
    openLoginButton.hidden = false;
    openLoginButton.textContent = "Open login page";
    reloadButton.textContent = "Reload panel";
  }

  function reloadQwenFrame(keepOverlayVisible = false) {
    isFrameReady = false;
    setPanelState(keepOverlayVisible ? "checking-session" : "loading");
    chatFrame.src = QWEN_URL;
  }

  function restoreEmbeddedPageState() {
    chrome.storage.local.get(EMBEDDED_PAGE_STATE_KEY, (data) => {
      const restoredState = data?.[EMBEDDED_PAGE_STATE_KEY];

      if (!restoredState || qwenPageState !== "loading") {
        return;
      }

      handleEmbeddedQwenPageState(restoredState);
    });
  }
});
