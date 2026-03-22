import { render, screen, fireEvent, act } from "@testing-library/react";
import { ListeningExercise } from "@/components/ListeningExercise";

jest.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({ play: jest.fn(), stop: jest.fn(), playing: false }),
}));

describe("ListeningExercise", () => {
  const defaultProps = {
    audioSrc: "/audio/test.mp3",
    options: ["おはよう", "こんにちは", "こんばんは", "さようなら"],
    onAnswer: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the exercise with listen button and all options", () => {
    render(<ListeningExercise {...defaultProps} />);
    expect(screen.getByTestId("listening-exercise")).toBeInTheDocument();
    expect(screen.getByTestId("listen-btn")).toBeInTheDocument();
    expect(screen.getByTestId("listen-option-0")).toBeInTheDocument();
    expect(screen.getByTestId("listen-option-1")).toBeInTheDocument();
    expect(screen.getByTestId("listen-option-2")).toBeInTheDocument();
    expect(screen.getByTestId("listen-option-3")).toBeInTheDocument();
  });

  it("calls onAnswer when an option is clicked", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-1"));
    expect(defaultProps.onAnswer).toHaveBeenCalledWith(1);
  });

  it("disables options after a selection is made", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-0"));
    expect(screen.getByTestId("listen-option-0")).toBeDisabled();
    expect(screen.getByTestId("listen-option-1")).toBeDisabled();
  });

  it("disables all options after first selection preventing further answers", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-2"));
    expect(screen.getByTestId("listen-option-0")).toBeDisabled();
    expect(screen.getByTestId("listen-option-1")).toBeDisabled();
    expect(screen.getByTestId("listen-option-2")).toBeDisabled();
    expect(screen.getByTestId("listen-option-3")).toBeDisabled();
    fireEvent.click(screen.getByTestId("listen-option-1"));
    expect(defaultProps.onAnswer).toHaveBeenCalledTimes(1);
  });

  it("shows listen-first hint when playCount is 0", () => {
    render(<ListeningExercise {...defaultProps} />);
    expect(screen.getByText("Press listen to hear the audio before answering.")).toBeInTheDocument();
  });

  it("hides listen-first hint after play button is clicked", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-btn"));
    expect(screen.queryByText("Press listen to hear the audio before answering.")).not.toBeInTheDocument();
  });

  it("tracks play count and displays it on the button after playback ends", () => {
    jest.useFakeTimers();
    render(<ListeningExercise {...defaultProps} />);
    expect(screen.getByTestId("listen-btn")).toHaveTextContent("Listen");
    expect(screen.getByTestId("listen-btn")).not.toHaveTextContent("(1)");
    fireEvent.click(screen.getByTestId("listen-btn"));
    expect(screen.getByTestId("listen-btn")).toHaveTextContent("Playing...");
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByTestId("listen-btn")).toHaveTextContent("(1)");
    jest.useRealTimers();
  });

  it("increments play count on successive plays", () => {
    jest.useFakeTimers();
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-btn"));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByTestId("listen-btn")).toHaveTextContent("(1)");
    fireEvent.click(screen.getByTestId("listen-btn"));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.getByTestId("listen-btn")).toHaveTextContent("(2)");
    jest.useRealTimers();
  });
});
