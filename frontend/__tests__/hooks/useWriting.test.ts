import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useWriting } from "@/hooks/useWriting";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useWriting", () => {
  it("submitWriting posts to /writing/submit", async () => {
    const feedbackData = {
      score: 90,
      grammar_feedback: "Excellent",
      naturalness_feedback: "Natural",
      register_feedback: "Appropriate",
      suggestions: [],
    };
    mockApi.post.mockResolvedValue(feedbackData);
    const { result } = renderHook(() => useWriting());

    await act(async () => {
      await result.current.submitWriting("ex-1", "今日は天気がいいです。");
    });

    expect(mockApi.post).toHaveBeenCalledWith("/writing/submit", {
      exercise_id: "ex-1",
      text: "今日は天気がいいです。",
    });
  });

  it("sets feedback after successful submit", async () => {
    const feedbackData = {
      score: 75,
      grammar_feedback: "Minor issues",
      naturalness_feedback: "Mostly natural",
      register_feedback: "OK",
      suggestions: ["Use て-form"],
    };
    mockApi.post.mockResolvedValue(feedbackData);
    const { result } = renderHook(() => useWriting());

    await act(async () => {
      await result.current.submitWriting("ex-2", "テスト");
    });

    expect(result.current.feedback).toEqual(feedbackData);
  });

  it("sets submitting during request", async () => {
    let resolve: (v: any) => void;
    mockApi.post.mockImplementation(
      () => new Promise((r) => (resolve = r))
    );
    const { result } = renderHook(() => useWriting());

    expect(result.current.submitting).toBe(false);

    let promise: Promise<any>;
    act(() => {
      promise = result.current.submitWriting("ex-1", "text");
    });

    expect(result.current.submitting).toBe(true);

    await act(async () => {
      resolve!({ score: 100 });
      await promise!;
    });

    expect(result.current.submitting).toBe(false);
  });

  it("handles errors and sets error state", async () => {
    mockApi.post.mockRejectedValue(new Error("Server error"));
    const { result } = renderHook(() => useWriting());

    await act(async () => {
      await result.current.submitWriting("ex-1", "text");
    });

    expect(result.current.error).toBe("Server error");
    expect(result.current.feedback).toBeNull();
  });

  it("clears error on new submission", async () => {
    mockApi.post.mockRejectedValueOnce(new Error("First error"));
    const { result } = renderHook(() => useWriting());

    await act(async () => {
      await result.current.submitWriting("ex-1", "text");
    });

    expect(result.current.error).toBe("First error");

    mockApi.post.mockResolvedValue({ score: 80 });
    await act(async () => {
      await result.current.submitWriting("ex-1", "text");
    });

    expect(result.current.error).toBeNull();
  });

  it("uses fallback message when error has no message", async () => {
    mockApi.post.mockRejectedValue({});
    const { result } = renderHook(() => useWriting());

    await act(async () => {
      await result.current.submitWriting("ex-1", "text");
    });

    expect(result.current.error).toBe("Failed to submit writing");
    expect(result.current.submitting).toBe(false);
  });
});
