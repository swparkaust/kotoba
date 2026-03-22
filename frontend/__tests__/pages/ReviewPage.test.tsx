import { render, screen, waitFor } from "@testing-library/react";
import ReviewPage from "@/app/review/page";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock("@/components/ReviewSession", () => ({
  ReviewSession: ({ card, remaining }: any) => (
    <div data-testid="review-session">
      {card ? card.card_key : "no-card"} remaining:{remaining}
    </div>
  ),
}));

jest.mock("@/components/ReviewFilter", () => ({
  ReviewFilter: ({ stats }: any) => (
    <div data-testid="review-filter">total:{stats.total}</div>
  ),
}));

const mockApiGet = api.get as jest.Mock;

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
});
