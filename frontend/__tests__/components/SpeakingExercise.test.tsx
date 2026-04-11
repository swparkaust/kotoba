import { render, screen, fireEvent } from "@testing-library/react";
import { SpeakingExercise } from "@/components/SpeakingExercise";

let mockRecorderState = {
  recording: false,
  error: null as string | null,
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
};

jest.mock("@/hooks/useSpeechRecorder", () => ({
  useSpeechRecorder: () => mockRecorderState,
}));

describe("SpeakingExercise", () => {
  beforeEach(() => {
    mockRecorderState = {
      recording: false,
      error: null,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
    };
  });

  it("renders target text and record button", () => {
    render(<SpeakingExercise targetText="おはようございます" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByTestId("speaking-exercise")).toBeInTheDocument();
    expect(screen.getByTestId("speaking-target")).toHaveTextContent("おはようございます");
    expect(screen.getByTestId("speaking-record-btn")).toBeInTheDocument();
  });

  it("shows skip button", () => {
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByTestId("speaking-skip")).toBeInTheDocument();
  });

  it("calls onSkip when skip is clicked", () => {
    const onSkip = jest.fn();
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId("speaking-skip"));
    expect(onSkip).toHaveBeenCalled();
  });

  it("renders stop button", () => {
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByTestId("speaking-stop-btn")).toBeInTheDocument();
  });

  it("displays error when recorder has error", () => {
    mockRecorderState.error = "Microphone access denied";
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText("Microphone access denied")).toBeInTheDocument();
  });

  it("does not display error when recorder has no error", () => {
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.queryByText("Microphone access denied")).not.toBeInTheDocument();
  });

  it("shows Listening indicator when recording is active", () => {
    mockRecorderState.recording = true;
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("does not show Listening indicator when not recording", () => {
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.queryByText("Listening...")).not.toBeInTheDocument();
  });

  it("calls startRecording and shows transcript on result", () => {
    let capturedCallback: ((text: string) => void) | undefined;
    mockRecorderState.startRecording = jest.fn((cb) => {
      capturedCallback = cb;
    });

    const onResult = jest.fn();
    render(<SpeakingExercise targetText="こんにちは" onResult={onResult} onSkip={jest.fn()} />);

    fireEvent.click(screen.getByTestId("speaking-record-btn"));
    expect(mockRecorderState.startRecording).toHaveBeenCalled();

    // Simulate speech recognition result
    if (capturedCallback) capturedCallback("こんにちは");
    expect(onResult).toHaveBeenCalledWith("こんにちは");
  });

  it("calls stopRecording when stop button is clicked", () => {
    mockRecorderState.recording = true;
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByTestId("speaking-stop-btn"));
    expect(mockRecorderState.stopRecording).toHaveBeenCalled();
  });

  it("disables record button when recording", () => {
    mockRecorderState.recording = true;
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByTestId("speaking-record-btn")).toBeDisabled();
  });

  it("disables stop button when not recording", () => {
    render(<SpeakingExercise targetText="test" onResult={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByTestId("speaking-stop-btn")).toBeDisabled();
  });
});
