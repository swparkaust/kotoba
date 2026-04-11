import { render, screen, fireEvent } from "@testing-library/react";
import { PragmaticScenario } from "@/components/PragmaticScenario";

describe("PragmaticScenario", () => {
  const mockScenario = {
    title: "上司の誘い",
    situation_ja: "上司があなたを飲み会に誘いました。",
    dialogue: [{ speaker: "上司", text: "飲みに行かない？", implied_meaning: "一緒に来てほしい", tone: "casual" }],
    choices: [
      { response: "ちょっと今日は...", consequence: "自然な断り方です", score: 100 },
      { response: "行きたくないです", consequence: "直接的すぎます", score: 30 },
    ],
    analysis: { rule: "断るときは言葉を濁します" },
  };

  it("renders situation and dialogue", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    expect(screen.getByTestId("pragmatic-scenario")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-situation")).toHaveTextContent("上司があなたを飲み会に誘いました");
    expect(screen.getByTestId("scenario-dialogue")).toBeInTheDocument();
  });

  it("renders response choices", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    expect(screen.getByTestId("scenario-choices")).toBeInTheDocument();
    expect(screen.getByText("ちょっと今日は...")).toBeInTheDocument();
    expect(screen.getByText("行きたくないです")).toBeInTheDocument();
  });

  it("does not call onChoice until continue is clicked", () => {
    const onChoice = jest.fn();
    render(<PragmaticScenario scenario={mockScenario} onChoice={onChoice} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(onChoice).not.toHaveBeenCalled();
  });

  it("calls onChoice after clicking continue", () => {
    const onChoice = jest.fn();
    render(<PragmaticScenario scenario={mockScenario} onChoice={onChoice} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    fireEvent.click(screen.getByTestId("scenario-continue"));
    expect(onChoice).toHaveBeenCalledWith(0);
  });

  it("shows analysis after choosing", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.getByTestId("scenario-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-analysis")).toHaveTextContent("断るときは言葉を濁します");
  });

  it("displays dialogue tone", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    expect(screen.getByText("casual")).toBeInTheDocument();
  });

  it("shows implied meaning after selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.getByText(/一緒に来てほしい/)).toBeInTheDocument();
  });

  it("prevents selecting a second choice after first selection", () => {
    const onChoice = jest.fn();
    render(<PragmaticScenario scenario={mockScenario} onChoice={onChoice} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    fireEvent.click(screen.getByText("行きたくないです"));
    fireEvent.click(screen.getByTestId("scenario-continue"));
    expect(onChoice).toHaveBeenCalledTimes(1);
    expect(onChoice).toHaveBeenCalledWith(0);
  });

  it("shows suboptimal feedback when non-best choice is selected", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("行きたくないです"));
    expect(screen.getByTestId("scenario-analysis")).toHaveTextContent("もっと良い返答がありました");
    expect(screen.getByTestId("scenario-analysis")).toHaveTextContent("ちょっと今日は...");
  });

  it("shows optimal feedback when best choice is selected", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.getByTestId("scenario-analysis")).toHaveTextContent("素晴らしい！最適な返答です。");
  });

  it("shows consequence and score after selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.getByText(/自然な断り方です/)).toBeInTheDocument();
    expect(screen.getByText(/Score: 100/)).toBeInTheDocument();
  });

  it("disables choice buttons after selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    const buttons = screen.getByTestId("scenario-choices").querySelectorAll("button");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("renders dialogue without implied_meaning when empty", () => {
    const scenarioNoImplied = {
      ...mockScenario,
      dialogue: [{ speaker: "上司", text: "飲みに行かない？", implied_meaning: "", tone: "casual" }],
    };
    render(<PragmaticScenario scenario={scenarioNoImplied} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.queryByText("→")).not.toBeInTheDocument();
  });

  it("does not show analysis before selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    expect(screen.queryByTestId("scenario-analysis")).not.toBeInTheDocument();
  });

  it("does not show implied meaning before selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    expect(screen.queryByText(/一緒に来てほしい/)).not.toBeInTheDocument();
  });

  it("shows all choices with consequences after selection", () => {
    render(<PragmaticScenario scenario={mockScenario} onChoice={jest.fn()} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
    expect(screen.getByText(/自然な断り方です/)).toBeInTheDocument();
    expect(screen.getByText(/直接的すぎます/)).toBeInTheDocument();
  });
});
