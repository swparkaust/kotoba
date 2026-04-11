import { render, screen, fireEvent } from "@testing-library/react";
import { AudioPlayer } from "@/components/AudioPlayer";

jest.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({ play: jest.fn(), stop: jest.fn() }),
}));

describe("AudioPlayer", () => {
  const defaultProps = {
    src: "/audio/test.mp3",
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders audio player with play button", () => {
    render(<AudioPlayer {...defaultProps} />);
    expect(screen.getByTestId("audio-player")).toBeInTheDocument();
    expect(screen.getByTestId("audio-play-btn")).toBeInTheDocument();
  });

  it("renders speed button showing 1x by default", () => {
    render(<AudioPlayer {...defaultProps} />);
    expect(screen.getByTestId("audio-speed-btn")).toHaveTextContent("1x");
  });

  it("cycles speed on speed button click", () => {
    render(<AudioPlayer {...defaultProps} />);
    const speedBtn = screen.getByTestId("audio-speed-btn");
    expect(speedBtn).toHaveTextContent("1x");
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent("1.25x");
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent("1.5x");
    fireEvent.click(speedBtn);
    expect(speedBtn).toHaveTextContent("0.5x");
  });

  it("renders label when provided", () => {
    render(<AudioPlayer {...defaultProps} label="Dialogue" />);
    expect(screen.getByText("Dialogue")).toBeInTheDocument();
  });

  it("does not render label when not provided", () => {
    render(<AudioPlayer {...defaultProps} />);
    expect(screen.queryByText("Dialogue")).not.toBeInTheDocument();
  });

  it("toggles play state on play button click", () => {
    render(<AudioPlayer {...defaultProps} />);
    const playBtn = screen.getByTestId("audio-play-btn");
    expect(playBtn).toHaveTextContent("▶");
    fireEvent.click(playBtn);
    expect(playBtn).toHaveTextContent("⏸");
  });

  it("toggles back to play state after stopping", () => {
    render(<AudioPlayer {...defaultProps} />);
    const playBtn = screen.getByTestId("audio-play-btn");
    fireEvent.click(playBtn);
    expect(playBtn).toHaveTextContent("⏸");
    fireEvent.click(playBtn);
    expect(playBtn).toHaveTextContent("▶");
  });

  it("calls stop when clicking play button while playing", () => {
    const mockStop = jest.fn();
    const mockPlayFn = jest.fn();
    jest.spyOn(require("@/hooks/useAudio"), "useAudio").mockReturnValue({
      play: mockPlayFn,
      stop: mockStop,
    });
    render(<AudioPlayer {...defaultProps} />);
    const playBtn = screen.getByTestId("audio-play-btn");
    fireEvent.click(playBtn);
    fireEvent.click(playBtn);
    expect(mockStop).toHaveBeenCalled();
  });
});
