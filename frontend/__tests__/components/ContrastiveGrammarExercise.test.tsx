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

  it("calls onAnswer when an option is clicked", () => {
    const onAnswer = jest.fn();
    render(<ContrastiveGrammarExercise set={mockSet} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText("のに"));
    expect(onAnswer).toHaveBeenCalledWith("のに");
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
});
