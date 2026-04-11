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

  it("registers ended event listener on audio", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    expect(mockAddEventListener).toHaveBeenCalledWith("ended", expect.any(Function));
  });

  it("renders without glosses or tips when scaffolding is empty", () => {
    render(<RealAudioPlayer {...defaultProps} scaffolding={{}} />);
    expect(screen.queryByText("Vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByText("Listening Tips")).not.toBeInTheDocument();
    expect(screen.queryByText("Comprehension")).not.toBeInTheDocument();
  });

  it("renders gloss without reading when reading is absent", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ glosses: [{ word: "天気" }] }}
      />
    );
    expect(screen.getByText("天気")).toBeInTheDocument();
  });

  it("renders gloss without definition when definition_ja is absent", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ glosses: [{ word: "猫", reading: "ねこ" }] }}
      />
    );
    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("(ねこ)")).toBeInTheDocument();
  });

  it("does not render glosses section when glosses array is empty", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ glosses: [] }}
      />
    );
    expect(screen.queryByText("Vocabulary")).not.toBeInTheDocument();
  });

  it("does not render listening tips when tips array is empty", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ listening_tips: [] }}
      />
    );
    expect(screen.queryByText("Listening Tips")).not.toBeInTheDocument();
  });

  it("does not render comprehension when questions array is empty", () => {
    render(
      <RealAudioPlayer
        {...defaultProps}
        scaffolding={{ comprehension_questions: [] }}
      />
    );
    expect(screen.queryByText("Comprehension")).not.toBeInTheDocument();
  });

  it("handles timeupdate event", () => {
    let timeUpdateHandler: (() => void) | undefined;
    mockAddEventListener.mockImplementation((event: string, handler: () => void) => {
      if (event === "timeupdate") timeUpdateHandler = handler;
    });
    render(<RealAudioPlayer {...defaultProps} />);
    expect(mockAddEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
  });

  it("handles loadedmetadata event", () => {
    render(<RealAudioPlayer {...defaultProps} />);
    expect(mockAddEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function));
  });

  it("cleans up event listeners on unmount", () => {
    const { unmount } = render(<RealAudioPlayer {...defaultProps} />);
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("loadedmetadata", expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith("timeupdate", expect.any(Function));
    expect(mockRemoveEventListener).toHaveBeenCalledWith("ended", expect.any(Function));
    expect(mockPause).toHaveBeenCalled();
  });

  it("seekbar click calls seekTo with correct percentage", async () => {
    let loadedMetadataHandler: (() => void) | undefined;
    const mockAudioInstance: any = {
      play: mockPlay,
      pause: mockPause,
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === "loadedmetadata") loadedMetadataHandler = handler;
      }),
      removeEventListener: mockRemoveEventListener,
      playbackRate: 1,
      duration: 100,
      currentTime: 0,
    };

    jest.spyOn(window, "Audio").mockImplementation(() => mockAudioInstance as unknown as HTMLAudioElement);

    const { rerender } = render(<RealAudioPlayer {...defaultProps} />);

    // Trigger loadedmetadata to set duration in React state
    const { act } = require("@testing-library/react");
    act(() => {
      if (loadedMetadataHandler) loadedMetadataHandler();
    });

    // Find the seekbar (the outer div with cursor-pointer)
    const seekbar = document.querySelector(".cursor-pointer") as HTMLElement;
    expect(seekbar).toBeTruthy();

    // Mock getBoundingClientRect on the seekbar
    seekbar.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      width: 200,
      top: 0,
      height: 10,
      right: 200,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Click at position 100 out of 200 = 50%
    fireEvent.click(seekbar, { clientX: 100 });

    expect(mockAudioInstance.currentTime).toBeCloseTo(50);
  });

  it("seekTo does nothing when duration is 0", () => {
    const mockAudioInstance: any = {
      play: mockPlay,
      pause: mockPause,
      addEventListener: jest.fn(),
      removeEventListener: mockRemoveEventListener,
      playbackRate: 1,
      duration: 0,
      currentTime: 0,
    };

    jest.spyOn(window, "Audio").mockImplementation(() => mockAudioInstance as unknown as HTMLAudioElement);

    render(<RealAudioPlayer {...defaultProps} />);

    const seekbar = document.querySelector(".cursor-pointer") as HTMLElement;
    expect(seekbar).toBeTruthy();

    seekbar.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      width: 200,
      top: 0,
      height: 10,
      right: 200,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    fireEvent.click(seekbar, { clientX: 100 });

    // currentTime should not change since duration is 0
    expect(mockAudioInstance.currentTime).toBe(0);
  });

  it("progress bar shows correct width when duration > 0", () => {
    let loadedMetadataHandler: (() => void) | undefined;
    let timeUpdateHandler: (() => void) | undefined;
    const mockAudioInstance: any = {
      play: mockPlay,
      pause: mockPause,
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === "loadedmetadata") loadedMetadataHandler = handler;
        if (event === "timeupdate") timeUpdateHandler = handler;
      }),
      removeEventListener: mockRemoveEventListener,
      playbackRate: 1,
      duration: 100,
      currentTime: 50,
    };

    jest.spyOn(window, "Audio").mockImplementation(() => mockAudioInstance as unknown as HTMLAudioElement);

    render(<RealAudioPlayer {...defaultProps} />);

    // Trigger metadata loaded
    if (loadedMetadataHandler) loadedMetadataHandler();
    if (timeUpdateHandler) timeUpdateHandler();
  });

  it("ended event sets playing to false", () => {
    let endedHandler: (() => void) | undefined;
    const mockAudioInstance: any = {
      play: mockPlay,
      pause: mockPause,
      addEventListener: jest.fn((event: string, handler: () => void) => {
        if (event === "ended") endedHandler = handler;
      }),
      removeEventListener: mockRemoveEventListener,
      playbackRate: 1,
      duration: 100,
      currentTime: 0,
    };

    jest.spyOn(window, "Audio").mockImplementation(() => mockAudioInstance as unknown as HTMLAudioElement);

    const { act } = require("@testing-library/react");
    render(<RealAudioPlayer {...defaultProps} />);

    // Start playing
    fireEvent.click(screen.getByTestId("real-audio-play"));

    // Trigger ended event
    act(() => {
      if (endedHandler) endedHandler();
    });
  });
});
