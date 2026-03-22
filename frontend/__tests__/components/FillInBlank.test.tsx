import { render, screen, fireEvent } from "@testing-library/react";
import { FillInBlank } from "@/components/FillInBlank";

describe("FillInBlank", () => {
  const defaultProps = {
    prompt: "私は＿＿が好きです。",
    onSubmit: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the prompt", () => {
    render(<FillInBlank {...defaultProps} />);
    expect(screen.getByTestId("fill-blank")).toBeInTheDocument();
    expect(screen.getByText("私は＿＿が好きです。")).toBeInTheDocument();
  });

  it("has submit button disabled when input is empty", () => {
    render(<FillInBlank {...defaultProps} />);
    expect(screen.getByTestId("blank-submit")).toBeDisabled();
  });

  it("calls onSubmit with the input value", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("猫");
  });
});
