import { render, screen, fireEvent } from "@testing-library/react";
import { PlacementTest } from "@/components/PlacementTest";

describe("PlacementTest", () => {
  const defaultProps = {
    onAnswer: jest.fn(),
    onAccept: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders placement test container", () => {
    render(<PlacementTest {...defaultProps} />);
    expect(screen.getByTestId("placement-test")).toBeInTheDocument();
  });

  it("renders result view when result is provided", () => {
    render(
      <PlacementTest
        {...defaultProps}
        result={{ recommended_level: 3, overall_score: 75 }}
      />
    );
    expect(screen.getByTestId("placement-result")).toBeInTheDocument();
    expect(screen.getByTestId("placement-accept")).toBeInTheDocument();
    expect(screen.getByText("Recommended: Level 3")).toBeInTheDocument();
  });

  it("calls onAccept with recommended level when accept clicked", () => {
    render(
      <PlacementTest
        {...defaultProps}
        result={{ recommended_level: 2, overall_score: 50 }}
      />
    );
    fireEvent.click(screen.getByTestId("placement-accept"));
    expect(defaultProps.onAccept).toHaveBeenCalledWith(2);
  });

  it("renders question view when question is provided", () => {
    render(
      <PlacementTest
        {...defaultProps}
        question={{ prompt: "Choose the correct reading", options: ["あ", "い", "う"] }}
      />
    );
    expect(screen.getByTestId("placement-question")).toBeInTheDocument();
    expect(screen.getByText("Choose the correct reading")).toBeInTheDocument();
  });

  it("calls onAnswer when a question option is clicked", () => {
    render(
      <PlacementTest
        {...defaultProps}
        question={{ prompt: "Choose", options: ["あ", "い"] }}
      />
    );
    fireEvent.click(screen.getByText("い"));
    expect(defaultProps.onAnswer).toHaveBeenCalledWith("い");
  });

  it("renders loading state when neither result nor question is given", () => {
    render(<PlacementTest {...defaultProps} />);
    expect(screen.getByTestId("placement-question")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
