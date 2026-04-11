import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReviewPage from "@/app/review/page";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/components/ReviewSession", () => ({
  ReviewSession: ({ card, remaining, onCorrect, onIncorrect }: any) => (
    <div data-testid="review-session">
      {card ? card.card_key : "no-card"} remaining:{remaining}
      {onCorrect && <button data-testid="correct-btn" onClick={onCorrect}>Correct</button>}
      {onIncorrect && <button data-testid="incorrect-btn" onClick={onIncorrect}>Incorrect</button>}
    </div>
  ),
}));

jest.mock("@/components/ReviewFilter", () => ({
  ReviewFilter: ({ stats, onApply }: any) => (
    <div data-testid="review-filter">
      total:{stats.total}
      {onApply && <button data-testid="apply-filter" onClick={() => onApply({ card_type: "kanji" })}>Apply</button>}
      {onApply && <button data-testid="apply-filter-time" onClick={() => onApply({ card_type: "vocab", time_budget: 15 })}>Apply with time</button>}
      {onApply && <button data-testid="apply-filter-empty" onClick={() => onApply({})}>Apply empty</button>}
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;
const mockApiPost = api.post as jest.Mock;

describe("ReviewPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading then review session", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("日");
    });
  });

  it("shows filter when stats loaded", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 25, active: 10, burned: 5, due_now: 8, due_today: 12 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-filter")).toHaveTextContent("total:25");
    });
  });

  it("shows error when fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("does not show filter when stats total is 0", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("review-filter")).not.toBeInTheDocument();
  });

  it("shows no-card when review list is empty", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("no-card");
    });
  });

  it("submits correct review and advances to next card", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([
        { id: "1", card_type: "kanji", card_key: "日", card_data: {} },
        { id: "2", card_type: "kanji", card_key: "月", card_data: {} },
      ]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      return Promise.resolve(null);
    });
    mockApiPost.mockResolvedValue({});

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("日");
    });

    fireEvent.click(screen.getByTestId("correct-btn"));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/reviews/1/submit", { correct: true });
    });

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("月");
    });
  });

  it("submits incorrect review and advances", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([
        { id: "1", card_type: "kanji", card_key: "日", card_data: {} },
        { id: "2", card_type: "kanji", card_key: "月", card_data: {} },
      ]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      return Promise.resolve(null);
    });
    mockApiPost.mockResolvedValue({});

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("日");
    });

    fireEvent.click(screen.getByTestId("incorrect-btn"));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/reviews/1/submit", { correct: false });
    });
  });

  it("shows error when review submit fails", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([
        { id: "1", card_type: "kanji", card_key: "日", card_data: {} },
      ]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      return Promise.resolve(null);
    });
    mockApiPost.mockRejectedValue(new Error("Submit failed"));

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("correct-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("correct-btn"));

    await waitFor(() => {
      expect(screen.getByText("Failed to submit review. Please try again.")).toBeInTheDocument();
    });
  });

  it("applies filter and refreshes cards", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url.includes("card_type=kanji")) return Promise.resolve([{ id: "2", card_type: "kanji", card_key: "火", card_data: {} }]);
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining("card_type=kanji"));
    });
  });

  it("handles non-array reviews response gracefully", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve("not-an-array");
      if (url === "/reviews/stats") return Promise.resolve({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("no-card");
    });
  });

  it("shows error when filter fetch fails", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url.includes("card_type")) return Promise.reject(new Error("Filter error"));
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter"));

    await waitFor(() => {
      expect(screen.getByText("Filter error")).toBeInTheDocument();
    });
  });

  it("handles correct click when no card is available", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("correct-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("correct-btn"));
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("handles incorrect click when no card is available", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 0, active: 0, burned: 0, due_now: 0, due_today: 0 });
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("incorrect-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("incorrect-btn"));
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("shows error when incorrect submit fails", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([
        { id: "1", card_type: "kanji", card_key: "日", card_data: {} },
      ]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      return Promise.resolve(null);
    });
    mockApiPost.mockRejectedValue(new Error("Submit error"));

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("incorrect-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("incorrect-btn"));

    await waitFor(() => {
      expect(screen.getByText("Failed to submit review. Please try again.")).toBeInTheDocument();
    });
  });

  it("applies filter with time_budget param", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url.includes("card_type=vocab") && url.includes("time_budget=15")) return Promise.resolve([{ id: "3", card_type: "vocab", card_key: "雨", card_data: {} }]);
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter-time")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter-time"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining("time_budget=15"));
    });
  });

  it("applies filter with no params", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url === "/reviews?") return Promise.resolve([]);
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter-empty")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter-empty"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(3);
    });
  });

  it("shows fallback error message when error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load reviews")).toBeInTheDocument();
    });
  });

  it("handles non-array filter response", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url.includes("card_type")) return Promise.resolve("not-an-array");
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter"));

    await waitFor(() => {
      expect(screen.getByTestId("review-session")).toHaveTextContent("no-card");
    });
  });

  it("shows fallback error message when filter error has no message", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/reviews") return Promise.resolve([{ id: "1", card_type: "kanji", card_key: "日", card_data: {} }]);
      if (url === "/reviews/stats") return Promise.resolve({ total: 10, active: 5, burned: 2, due_now: 3, due_today: 4 });
      if (url.includes("card_type")) return Promise.reject({});
      return Promise.resolve(null);
    });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(screen.getByTestId("apply-filter")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("apply-filter"));

    await waitFor(() => {
      expect(screen.getByText("Failed to apply filter")).toBeInTheDocument();
    });
  });
});
