import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/hooks/useLanguage", () => ({
  useLanguage: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/components/LevelMap", () => ({
  LevelMap: ({ levels, onSelectLevel }: { levels: any[]; onSelectLevel?: (id: number) => void }) => (
    <div data-testid="level-map">
      {levels.map((l: any) => l.name).join(",")}
      {onSelectLevel && (
        <button data-testid="select-level" onClick={() => onSelectLevel(1)}>
          Select
        </button>
      )}
    </div>
  ),
}));

jest.mock("@/components/JlptProgressBar", () => ({
  JlptProgressBar: ({ jlptLabel, percentage }: any) => (
    <div data-testid="jlpt-bar">{jlptLabel} {percentage}%</div>
  ),
}));

jest.mock("@/components/StreakFreeEncouragement", () => ({
  StreakFreeEncouragement: () => <div data-testid="encouragement" />,
}));

const mockUseLanguage = useLanguage as jest.Mock;
const mockApiGet = api.get as jest.Mock;

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({ languageCode: "ja" });
  });

  it("renders loading state initially", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows levels after fetch", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum")) return Promise.resolve([{ name: "Level 1" }, { name: "Level 2" }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve({ jlpt_label: "N5", percentage: 42, completed_levels: 1 });
      if (url === "/progress") return Promise.resolve([{ status: "completed" }]);
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("level-map")).toHaveTextContent("Level 1,Level 2");
    });
    expect(screen.getByTestId("jlpt-bar")).toHaveTextContent("N5 42%");
  });

  it("shows error when fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard")).toBeInTheDocument();
    });
  });

  it("navigates to level when handleSelectLevel is called with valid data", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([{ name: "Level 1", id: 1 }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve({ jlpt_label: "N5", percentage: 42, completed_levels: 1 });
      if (url === "/progress") return Promise.resolve([{ status: "completed" }]);
      if (url === "/curriculum/1") return Promise.resolve({ curriculum_units: [{ id: 10, lessons: [{ id: 100 }] }] });
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("select-level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("select-level"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/learn/1/10/100");
    });
  });

  it("sets error when handleSelectLevel fails", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([{ name: "Level 1", id: 1 }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      if (url === "/curriculum/1") return Promise.reject(new Error("Load failed"));
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("select-level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("select-level"));

    await waitFor(() => {
      expect(screen.getByText("Could not load level")).toBeInTheDocument();
    });
  });

  it("handles level with no units or lessons", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([{ name: "Level 1", id: 1 }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      if (url === "/curriculum/1") return Promise.resolve({ curriculum_units: [] });
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("select-level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("select-level"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/curriculum/1");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handles level with units but no lessons", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([{ name: "Level 1", id: 1 }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      if (url === "/curriculum/1") return Promise.resolve({ curriculum_units: [{ id: 10 }] });
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("select-level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("select-level"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/curriculum/1");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("handles level response with no units field", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([{ name: "Level 1", id: 1 }]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      if (url === "/curriculum/1") return Promise.resolve({});
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("select-level")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("select-level"));

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/curriculum/1");
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders without jlpt data (no JlptProgressBar)", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("level-map")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("jlpt-bar")).not.toBeInTheDocument();
  });

  it("handles non-array progress data gracefully", async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve("not-an-array");
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("level-map")).toBeInTheDocument();
    });
  });

  it("shows placement test button and navigates on click", async () => {
    const mockPush = jest.fn();
    jest.spyOn(require("next/navigation"), "useRouter").mockReturnValue({ push: mockPush });

    mockApiGet.mockImplementation((url: string) => {
      if (url.startsWith("/curriculum?")) return Promise.resolve([]);
      if (url.startsWith("/progress/jlpt")) return Promise.resolve(null);
      if (url === "/progress") return Promise.resolve([]);
      return Promise.resolve(null);
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Take Placement Test/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Take Placement Test/));
    expect(mockPush).toHaveBeenCalledWith("/placement");
  });
});
