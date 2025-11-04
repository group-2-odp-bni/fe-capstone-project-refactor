let loaded = false;

export function loadClarity(projectId) {
  if (typeof window === "undefined") return;
  if (loaded || !projectId) return;
  loaded = true;

  (function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        (c[a].q = c[a].q || []).push(arguments);
      };
    t = l.createElement(r);
    t.async = 1;
    t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0];
    y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", projectId);
}

function getClarity() {
  if (typeof window === "undefined") return null;
  return window.clarity || null;
}

export function clarityPageview() {
  const c = getClarity();
  if (c) c("pageview");
}

export function clarityEvent(name, data) {
  const c = getClarity();
  if (c) c("event", name, data);
}

export function clarityIdentify(userId, props) {
  const c = getClarity();
  if (!c) return;
  if (userId) c("identify", String(userId));
  if (props && typeof props === "object") c("set", "userProps", props);
}

export function claritySet(key, value) {
  const c = getClarity();
  if (c) c("set", key, value);
}
