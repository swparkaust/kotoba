import { render, screen, waitFor } from "@testing-library/react";
import ListenPage from "@/app/library/listen/[itemId]/page";
import { api } from "@/lib/api";

jest.mock("next/navigation", () => ({
  useParams: () => ({ itemId: "1" }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/components/RealAudioPlayer", () => ({
  RealAudioPlayer: ({ audioUrl, transcription }: any) => (
    <div data-testid="audio-player">
      <span data-testid="audio-url">{audioUrl}</span>
      <span data-testid="transcription">{transcription}</span>
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;

describe("ListenPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading then RealAudioPlayer", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<ListenPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("passes audio_url and transcription to RealAudioPlayer", async () => {
    mockApiGet.mockResolvedValue({
      title: "Podcast Episode 1",
      audio_url: "https://example.com/audio.mp3",
      body_text: "今日は天気がいいです",
      glosses: [],
      listening_tips: [],
      comprehension_questions: [],
    });

    render(<ListenPage />);

    await waitFor(() => {
      expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    });
    expect(screen.getByTestId("audio-url")).toHaveTextContent("https://example.com/audio.mp3");
    expect(screen.getByTestId("transcription")).toHaveTextContent("今日は天気がいいです");
  });

  it("shows error when fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Not found"));

    render(<ListenPage />);

    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeInTheDocument();
    });
  });

  it("shows fallback error message when error has no message", async () => {
    mockApiGet.mockRejectedValue({});

    render(<ListenPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load item")).toBeInTheDocument();
    });
  });

  it("handles item with missing optional fields", async () => {
    mockApiGet.mockResolvedValue({
      title: "Episode",
    });

    render(<ListenPage />);

    await waitFor(() => {
      expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    });
    expect(screen.getByTestId("audio-url")).toHaveTextContent("");
    expect(screen.getByTestId("transcription")).toHaveTextContent("");
  });
});
