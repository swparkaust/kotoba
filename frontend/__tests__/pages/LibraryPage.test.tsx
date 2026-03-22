import { render, screen, waitFor } from "@testing-library/react";
import LibraryPage from "@/app/library/page";
import { api } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";

jest.mock("@/hooks/useLanguage", () => ({
  useLanguage: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock("@/components/LibraryBrowser", () => ({
  LibraryBrowser: ({ items }: { items: any[] }) => (
    <div data-testid="library-browser">
      {items.map((item: any) => item.title).join(",")}
    </div>
  ),
}));

const mockUseLanguage = useLanguage as jest.Mock;
const mockApiGet = api.get as jest.Mock;

describe("LibraryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLanguage.mockReturnValue({ languageCode: "ja" });
  });

  it("renders loading then LibraryBrowser", async () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    render(<LibraryPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("passes fetched items to LibraryBrowser", async () => {
    mockApiGet.mockResolvedValue([
      { title: "Story One" },
      { title: "Story Two" },
    ]);

    render(<LibraryPage />);

    await waitFor(() => {
      expect(screen.getByTestId("library-browser")).toHaveTextContent("Story One,Story Two");
    });
  });
});
