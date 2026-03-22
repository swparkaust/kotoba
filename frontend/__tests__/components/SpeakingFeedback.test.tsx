import { render, screen } from "@testing-library/react";
import { SpeakingFeedback } from "@/components/SpeakingFeedback";

describe("SpeakingFeedback", () => {
  const defaultProps = {
    score: 85,
    notes: "Good pronunciation overall",
    problemSounds: [
      { expected: "し", heard: "si", tip: "Round your lips" },
      { expected: "つ", heard: "tu", tip: "Touch tongue to ridge" },
      { expected: "ふ", heard: "hu", tip: "Blow gently" },
    ],
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the feedback container", () => {
    render(<SpeakingFeedback {...defaultProps} />);
    expect(screen.getByTestId("speaking-feedback")).toBeInTheDocument();
  });

  it("renders the score", () => {
    render(<SpeakingFeedback {...defaultProps} />);
    expect(screen.getByTestId("speaking-score")).toHaveTextContent("85");
  });

  it("renders the notes", () => {
    render(<SpeakingFeedback {...defaultProps} />);
    expect(screen.getByTestId("speaking-notes")).toHaveTextContent("Good pronunciation overall");
  });

  it("renders the problem sounds list", () => {
    render(<SpeakingFeedback {...defaultProps} />);
    const list = screen.getByTestId("problem-sound-list");
    expect(list).toBeInTheDocument();
    expect(list).toHaveTextContent("し");
    expect(list).toHaveTextContent("つ");
    expect(list).toHaveTextContent("ふ");
  });
});
