import { render, screen, fireEvent } from "@testing-library/react";
import { MultipleChoice } from "@/components/MultipleChoice";

const mockPlay = jest.fn();
jest.mock("@/hooks/useAudio", () => ({
  useAudio: () => ({ play: mockPlay, stop: jest.fn() }),
}));

describe("MultipleChoice", () => {
  const defaultProps = {
    prompt: "あ",
    options: ["あ", "い", "う", "え"],
    correctIndex: 0,
    onAnswer: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders prompt and all options", () => {
    render(<MultipleChoice {...defaultProps} />);
    expect(screen.getByTestId("multiple-choice")).toBeInTheDocument();
    expect(screen.getAllByText("あ").length).toBeGreaterThan(0);
    expect(screen.getByTestId("choice-0")).toBeInTheDocument();
    expect(screen.getByTestId("choice-3")).toBeInTheDocument();
  });

  it("calls onAnswer with the selected option text", () => {
    render(<MultipleChoice {...defaultProps} />);
    fireEvent.click(screen.getByTestId("choice-1"));
    expect(defaultProps.onAnswer).toHaveBeenCalledWith("い");
  });

  it("shows feedback after answering correctly", () => {
    render(<MultipleChoice {...defaultProps} />);
    fireEvent.click(screen.getByTestId("choice-0"));
    expect(screen.getByTestId("choice-feedback")).toBeInTheDocument();
    expect(screen.getByTestId("choice-feedback")).toHaveTextContent("正解");
  });

  it("shows correct answer on wrong selection", () => {
    render(<MultipleChoice {...defaultProps} />);
    fireEvent.click(screen.getByTestId("choice-2"));
    expect(screen.getByTestId("choice-feedback")).toHaveTextContent("あ");
  });

  it("disables all options after an answer is selected", () => {
    render(<MultipleChoice {...defaultProps} />);
    fireEvent.click(screen.getByTestId("choice-1"));
    expect(screen.getByTestId("choice-0")).toBeDisabled();
    expect(screen.getByTestId("choice-1")).toBeDisabled();
  });

  it("renders image when imageUrl provided", () => {
    render(<MultipleChoice {...defaultProps} imageUrl="/test.png" />);
    expect(screen.getByRole("presentation")).toBeInTheDocument();
  });

  it("renders audio play button when audioUrl is provided", () => {
    render(<MultipleChoice {...defaultProps} audioUrl="/audio/test.mp3" />);
    expect(screen.getByText("🔊 Listen")).toBeInTheDocument();
  });

  it("does not render audio play button when audioUrl is not provided", () => {
    render(<MultipleChoice {...defaultProps} />);
    expect(screen.queryByText("🔊 Listen")).not.toBeInTheDocument();
  });

  it("calls play with audioUrl when audio button is clicked", () => {
    render(<MultipleChoice {...defaultProps} audioUrl="/audio/test.mp3" />);
    fireEvent.click(screen.getByText("🔊 Listen"));
    expect(mockPlay).toHaveBeenCalledWith("/audio/test.mp3");
  });
});
