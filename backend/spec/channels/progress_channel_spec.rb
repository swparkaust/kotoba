require 'rails_helper'

RSpec.describe ProgressChannel, type: :channel do
  describe ".broadcast_update" do
    it "broadcasts data when learner exists" do
      learner = create(:learner)
      data = { lesson_id: 1, status: "complete" }
      expect(ProgressChannel).to receive(:broadcast_to).with(learner, data)
      ProgressChannel.broadcast_update(learner.id, data)
    end

    it "is a no-op when learner does not exist" do
      data = { lesson_id: 1, status: "complete" }
      expect(ProgressChannel).not_to receive(:broadcast_to)
      ProgressChannel.broadcast_update(999999, data)
    end
  end
end
