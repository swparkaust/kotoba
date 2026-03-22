import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterTracer } from "@/components/CharacterTracer";

describe("CharacterTracer", () => {
  const defaultProps = {
    character: "あ",
    onComplete: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

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
});
