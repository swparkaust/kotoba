import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationSettings } from "@/components/NotificationSettings";

describe("NotificationSettings", () => {
  const defaultProps = {
    enabled: true,
    time: "09:00",
    onToggle: jest.fn(),
    onTimeChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the settings container with toggle", () => {
    render(<NotificationSettings {...defaultProps} />);
    expect(screen.getByTestId("notification-settings")).toBeInTheDocument();
    expect(screen.getByTestId("notification-toggle")).toBeInTheDocument();
  });

  it("shows time picker when enabled", () => {
    render(<NotificationSettings {...defaultProps} enabled={true} />);
    expect(screen.getByTestId("notification-time-picker")).toBeInTheDocument();
  });

  it("hides time picker when disabled", () => {
    render(<NotificationSettings {...defaultProps} enabled={false} />);
    expect(screen.queryByTestId("notification-time-picker")).not.toBeInTheDocument();
  });

  it("calls onToggle when toggle is clicked", () => {
    render(<NotificationSettings {...defaultProps} />);
    fireEvent.click(screen.getByTestId("notification-toggle"));
    expect(defaultProps.onToggle).toHaveBeenCalled();
  });

  it("calls onTimeChange when time picker value changes", () => {
    render(<NotificationSettings {...defaultProps} />);
    fireEvent.change(screen.getByTestId("notification-time-picker"), { target: { value: "18:30" } });
    expect(defaultProps.onTimeChange).toHaveBeenCalledWith("18:30");
  });
});
