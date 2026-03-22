import { render, screen } from "@testing-library/react";
import { ReadingTimeTracker } from "@/components/ReadingTimeTracker";

describe("ReadingTimeTracker", () => {
  it("renders cumulative reading and listening time", () => {
    render(<ReadingTimeTracker readingMinutes={120} listeningMinutes={45} wordsRead={8500} />);
    expect(screen.getByTestId("reading-tracker")).toBeInTheDocument();
    expect(screen.getByTestId("reading-minutes")).toBeInTheDocument();
    expect(screen.getByTestId("listening-minutes")).toBeInTheDocument();
    expect(screen.getByTestId("words-read")).toBeInTheDocument();
  });

  it("displays correct reading minutes value", () => {
    render(<ReadingTimeTracker readingMinutes={90} listeningMinutes={30} wordsRead={5000} />);
    expect(screen.getByTestId("reading-minutes")).toHaveTextContent("90");
  });

  it("displays correct word count", () => {
    render(<ReadingTimeTracker readingMinutes={60} listeningMinutes={20} wordsRead={12000} />);
    expect(screen.getByTestId("words-read")).toHaveTextContent("12000");
  });

  it("handles zero values", () => {
    render(<ReadingTimeTracker readingMinutes={0} listeningMinutes={0} wordsRead={0} />);
    expect(screen.getByTestId("reading-tracker")).toBeInTheDocument();
    expect(screen.getByTestId("reading-minutes")).toHaveTextContent("0");
  });
});
