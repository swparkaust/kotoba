import { render, screen, fireEvent } from "@testing-library/react";
import { PictureMatchCard } from "@/components/PictureMatchCard";

describe("PictureMatchCard", () => {
  const defaultProps = {
    options: [
      { imageUrl: "/img/cat.png", label: "猫" },
      { imageUrl: "/img/dog.png", label: "犬" },
      { imageUrl: "/img/bird.png", label: "鳥" },
      { imageUrl: "/img/fish.png", label: "魚" },
    ],
    onSelect: jest.fn(),
    correctIndex: 0,
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders all options", () => {
    render(<PictureMatchCard {...defaultProps} />);
    expect(screen.getByTestId("picture-match")).toBeInTheDocument();
    expect(screen.getByTestId("match-option-0")).toBeInTheDocument();
    expect(screen.getByTestId("match-option-1")).toBeInTheDocument();
    expect(screen.getByTestId("match-option-2")).toBeInTheDocument();
    expect(screen.getByTestId("match-option-3")).toBeInTheDocument();
  });

  it("renders option labels", () => {
    render(<PictureMatchCard {...defaultProps} />);
    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("犬")).toBeInTheDocument();
  });

  it("calls onSelect with the clicked index", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-2"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(2);
  });

  it("disables all options after selection", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-1"));
    expect(screen.getByTestId("match-option-0")).toBeDisabled();
    expect(screen.getByTestId("match-option-1")).toBeDisabled();
    expect(screen.getByTestId("match-option-2")).toBeDisabled();
    expect(screen.getByTestId("match-option-3")).toBeDisabled();
  });

  it("does not call onSelect on second click", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-0"));
    fireEvent.click(screen.getByTestId("match-option-1"));
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
  });
});
