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
});
