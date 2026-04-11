import { render, screen, fireEvent, act } from "@testing-library/react";
import { ListeningExercise } from "@/components/ListeningExercise";

jest.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({ play: jest.fn(), stop: jest.fn(), playing: false }),
}));

describe("ListeningExercise", () => {
  const defaultProps = {
    audioSrc: "/audio/test.mp3",
    options: ["おはよう", "こんにちは", "こんばんは", "さようなら"],
    correctIndex: 1,
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

  it("does not call onAnswer until continue is clicked", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-1"));
    expect(defaultProps.onAnswer).not.toHaveBeenCalled();
  });

  it("calls onAnswer after clicking continue", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-1"));
    fireEvent.click(screen.getByTestId("listen-continue"));
    expect(defaultProps.onAnswer).toHaveBeenCalledWith(1);
  });

  it("shows correct feedback on right answer", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-1"));
    expect(screen.getByTestId("listen-feedback")).toHaveTextContent("正解");
  });

  it("shows correct answer on wrong selection", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-0"));
    expect(screen.getByTestId("listen-feedback")).toHaveTextContent("こんにちは");
  });

  it("disables options after a selection is made", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-0"));
    expect(screen.getByTestId("listen-option-0")).toBeDisabled();
    expect(screen.getByTestId("listen-option-1")).toBeDisabled();
  });

  it("prevents double selection", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-2"));
    fireEvent.click(screen.getByTestId("listen-option-1"));
    fireEvent.click(screen.getByTestId("listen-continue"));
    expect(defaultProps.onAnswer).toHaveBeenCalledTimes(1);
    expect(defaultProps.onAnswer).toHaveBeenCalledWith(2);
  });

  it("shows listen-first hint when playCount is 0 and no selection", () => {
    render(<ListeningExercise {...defaultProps} />);
    expect(screen.getByText("Press listen to hear the audio before answering.")).toBeInTheDocument();
  });

  it("hides listen-first hint after play button is clicked", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-btn"));
    expect(screen.queryByText("Press listen to hear the audio before answering.")).not.toBeInTheDocument();
  });

  it("hides listen-first hint after selection", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-0"));
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

  it("stops audio when clicking button while playing", () => {
    const mockStop = jest.fn();
    jest.spyOn(require("@/hooks/useAudio"), "useAudio").mockReturnValue({
      play: jest.fn(),
      stop: mockStop,
      playing: false,
    });

    jest.useFakeTimers();
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-btn"));
    fireEvent.click(screen.getByTestId("listen-btn"));
    expect(mockStop).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("highlights correct option green and wrong option red after selection", () => {
    render(<ListeningExercise {...defaultProps} />);
    fireEvent.click(screen.getByTestId("listen-option-0"));
    const wrongBtn = screen.getByTestId("listen-option-0");
    const correctBtn = screen.getByTestId("listen-option-1");
    expect(wrongBtn.className).toContain("border-red");
    expect(correctBtn.className).toContain("border-green");
  });
});
