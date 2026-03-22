import { render, screen, waitFor } from "@testing-library/react";
import PlacementPage from "@/app/placement/page";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
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
  PlacementTest: ({ question, result, onAnswer }: any) => (
    <div data-testid="placement-test">
      {question && <span data-testid="prompt">{question.prompt}</span>}
      {result && <span data-testid="result">level:{result.recommended_level} score:{result.overall_score}</span>}
      {question && (
        <button data-testid="answer-btn" onClick={() => onAnswer("a")}>
          Answer
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
});
