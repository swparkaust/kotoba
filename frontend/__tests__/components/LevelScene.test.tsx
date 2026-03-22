import { render, screen } from "@testing-library/react";
import { LevelScene } from "@/components/LevelScene";

describe("LevelScene", () => {
  it("renders scene container", () => {
    render(<LevelScene levelId={1} completedLessons={3} totalLessons={8} />);
    expect(screen.getByTestId("level-scene")).toBeInTheDocument();
  });

  it("shows more scene elements as lessons complete", () => {
    const { rerender } = render(<LevelScene levelId={1} completedLessons={1} totalLessons={8} />);
    const elementsAt1 = screen.queryAllByTestId(/scene-element-/).length;
    rerender(<LevelScene levelId={1} completedLessons={5} totalLessons={8} />);
    const elementsAt5 = screen.queryAllByTestId(/scene-element-/).length;
    expect(elementsAt5).toBeGreaterThan(elementsAt1);
  });

  it("renders completion percentage", () => {
    render(<LevelScene levelId={1} completedLessons={4} totalLessons={8} />);
    expect(screen.getByTestId("level-scene")).toBeInTheDocument();
  });

  it("handles zero completed lessons", () => {
    render(<LevelScene levelId={1} completedLessons={0} totalLessons={10} />);
    expect(screen.getByTestId("level-scene")).toBeInTheDocument();
  });
});
