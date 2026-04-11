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

  it("does not call onSelect until continue is clicked", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-2"));
    expect(defaultProps.onSelect).not.toHaveBeenCalled();
  });

  it("calls onSelect with the clicked index after continue", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-2"));
    fireEvent.click(screen.getByTestId("match-continue"));
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
    fireEvent.click(screen.getByTestId("match-continue"));
    expect(defaultProps.onSelect).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSelect).toHaveBeenCalledWith(0);
  });

  it("shows fallback character when image fails to load", () => {
    render(<PictureMatchCard {...defaultProps} />);
    const option0 = screen.getByTestId("match-option-0");
    const img = option0.querySelector("img")!;
    expect(img).toBeInTheDocument();
    fireEvent.error(img);
    expect(option0.querySelector("img")).not.toBeInTheDocument();
    expect(option0.querySelector("span")).toHaveTextContent("猫");
  });

  it("shows correct feedback on right answer", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-0"));
    expect(screen.getByTestId("match-feedback")).toHaveTextContent("正解");
  });

  it("shows correct answer on wrong selection", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-1"));
    expect(screen.getByTestId("match-feedback")).toHaveTextContent("猫");
  });

  it("selects wrong answer and shows red border class", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-1"));
    const correctBtn = screen.getByTestId("match-option-0");
    expect(correctBtn.className).toContain("border-green");
    const wrongBtn = screen.getByTestId("match-option-1");
    expect(wrongBtn.className).toContain("border-red");
  });

  it("selects correct answer and shows green border class", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-0"));
    const correctBtn = screen.getByTestId("match-option-0");
    expect(correctBtn.className).toContain("border-green");
  });

  it("unselected options get opacity-50 after selection", () => {
    render(<PictureMatchCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("match-option-0"));
    const unselectedBtn = screen.getByTestId("match-option-2");
    expect(unselectedBtn.className).toContain("opacity-50");
  });

  it("renders images for all options initially", () => {
    render(<PictureMatchCard {...defaultProps} />);
    const imgs = screen.getByTestId("picture-match").querySelectorAll("img");
    expect(imgs).toHaveLength(4);
  });

  it("handleSelect returns early when already selected (via non-disabled elem)", () => {
    const onSelect = jest.fn();
    render(<PictureMatchCard options={defaultProps.options} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId("match-option-0"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
