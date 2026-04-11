import { render, screen, fireEvent } from "@testing-library/react";
import { ContrastiveGrammarExercise } from "@/components/ContrastiveGrammarExercise";

describe("ContrastiveGrammarExercise", () => {
  const mockSet = {
    cluster_name: "〜ても vs 〜のに",
    patterns: [
      { pattern: "〜ても", usage_ja: "仮定的にも使える", example_sentences: ["雨が降っても行きます"] },
      { pattern: "〜のに", usage_ja: "事実のみ。不満の気持ち", example_sentences: ["約束したのに来なかった"] },
    ],
    exercises: [
      { context: "早く起きた___遅刻した", correct: "のに", options: ["ても", "のに"] },
      { context: "雨が降っ___行きます", correct: "ても", options: ["ても", "のに"] },
    ],
  };

  it("renders pattern comparison and exercise", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    expect(screen.getByTestId("contrastive-grammar")).toBeInTheDocument();
    expect(screen.getByTestId("contrastive-patterns")).toBeInTheDocument();
    expect(screen.getByTestId("contrastive-exercise")).toBeInTheDocument();
  });

  it("displays pattern explanations with examples", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    expect(screen.getByText("〜ても")).toBeInTheDocument();
    expect(screen.getByText("〜のに")).toBeInTheDocument();
    expect(screen.getByText("雨が降っても行きます")).toBeInTheDocument();
  });

  it("does not call onAnswer on intermediate questions", () => {
    const onAnswer = jest.fn();
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText("のに"));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("calls onAnswer after answering last question and clicking continue", () => {
    const onAnswer = jest.fn();
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText("のに"));
    fireEvent.click(screen.getByText("Next question →"));
    fireEvent.click(screen.getByText("ても"));
    fireEvent.click(screen.getByTestId("contrastive-continue"));
    expect(onAnswer).toHaveBeenCalledWith("ても");
  });

  it("shows feedback after answering correctly", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("のに"));
    expect(screen.getByTestId("contrastive-feedback")).toBeInTheDocument();
    expect(screen.getByTestId("contrastive-feedback")).toHaveTextContent("正解");
  });

  it("shows correct answer on wrong selection", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("ても"));
    expect(screen.getByTestId("contrastive-feedback")).toHaveTextContent("のに");
  });

  it("shows question counter", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
  });

  it("advances to next question when next is clicked", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("のに"));
    expect(screen.getByText("Next question →")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Next question →"));
    expect(screen.getByText("Question 2 of 2")).toBeInTheDocument();
  });

  it("shows continue button instead of next on last question", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("のに"));
    fireEvent.click(screen.getByText("Next question →"));
    fireEvent.click(screen.getByText("ても"));
    expect(screen.queryByText("Next question →")).not.toBeInTheDocument();
    expect(screen.getByTestId("contrastive-continue")).toBeInTheDocument();
  });

  it("prevents double selection on same question", () => {
    const onAnswer = jest.fn();
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText("のに"));
    fireEvent.click(screen.getByText("ても"));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("shows usage hint on incorrect answer", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("ても"));
    expect(screen.getByTestId("contrastive-feedback")).toHaveTextContent("仮定的にも使える");
  });

  it("does not show usage hint on correct answer", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("のに"));
    expect(screen.getByTestId("contrastive-feedback")).not.toHaveTextContent("仮定的にも使える");
  });

  it("handles single-exercise set with continue button", () => {
    const singleSet = {
      ...mockSet,
      exercises: [
        { context: "早く起きた___遅刻した", correct: "のに", options: ["ても", "のに"] },
      ],
    };
    const onAnswer = jest.fn();
    render(<ContrastiveGrammarExercise set={singleSet} onAnswer={onAnswer} />);
    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("のに"));
    expect(screen.queryByText("Next question →")).not.toBeInTheDocument();
    expect(screen.getByTestId("contrastive-continue")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("contrastive-continue"));
    expect(onAnswer).toHaveBeenCalledWith("のに");
  });

  it("handleNext does not advance past the last question", () => {
    const singleSet = {
      ...mockSet,
      exercises: [
        { context: "Test", correct: "のに", options: ["ても", "のに"] },
      ],
    };
    render(<ContrastiveGrammarExercise set={singleSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("のに"));
    expect(screen.queryByText("Next question →")).not.toBeInTheDocument();
    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
  });

  it("shows incorrect feedback with usage from first pattern", () => {
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={jest.fn()} />);
    fireEvent.click(screen.getByText("ても"));
    expect(screen.getByTestId("contrastive-feedback")).toHaveTextContent("不正解");
    expect(screen.getByTestId("contrastive-feedback")).toHaveTextContent("仮定的にも使える");
  });
});
