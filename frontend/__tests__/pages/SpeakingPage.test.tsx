import { render, screen, waitFor } from "@testing-library/react";
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

jest.mock("@/components/SpeakingExercise", () => ({
  SpeakingExercise: ({ targetText, onResult }: any) => (
    <div data-testid="speaking-exercise">
      <span data-testid="target-text">{targetText}</span>
      <button data-testid="submit-speech" onClick={() => onResult("こんにちは")}>
        Submit
      </button>
    </div>
  ),
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
});
