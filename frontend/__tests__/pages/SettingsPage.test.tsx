import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SettingsPage from "@/app/settings/page";
import { api } from "@/lib/api";

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockToggle = jest.fn();

jest.mock("@/components/NotificationSettings", () => ({
  NotificationSettings: ({ enabled, time, onToggle, onTimeChange }: any) => (
    <div data-testid="notif-settings">
      <span data-testid="notif-enabled">{enabled ? "on" : "off"}</span>
      <span data-testid="notif-time">{time}</span>
      <button data-testid="notif-toggle" onClick={() => onToggle(!enabled)}>Toggle</button>
    </div>
  ),
}));

const mockApiGet = api.get as jest.Mock;
const mockApiPatch = api.patch as jest.Mock;

describe("SettingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders notification settings after profile fetch", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: true, notification_time: "08:30" });

    render(<SettingsPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("notif-settings")).toBeInTheDocument();
    });
    expect(screen.getByTestId("notif-enabled")).toHaveTextContent("on");
    expect(screen.getByTestId("notif-time")).toHaveTextContent("08:30");
  });

  it("toggle calls patch", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: true, notification_time: "09:00" });
    mockApiPatch.mockResolvedValue({});

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("notif-toggle")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notif-toggle"));

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith("/profile", { notifications_enabled: false });
    });
  });
});
