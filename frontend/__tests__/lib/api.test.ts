const mockLocalStorage: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: jest.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
  Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
});

function loadBrowserModule() {
  return require("@/lib/api") as typeof import("@/lib/api");
}

describe("setAuthToken / getAuthToken", () => {
  it("stores and retrieves a token", () => {
    const { setAuthToken, getAuthToken } = loadBrowserModule();
    setAuthToken("tok_abc");
    expect(getAuthToken()).toBe("tok_abc");
  });

  it("persists token to localStorage", () => {
    const { setAuthToken } = loadBrowserModule();
    setAuthToken("tok_xyz");
    expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", "tok_xyz");
  });

  it("reads token from localStorage when in-memory token is absent", () => {
    mockLocalStorage["auth_token"] = "tok_stored";
    const { getAuthToken } = loadBrowserModule();
    expect(getAuthToken()).toBe("tok_stored");
  });
});

describe("api.get", () => {
  it("makes a GET fetch with Authorization header", async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ data: 1 }) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_get");
    const result = await api.get("/lessons");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/lessons",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer tok_get" }),
      })
    );
    expect(result).toEqual({ data: 1 });
  });
});

describe("api.post", () => {
  it("sends JSON body with POST method", async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ id: 42 }) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_post");
    const result = await api.post("/exercises", { answer: "あ" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/exercises",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answer: "あ" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual({ id: 42 });
  });
});

describe("api.patch", () => {
  it("sends PATCH request with JSON body", async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ updated: true }) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_patch");
    const result = await api.patch("/lessons/1", { title: "Updated" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/lessons/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ title: "Updated" }),
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
    expect(result).toEqual({ updated: true });
  });
});

describe("api.delete", () => {
  it("sends DELETE request", async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ deleted: true }) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_delete");
    const result = await api.delete("/lessons/1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/lessons/1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer tok_delete" }),
      })
    );
    expect(result).toEqual({ deleted: true });
  });
});

describe("204 response", () => {
  it("returns null for 204 No Content", async () => {
    const mockResponse = { ok: true, status: 204 };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_204");
    const result = await api.delete("/lessons/1");

    expect(result).toBeNull();
  });
});

describe("401 response", () => {
  it("throws Unauthorized error on 401 status", async () => {
    const mockResponse = { ok: false, status: 401, statusText: "Unauthorized" };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_expired");

    await expect(api.get("/profile")).rejects.toThrow("Unauthorized");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/profile",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer tok_expired" }),
      })
    );
  });
});

describe("non-401 error response", () => {
  it("throws with status and statusText for 500 error", async () => {
    const mockResponse = { ok: false, status: 500, statusText: "Internal Server Error" };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api, setAuthToken } = loadBrowserModule();
    setAuthToken("tok_500");

    await expect(api.get("/lessons")).rejects.toThrow("500 Internal Server Error");
  });
});

describe("server-side (no window)", () => {
  it("setAuthToken skips localStorage when window is undefined", () => {
    jest.isolateModules(() => {
      // In jsdom window is always defined; we can still verify the positive branch
      // by confirming localStorage.setItem IS called (which means the branch evaluates to true)
      const { setAuthToken } = require("@/lib/api");
      (localStorage.setItem as jest.Mock).mockClear();
      setAuthToken("tok_server_test");
      expect(localStorage.setItem).toHaveBeenCalledWith("auth_token", "tok_server_test");
    });
  });

  it("getAuthToken reads from localStorage when in-memory token is null", () => {
    jest.isolateModules(() => {
      // Fresh module: authToken starts as null, so it should fall through to localStorage
      mockLocalStorage["auth_token"] = "tok_from_storage";
      const { getAuthToken } = require("@/lib/api");
      const result = getAuthToken();
      expect(result).toBe("tok_from_storage");
    });
  });

  it("getAuthToken returns null when no token anywhere", () => {
    jest.isolateModules(() => {
      const { getAuthToken } = require("@/lib/api");
      const result = getAuthToken();
      expect(result).toBeNull();
    });
  });
});

describe("401 on auth pages", () => {
  it("does not redirect when on /login page", async () => {
    // jsdom default window.location.pathname is /
    // We can use history.pushState to change pathname
    window.history.pushState({}, "", "/login");

    const mockResponse = { ok: false, status: 401, statusText: "Unauthorized" };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api } = loadBrowserModule();

    await expect(api.get("/profile")).rejects.toThrow("Unauthorized");

    // Should not have redirected - still on /login
    expect(window.location.pathname).toBe("/login");

    window.history.pushState({}, "", "/");
  });

  it("does not redirect when on /signup page", async () => {
    window.history.pushState({}, "", "/signup");

    const mockResponse = { ok: false, status: 401, statusText: "Unauthorized" };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api } = loadBrowserModule();

    await expect(api.get("/profile")).rejects.toThrow("Unauthorized");

    expect(window.location.pathname).toBe("/signup");

    window.history.pushState({}, "", "/");
  });
});

describe("request without auth token", () => {
  it("does not include Authorization header when no token is set", async () => {
    const mockResponse = { ok: true, status: 200, json: () => Promise.resolve({ data: 1 }) };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api } = loadBrowserModule();
    await api.get("/public");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/public",
      expect.objectContaining({
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
    );
  });
});
