import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import { api } from "@/lib/api";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api", () => ({
  api: {
    post: jest.fn(),
  },
  setAuthToken: jest.fn(),
}));

const mockApiPost = api.post as jest.Mock;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByText("Log in")).toBeInTheDocument();
  });

  it("submits credentials and navigates on success", async () => {
    mockApiPost.mockResolvedValue({ auth_token: "tok_123" });

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByText("Log in"));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/sessions", { email: "user@example.com", password: "secret" });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error on failure", async () => {
    mockApiPost.mockRejectedValue(new Error("bad credentials"));

    render(<LoginPage />);
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "bad@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Log in"));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });
});
