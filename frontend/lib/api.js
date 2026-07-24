const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
let accessToken = null;
let authFailureHandler = null;
let refreshPromise = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const setAuthFailureHandler = (handler) => { authFailureHandler = handler; };

async function refreshAccessToken() {
  if (!refreshPromise) refreshPromise = (async () => {
    const response = await fetch(`${BASE}/auth/refresh-token`, { method: "POST", credentials: "include" });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.data?.accessToken) {
      setAccessToken(null);
      authFailureHandler?.();
      return null;
    }
    setAccessToken(payload.data.accessToken);
    return payload.data.accessToken;
  })();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function api(path, { method = "GET", body, headers, ...options } = {}) {
  const isForm = body instanceof FormData;
  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { ...(!isForm && body ? { "Content-Type": "application/json" } : {}), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...headers },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
    ...options,
  });
  const payload = await response.json().catch(() => ({ success: false, message: "Phản hồi máy chủ không hợp lệ" }));
  if (response.status === 401 && path !== "/auth/refresh-token" && path !== "/auth/login") {
    const token = await refreshAccessToken().catch(() => null);
    if (token) return api(path, { method, body, headers, ...options });
  }
  if (!response.ok) throw Object.assign(new Error(payload.message || "Có lỗi xảy ra"), { status: response.status, errors: payload.errors });
  return payload.data;
}

export async function subscribeNotificationStream({ signal, onEvent }) {
  const connect = (token) => fetch(`${BASE}/notifications/stream`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {}, signal });
  let response = await connect(accessToken);
  if (response.status === 401) {
    const token = await refreshAccessToken();
    if (!token) throw Object.assign(new Error("Phiên đăng nhập đã hết hạn"), { status: 401 });
    response = await connect(token);
  }
  if (!response.ok || !response.body) throw new Error("Không thể kết nối thông báo trực tiếp");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || "";
    for (const frame of frames) {
      if (!frame || frame.startsWith(":")) continue;
      let event = "message";
      const data = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      if (data.length) {
        let payload = data.join("\n");
        try { payload = JSON.parse(payload); } catch {}
        onEvent?.({ event, data: payload });
      }
    }
  }
}

export async function subscribeAdminActivityStream({ signal, onEvent }) {
  const connect = (token) => fetch(`${BASE}/admin/dashboard/activity/stream`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {}, signal });
  let response = await connect(accessToken);
  if (response.status === 401) {
    const token = await refreshAccessToken();
    if (!token) throw Object.assign(new Error("Phiên đăng nhập đã hết hạn"), { status: 401 });
    response = await connect(token);
  }
  if (!response.ok || !response.body) throw new Error("Không thể kết nối thông báo quản trị trực tiếp");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || "";
    for (const frame of frames) {
      if (!frame || frame.startsWith(":")) continue;
      let event = "message";
      const data = [];
      for (const line of frame.split(/\r?\n/)) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trim());
      }
      if (data.length) {
        let payload = data.join("\n");
        try { payload = JSON.parse(payload); } catch {}
        onEvent?.({ event, data: payload });
      }
    }
  }
}
