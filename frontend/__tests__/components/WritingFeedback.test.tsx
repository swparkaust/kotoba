import { render, screen } from "@testing-library/react";
import { WritingFeedback } from "@/components/WritingFeedback";

describe("WritingFeedback", () => {
  it("renders score and feedback sections", () => {
    render(<WritingFeedback score={85} grammarFeedback="Good" naturalnessFeedback="Natural" suggestions={["Keep going"]} />);
    expect(screen.getByTestId("writing-feedback")).toBeInTheDocument();
    expect(screen.getByTestId("writing-score")).toHaveTextContent("85");
    expect(screen.getByTestId("writing-grammar")).toBeInTheDocument();
  });

  it("displays grammar feedback text", () => {
    render(<WritingFeedback score={70} grammarFeedback="文法は正しいです" naturalnessFeedback="自然です" suggestions={[]} />);
    expect(screen.getByTestId("writing-grammar")).toHaveTextContent("文法は正しいです");
  });

  it("renders all suggestions", () => {
    const suggestions = ["もっと丁寧に", "漢字を使いましょう", "接続詞を加えて"];
    render(<WritingFeedback score={60} grammarFeedback="OK" naturalnessFeedback="OK" suggestions={suggestions} />);
    suggestions.forEach((s) => {
      expect(screen.getByText("• " + s)).toBeInTheDocument();
    });
  });

  it("handles empty suggestions gracefully", () => {
    render(<WritingFeedback score={95} grammarFeedback="Perfect" naturalnessFeedback="Very natural" suggestions={[]} />);
    expect(screen.getByTestId("writing-feedback")).toBeInTheDocument();
  });

  it("renders naturalness feedback text", () => {
    render(<WritingFeedback score={80} grammarFeedback="Good grammar" naturalnessFeedback="とても自然な表現です" suggestions={[]} />);
    expect(screen.getByTestId("writing-naturalness")).toHaveTextContent("とても自然な表現です");
  });
});
