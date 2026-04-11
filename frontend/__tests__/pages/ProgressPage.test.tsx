import { render, screen, waitFor } from "@testing-library/react";
import ProgressPage from "@/app/progress/page";
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

jest.mock("@/components/JlptProgressBar", () => ({
  JlptProgressBar: ({ jlptLabel, percentage }: any) => (
    <div data-testid="jlpt-bar">{jlptLabel} {percentage}%</div>
  ),
}));

const mockUseLanguage = useLanguage as jest.Mock;
const mockApiGet = api.get as jest.Mock;

describe("ProgressPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({ languageCode: "ja" });
  });

  it("renders loading state", () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<ProgressPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders JLPT progress after fetch", async () => {
    mockApiGet.mockResolvedValue({ jlpt_label: "N4", percentage: 65 });

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByTestId("jlpt-bar")).toHaveTextContent("N4 65%");
    });
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Failed to load"));

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
  });

  it("does not render JLPT bar when data is null", async () => {
    mockApiGet.mockResolvedValue(null);

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText("Progress")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("jlpt-bar")).not.toBeInTheDocument();
  });

  it("shows error with default message when error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load progress")).toBeInTheDocument();
    });
  });

  it("renders heading after loading completes", async () => {
    mockApiGet.mockResolvedValue({ jlpt_label: "N3", percentage: 45 });

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });
});
