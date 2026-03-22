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

  it("calls onChoice when a choice is selected", () => {
    const onChoice = jest.fn();
    render(<PragmaticScenario scenario={mockScenario} onChoice={onChoice} />);
    fireEvent.click(screen.getByText("ちょっと今日は..."));
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
});
