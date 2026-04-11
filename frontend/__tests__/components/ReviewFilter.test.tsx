import { render, screen, fireEvent } from "@testing-library/react";
import { ReviewFilter } from "@/components/ReviewFilter";

describe("ReviewFilter", () => {
  const stats = { total: 100, active: 90, burned: 10, due_now: 15, due_today: 20 };

  it("renders filter controls", () => {
    render(<ReviewFilter onApply={jest.fn()} stats={stats} />);
    expect(screen.getByTestId("review-filter")).toBeInTheDocument();
    expect(screen.getByTestId("filter-type-select")).toBeInTheDocument();
    expect(screen.getByTestId("filter-time-budget")).toBeInTheDocument();
    expect(screen.getByTestId("review-stats")).toBeInTheDocument();
  });

  it("calls onApply with filter params when apply clicked", () => {
    const onApply = jest.fn();
    render(<ReviewFilter onApply={onApply} stats={stats} />);
    fireEvent.click(screen.getByTestId("filter-apply"));
    expect(onApply).toHaveBeenCalled();
  });

  it("displays card statistics", () => {
    render(<ReviewFilter onApply={jest.fn()} stats={stats} />);
    expect(screen.getByTestId("review-stats")).toHaveTextContent("100");
    expect(screen.getByTestId("review-stats")).toHaveTextContent("15");
  });

  it("renders type select with options", () => {
    render(<ReviewFilter onApply={jest.fn()} stats={stats} />);
    const select = screen.getByTestId("filter-type-select");
    expect(select).toBeInTheDocument();
  });

  it("passes selected card type to onApply", () => {
    const onApply = jest.fn();
    render(<ReviewFilter onApply={onApply} stats={stats} />);
    fireEvent.change(screen.getByTestId("filter-type-select"), { target: { value: "kanji" } });
    fireEvent.click(screen.getByTestId("filter-apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ card_type: "kanji" }));
  });

  it("passes level min and max to onApply", () => {
    const onApply = jest.fn();
    render(<ReviewFilter onApply={onApply} stats={stats} />);
    fireEvent.change(screen.getByTestId("filter-level-min"), { target: { value: "3" } });
    fireEvent.change(screen.getByTestId("filter-level-max"), { target: { value: "7" } });
    fireEvent.click(screen.getByTestId("filter-apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ level_min: 3, level_max: 7 }));
  });

  it("passes time budget to onApply", () => {
    const onApply = jest.fn();
    render(<ReviewFilter onApply={onApply} stats={stats} />);
    fireEvent.change(screen.getByTestId("filter-time-budget"), { target: { value: "15" } });
    fireEvent.click(screen.getByTestId("filter-apply"));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ time_budget: 15 }));
  });

  it("passes undefined for empty fields", () => {
    const onApply = jest.fn();
    render(<ReviewFilter onApply={onApply} stats={stats} />);
    fireEvent.click(screen.getByTestId("filter-apply"));
    expect(onApply).toHaveBeenCalledWith({
      card_type: undefined,
      level_min: undefined,
      level_max: undefined,
      time_budget: undefined,
    });
  });

  it("displays burned count in stats", () => {
    render(<ReviewFilter onApply={jest.fn()} stats={stats} />);
    expect(screen.getByTestId("review-stats")).toHaveTextContent("Burned: 10");
  });

  it("renders level min and max inputs", () => {
    render(<ReviewFilter onApply={jest.fn()} stats={stats} />);
    expect(screen.getByTestId("filter-level-min")).toBeInTheDocument();
    expect(screen.getByTestId("filter-level-max")).toBeInTheDocument();
  });
});
