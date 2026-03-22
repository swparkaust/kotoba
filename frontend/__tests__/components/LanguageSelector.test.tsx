import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSelector } from "@/components/LanguageSelector";

describe("LanguageSelector", () => {
  const defaultProps = {
    languages: [
      { code: "en", name: "English", native_name: "English" },
      { code: "ja", name: "Japanese", native_name: "日本語" },
      { code: "ko", name: "Korean", native_name: "한국어" },
    ],
    activeCode: "ja",
    onSelect: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders the selector with all language options", () => {
    render(<LanguageSelector {...defaultProps} />);
    expect(screen.getByTestId("language-selector")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-en")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-ja")).toBeInTheDocument();
    expect(screen.getByTestId("language-option-ko")).toBeInTheDocument();
  });

  it("highlights the active language", () => {
    render(<LanguageSelector {...defaultProps} />);
    expect(screen.getByTestId("language-active")).toBeInTheDocument();
  });

  it("calls onSelect when a language option is clicked", () => {
    render(<LanguageSelector {...defaultProps} />);
    fireEvent.click(screen.getByTestId("language-option-en"));
    expect(defaultProps.onSelect).toHaveBeenCalledWith("en");
  });
});
