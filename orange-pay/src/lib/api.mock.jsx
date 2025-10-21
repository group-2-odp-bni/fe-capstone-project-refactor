// src/lib/api.mock.jsx
// Minimal axios-like mock client (no network). Safe to attach interceptors.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = async (data, ms = 150) => {
  await delay(ms);
  return { data, status: 200 };
};

// no-op interceptors so code that "uses" them won't crash
const interceptors = {
  request: { use: () => {} },
  response: { use: () => {} },
};

const api = {
  async request(cfg = {}) {
    return ok({ success: true, echo: { url: cfg.url, method: cfg.method } });
  },
  get: (url, _cfg) => ok({ success: true, url, method: "GET" }),
  delete: (url, _cfg) => ok({ success: true, url, method: "DELETE" }),
  post: (url, body, _cfg) => {
    if (url === "/auth/logout") {
      return ok({ message: "Logged out (mock)" });
    }
    if (url === "/auth/refresh") {
      return ok({
        accessToken: "mock_access_" + Date.now(),
        refreshToken: "mock_refresh_" + Date.now(),
      });
    }
    return ok({ success: true, url, method: "POST", body });
  },
  put: (url, body, _cfg) => ok({ success: true, url, method: "PUT", body }),
  patch: (url, body, _cfg) => ok({ success: true, url, method: "PATCH", body }),
  interceptors,
};

// allow calling like axios(instance)(config)
const callable = new Proxy(api, {
  apply(_t, _this, args) {
    return api.request(args[0] || {});
  },
});

export const refreshToken = async () => {
  const res = await api.post("/auth/refresh");
  return res.data.accessToken;
};

export default callable;
