import { render, screen } from "@testing-library/react";
import { JlptProgressBar } from "@/components/JlptProgressBar";

describe("JlptProgressBar", () => {
  it("renders JLPT level and percentage", () => {
    render(<JlptProgressBar jlptLabel="N5" percentage={20} />);
    expect(screen.getByTestId("jlpt-bar")).toBeInTheDocument();
    expect(screen.getByTestId("jlpt-label")).toHaveTextContent("N5");
  });

  it("renders Pre-N5 for beginners", () => {
    render(<JlptProgressBar jlptLabel="Pre-N5" percentage={0} />);
    expect(screen.getByTestId("jlpt-label")).toHaveTextContent("Pre-N5");
  });

  it("displays percentage value", () => {
    render(<JlptProgressBar jlptLabel="N3" percentage={55} />);
    expect(screen.getByTestId("jlpt-bar")).toHaveTextContent("55");
  });

  it("renders progress bar at 100%", () => {
    render(<JlptProgressBar jlptLabel="N1+" percentage={100} />);
    expect(screen.getByTestId("jlpt-label")).toHaveTextContent("N1+");
    expect(screen.getByTestId("jlpt-bar")).toBeInTheDocument();
  });
});
