import { render, screen, waitFor } from "@testing-library/react";
import LearnPage from "@/app/learn/[levelId]/[unitId]/[lessonId]/page";
import { useLesson } from "@/hooks/useLesson";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ lessonId: "1", levelId: "1", unitId: "1" }),
}));

jest.mock("@/hooks/useLesson", () => ({
  useLesson: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  api: {
    patch: jest.fn(),
  },
}));

jest.mock("@/components/LessonPlayer", () => ({
  LessonPlayer: ({ lesson, onAnswer, onComplete }: any) => (
    <div data-testid="lesson-player">
      {lesson?.title}
      <button data-testid="answer-btn" onClick={() => onAnswer("ex1", "あ")}>Answer</button>
      <button data-testid="complete-btn" onClick={onComplete}>Complete</button>
    </div>
  ),
}));

const mockUseLesson = useLesson as jest.Mock;

describe("LearnPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseLesson.mockReturnValue({
      lesson: null,
      loading: true,
      currentExercise: 0,
      fetchLesson: jest.fn(),
      submitAnswer: jest.fn(),
      nextExercise: jest.fn(),
    });

    render(<LearnPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders LessonPlayer when lesson loaded", () => {
    const mockLesson = { title: "Greetings", exercises: [] };
    mockUseLesson.mockReturnValue({
      lesson: mockLesson,
      loading: false,
      currentExercise: 0,
      fetchLesson: jest.fn(),
      submitAnswer: jest.fn(),
      nextExercise: jest.fn(),
    });

    render(<LearnPage />);
    expect(screen.getByTestId("lesson-player")).toHaveTextContent("Greetings");
  });

  it("calls submitAnswer and nextExercise on answer", async () => {
    const submitAnswer = jest.fn().mockResolvedValue(null);
    const nextExercise = jest.fn();
    mockUseLesson.mockReturnValue({
      lesson: { title: "Greetings", exercises: [] },
      loading: false,
      currentExercise: 0,
      fetchLesson: jest.fn(),
      submitAnswer,
      nextExercise,
    });

    render(<LearnPage />);
    screen.getByTestId("answer-btn").click();
    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith("ex1", "あ");
      expect(nextExercise).toHaveBeenCalled();
    });
  });

  it("marks lesson completed and navigates to dashboard", async () => {
    const push = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push });
    const { api } = require("@/lib/api");
    api.patch.mockResolvedValue(null);
    mockUseLesson.mockReturnValue({
      lesson: { title: "Greetings", exercises: [] },
      loading: false,
      currentExercise: 0,
      fetchLesson: jest.fn(),
      submitAnswer: jest.fn(),
      nextExercise: jest.fn(),
    });

    render(<LearnPage />);
    screen.getByTestId("complete-btn").click();
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/progress", { lesson_id: "1", status: "completed" });
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
  });
});
