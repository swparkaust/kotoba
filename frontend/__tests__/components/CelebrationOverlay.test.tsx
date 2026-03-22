import { render, screen, fireEvent } from "@testing-library/react";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

describe("CelebrationOverlay", () => {
  it("renders checkmark and message on lesson completion", () => {
    render(<CelebrationOverlay type="lesson" score={95} onDismiss={jest.fn()} />);
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    expect(screen.getByTestId("celebration-checkmark")).toBeInTheDocument();
    expect(screen.getByTestId("celebration-message")).toBeInTheDocument();
  });

  it("renders JLPT milestone for level completion", () => {
    render(<CelebrationOverlay type="level" score={90} jlptMilestone="N4" onDismiss={jest.fn()} />);
    expect(screen.getByTestId("celebration-message")).toHaveTextContent("N4");
  });

  it("calls onDismiss when dismissed", () => {
    const onDismiss = jest.fn();
    render(<CelebrationOverlay type="lesson" score={80} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByTestId("celebration-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});
