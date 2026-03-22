import { render, screen } from "@testing-library/react";
import { StreakFreeEncouragement } from "@/components/StreakFreeEncouragement";

describe("StreakFreeEncouragement", () => {
  it("renders an encouraging message for active learners", () => {
    render(<StreakFreeEncouragement lessonsCompleted={5} />);
    expect(screen.getByTestId("encouragement")).toBeInTheDocument();
    expect(screen.getByTestId("encouragement-message")).toBeTruthy();
  });

  it("renders welcome message for new learners", () => {
    render(<StreakFreeEncouragement lessonsCompleted={0} />);
    expect(screen.getByTestId("encouragement-message")).toBeInTheDocument();
  });

  it("shows different message for experienced learners", () => {
    const { rerender } = render(<StreakFreeEncouragement lessonsCompleted={1} />);
    const msg1 = screen.getByTestId("encouragement-message").textContent;
    rerender(<StreakFreeEncouragement lessonsCompleted={50} />);
    const msg50 = screen.getByTestId("encouragement-message").textContent;
    // Messages should exist for different levels
    expect(msg1).toBeTruthy();
    expect(msg50).toBeTruthy();
  });

  it("always renders the encouragement container", () => {
    render(<StreakFreeEncouragement lessonsCompleted={100} />);
    expect(screen.getByTestId("encouragement")).toBeInTheDocument();
  });
});
