import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useContentPack } from "@/hooks/useContentPack";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useContentPack", () => {
  it("checkForUpdate calls correct endpoint with default language", async () => {
    mockApi.get.mockResolvedValue({
      update_available: false,
      latest_version: 1,
    });
    const { result } = renderHook(() => useContentPack());

    await act(async () => {
      await result.current.checkForUpdate(1);
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/content_packs/check_update?language_code=ja&current_version=1"
    );
  });

  it("checkForUpdate uses provided language code", async () => {
    mockApi.get.mockResolvedValue({
      update_available: false,
      latest_version: 1,
    });
    const { result } = renderHook(() => useContentPack());

    await act(async () => {
      await result.current.checkForUpdate(1, "ko");
    });

    expect(mockApi.get).toHaveBeenCalledWith(
      "/content_packs/check_update?language_code=ko&current_version=1"
    );
  });

  it("sets updateAvailable true when newer version exists", async () => {
    mockApi.get.mockResolvedValue({
      update_available: true,
      latest_version: 3,
    });
    const { result } = renderHook(() => useContentPack());

    expect(result.current.updateAvailable).toBe(false);

    await act(async () => {
      await result.current.checkForUpdate(1);
    });

    expect(result.current.updateAvailable).toBe(true);
    expect(result.current.latestVersion).toBe(3);
  });

  it("sets updateAvailable false when no update", async () => {
    mockApi.get.mockResolvedValue({
      update_available: false,
      latest_version: 1,
    });
    const { result } = renderHook(() => useContentPack());

    await act(async () => {
      await result.current.checkForUpdate(1);
    });

    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.latestVersion).toBe(1);
  });

  it("sets error on failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Network failure"));
    const { result } = renderHook(() => useContentPack());

    await act(async () => {
      await result.current.checkForUpdate(1);
    });

    expect(result.current.error).toBe("Network failure");
  });
});
