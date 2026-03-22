import { render, screen, fireEvent } from "@testing-library/react";
import { ContentUpdateBanner } from "@/components/ContentUpdateBanner";

describe("ContentUpdateBanner", () => {
  it("renders when update is available", () => {
    render(<ContentUpdateBanner available={true} onUpdate={jest.fn()} />);
    expect(screen.getByTestId("content-update-banner")).toBeInTheDocument();
  });

  it("does not render when no update", () => {
    render(<ContentUpdateBanner available={false} onUpdate={jest.fn()} />);
    expect(screen.queryByTestId("content-update-banner")).not.toBeInTheDocument();
  });

  it("calls onUpdate when button clicked", () => {
    const onUpdate = jest.fn();
    render(<ContentUpdateBanner available={true} onUpdate={onUpdate} />);
    fireEvent.click(screen.getByTestId("update-btn"));
    expect(onUpdate).toHaveBeenCalled();
  });
});
