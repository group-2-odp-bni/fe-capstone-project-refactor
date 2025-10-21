// src/lib/api.jsx
const isMock =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_USE_MOCK === "true") ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_USE_MOCK === "true");

let _modPromise = null;
const load = () => {
  if (!_modPromise) {
    _modPromise = isMock ? import("./api.mock.jsx") : import("./api.real.jsx");
  }
  return _modPromise;
};

// Lazy proxy: defers loading until first use (Vite-friendly)
const api = new Proxy(function () {}, {
  apply: async (_t, _this, args) => {
    const mod = await load();
    return mod.default(...(args || []));
  },
  get: (_t, prop) => {
    if (prop === "then") return undefined; // don't look like a Promise
    return async (...args) => {
      const mod = await load();
      const target = mod.default[prop];
      if (typeof target !== "function") return target;
      return target(...args);
    };
  },
});

export const refreshToken = async (...args) => {
  const mod = await load();
  return mod.refreshToken?.(...args);
};

export default api;
