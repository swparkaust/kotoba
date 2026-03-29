require 'rails_helper'

RSpec.describe Studio::QualityReviewJob do
  let(:router) { double("AiModelRouter") }
  let(:language_config) { LanguageConfig.load(language_code: "ja") }

  let(:lesson) do
    double("Lesson",
      id: 1,
      content_status: "qa_review",
      qa_retry_count: 0
    )
  end

  let(:reviewer) { double("ContentQualityReviewer") }

  before do
    allow(AiProviders).to receive(:build_router).and_return(router)
    allow(Lesson).to receive(:find).with(1).and_return(lesson)
    allow(Studio::QA::ContentQualityReviewer).to receive(:new).and_return(reviewer)
  end

  it "skips when content_status is not qa_review" do
    allow(lesson).to receive(:content_status).and_return("building")
    allow(reviewer).to receive(:review)

    described_class.new.perform(1, "ja")

    expect(reviewer).not_to have_received(:review)
  end

  context "when review passes" do
    let(:result) { double("ReviewResult", passed?: true, score: 95.0) }

    before do
      allow(reviewer).to receive(:review).and_return(result)
      allow(lesson).to receive(:update!)
    end

    it "resets qa_retry_count on pass" do
      described_class.new.perform(1, "ja")

      expect(lesson).to have_received(:update!).with(qa_retry_count: 0)
    end
  end

  context "when review fails with retries remaining" do
    let(:result) { double("ReviewResult", passed?: false, score: 40.0) }

    before do
      allow(lesson).to receive(:qa_retry_count).and_return(1)
      allow(reviewer).to receive(:review).and_return(result)
      allow(lesson).to receive(:update!)
      allow(Studio::ContentBuildJob).to receive(:perform_async)
    end

    it "re-enqueues ContentBuildJob" do
      described_class.new.perform(1, "ja")

      expect(lesson).to have_received(:update!).with(content_status: "building", qa_retry_count: 2)
      expect(Studio::ContentBuildJob).to have_received(:perform_async).with(1, "ja")
    end
  end

  context "when review fails with retries exhausted" do
    let(:result) { double("ReviewResult", passed?: false, score: 30.0) }

    before do
      allow(lesson).to receive(:qa_retry_count).and_return(3)
      allow(reviewer).to receive(:review).and_return(result)
    end

    it "logs error without re-enqueuing" do
      allow(Studio::ContentBuildJob).to receive(:perform_async)

      described_class.new.perform(1, "ja")

      expect(Studio::ContentBuildJob).not_to have_received(:perform_async)
    end
  end

  context "when reviewer raises StandardError" do
    before do
      allow(reviewer).to receive(:review).and_raise(StandardError, "AI service unavailable")
    end

    it "rescues and re-raises the error" do
      expect {
        described_class.new.perform(1, "ja")
      }.to raise_error(StandardError, "AI service unavailable")
    end
  end
end
