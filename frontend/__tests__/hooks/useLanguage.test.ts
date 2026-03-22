import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useLanguage", () => {
  it("fetches profile on mount and sets language code", async () => {
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/profile")
        return Promise.resolve({ active_language_code: "ko" });
      if (path === "/languages")
        return Promise.resolve([{ code: "ja" }, { code: "ko" }]);
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockApi.get).toHaveBeenCalledWith("/profile");
    expect(result.current.languageCode).toBe("ko");
  });

  it("fetches available languages on mount", async () => {
    const languages = [{ code: "ja" }, { code: "ko" }, { code: "zh" }];
    mockApi.get.mockImplementation((path: string) => {
      if (path === "/profile")
        return Promise.resolve({ active_language_code: "ja" });
      if (path === "/languages") return Promise.resolve(languages);
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockApi.get).toHaveBeenCalledWith("/languages");
    expect(result.current.availableLanguages).toEqual(languages);
  });

  it("switchLanguage patches profile", async () => {
    mockApi.get.mockResolvedValue({});
    mockApi.patch.mockResolvedValue({});
    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.switchLanguage("zh");
    });

    expect(mockApi.patch).toHaveBeenCalledWith("/profile", {
      active_language_code: "zh",
    });
    expect(result.current.languageCode).toBe("zh");
  });

  it("sets error when profile fetch fails", async () => {
    mockApi.get.mockRejectedValue(new Error("Unauthorized"));

    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).toBe("Unauthorized");
  });

  it("sets error when switchLanguage fails", async () => {
    mockApi.get.mockResolvedValue({});
    mockApi.patch.mockRejectedValue(new Error("Patch failed"));
    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.switchLanguage("ko");
    });

    expect(result.current.error).toBe("Patch failed");
  });
});
