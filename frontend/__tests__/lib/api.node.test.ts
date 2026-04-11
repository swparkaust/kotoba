/**
 * @jest-environment node
 */

// Tests for api.ts server-side branches where typeof window === "undefined"

beforeEach(() => {
  jest.resetModules();
});

function loadModule() {
  return require("@/lib/api") as typeof import("@/lib/api");
}

describe("api.ts server-side (node environment)", () => {
  it("setAuthToken stores token in memory without localStorage", () => {
    const { setAuthToken, getAuthToken } = loadModule();
    setAuthToken("tok_node");
    // Token should still be retrievable from in-memory variable
    expect(getAuthToken()).toBe("tok_node");
  });

  it("getAuthToken returns null when no token is set and window is undefined", () => {
    const { getAuthToken } = loadModule();
    expect(getAuthToken()).toBeNull();
  });

  it("request throws Unauthorized on 401 without redirect when window is undefined", async () => {
    const mockResponse = { ok: false, status: 401, statusText: "Unauthorized" };
    global.fetch = jest.fn().mockResolvedValue(mockResponse);

    const { api } = loadModule();

    await expect(api.get("/profile")).rejects.toThrow("Unauthorized");
  });
});
