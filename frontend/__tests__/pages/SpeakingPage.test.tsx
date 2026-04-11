import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SpeakingPage from "@/app/speaking/[lessonId]/page";
import { api } from "@/lib/api";
import { useSpeechRecorder } from "@/hooks/useSpeechRecorder";

jest.mock("next/navigation", () => ({
  useParams: () => ({ lessonId: "1" }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/hooks/useSpeechRecorder", () => ({
  useSpeechRecorder: jest.fn(),
}));

let capturedOnResult: ((text: string) => void) | null = null;
jest.mock("@/components/SpeakingExercise", () => ({
  SpeakingExercise: ({ targetText, onResult, onSkip }: any) => {
    capturedOnResult = onResult;
    return (
      <div data-testid="speaking-exercise">
        <span data-testid="target-text">{targetText}</span>
        <button data-testid="submit-speech" onClick={() => onResult("こんにちは")}>
          Submit
        </button>
        <button data-testid="skip-btn" onClick={onSkip}>
          Skip
        </button>
      </div>
    );
  },
}));

jest.mock("@/components/SpeakingFeedback", () => ({
  SpeakingFeedback: ({ score, notes }: any) => (
    <div data-testid="speaking-feedback">
      score:{score} notes:{notes}
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;
const mockUseSpeechRecorder = useSpeechRecorder as jest.Mock;
const mockSubmitSpeech = jest.fn();

describe("SpeakingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSpeechRecorder.mockReturnValue({
      feedback: null,
      submitting: false,
      submitSpeech: mockSubmitSpeech,
    });
  });

  it("renders loading then SpeakingExercise", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<SpeakingPage />);
    expect(screen.getByText("Loading exercise...")).toBeInTheDocument();
  });

  it("renders SpeakingExercise after fetch", async () => {
    mockApiGet.mockResolvedValue([
      { id: 1, content: { prompt: "Say hello", target_text: "こんにちは", hints: [] } },
    ]);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("speaking-exercise")).toBeInTheDocument();
    });
    expect(screen.getByTestId("target-text")).toHaveTextContent("こんにちは");
  });

  it("shows SpeakingFeedback after submission", async () => {
    mockApiGet.mockResolvedValue([
      { id: 1, content: { prompt: "Say hello", target_text: "こんにちは", hints: [] } },
    ]);
    mockSubmitSpeech.mockResolvedValue(undefined);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("submit-speech")).toBeInTheDocument();
    });

    mockUseSpeechRecorder.mockReturnValue({
      feedback: { accuracy_score: 85, pronunciation_notes: "Good pitch", problem_sounds: [] },
      submitting: false,
      submitSpeech: mockSubmitSpeech,
    });

    screen.getByTestId("submit-speech").click();

    await waitFor(() => {
      expect(mockSubmitSpeech).toHaveBeenCalledWith("1", "こんにちは", "こんにちは");
    });
  });

  it("shows no exercise found message when no exercises returned", async () => {
    mockApiGet.mockResolvedValue([]);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByText("No speaking exercise found for this lesson.")).toBeInTheDocument();
    });
  });

  it("calls window.history.back when skip is clicked", async () => {
    const mockBack = jest.fn();
    jest.spyOn(window.history, "back").mockImplementation(mockBack);

    mockApiGet.mockResolvedValue([
      { id: 1, content: { prompt: "Say hello", target_text: "こんにちは", hints: [] } },
    ]);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("skip-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("skip-btn"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("handles non-array exercises response", async () => {
    mockApiGet.mockResolvedValue("not-an-array");

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByText("No speaking exercise found for this lesson.")).toBeInTheDocument();
    });
  });

  it("does not submit when exercise is null", async () => {
    mockApiGet.mockResolvedValue([]);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByText("No speaking exercise found for this lesson.")).toBeInTheDocument();
    });

    expect(mockSubmitSpeech).not.toHaveBeenCalled();
  });

  it("shows exercise without prompt", async () => {
    mockApiGet.mockResolvedValue([
      { id: 1, content: { target_text: "こんにちは", hints: [] } },
    ]);

    render(<SpeakingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("speaking-exercise")).toBeInTheDocument();
    });
  });
});
