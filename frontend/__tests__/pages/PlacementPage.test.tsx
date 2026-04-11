import { render, screen, waitFor, act } from "@testing-library/react";
import PlacementPage from "@/app/placement/page";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/hooks/useLanguage", () => ({
  useLanguage: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/components/PlacementTest", () => ({
  PlacementTest: ({ question, result, onAnswer, onAccept }: any) => (
    <div data-testid="placement-test">
      {question && <span data-testid="prompt">{question.prompt}</span>}
      {result && <span data-testid="result">level:{result.recommended_level} score:{result.overall_score}</span>}
      {question && (
        <button data-testid="answer-btn" onClick={() => onAnswer("a")}>
          Answer
        </button>
      )}
      {onAccept && (
        <button data-testid="accept-btn" onClick={() => onAccept(3)}>
          Accept
        </button>
      )}
    </div>
  ),
}));

const mockUseLanguage = useLanguage as jest.Mock;
const mockApiGet = api.get as jest.Mock;
const mockApiPost = api.post as jest.Mock;

describe("PlacementPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({ languageCode: "ja" });
  });

  it("renders loading then PlacementTest component", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<PlacementPage />);
    expect(screen.getByText("Generating placement test...")).toBeInTheDocument();
  });

  it("renders PlacementTest with question after fetch", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "What is こんにちは?", options: ["Hello", "Goodbye"], level: 1, skill_tested: "vocab" },
      ],
    });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("placement-test")).toBeInTheDocument();
    });
    expect(screen.getByTestId("prompt")).toHaveTextContent("What is こんにちは?");
  });

  it("shows result after answering all questions", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost.mockResolvedValue({
      recommended_level: 3,
      overall_score: 75,
      id: 42,
    });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("level:3 score:75");
    });
  });

  it("shows error when questions fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Server error"));

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no questions returned", async () => {
    mockApiGet.mockResolvedValue({ session_key: "abc", questions: [] });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByText("No questions available")).toBeInTheDocument();
    });
  });

  it("shows error when submission fails", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost.mockRejectedValue(new Error("Submission failed"));

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByText("Submission failed")).toBeInTheDocument();
    });
  });

  it("navigates to dashboard when placement is accepted", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost
      .mockResolvedValueOnce({ recommended_level: 3, overall_score: 75, id: 42 })
      .mockResolvedValueOnce({});

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("accept-btn")).toBeInTheDocument();
    });

    screen.getByTestId("accept-btn").click();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("advances through multiple questions before submitting", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
        { prompt: "Q2", options: ["c", "d"], level: 2, skill_tested: "grammar" },
      ],
    });
    mockApiPost.mockResolvedValue({ recommended_level: 4, overall_score: 80, id: 10 });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("Q1");
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("prompt")).toHaveTextContent("Q2");
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("result")).toHaveTextContent("level:4 score:80");
    });
  });

  it("shows error when accept fails", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost
      .mockResolvedValueOnce({ recommended_level: 3, overall_score: 75, id: 42 })
      .mockRejectedValueOnce(new Error("Accept failed"));

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("accept-btn")).toBeInTheDocument();
    });

    screen.getByTestId("accept-btn").click();

    await waitFor(() => {
      expect(screen.getByText("Accept failed")).toBeInTheDocument();
    });
  });

  it("handles missing questions field in response", async () => {
    mockApiGet.mockResolvedValue({ session_key: "abc" });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByText("No questions available")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when fetch error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load placement test")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when submission error has no message", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost.mockRejectedValue({});

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByText("Failed to submit placement test")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when accept error has no message", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost
      .mockResolvedValueOnce({ recommended_level: 3, overall_score: 75, id: 42 })
      .mockRejectedValueOnce({});

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("accept-btn")).toBeInTheDocument();
    });

    screen.getByTestId("accept-btn").click();

    await waitFor(() => {
      expect(screen.getByText("Failed to accept placement")).toBeInTheDocument();
    });
  });

  it("shows submitting state while evaluating answers", async () => {
    let resolvePost: (v: any) => void;
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost.mockImplementation(() => new Promise((r) => { resolvePost = r; }));

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByText("Evaluating your answers...")).toBeInTheDocument();
    });

    await act(async () => {
      resolvePost!({ recommended_level: 3, overall_score: 75, id: 42 });
    });
  });

  it("handleAccept returns early when result is null", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("accept-btn")).toBeInTheDocument();
    });

    screen.getByTestId("accept-btn").click();

    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("hides progress bar and question counter when result is shown", async () => {
    mockApiGet.mockResolvedValue({
      session_key: "abc",
      questions: [
        { prompt: "Q1", options: ["a", "b"], level: 1, skill_tested: "vocab" },
      ],
    });
    mockApiPost.mockResolvedValue({ recommended_level: 3, overall_score: 75, id: 42 });

    render(<PlacementPage />);

    await waitFor(() => {
      expect(screen.getByTestId("answer-btn")).toBeInTheDocument();
    });

    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();

    screen.getByTestId("answer-btn").click();

    await waitFor(() => {
      expect(screen.getByTestId("result")).toBeInTheDocument();
    });

    expect(screen.queryByText(/Question \d+ of/)).not.toBeInTheDocument();
  });
});
