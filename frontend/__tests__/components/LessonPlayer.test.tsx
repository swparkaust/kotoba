import { render, screen, fireEvent } from "@testing-library/react";
import { LessonPlayer } from "@/components/LessonPlayer";

jest.mock("@/components/ExerciseRenderer", () => ({
  ExerciseRenderer: ({ exercise, onAnswer }: { exercise: any; onAnswer: (answer: string) => void }) => (
    <div data-testid="mock-exercise-renderer">
      {exercise.exercise_type}
      <button data-testid="mock-answer-btn" onClick={() => onAnswer("test-answer")}>Answer</button>
    </div>
  ),
}));

describe("LessonPlayer", () => {
  const defaultProps = {
    lesson: {
      id: 1,
      position: 1,
      title: "Test Lesson",
      skill_type: "vocabulary",
      objectives: ["Learn basics"],
      content_status: "ready",
      content_assets: [],
      progress_status: "not_started",
      score: null,
      exercises: [
        { id: 1, position: 1, exercise_type: "multiple_choice", content: { prompt: "Q1", options: ["a", "b"] } },
        { id: 2, position: 2, exercise_type: "fill_blank", content: { prompt: "Q2" } },
        { id: 3, position: 3, exercise_type: "trace", content: { character: "あ" } },
      ],
    },
    currentExercise: 0,
    onAnswer: jest.fn(),
    onComplete: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders lesson player with progress", () => {
    render(<LessonPlayer {...defaultProps} />);
    expect(screen.getByTestId("lesson-player")).toBeInTheDocument();
    expect(screen.getByTestId("exercise-progress")).toBeInTheDocument();
  });

  it("shows correct progress text", () => {
    render(<LessonPlayer {...defaultProps} />);
    expect(screen.getByTestId("exercise-progress")).toHaveTextContent("1 / 3");
  });

  it("renders the current exercise via ExerciseRenderer", () => {
    render(<LessonPlayer {...defaultProps} />);
    expect(screen.getByTestId("mock-exercise-renderer")).toBeInTheDocument();
    expect(screen.getByTestId("mock-exercise-renderer")).toHaveTextContent("multiple_choice");
  });

  it("shows second exercise when currentExercise is 1", () => {
    render(<LessonPlayer {...defaultProps} currentExercise={1} />);
    expect(screen.getByTestId("exercise-progress")).toHaveTextContent("2 / 3");
    expect(screen.getByTestId("mock-exercise-renderer")).toHaveTextContent("fill_blank");
  });

  it("calls onComplete when all exercises are done", () => {
    render(<LessonPlayer {...defaultProps} currentExercise={3} />);
    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it("renders completion view when all exercises are done", () => {
    render(<LessonPlayer {...defaultProps} currentExercise={3} />);
    expect(screen.getByTestId("lesson-complete")).toBeInTheDocument();
  });

  it("shows correct pluralization for single exercise", () => {
    render(
      <LessonPlayer
        {...defaultProps}
        lesson={{ ...defaultProps.lesson, exercises: [{ id: 1, position: 1, exercise_type: "multiple_choice", content: { prompt: "Q1", options: ["a"] } }] }}
        currentExercise={1}
      />
    );
    expect(screen.getByTestId("lesson-complete")).toHaveTextContent("1 exercise.");
  });

  it("shows correct pluralization for multiple exercises", () => {
    render(<LessonPlayer {...defaultProps} currentExercise={3} />);
    expect(screen.getByTestId("lesson-complete")).toHaveTextContent("3 exercises.");
  });

  it("handles null lesson gracefully", () => {
    render(<LessonPlayer {...defaultProps} lesson={null} currentExercise={0} />);
    expect(screen.getByTestId("lesson-complete")).toBeInTheDocument();
  });

  it("does not call onComplete when lesson has no exercises", () => {
    const onComplete = jest.fn();
    render(<LessonPlayer {...defaultProps} lesson={{ ...defaultProps.lesson, exercises: [] }} currentExercise={0} onComplete={onComplete} />);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("calls onAnswer with exercise id and answer text", () => {
    const onAnswer = jest.fn();
    render(<LessonPlayer {...defaultProps} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByTestId("mock-answer-btn"));
    expect(onAnswer).toHaveBeenCalledWith("1", "test-answer");
  });
});
