require 'rails_helper'

module ApplicationCable
  RSpec.describe Connection, type: :channel do
    let(:learner) { create(:learner) }

    it "connects successfully with a valid token param" do
      connect "/cable", params: { token: learner.auth_token }
      expect(connection.current_learner).to eq(learner)
    end

    it "connects successfully with a valid Authorization header" do
      connect "/cable", headers: { "Authorization" => "Bearer #{learner.auth_token}" }
      expect(connection.current_learner).to eq(learner)
    end

    it "rejects connection when token is missing" do
      expect { connect "/cable" }.to have_rejected_connection
    end

    it "rejects connection when token is invalid" do
      expect { connect "/cable", params: { token: "bad-token" } }.to have_rejected_connection
    end
  end
end
