import { render, screen, fireEvent } from "@testing-library/react";
import { TapToGloss } from "@/components/TapToGloss";

describe("TapToGloss", () => {
  const defaultProps = {
    word: "食べる",
    definition: "to eat",
    onClose: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the word and definition", () => {
    render(<TapToGloss {...defaultProps} />);
    expect(screen.getByTestId("tap-gloss")).toBeInTheDocument();
    expect(screen.getByTestId("gloss-word")).toHaveTextContent("食べる");
    expect(screen.getByTestId("gloss-definition")).toHaveTextContent("to eat");
  });

  it("renders the reading when provided", () => {
    render(<TapToGloss {...defaultProps} reading="たべる" />);
    expect(screen.getByTestId("gloss-reading")).toHaveTextContent("たべる");
  });

  it("does not render reading when not provided", () => {
    render(<TapToGloss {...defaultProps} />);
    expect(screen.queryByTestId("gloss-reading")).not.toBeInTheDocument();
  });

  it("renders add-srs button when onAddSrs is provided", () => {
    const onAddSrs = jest.fn();
    render(<TapToGloss {...defaultProps} onAddSrs={onAddSrs} />);
    expect(screen.getByTestId("gloss-add-srs")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("gloss-add-srs"));
    expect(onAddSrs).toHaveBeenCalled();
  });

  it("does not render add-srs button when onAddSrs is not provided", () => {
    render(<TapToGloss {...defaultProps} />);
    expect(screen.queryByTestId("gloss-add-srs")).not.toBeInTheDocument();
  });
});
