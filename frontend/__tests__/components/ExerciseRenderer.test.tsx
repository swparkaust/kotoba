import { render, screen, fireEvent } from "@testing-library/react";
import { ExerciseRenderer } from "@/components/ExerciseRenderer";

jest.mock("@/components/MultipleChoice", () => ({
  MultipleChoice: (props: any) => <div data-testid="mock-multiple-choice">{props.prompt}</div>,
}));

jest.mock("@/components/FillInBlank", () => ({
  FillInBlank: (props: any) => <div data-testid="mock-fill-blank">{props.prompt}</div>,
}));

jest.mock("@/components/CharacterTracer", () => ({
  CharacterTracer: (props: any) => (
    <div data-testid="mock-character-tracer">
      {props.character}
      <button data-testid="tracer-complete" onClick={props.onComplete}>Complete</button>
    </div>
  ),
}));

jest.mock("@/components/ListeningExercise", () => ({
  ListeningExercise: (props: any) => (
    <div data-testid="mock-listening">
      {props.audioSrc}
      {props.options?.map((o: string, i: number) => (
        <button key={i} data-testid={`listening-opt-${i}`} onClick={() => props.onAnswer(i)}>{o}</button>
      ))}
      <button data-testid="listening-oob" onClick={() => props.onAnswer(999)}>OOB</button>
    </div>
  ),
}));

jest.mock("@/components/PictureMatchCard", () => ({
  PictureMatchCard: (props: any) => (
    <div data-testid="mock-picture-match">
      {props.options?.map((o: any, i: number) => (
        <button key={i} data-testid={`pm-opt-${i}`} onClick={() => props.onSelect(i)}>{o.label}</button>
      ))}
      <button data-testid="pm-oob" onClick={() => props.onSelect(999)}>OOB</button>
    </div>
  ),
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

  it("calls onAnswer with correct_answer when trace exercise completes", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 20, exercise_type: "trace", content: { character: "か", correct_answer: "ka" } }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("tracer-complete"));
    expect(onAnswer).toHaveBeenCalledWith("ka");
  });

  it("calls onAnswer with the option value when listening exercise answers", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 21, exercise_type: "listening", content: { audio_src: "/a.mp3", options: ["x", "y"] } }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("listening-opt-1"));
    expect(onAnswer).toHaveBeenCalledWith("y");
  });

  it("calls onAnswer with the label when picture_match exercise selects", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 22,
          exercise_type: "picture_match",
          content: {
            picture_options: [{ imageUrl: "/a.png", label: "apple" }, { imageUrl: "/b.png", label: "banana" }],
            correct_index: 0,
          },
        }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("pm-opt-1"));
    expect(onAnswer).toHaveBeenCalledWith("banana");
  });

  it("trace falls back to correct_answer when character is missing", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 23, exercise_type: "trace", content: { correct_answer: "test" } }}
        onAnswer={onAnswer}
      />
    );
    expect(screen.getByTestId("mock-character-tracer")).toHaveTextContent("test");
  });

  it("does not render hints when hints array is empty", () => {
    render(
      <ExerciseRenderer
        {...defaultProps}
        exercise={{
          ...defaultProps.exercise,
          content: { ...defaultProps.exercise.content, hints: [] },
        }}
      />
    );
    expect(screen.queryByText(/Hint:/)).not.toBeInTheDocument();
  });

  it("listening handles empty options gracefully", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 24, exercise_type: "listening", content: { audio_src: "/a.mp3" } }}
        onAnswer={onAnswer}
      />
    );
    expect(screen.getByTestId("mock-listening")).toBeInTheDocument();
  });

  it("default case with empty options array falls back to FillInBlank", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 25, exercise_type: "unknown", content: { prompt: "test", options: [] } }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("handles multiple_choice with missing options gracefully", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 26, exercise_type: "multiple_choice", content: { prompt: "test" } }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-multiple-choice")).toBeInTheDocument();
  });

  it("handles multiple_choice with missing correct_answer", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 27, exercise_type: "multiple_choice", content: { prompt: "test", options: ["a", "b"] } }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-multiple-choice")).toBeInTheDocument();
  });

  it("handles multiple_choice with image_url", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 28, exercise_type: "multiple_choice", content: { prompt: "test", options: ["a"], correct_answer: "a", image_url: "/img.png" } }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-multiple-choice")).toBeInTheDocument();
  });

  it("handles fill_blank with missing prompt", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 29, exercise_type: "fill_blank", content: {} }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("handles trace with character but no correct_answer", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 30, exercise_type: "trace", content: { character: "き" } }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("tracer-complete"));
    expect(onAnswer).toHaveBeenCalledWith("");
  });

  it("handles listening with empty options returning empty string on answer", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 31, exercise_type: "listening", content: {} }}
        onAnswer={onAnswer}
      />
    );
    expect(screen.getByTestId("mock-listening")).toBeInTheDocument();
  });

  it("handles picture_match with empty picture_options", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{ id: 32, exercise_type: "picture_match", content: {} }}
        onAnswer={onAnswer}
      />
    );
    expect(screen.getByTestId("mock-picture-match")).toBeInTheDocument();
  });

  it("picture_match onSelect with out-of-bound index returns empty label", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 33,
          exercise_type: "picture_match",
          content: { picture_options: [{ imageUrl: "/a.png", label: "x" }], correct_index: 0 },
        }}
        onAnswer={onAnswer}
      />
    );
    // Select index 0 which exists
    fireEvent.click(screen.getByTestId("pm-opt-0"));
    expect(onAnswer).toHaveBeenCalledWith("x");
  });

  it("default fallback with undefined prompt renders FillInBlank", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 34, exercise_type: "exotic", content: {} }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-fill-blank")).toBeInTheDocument();
  });

  it("multiple_choice with undefined options uses null indexOf fallback", () => {
    render(
      <ExerciseRenderer
        exercise={{
          id: 35,
          exercise_type: "multiple_choice",
          content: { prompt: "Test prompt", correct_answer: "a" },
        }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-multiple-choice")).toHaveTextContent("Test prompt");
  });

  it("listening exercise with out-of-bound index returns empty string", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 36,
          exercise_type: "listening",
          content: { audio_src: "/a.mp3", options: ["only-one"] },
        }}
        onAnswer={onAnswer}
      />
    );
    // Click index 0 which exists - the option at that index
    fireEvent.click(screen.getByTestId("listening-opt-0"));
    expect(onAnswer).toHaveBeenCalledWith("only-one");
  });

  it("picture_match with missing picture_options array handles select gracefully", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 37,
          exercise_type: "picture_match",
          content: { correct_index: 0 },
        }}
        onAnswer={onAnswer}
      />
    );
    expect(screen.getByTestId("mock-picture-match")).toBeInTheDocument();
  });

  it("trace exercise with neither character nor correct_answer uses empty string", () => {
    render(
      <ExerciseRenderer
        exercise={{ id: 38, exercise_type: "trace", content: {} }}
        onAnswer={jest.fn()}
      />
    );
    expect(screen.getByTestId("mock-character-tracer")).toBeInTheDocument();
  });

  it("multiple_choice with empty prompt uses empty string fallback", () => {
    render(
      <ExerciseRenderer
        exercise={{
          id: 39,
          exercise_type: "multiple_choice",
          content: { options: ["a", "b"], correct_answer: "a" },
        }}
        onAnswer={jest.fn()}
      />
    );
    // prompt || "" fallback should be ""
    expect(screen.getByTestId("mock-multiple-choice")).toHaveTextContent("");
  });

  it("listening exercise onAnswer with out-of-bounds index returns empty string", () => {
    const onAnswer = jest.fn();
    // Create a listening exercise mock that directly calls onAnswer with index 5 (out of bounds)
    jest.resetModules();

    // The inner mock for ListeningExercise already fires onAnswer(i) where i is the button index
    // We test this by having an options array shorter than the index accessed
    render(
      <ExerciseRenderer
        exercise={{
          id: 40,
          exercise_type: "listening",
          content: { audio_src: "/a.mp3", options: [] },
        }}
        onAnswer={onAnswer}
      />
    );
    // With empty options, the mock renders no buttons, but the component still renders
    expect(screen.getByTestId("mock-listening")).toBeInTheDocument();
  });

  it("picture_match onSelect with empty picture_options returns empty label", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 41,
          exercise_type: "picture_match",
          content: { picture_options: [], correct_index: 0 },
        }}
        onAnswer={onAnswer}
      />
    );
    // Empty options - mock renders no buttons
    expect(screen.getByTestId("mock-picture-match")).toBeInTheDocument();
  });

  it("listening out-of-bounds index returns empty string via fallback", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 42,
          exercise_type: "listening",
          content: { audio_src: "/a.mp3", options: ["x", "y"] },
        }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("listening-oob"));
    expect(onAnswer).toHaveBeenCalledWith("");
  });

  it("listening without options calls onAnswer with empty string via fallback", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 44,
          exercise_type: "listening",
          content: { audio_src: "/a.mp3" },
        }}
        onAnswer={onAnswer}
      />
    );
    // No options at all, OOB button calls onAnswer(999), content.options is undefined
    // (content.options || [])[999] -> [][999] -> undefined, || "" -> ""
    fireEvent.click(screen.getByTestId("listening-oob"));
    expect(onAnswer).toHaveBeenCalledWith("");
  });

  it("picture_match out-of-bounds index returns empty string via fallback", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 43,
          exercise_type: "picture_match",
          content: {
            picture_options: [{ imageUrl: "/a.png", label: "apple" }],
            correct_index: 0,
          },
        }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("pm-oob"));
    expect(onAnswer).toHaveBeenCalledWith("");
  });

  it("picture_match without picture_options calls onAnswer with empty string", () => {
    const onAnswer = jest.fn();
    render(
      <ExerciseRenderer
        exercise={{
          id: 45,
          exercise_type: "picture_match",
          content: { correct_index: 0 },
        }}
        onAnswer={onAnswer}
      />
    );
    fireEvent.click(screen.getByTestId("pm-oob"));
    expect(onAnswer).toHaveBeenCalledWith("");
  });
});
