import { render, screen, waitFor } from "@testing-library/react";
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
  LevelMap: ({ levels }: { levels: any[] }) => (
    <div data-testid="level-map">{levels.map((l: any) => l.name).join(",")}</div>
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
});
