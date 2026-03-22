import { render, screen, fireEvent } from "@testing-library/react";
import { RealAudioPlayer } from "@/components/RealAudioPlayer";

const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

jest.spyOn(window, "Audio").mockImplementation(
  () =>
    ({
      play: mockPlay,
      pause: mockPause,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      playbackRate: 1,
    }) as unknown as HTMLAudioElement
);

describe("RealAudioPlayer", () => {
  const defaultProps = {
    audioUrl: "/test.mp3",
    transcription: "今日はいい天気ですね。",
    scaffolding: {},
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders player with play button", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    expect(screen.getByTestId("real-audio-player")).toBeInTheDocument();
    expect(screen.getByTestId("real-audio-play")).toBeInTheDocument();
  });

  it("hides transcript by default", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    expect(screen.queryByTestId("real-audio-transcript")).not.toBeInTheDocument();
  });

  it("toggles transcript visibility on click", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    fireEvent.click(screen.getByText("Show transcript"));
    expect(screen.getByTestId("real-audio-transcript")).toBeInTheDocument();
    expect(screen.getByTestId("real-audio-transcript")).toHaveTextContent("今日はいい天気ですね。");
    fireEvent.click(screen.getByText("Hide transcript"));
    expect(screen.queryByTestId("real-audio-transcript")).not.toBeInTheDocument();
  });

  it("renders listening tips when provided", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ listening_tips: ["Focus on particles"] }}
      />
    );
    expect(screen.getByText("Focus on particles", { exact: false })).toBeInTheDocument();
  });

  it("renders glosses when provided", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ glosses: [{ word: "天気", reading: "てんき", definition_ja: "weather" }] }}
      />
    );
    expect(screen.getByText("天気")).toBeInTheDocument();
  });

  it("renders comprehension questions when provided", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ comprehension_questions: ["What is the weather?"] }}
      />
    );
    expect(screen.getByText("What is the weather?", { exact: false })).toBeInTheDocument();
  });

  it("cycles playback rate on speed button click", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    const speedBtn = screen.getByText("1x");
    expect(speedBtn).toBeInTheDocument();

    fireEvent.click(speedBtn);
    expect(screen.getByText("1.25x")).toBeInTheDocument();

    fireEvent.click(screen.getByText("1.25x"));
    expect(screen.getByText("1.5x")).toBeInTheDocument();

    fireEvent.click(screen.getByText("1.5x"));
    expect(screen.getByText("0.5x")).toBeInTheDocument();

    fireEvent.click(screen.getByText("0.5x"));
    expect(screen.getByText("0.75x")).toBeInTheDocument();

    fireEvent.click(screen.getByText("0.75x"));
    expect(screen.getByText("1x")).toBeInTheDocument();
  });

  it("toggles play/pause on play button click", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    const playBtn = screen.getByTestId("real-audio-play");

    fireEvent.click(playBtn);
    expect(mockPlay).toHaveBeenCalledTimes(1);

    fireEvent.click(playBtn);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });
});
