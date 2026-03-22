import { render, screen, fireEvent } from "@testing-library/react";
import { ExerciseRenderer } from "@/components/ExerciseRenderer";

jest.mock("@/components/MultipleChoice", () => ({
  MultipleChoice: (props: any) => <div data-testid="mock-multiple-choice">{props.prompt}</div>,
}));

jest.mock("@/components/FillInBlank", () => ({
  FillInBlank: (props: any) => <div data-testid="mock-fill-blank">{props.prompt}</div>,
}));

jest.mock("@/components/CharacterTracer", () => ({
  CharacterTracer: (props: any) => <div data-testid="mock-character-tracer">{props.character}</div>,
}));

jest.mock("@/components/ListeningExercise", () => ({
  ListeningExercise: (props: any) => <div data-testid="mock-listening">{props.audioSrc}</div>,
}));

jest.mock("@/components/PictureMatchCard", () => ({
  PictureMatchCard: () => <div data-testid="mock-picture-match" />,
}));

describe("ExerciseRenderer", () => {
  const defaultProps = {
    exercise: {
      id: 1,
      exercise_type: "multiple_choice",
      content: {
        prompt: "What is this?",
        options: ["あ", "い", "う"],
        correct_answer: "あ",
      },
    },
    onAnswer: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders exercise renderer container", () => {
    render(<ExerciseRenderer {...defaultProps} />);
    expect(screen.getByTestId("exercise-renderer")).toBeInTheDocument();
  });

  it("renders MultipleChoice for multiple_choice type", () => {
    render(<ExerciseRenderer {...defaultProps} />);
    expect(screen.getByTestId("mock-multiple-choice")).toBeInTheDocument();
  });

  it("renders FillInBlank for fill_blank type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 2, exercise_type: "fill_blank", content: { prompt: "Fill this" } }}
      />
    );
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("renders CharacterTracer for trace type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 3, exercise_type: "trace", content: { character: "あ" } }}
      />
    );
    expect(screen.getByTestId("mock-character-tracer")).toBeInTheDocument();
  });

  it("renders ListeningExercise for listening type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 4, exercise_type: "listening", content: { audio_src: "/a.mp3", options: ["a"] } }}
      />
    );
    expect(screen.getByTestId("mock-listening")).toBeInTheDocument();
  });

  it("renders PictureMatchCard for picture_match type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{
          id: 5,
          exercise_type: "picture_match",
          content: { picture_options: [{ imageUrl: "/a.png", label: "a" }], correct_index: 0 },
        }}
      />
    );
    expect(screen.getByTestId("mock-picture-match")).toBeInTheDocument();
  });

  it("renders exercise type testid", () => {
    render(<ExerciseRenderer {...defaultProps} />);
    expect(screen.getByTestId("exercise-type-multiple_choice")).toBeInTheDocument();
  });

  it("renders hints when provided", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{
          ...defaultProps.exercise,
          content: { ...defaultProps.exercise.content, hints: ["Think about vowels"] },
        }}
      />
    );
    expect(screen.getByText("Hint: Think about vowels")).toBeInTheDocument();
  });

  it("renders FillInBlank as fallback for unknown type without options", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 99, exercise_type: "unknown_type", content: { prompt: "Fallback prompt" } }}
      />
    );
    expect(screen.getByTestId("exercise-renderer")).toBeInTheDocument();
    expect(screen.getByTestId("exercise-type-unknown_type")).toBeInTheDocument();
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("renders inline options as fallback for unknown type with options", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{
          id: 100,
          exercise_type: "custom_quiz",
          content: { prompt: "Pick one", options: ["A", "B", "C"] },
        }}
      />
    );
    expect(screen.getByTestId("exercise-type-custom_quiz")).toBeInTheDocument();
    expect(screen.getByText("Pick one")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("falls back to FillInBlank for reorder exercise type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 10, exercise_type: "reorder", content: { prompt: "Reorder" } }}
      />
    );
    expect(screen.getByTestId("exercise-type-reorder")).toBeInTheDocument();
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("falls back to FillInBlank for writing exercise type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 11, exercise_type: "writing", content: { prompt: "Write this" } }}
      />
    );
    expect(screen.getByTestId("exercise-type-writing")).toBeInTheDocument();
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("falls back to FillInBlank for speaking exercise type", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{ id: 12, exercise_type: "speaking", content: { prompt: "Say this" } }}
      />
    );
    expect(screen.getByTestId("exercise-type-speaking")).toBeInTheDocument();
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("falls back to inline options for reorder type with options", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{
          id: 13,
          exercise_type: "reorder",
          content: { prompt: "Reorder these", options: ["X", "Y"] },
        }}
      />
    );
    expect(screen.getByTestId("exercise-type-reorder")).toBeInTheDocument();
    expect(screen.getByText("X")).toBeInTheDocument();
    expect(screen.getByText("Y")).toBeInTheDocument();
  });

  it("calls onAnswer when fallback inline option is clicked", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 14,
          exercise_type: "speaking",
          content: { prompt: "Pick", options: ["Alpha", "Beta"] },
        }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByText("Alpha"));
    expect(onAnswer).toHaveBeenCalledWith("Alpha");
  });
});
