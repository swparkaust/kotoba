require 'rails_helper'

RSpec.describe PlacementEvaluator, type: :service do
  let(:router) { instance_double(AiModelRouter) }
  let(:service) { described_class.new(router: router) }

  before do
    allow(router).to receive(:call).and_return(
      AiResponse.new(
        text: '{"recommended_level":3,"overall_score":0.65,"scores_by_level":{"1":0.95,"2":0.85,"3":0.65}}',
        model: "claude-opus-4-20250514",
        task: :placement_evaluation
      )
    )
  end

  it "routes to the placement_evaluation task" do
    learner = create(:learner)
    language = create(:language, code: "ja")
    expect(router).to receive(:call).with(hash_including(task: :placement_evaluation))
    service.evaluate(learner: learner, language: language, responses: [])
  end

  it "creates a PlacementAttempt and returns a PlacementResult" do
    learner = create(:learner)
    language = create(:language, code: "ja")
    result = service.evaluate(learner: learner, language: language, responses: [])
    expect(result).to be_a(PlacementResult)
    expect(result.recommended_level).to eq(3)
    expect(PlacementAttempt.count).to eq(1)
  end

  it "falls back to level 1 when AI returns malformed JSON" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "not valid json", model: "test", task: :placement_evaluation)
    )
    learner = create(:learner)
    language = create(:language, code: "ja")
    result = service.evaluate(learner: learner, language: language, responses: [])
    expect(result.recommended_level).to eq(1)
    expect(result.overall_score).to eq(0.0)
  end

  it "falls back to level 1 when AI returns blank text" do
    allow(router).to receive(:call).and_return(
      AiResponse.new(text: "", model: "test", task: :placement_evaluation)
    )
    learner = create(:learner)
    language = create(:language, code: "ja")
    result = service.evaluate(learner: learner, language: language, responses: [])
    expect(result.recommended_level).to eq(1)
    expect(result.overall_score).to eq(0.0)
  end
end
