const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function assetUrl(value) {
  if (!value || /^(https?:|data:|blob:)/.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${API_URL}${path}`;
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("rp_token");
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}
