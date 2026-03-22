import { render, screen, fireEvent } from "@testing-library/react";
import { UnitCard } from "@/components/UnitCard";

describe("UnitCard", () => {
  const defaultProps = {
    unit: {
      id: 5,
      title: "Greetings and Self-Introduction",
      lessons: [
        { id: 101, position: 1 },
        { id: 102, position: 2 },
        { id: 103, position: 3 },
      ],
    },
    onSelectLesson: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders unit card with correct testid", () => {
    render(<UnitCard {...defaultProps} />);
    expect(screen.getByTestId("unit-card-5")).toBeInTheDocument();
  });

  it("renders unit title", () => {
    render(<UnitCard {...defaultProps} />);
    expect(screen.getByText("Greetings and Self-Introduction")).toBeInTheDocument();
  });

  it("renders lesson dots for each lesson", () => {
    render(<UnitCard {...defaultProps} />);
    expect(screen.getByTestId("lesson-dot-101")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-dot-102")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-dot-103")).toBeInTheDocument();
  });

  it("calls onSelectLesson with lesson id when dot is clicked", () => {
    render(<UnitCard {...defaultProps} />);
    fireEvent.click(screen.getByTestId("lesson-dot-102"));
    expect(defaultProps.onSelectLesson).toHaveBeenCalledWith(102);
  });

  it("renders lesson position numbers on dots", () => {
    render(<UnitCard {...defaultProps} />);
    expect(screen.getByTestId("lesson-dot-101")).toHaveTextContent("1");
    expect(screen.getByTestId("lesson-dot-103")).toHaveTextContent("3");
  });
});
