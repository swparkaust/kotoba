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

  it("expands gloss to show example sentence on click", () => {
    render(<AuthenticReader source={mockSource} />);
    // Example sentence not visible initially
    expect(screen.queryByText("日本の経済は良い")).not.toBeInTheDocument();
    // Click the gloss button (the button contains the word as <strong>)
    const glossArea = screen.getByTestId("authentic-gloss");
    const glossBtn = glossArea.querySelector("button")!;
    fireEvent.click(glossBtn);
    expect(screen.getByText("日本の経済は良い")).toBeInTheDocument();
  });

  it("collapses gloss example sentence on second click", () => {
    render(<AuthenticReader source={mockSource} />);
    const glossArea = screen.getByTestId("authentic-gloss");
    const glossBtn = glossArea.querySelector("button")!;
    fireEvent.click(glossBtn);
    expect(screen.getByText("日本の経済は良い")).toBeInTheDocument();
    fireEvent.click(glossBtn);
    expect(screen.queryByText("日本の経済は良い")).not.toBeInTheDocument();
  });

  it("renders title", () => {
    render(<AuthenticReader source={mockSource} />);
    expect(screen.getByText("経済ニュース")).toBeInTheDocument();
  });

  it("does not show example sentence when gloss has no example", () => {
    const sourceNoExample = {
      ...mockSource,
      scaffolding: {
        ...mockSource.scaffolding,
        glosses: [{ word: "政治", reading: "せいじ", definition_ja: "politics", example_sentence: "" }],
      },
    };
    render(<AuthenticReader source={sourceNoExample} />);
    fireEvent.click(screen.getByText(/政治/));
    // No example text should appear since example_sentence is empty
    expect(screen.queryByText(/border-l-2/)).not.toBeInTheDocument();
  });

  it("shows button text as Show answer before reveal", () => {
    render(<AuthenticReader source={mockSource} />);
    expect(screen.getByTestId("question-reveal-0")).toHaveTextContent("Show answer");
  });

  it("changes button text to Hide answer after reveal", () => {
    render(<AuthenticReader source={mockSource} />);
    fireEvent.click(screen.getByTestId("question-reveal-0"));
    expect(screen.getByTestId("question-reveal-0")).toHaveTextContent("Hide answer");
  });
});
