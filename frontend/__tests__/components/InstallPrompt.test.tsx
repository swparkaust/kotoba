import { render, screen, fireEvent } from "@testing-library/react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

jest.mock("@/hooks/useInstallPrompt");
const mockUseInstallPrompt = useInstallPrompt as jest.MockedFunction<typeof useInstallPrompt>;

describe("InstallPrompt", () => {
  it("renders when app is installable and not installed", () => {
    mockUseInstallPrompt.mockReturnValue({ isInstallable: true, isInstalled: false, promptInstall: jest.fn() });
    render(<InstallPrompt />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByText(/Install App/)).toBeInTheDocument();
  });

  it("does not render when already installed", () => {
    mockUseInstallPrompt.mockReturnValue({ isInstallable: true, isInstalled: true, promptInstall: jest.fn() });
    render(<InstallPrompt />);
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
  });

  it("calls promptInstall when button is clicked", () => {
    const mockPrompt = jest.fn();
    mockUseInstallPrompt.mockReturnValue({ isInstallable: true, isInstalled: false, promptInstall: mockPrompt });
    render(<InstallPrompt />);
    fireEvent.click(screen.getByText(/Install App/));
    expect(mockPrompt).toHaveBeenCalled();
  });
});
