import { render, screen, fireEvent } from "@testing-library/react";
import { WritingExercise } from "@/components/WritingExercise";

describe("WritingExercise", () => {
  it("renders prompt and input area", () => {
    render(<WritingExercise prompt="Write something" onSubmit={jest.fn()} />);
    expect(screen.getByTestId("writing-exercise")).toBeInTheDocument();
    expect(screen.getByTestId("writing-prompt")).toBeInTheDocument();
    expect(screen.getByTestId("writing-input")).toBeInTheDocument();
  });

  it("calls onSubmit with text when submitted", () => {
    const onSubmit = jest.fn();
    render(<WritingExercise prompt="Write" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByTestId("writing-input"), { target: { value: "テスト" } });
    fireEvent.click(screen.getByTestId("writing-submit"));
    expect(onSubmit).toHaveBeenCalledWith("テスト");
  });

  it("disables submit button when input is empty", () => {
    render(<WritingExercise prompt="Write" onSubmit={jest.fn()} />);
    expect(screen.getByTestId("writing-submit")).toBeDisabled();
  });

  it("enables submit button when text is entered", () => {
    render(<WritingExercise prompt="Write" onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByTestId("writing-input"), { target: { value: "文章" } });
    expect(screen.getByTestId("writing-submit")).not.toBeDisabled();
  });

  it("displays the prompt text", () => {
    render(<WritingExercise prompt="日本語で書いてください" onSubmit={jest.fn()} />);
    expect(screen.getByTestId("writing-prompt")).toHaveTextContent("日本語で書いてください");
  });
});
