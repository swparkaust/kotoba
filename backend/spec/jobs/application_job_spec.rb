require 'rails_helper'

# A concrete subclass so we can exercise the around_perform block
class TestApplicationJob < ApplicationJob
  class TestJobError < StandardError; end

  def perform(should_raise: false)
    raise TestJobError, "boom" if should_raise
    "done"
  end
end

RSpec.describe ApplicationJob, type: :job do
  it "configures retry_on for ActiveRecord::Deadlocked" do
    handler_names = described_class.rescue_handlers.map(&:first)
    expect(handler_names).to include("ActiveRecord::Deadlocked")
  end

  it "configures discard_on for ActiveJob::DeserializationError" do
    handler_names = described_class.rescue_handlers.map(&:first)
    expect(handler_names).to include("ActiveJob::DeserializationError")
  end

  describe "around_perform error logging" do
    it "allows successful jobs to complete" do
      expect {
        TestApplicationJob.perform_now(should_raise: false)
      }.not_to raise_error
    end

    it "logs and re-raises errors from perform" do
      allow_any_instance_of(ActiveSupport::Logger).to receive(:error)
      allow_any_instance_of(ActiveSupport::BroadcastLogger).to receive(:error)

      expect {
        TestApplicationJob.perform_now(should_raise: true)
      }.to raise_error(TestApplicationJob::TestJobError, "boom")
    end
  end
end
