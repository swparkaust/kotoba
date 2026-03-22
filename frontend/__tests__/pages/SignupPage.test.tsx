import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupPage from "@/app/signup/page";
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

describe("SignupPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with name, email, and password fields", () => {
    render(<SignupPage />);
    expect(screen.getByPlaceholderText("Display name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });

  it("submits signup data and navigates on success", async () => {
    mockApiPost.mockResolvedValue({ auth_token: "tok_456" });

    render(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText("Display name"), { target: { value: "Taro" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Sign up"));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith("/sessions/signup", {
        display_name: "Taro",
        email: "taro@example.com",
        password: "password123",
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error on failure", async () => {
    mockApiPost.mockRejectedValue(new Error("signup failed"));

    render(<SignupPage />);
    fireEvent.change(screen.getByPlaceholderText("Display name"), { target: { value: "Taro" } });
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "taro@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByText("Sign up"));

    await waitFor(() => {
      expect(screen.getByText("Could not create account")).toBeInTheDocument();
    });
  });
});
