import { render, screen, waitFor } from "@testing-library/react";
import WritingPage from "@/app/writing/[lessonId]/page";
import { api } from "@/lib/api";
import { useWriting } from "@/hooks/useWriting";

jest.mock("next/navigation", () => ({
  useParams: () => ({ lessonId: "1" }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/hooks/useWriting", () => ({
  useWriting: jest.fn(),
}));

jest.mock("@/components/WritingExercise", () => ({
  WritingExercise: ({ prompt, onSubmit }: any) => (
    <div data-testid="writing-exercise">
      <span data-testid="writing-prompt">{prompt}</span>
      <button data-testid="submit-writing" onClick={() => onSubmit("私は学生です")}>
        Submit
      </button>
    </div>
  ),
}));

jest.mock("@/components/WritingFeedback", () => ({
  WritingFeedback: ({ score, grammarFeedback }: any) => (
    <div data-testid="writing-feedback">
      score:{score} grammar:{grammarFeedback}
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;
const mockUseWriting = useWriting as jest.Mock;
const mockSubmitWriting = jest.fn();

describe("WritingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriting.mockReturnValue({
      feedback: null,
      submitting: false,
      submitWriting: mockSubmitWriting,
    });
  });

  it("renders loading then WritingExercise", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<WritingPage />);
    expect(screen.getByText("Loading exercise...")).toBeInTheDocument();
  });

  it("renders WritingExercise after fetch", async () => {
    mockApiGet.mockResolvedValue([
      { id: 1, content: { prompt: "Write a self-introduction", hints: [] } },
    ]);

    render(<WritingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("writing-exercise")).toBeInTheDocument();
    });
    expect(screen.getByTestId("writing-prompt")).toHaveTextContent("Write a self-introduction");
  });

  it("shows WritingFeedback after submission", async () => {
    mockApiGet.mockResolvedValue([
      { id: 1, content: { prompt: "Write a self-introduction", hints: [] } },
    ]);
    mockSubmitWriting.mockResolvedValue(undefined);

    render(<WritingPage />);

    await waitFor(() => {
      expect(screen.getByTestId("submit-writing")).toBeInTheDocument();
    });

    mockUseWriting.mockReturnValue({
      feedback: { score: 90, grammar_feedback: "Excellent", naturalness_feedback: "Natural", suggestions: [] },
      submitting: false,
      submitWriting: mockSubmitWriting,
    });

    screen.getByTestId("submit-writing").click();

    await waitFor(() => {
      expect(mockSubmitWriting).toHaveBeenCalledWith("1", "私は学生です");
    });
  });
});
