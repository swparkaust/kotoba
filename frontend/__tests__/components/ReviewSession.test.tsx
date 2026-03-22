import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewSession } from "@/components/ReviewSession";

describe("ReviewSession", () => {
  const mockCard = {
    id: "1", card_type: "kanji", card_key: "一",
    card_data: { front: "一", back: "いち / ひと(つ)" },
  };

  it("renders a review card", () => {
    render(<ReviewSession card={mockCard} remaining={5} onCorrect={jest.fn()} onIncorrect={jest.fn()} />);
    expect(screen.getByTestId("review-session")).toBeInTheDocument();
    expect(screen.getByTestId("review-card")).toBeInTheDocument();
    expect(screen.getByTestId("review-remaining")).toHaveTextContent("5");
  });

  it("calls onCorrect when correct button clicked", () => {
    const onCorrect = jest.fn();
    render(<ReviewSession card={mockCard} remaining={5} onCorrect={onCorrect} onIncorrect={jest.fn()} />);
    fireEvent.click(screen.getByTestId("review-correct"));
    expect(onCorrect).toHaveBeenCalled();
  });

  it("calls onIncorrect when incorrect button clicked", () => {
    const onIncorrect = jest.fn();
    render(<ReviewSession card={mockCard} remaining={5} onCorrect={jest.fn()} onIncorrect={onIncorrect} />);
    fireEvent.click(screen.getByTestId("review-incorrect"));
    expect(onIncorrect).toHaveBeenCalled();
  });

  it("renders empty state when card is null", () => {
    render(<ReviewSession card={null} remaining={0} onCorrect={jest.fn()} onIncorrect={jest.fn()} />);
    expect(screen.getByTestId("review-empty")).toBeInTheDocument();
    expect(screen.getByText("No cards due for review right now.")).toBeInTheDocument();
    expect(screen.queryByTestId("review-session")).not.toBeInTheDocument();
  });

  it("displays remaining count", () => {
    render(<ReviewSession card={mockCard} remaining={12} onCorrect={jest.fn()} onIncorrect={jest.fn()} />);
    expect(screen.getByTestId("review-remaining")).toHaveTextContent("12");
  });

  it("displays card front and back text", () => {
    render(<ReviewSession card={mockCard} remaining={3} onCorrect={jest.fn()} onIncorrect={jest.fn()} />);
    expect(screen.getByText("一")).toBeInTheDocument();
    expect(screen.getByText("いち / ひと(つ)")).toBeInTheDocument();
  });
});
