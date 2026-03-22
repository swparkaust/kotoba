import { renderHook, act } from "@testing-library/react";

jest.mock("@/lib/api", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { api } from "@/lib/api";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";

const mockApi = api as jest.Mocked<typeof api>;

let mockRecognitionInstance: any;

class MockSpeechRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = jest.fn();
  stop = jest.fn();
  constructor() {
    mockRecognitionInstance = this;
  }
}

(window as any).SpeechRecognition = MockSpeechRecognition;

beforeEach(() => {
  jest.clearAllMocks();
  mockRecognitionInstance = null;
});

describe("useSpeechRecorder", () => {
  it("startRecording sets recording to true", () => {
    const { result } = renderHook(() => useSpeechRecorder());
    const onTranscript = jest.fn();

    act(() => {
      result.current.startRecording(onTranscript);
    });

    expect(result.current.recording).toBe(true);
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });

  it("startRecording sets language on recognition", () => {
    const { result } = renderHook(() => useSpeechRecorder("ko-KR"));
    const onTranscript = jest.fn();

    act(() => {
      result.current.startRecording(onTranscript);
    });

    expect(mockRecognitionInstance.lang).toBe("ko-KR");
  });

  it("stopRecording sets recording to false", () => {
    const { result } = renderHook(() => useSpeechRecorder());
    const onTranscript = jest.fn();

    act(() => {
      result.current.startRecording(onTranscript);
    });

    act(() => {
      result.current.stopRecording();
    });

    expect(result.current.recording).toBe(false);
    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
  });

  it("calls onTranscript when recognition result is received", () => {
    const { result } = renderHook(() => useSpeechRecorder());
    const onTranscript = jest.fn();

    act(() => {
      result.current.startRecording(onTranscript);
    });

    act(() => {
      mockRecognitionInstance.onresult({
        results: [[{ transcript: "こんにちは" }]],
      });
    });

    expect(onTranscript).toHaveBeenCalledWith("こんにちは");
  });

  it("submitSpeech posts and returns feedback", async () => {
    const feedbackData = {
      accuracy_score: 85,
      transcription: "こんにちは",
      pronunciation_notes: "Good",
      problem_sounds: [],
    };
    mockApi.post.mockResolvedValue(feedbackData);
    const { result } = renderHook(() => useSpeechRecorder());

    let returnedData: any;
    await act(async () => {
      returnedData = await result.current.submitSpeech(
        "ex-1",
        "こんにちは",
        "こんにちは"
      );
    });

    expect(mockApi.post).toHaveBeenCalledWith("/speaking/submit", {
      exercise_id: "ex-1",
      transcription: "こんにちは",
      target_text: "こんにちは",
    });
    expect(returnedData).toEqual(feedbackData);
    expect(result.current.feedback).toEqual(feedbackData);
  });

  it("sets error when speech recognition is not supported", () => {
    const origSR = (window as any).SpeechRecognition;
    const origWebkit = (window as any).webkitSpeechRecognition;
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    const { result } = renderHook(() => useSpeechRecorder());

    act(() => {
      result.current.startRecording(jest.fn());
    });

    expect(result.current.error).toBe(
      "Speech recognition is not supported in this browser."
    );

    (window as any).SpeechRecognition = origSR;
    if (origWebkit) (window as any).webkitSpeechRecognition = origWebkit;
  });

  it("sets error on submit failure", async () => {
    mockApi.post.mockRejectedValue(new Error("Submit failed"));
    const { result } = renderHook(() => useSpeechRecorder());

    await act(async () => {
      const data = await result.current.submitSpeech("ex-1", "test", "test");
      expect(data).toBeNull();
    });

    expect(result.current.error).toBe("Submit failed");
  });
});
