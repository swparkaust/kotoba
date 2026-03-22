const BASE = "/api/v1";

let authToken: string | null = null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("auth_token");
  }
  return authToken;
}

async function request(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const options: RequestInit = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${BASE}${path}`, options);
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path: string) => request("GET", path),
  post: (path: string, body?: unknown) => request("POST", path, body),
  patch: (path: string, body?: unknown) => request("PATCH", path, body),
  delete: (path: string) => request("DELETE", path),
};
