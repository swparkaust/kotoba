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
});
