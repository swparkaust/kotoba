import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
  ImmersiveReader: ({ text, progress, onWordTap }: any) => (
    <div data-testid="immersive-reader">
      <span data-testid="reader-text">{text}</span>
      <span data-testid="reader-progress">{progress}</span>
      <button data-testid="word-tap" onClick={() => onWordTap("桜")}>Tap</button>
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

  it("shows error when fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Not found"));

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load item")).toBeInTheDocument();
    });
  });

  it("calls addGlossCard and setWordsRead when word is tapped", async () => {
    const mockAddGlossCard = jest.fn();
    const mockSetWordsRead = jest.fn();
    mockUseReadingSession.mockReturnValue({
      elapsed: 0,
      wordsRead: 0,
      start: mockStart,
      pause: mockPause,
      addGlossCard: mockAddGlossCard,
      setWordsRead: mockSetWordsRead,
      saveSession: mockSaveSession,
    });

    mockApiGet.mockResolvedValue({
      body_text: "桜が咲いた",
      word_count: 3,
      glosses: [],
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("word-tap"));

    expect(mockAddGlossCard).toHaveBeenCalledWith("桜", "");
    expect(mockSetWordsRead).toHaveBeenCalled();
  });

  it("computes progress as 0 when word_count is 0", async () => {
    mockApiGet.mockResolvedValue({
      body_text: "テスト",
      word_count: 0,
      glosses: [],
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reader-progress")).toHaveTextContent("0");
  });

  it("computes progress as 0 when word_count is missing", async () => {
    mockApiGet.mockResolvedValue({
      body_text: "テスト",
      glosses: [],
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reader-progress")).toHaveTextContent("0");
  });

  it("handles item with missing body_text and glosses", async () => {
    mockApiGet.mockResolvedValue({
      word_count: 5,
    });

    render(<ReadPage />);

    await waitFor(() => {
      expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
    });
    expect(screen.getByTestId("reader-text")).toHaveTextContent("");
  });

  it("calls pause and saveSession on unmount", async () => {
    mockApiGet.mockResolvedValue({
      body_text: "テスト",
      word_count: 1,
      glosses: [],
    });

    const { unmount } = render(<ReadPage />);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    unmount();

    expect(mockPause).toHaveBeenCalled();
    expect(mockSaveSession).toHaveBeenCalledWith("reading", expect.any(Number));
  });
});
