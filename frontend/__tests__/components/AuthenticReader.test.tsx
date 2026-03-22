import { render, screen, fireEvent } from "@testing-library/react";
import { AuthenticReader } from "@/components/AuthenticReader";

describe("AuthenticReader", () => {
  const mockSource = {
    title: "経済ニュース",
    body_text: "日本の経済は...",
    attribution: "NHK News Web Easy",
    scaffolding: {
      glosses: [{ word: "経済", reading: "けいざい", definition_ja: "お金の動き", example_sentence: "日本の経済は良い" }],
      comprehension_questions: [{ question_ja: "テーマは何ですか？", expected_answer_ja: "経済" }],
    },
  };

  it("renders authentic text with source attribution", () => {
    render(<AuthenticReader source={mockSource} />);
    expect(screen.getByTestId("authentic-reader")).toBeInTheDocument();
    expect(screen.getByTestId("authentic-text")).toHaveTextContent("日本の経済は...");
    expect(screen.getByTestId("authentic-source")).toHaveTextContent("NHK News Web Easy");
  });

  it("renders glosses with readings and definitions", () => {
    render(<AuthenticReader source={mockSource} />);
    expect(screen.getByTestId("authentic-gloss")).toBeInTheDocument();
    expect(screen.getByText(/けいざい/)).toBeInTheDocument();
    expect(screen.getByText(/お金の動き/)).toBeInTheDocument();
  });

  it("renders comprehension questions", () => {
    render(<AuthenticReader source={mockSource} />);
    expect(screen.getByTestId("authentic-questions")).toBeInTheDocument();
    expect(screen.getByText("テーマは何ですか？", { exact: false })).toBeInTheDocument();
  });

  it("reveals answer when show answer is clicked", () => {
    render(<AuthenticReader source={mockSource} />);
    fireEvent.click(screen.getByTestId("question-reveal-0"));
    expect(screen.getByTestId("question-answer-0")).toHaveTextContent("経済");
  });

  it("hides answer when toggled again", () => {
    render(<AuthenticReader source={mockSource} />);
    fireEvent.click(screen.getByTestId("question-reveal-0"));
    expect(screen.getByTestId("question-answer-0")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("question-reveal-0"));
    expect(screen.queryByTestId("question-answer-0")).not.toBeInTheDocument();
  });
});
