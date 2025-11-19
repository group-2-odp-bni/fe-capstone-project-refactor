let _injected = false;

function getClarity() {
  if (typeof window === "undefined") return null;
  return typeof window.clarity === "function" ? window.clarity : null;
}

export function loadClarity(projectId) {
  if (typeof window === "undefined" || !projectId) return;

  if (window.__CLARITY_INIT_DONE) return;

  if (typeof window.clarity === "function") {
    window.__CLARITY_INIT_DONE = true;
    return;
  }

  if (document.querySelector('script[data-clarity="true"]')) {
    window.__CLARITY_INIT_DONE = true;
    return;
  }

  if (_injected) return;
  _injected = true;

  window.clarity =
    window.clarity ||
    function () {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };

  const scriptEl = document.createElement("script");
  scriptEl.async = true;
  scriptEl.setAttribute("data-clarity", "true");
  scriptEl.src = "https://www.clarity.ms/tag/" + projectId;
  scriptEl.onload = () => {
    window.__CLARITY_INIT_DONE = true;
  };

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(scriptEl, firstScript);
  } else {
    document.head.appendChild(scriptEl);
  }
}

export function clarityPageview() {
  const c = getClarity();
  if (!c) return;
  try {
    c("pageview");
  } catch (_) {}
}

export function clarityEvent(name, data) {
  const c = getClarity();
  if (!c) return;
  try {
    c("event", name, data);
  } catch (_) {}
}

export function clarityIdentify(userId, props) {
  const c = getClarity();
  if (!c) return;
  try {
    if (userId) c("identify", String(userId));
    if (props && typeof props === "object") c("set", "userProps", props);
  } catch (_) {}
}

export function claritySet(key, value) {
  const c = getClarity();
  if (!c) return;
  try {
    c("set", key, value);
  } catch (_) {}
}
