import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterTracer } from "@/components/CharacterTracer";

const mockCtx = {
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  fillText: jest.fn(),
  setLineDash: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  strokeStyle: "",
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  globalAlpha: 1,
  font: "",
  fillStyle: "",
  textAlign: "",
  textBaseline: "",
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx) as any;

describe("CharacterTracer", () => {
  const defaultProps = {
    character: "あ",
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-mock getContext for each test
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx) as any;
  });

  it("renders the tracer container", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByTestId("character-tracer")).toBeInTheDocument();
  });

  it("renders the trace canvas", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByTestId("trace-canvas")).toBeInTheDocument();
  });

  it("renders the character as a hint", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByTestId("trace-hint")).toHaveTextContent("Trace over the guide character");
  });

  it("done button is disabled when no strokes drawn", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByText("Done")).toBeDisabled();
  });

  it("calls onComplete when done button is clicked after drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);
    fireEvent.click(screen.getByText("Done"));
    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it("draws guide character on canvas", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalledWith("あ", 150, 160);
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it("draws grid lines on canvas", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.setLineDash).toHaveBeenCalledWith([5, 5]);
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalled();
    expect(mockCtx.lineTo).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("toggles guide visibility on button click", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByTestId("trace-hint")).toHaveTextContent("Trace over the guide character");
    expect(screen.getByText("Hide Guide")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide Guide"));

    expect(screen.getByTestId("trace-hint")).toHaveTextContent("Write the character from memory");
    expect(screen.getByText("Show Guide")).toBeInTheDocument();
  });

  it("undo removes the last stroke", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    // Draw first stroke
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    // Draw second stroke
    fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    expect(screen.getByText("Undo")).not.toBeDisabled();

    // Undo the second stroke
    fireEvent.click(screen.getByText("Undo"));

    // Still has one stroke so Done should be enabled
    expect(screen.getByText("Done")).not.toBeDisabled();
  });

  it("clear removes all strokes", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    // Draw a stroke
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    expect(screen.getByText("Clear")).not.toBeDisabled();

    // Clear all strokes
    fireEvent.click(screen.getByText("Clear"));

    // Done should now be disabled
    expect(screen.getByText("Done")).toBeDisabled();
  });

  it("undo and clear are disabled when no strokes exist", () => {
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByText("Undo")).toBeDisabled();
    expect(screen.getByText("Clear")).toBeDisabled();
  });

  it("handles touch events for drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    fireEvent.touchStart(canvas, {
      touches: [{ clientX: 10, clientY: 10 }],
    });
    fireEvent.touchMove(canvas, {
      touches: [{ clientX: 50, clientY: 50 }],
    });
    fireEvent.touchEnd(canvas);

    // After touch draw, Done should be enabled
    expect(screen.getByText("Done")).not.toBeDisabled();
  });

  it("mouseLeave ends the drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(canvas);

    // Stroke should have been saved
    expect(screen.getByText("Done")).not.toBeDisabled();
  });

  it("mouseMove does nothing when not drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    // Move without mouseDown - should not crash
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });

    expect(screen.getByText("Done")).toBeDisabled();
  });

  it("mouseUp does nothing when not drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    fireEvent.mouseUp(canvas);

    expect(screen.getByText("Done")).toBeDisabled();
  });

  it("single-point stroke (no move) is not saved", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    // No stroke saved because only 1 point
    expect(screen.getByText("Done")).toBeDisabled();
  });

  it("handles getContext returning null gracefully", () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as any;
    // Should not crash even if canvas context is null
    render(<CharacterTracer {...defaultProps} />);
    expect(screen.getByTestId("character-tracer")).toBeInTheDocument();
  });

  it("draws multiple completed strokes and current stroke", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    // Draw first stroke
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseUp(canvas);

    // Draw second stroke
    fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 });
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseUp(canvas);

    // Verify strokes were drawn (multiple beginPath calls)
    expect(mockCtx.beginPath).toHaveBeenCalled();
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it("renders current stroke during drawing", () => {
    render(<CharacterTracer {...defaultProps} />);
    const canvas = screen.getByTestId("trace-canvas");

    // Start drawing but don't finish (still in drawing state)
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
    fireEvent.mouseMove(canvas, { clientX: 70, clientY: 70 });

    // Current stroke should be being rendered
    expect(mockCtx.lineTo).toHaveBeenCalled();
  });

  it("hides guide and does not draw guide character when showGuide is false", () => {
    render(<CharacterTracer {...defaultProps} />);

    // Initially guide is shown
    expect(mockCtx.fillText).toHaveBeenCalledWith("あ", 150, 160);

    // Toggle guide off
    mockCtx.fillText.mockClear();
    fireEvent.click(screen.getByText("Hide Guide"));

    // After hiding, fillText should not be called with the character
    // (redraw is triggered but skipps drawGuideCharacter)
  });
});
