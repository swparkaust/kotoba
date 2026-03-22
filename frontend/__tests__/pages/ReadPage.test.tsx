import { render, screen, waitFor } from "@testing-library/react";
import ReadPage from "@/app/library/read/[itemId]/page";
import { api } from "@/lib/api";
import { useReadingSession } from "@/hooks/useReadingSession";

jest.mock("next/navigation", () => ({
  useParams: () => ({ itemId: "1" }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/hooks/useReadingSession", () => ({
  useReadingSession: jest.fn(),
}));

jest.mock("@/components/ImmersiveReader", () => ({
  ImmersiveReader: ({ text, progress }: any) => (
    <div data-testid="immersive-reader">
      <span data-testid="reader-text">{text}</span>
      <span data-testid="reader-progress">{progress}</span>
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;
const mockUseReadingSession = useReadingSession as jest.Mock;

const mockStart = jest.fn();
const mockPause = jest.fn();
const mockSaveSession = jest.fn();

describe("ReadPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseReadingSession.mockReturnValue({
      elapsed: 0,
      wordsRead: 0,
      start: mockStart,
      pause: mockPause,
      addGlossCard: jest.fn(),
      setWordsRead: jest.fn(),
      saveSession: mockSaveSession,
    });
  });

  it("renders loading then ImmersiveReader", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<ReadPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders ImmersiveReader after fetch", async () => {
    mockApiGet.mockResolvedValue({
      body_text: "桜が咲いた",
      word_count: 3,
      glosses: [],
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reader-text")).toHaveTextContent("桜が咲いた");
  });

  it("starts reading session on mount", async () => {
    mockApiGet.mockResolvedValue({
      body_text: "テスト",
      word_count: 1,
      glosses: [],
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
  });
});
