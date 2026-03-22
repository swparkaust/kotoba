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
  LessonPlayer: ({ lesson }: any) => (
    <div data-testid="lesson-player">{lesson?.title}</div>
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
});
