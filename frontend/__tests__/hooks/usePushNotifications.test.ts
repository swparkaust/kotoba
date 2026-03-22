import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const mockApi = api as jest.Mocked<typeof api>;

const mockSubscription = {
  toJSON: jest.fn().mockReturnValue({
    endpoint: "https://push.example.com",
    keys: { p256dh: "key1", auth: "key2" },
  }),
};

const mockPushManager = {
  subscribe: jest.fn().mockResolvedValue(mockSubscription),
  getSubscription: jest.fn().mockResolvedValue(null),
};

const mockRegistration = {
  pushManager: mockPushManager,
};

Object.defineProperty(navigator, "serviceWorker", {
  writable: true,
  value: {
    ready: Promise.resolve(mockRegistration),
  },
});

process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-WLm1aLPGETY0lwafluE0FQ3C9Xk_5MZzR8gCg";

beforeEach(() => {
  jest.clearAllMocks();
  mockPushManager.getSubscription.mockResolvedValue(null);
  mockPushManager.subscribe.mockResolvedValue(mockSubscription);
});

describe("usePushNotifications", () => {
  it("checks existing subscription on mount", async () => {
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockPushManager.getSubscription).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
  });

  it("isSubscribed is false when no existing subscription", async () => {
    mockPushManager.getSubscription.mockResolvedValue(null);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isSubscribed).toBe(false);
  });

  it("subscribe calls pushManager.subscribe with correct options", async () => {
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockPushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
  });

  it("subscribe posts subscription to /push_subscriptions", async () => {
    mockApi.post.mockResolvedValue({});
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockApi.post).toHaveBeenCalledWith("/push_subscriptions", {
      endpoint: "https://push.example.com",
      keys: { p256dh: "key1", auth: "key2" },
    });
    expect(result.current.isSubscribed).toBe(true);
  });

  it("sets error on subscribe failure", async () => {
    mockPushManager.subscribe.mockRejectedValue(
      new Error("Permission denied")
    );
    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe("Permission denied");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("does not call pushManager.subscribe when existing subscription found on mount", async () => {
    mockPushManager.getSubscription.mockResolvedValue(mockSubscription);

    const { result } = renderHook(() => usePushNotifications());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.isSubscribed).toBe(true);
    expect(mockPushManager.subscribe).not.toHaveBeenCalled();
  });
});
