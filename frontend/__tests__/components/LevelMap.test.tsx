import { render, screen, fireEvent } from "@testing-library/react";
import { LevelMap } from "@/components/LevelMap";

describe("LevelMap", () => {
  const defaultProps = {
    levels: [
      { id: 1, position: 1, title: "Beginner", jlpt_approx: "N5", curriculum_units: [], lesson_count: 10, completed_count: 0 },
      { id: 2, position: 2, title: "Elementary", jlpt_approx: "N4", curriculum_units: [], lesson_count: 12, completed_count: 0 },
      { id: 3, position: 3, title: "Intermediate", jlpt_approx: "N3", curriculum_units: [], lesson_count: 15, completed_count: 0 },
      { id: 4, position: 4, title: "Advanced", jlpt_approx: "N2", curriculum_units: [], lesson_count: 20, completed_count: 0 },
    ],
    currentLevel: 2,
    onSelectLevel: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders level map container", () => {
    render(<LevelMap {...defaultProps} />);
    expect(screen.getByTestId("level-map")).toBeInTheDocument();
  });

  it("renders visible levels (position <= currentLevel + 1)", () => {
    render(<LevelMap {...defaultProps} />);
    expect(screen.getByTestId("level-card-1")).toBeInTheDocument();
    expect(screen.getByTestId("level-card-2")).toBeInTheDocument();
    expect(screen.getByTestId("level-card-3")).toBeInTheDocument();
  });

  it("hides levels with position > currentLevel + 1", () => {
    render(<LevelMap {...defaultProps} />);
    expect(screen.queryByTestId("level-card-4")).not.toBeInTheDocument();
  });

  it("shows hidden level count", () => {
    render(<LevelMap {...defaultProps} />);
    expect(screen.getByTestId("levels-collapsed")).toHaveTextContent("1 more");
  });

  it("calls onSelectLevel when a level card is clicked", () => {
    render(<LevelMap {...defaultProps} />);
    fireEvent.click(screen.getByTestId("level-card-2"));
    expect(defaultProps.onSelectLevel).toHaveBeenCalledWith(2);
  });

  it("renders level titles", () => {
    render(<LevelMap {...defaultProps} />);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("Elementary")).toBeInTheDocument();
  });
});
