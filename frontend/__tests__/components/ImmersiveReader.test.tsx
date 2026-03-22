import { render, screen, fireEvent } from "@testing-library/react";
import { ImmersiveReader } from "@/components/ImmersiveReader";

describe("ImmersiveReader", () => {
  const defaultProps = {
    text: "日本語のテキスト",
    elapsed: 120,
    progress: 0.65,
    onWordTap: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the reader container", () => {
    render(<ImmersiveReader {...defaultProps} />);
    expect(screen.getByTestId("immersive-reader")).toBeInTheDocument();
  });

  it("renders the text content", () => {
    render(<ImmersiveReader {...defaultProps} />);
    expect(screen.getByTestId("reader-text")).toHaveTextContent("日本語のテキスト");
  });

  it("shows the elapsed time", () => {
    render(<ImmersiveReader {...defaultProps} />);
    expect(screen.getByTestId("reader-timer")).toBeInTheDocument();
  });

  it("shows the progress bar", () => {
    render(<ImmersiveReader {...defaultProps} />);
    expect(screen.getByTestId("reader-progress")).toBeInTheDocument();
  });

  it("calls onWordTap when a text word is clicked", () => {
    render(<ImmersiveReader {...defaultProps} />);
    const readerText = screen.getByTestId("reader-text");
    const firstSpan = readerText.querySelector("span")!;
    fireEvent.click(firstSpan);
    expect(defaultProps.onWordTap).toHaveBeenCalled();
  });

  it("shows gloss popup when a glossed word is clicked", () => {
    const glosses = [
      { word: "日本語", reading: "にほんご", definition_ja: "Japanese language" },
    ];
    render(<ImmersiveReader {...defaultProps} text="日本語のテキスト" glosses={glosses} />);
    const readerText = screen.getByTestId("reader-text");
    const spans = readerText.querySelectorAll("span");
    const glossedSpan = Array.from(spans).find((s) => s.textContent === "日本語")!;
    fireEvent.click(glossedSpan);
    expect(screen.getByTestId("reader-gloss-popup")).toBeInTheDocument();
    expect(screen.getByTestId("tap-gloss")).toBeInTheDocument();
  });

  it("does not show gloss popup for non-glossed word", () => {
    const glosses = [
      { word: "日本語", reading: "にほんご", definition_ja: "Japanese language" },
    ];
    render(<ImmersiveReader {...defaultProps} text="日本語のテキスト" glosses={glosses} />);
    const readerText = screen.getByTestId("reader-text");
    const spans = readerText.querySelectorAll("span");
    const nonGlossedSpan = Array.from(spans).find((s) => s.textContent === "の")!;
    fireEvent.click(nonGlossedSpan);
    expect(screen.queryByTestId("reader-gloss-popup")).not.toBeInTheDocument();
  });

  it("calls onAddSrs callback via gloss popup", () => {
    const onAddSrs = jest.fn();
    const glosses = [
      { word: "日本語", reading: "にほんご", definition_ja: "Japanese language" },
    ];
    render(
      <ImmersiveReader {...defaultProps} text="日本語のテキスト" glosses={glosses} onAddSrs={onAddSrs} />
    );
    const readerText = screen.getByTestId("reader-text");
    const spans = readerText.querySelectorAll("span");
    const glossedSpan = Array.from(spans).find((s) => s.textContent === "日本語")!;
    fireEvent.click(glossedSpan);
    expect(screen.getByTestId("reader-gloss-popup")).toBeInTheDocument();
  });

  it("formats elapsed time correctly", () => {
    render(<ImmersiveReader {...defaultProps} elapsed={65} />);
    expect(screen.getByTestId("reader-timer")).toHaveTextContent("1:05");
  });

  it("displays progress percentage", () => {
    render(<ImmersiveReader {...defaultProps} progress={0.5} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
