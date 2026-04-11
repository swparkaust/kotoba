import { render, screen, fireEvent } from "@testing-library/react";
import { FillInBlank } from "@/components/FillInBlank";

describe("FillInBlank", () => {
  const defaultProps = {
    prompt: "私は＿＿が好きです。",
    correctAnswer: "猫",
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

  it("does not call onSubmit until continue is clicked", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the input value after clicking continue", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    fireEvent.click(screen.getByTestId("blank-continue"));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("猫");
  });

  it("shows correct feedback on right answer", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(screen.getByTestId("blank-feedback")).toHaveTextContent("正解");
  });

  it("shows correct answer on wrong answer", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "犬" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(screen.getByTestId("blank-feedback")).toHaveTextContent("猫");
  });

  it("disables input after checking", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(screen.getByTestId("blank-input")).toBeDisabled();
  });

  it("hides check button and shows continue after checking", () => {
    render(<FillInBlank {...defaultProps} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "猫" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(screen.queryByTestId("blank-submit")).not.toBeInTheDocument();
    expect(screen.getByTestId("blank-continue")).toBeInTheDocument();
  });

  it("shows generic incorrect feedback when correctAnswer is not provided", () => {
    render(<FillInBlank prompt="Fill in" onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByTestId("blank-input"), { target: { value: "anything" } });
    fireEvent.click(screen.getByTestId("blank-submit"));
    expect(screen.getByTestId("blank-feedback")).toHaveTextContent("不正解");
    expect(screen.getByTestId("blank-feedback")).not.toHaveTextContent("undefined");
  });
});
