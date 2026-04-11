import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useLesson } from "@/hooks/useLesson";

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe("useLesson", () => {
  it("fetchLesson calls GET /lessons/:id", async () => {
    const lessonData = {
      id: "lesson-1",
      title: "Greetings",
      exercises: [{ id: "e1" }, { id: "e2" }],
    };
    mockApi.get.mockResolvedValue(lessonData);
    const { result } = renderHook(() => useLesson("lesson-1"));

    await act(async () => {
      await result.current.fetchLesson();
    });

    expect(mockApi.get).toHaveBeenCalledWith("/lessons/lesson-1");
    expect(result.current.lesson).toEqual(lessonData);
  });

  it("sets loading false after fetchLesson completes", async () => {
    mockApi.get.mockResolvedValue({ id: "lesson-1" });
    const { result } = renderHook(() => useLesson("lesson-1"));

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.fetchLesson();
    });

    expect(result.current.loading).toBe(false);
  });

  it("submitAnswer calls POST /exercises/:id/submit", async () => {
    const response = { correct: true, explanation: "Good job" };
    mockApi.post.mockResolvedValue(response);
    const { result } = renderHook(() => useLesson("lesson-1"));

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.submitAnswer("e1", "こんにちは");
    });

    expect(mockApi.post).toHaveBeenCalledWith("/exercises/e1/submit", {
      answer: "こんにちは",
    });
    expect(returnedData).toEqual(response);
  });

  it("nextExercise increments currentExercise", () => {
    const { result } = renderHook(() => useLesson("lesson-1"));

    expect(result.current.currentExercise).toBe(0);

    act(() => {
      result.current.nextExercise();
    });

    expect(result.current.currentExercise).toBe(1);

    act(() => {
      result.current.nextExercise();
    });

    expect(result.current.currentExercise).toBe(2);
  });

  it("sets error on fetchLesson failure", async () => {
    mockApi.get.mockRejectedValue(new Error("Not found"));
    const { result } = renderHook(() => useLesson("bad-id"));

    await act(async () => {
      await result.current.fetchLesson();
    });

    expect(result.current.error).toBe("Not found");
    expect(result.current.loading).toBe(false);
  });

  it("sets error on submitAnswer failure", async () => {
    mockApi.post.mockRejectedValue(new Error("Invalid answer"));
    const { result } = renderHook(() => useLesson("lesson-1"));

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.submitAnswer("e1", "wrong");
    });

    expect(result.current.error).toBe("Invalid answer");
    expect(returnedData).toBeNull();
  });

  it("uses fallback message when fetchLesson error has no message", async () => {
    mockApi.get.mockRejectedValue({});
    const { result } = renderHook(() => useLesson("bad-id"));

    await act(async () => {
      await result.current.fetchLesson();
    });

    expect(result.current.error).toBe("Failed to load lesson");
    expect(result.current.loading).toBe(false);
  });

  it("uses fallback message when submitAnswer error has no message", async () => {
    mockApi.post.mockRejectedValue({});
    const { result } = renderHook(() => useLesson("lesson-1"));

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.submitAnswer("e1", "wrong");
    });

    expect(result.current.error).toBe("Failed to submit answer");
    expect(returnedData).toBeNull();
  });
});
