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
      <button data-testid="notif-time-change" onClick={() => onTimeChange("07:00")}>Change Time</button>
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

  it("shows error when profile fetch fails", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("shows error when toggle patch fails and reverts state", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: true, notification_time: "09:00" });
    mockApiPatch.mockRejectedValue(new Error("Update failed"));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("notif-toggle")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notif-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Failed to update notification setting")).toBeInTheDocument();
    });
    expect(screen.getByTestId("notif-enabled")).toHaveTextContent("on");
  });

  it("shows error when time change patch fails", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: false, notification_time: "09:00" });
    mockApiPatch.mockRejectedValue(new Error("Time update failed"));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("notif-time-change")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notif-time-change"));

    await waitFor(() => {
      expect(screen.getByText("Failed to update notification time")).toBeInTheDocument();
    });
  });

  it("calls patch with new time when time is changed", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: false, notification_time: "09:00" });
    mockApiPatch.mockResolvedValue({});

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("notif-time-change")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("notif-time-change"));

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith("/profile", { notification_time: "07:00" });
    });
  });

  it("uses defaults when profile data is missing fields", async () => {
    mockApiGet.mockResolvedValue({});

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId("notif-settings")).toBeInTheDocument();
    });
    expect(screen.getByTestId("notif-enabled")).toHaveTextContent("off");
    expect(screen.getByTestId("notif-time")).toHaveTextContent("09:00");
  });

  it("renders Settings heading after loading", async () => {
    mockApiGet.mockResolvedValue({ notifications_enabled: false, notification_time: "09:00" });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  it("shows default error message when error has no message property", async () => {
    mockApiGet.mockRejectedValue({});

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load settings")).toBeInTheDocument();
    });
  });
});
