import { render, screen, fireEvent } from "@testing-library/react";
import { LibraryBrowser } from "@/components/LibraryBrowser";

describe("LibraryBrowser", () => {
  const items = [
    { id: 1, title: "桃太郎", item_type: "graded_reader", difficulty_level: 5 },
    { id: 2, title: "走れメロス", item_type: "novel", difficulty_level: 10 },
  ];
  const stats = { total_reading_minutes: 120, total_listening_minutes: 45 };

  it("renders all library items", () => {
    render(<LibraryBrowser items={items} stats={stats} />);
    expect(screen.getByTestId("library-browser")).toBeInTheDocument();
    expect(screen.getByTestId("library-item-1")).toBeInTheDocument();
    expect(screen.getByTestId("library-item-2")).toBeInTheDocument();
  });

  it("displays reading and listening stats", () => {
    render(<LibraryBrowser items={items} stats={stats} />);
    expect(screen.getByTestId("library-stats")).toBeInTheDocument();
    expect(screen.getByTestId("library-stats")).toHaveTextContent("120");
    expect(screen.getByTestId("library-stats")).toHaveTextContent("45");
  });

  it("calls onSelectItem when an item is clicked", () => {
    const onSelect = jest.fn();
    render(<LibraryBrowser items={items} stats={stats} onSelectItem={onSelect} />);
    fireEvent.click(screen.getByTestId("library-item-1"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("shows empty state when no items", () => {
    render(<LibraryBrowser items={[]} />);
    expect(screen.getByText("No items available yet.")).toBeInTheDocument();
  });

  it("displays item type and difficulty level", () => {
    render(<LibraryBrowser items={items} />);
    expect(screen.getByTestId("library-item-1")).toHaveTextContent("graded_reader");
    expect(screen.getByTestId("library-item-1")).toHaveTextContent("Level 5");
  });
});
