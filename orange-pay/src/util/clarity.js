let loaded = false;
let ready = false;

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

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.setAttribute("data-clarity", "true");
    t.src = "https://www.clarity.ms/tag/" + i;
    t.onload = () => {
      window.__CLARITY_INIT_DONE = true;
    };
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
}

function getClarity() {
  if (typeof window === "undefined") return null;
  return typeof window.clarity === "function" ? window.clarity : null;
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
