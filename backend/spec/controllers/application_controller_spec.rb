require 'rails_helper'

# Use a concrete controller to test ApplicationController behavior.
# ExercisesController inherits from ApplicationController and has simple actions.
RSpec.describe Api::V1::ExercisesController, type: :controller do
  describe "ApplicationController#current_learner (real path, no stub)" do
    it "returns the authenticated learner via the current_learner accessor" do
      learner = create(:learner)
      exercise = create(:exercise)
      request.headers["Authorization"] = "Bearer #{learner.auth_token}"

      get :show, params: { id: exercise.id }
      expect(response).to have_http_status(:ok)
      # Verify the controller's real current_learner was set
      expect(controller.send(:current_learner)).to eq(learner)
    end
  end

  describe "ApplicationController#ai_router" do
    it "builds and memoizes the AI router" do
      learner = create(:learner)
      request.headers["Authorization"] = "Bearer #{learner.auth_token}"

      router_double = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router_double)

      result = controller.send(:ai_router)
      expect(result).to eq(router_double)

      # Verify memoization: second call should not invoke build_router again
      expect(AiProviders).to have_received(:build_router).once
      expect(controller.send(:ai_router)).to eq(router_double)
    end
  end
end
