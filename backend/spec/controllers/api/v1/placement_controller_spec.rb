require 'rails_helper'

RSpec.describe Api::V1::PlacementController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "POST #create" do
    it "evaluates placement and returns recommendation" do
      create(:language, code: "ja")

      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: '{"recommended_level":2,"overall_score":0.7,"scores_by_level":{"1":0.9,"2":0.7}}', task: :placement_evaluation)
      )

      post :create, params: { language_code: "ja", responses: [] }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["recommended_level"]).to eq(2)
    end

    it "creates a PlacementAttempt record" do
      create(:language, code: "ja")

      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: '{"recommended_level":1,"overall_score":0.3,"scores_by_level":{}}', task: :placement_evaluation)
      )

      expect { post :create, params: { language_code: "ja", responses: [] } }
        .to change(PlacementAttempt, :count).by(1)
    end

    context "with server-side grading (MemoryStore cache)" do
      around do |example|
        original_cache = Rails.cache
        Rails.cache = ActiveSupport::Cache::MemoryStore.new
        example.run
      ensure
        Rails.cache = original_cache
      end

      it "grades answers server-side using stored questions from session_key" do
        create(:language, code: "ja")

        stored_questions = [
          { prompt: "What is あ?", options: [ "a", "b", "c", "d" ], correct_answer: "a", level: 1, skill_tested: "hiragana" },
          { prompt: "What is い?", options: [ "a", "b", "c", "d" ], correct_answer: "b", level: 1, skill_tested: "hiragana" }
        ]
        session_key = "placement_#{learner.id}_#{Time.current.to_i}"
        Rails.cache.write(session_key, stored_questions, expires_in: 1.hour)

        router = instance_double(AiModelRouter)
        allow(AiProviders).to receive(:build_router).and_return(router)
        allow(router).to receive(:call).and_return(
          AiResponse.new(text: '{"recommended_level":1,"overall_score":0.5,"scores_by_level":{"1":0.5}}', task: :placement_evaluation)
        )

        post :create, params: { language_code: "ja", session_key: session_key, answers: [ "a", "c" ] }
        expect(response).to have_http_status(:ok)
        data = JSON.parse(response.body)
        expect(data["recommended_level"]).to eq(1)
        expect(Rails.cache.read(session_key)).to be_nil
      end

      it "skips answers beyond stored questions count" do
        create(:language, code: "ja")

        stored_questions = [
          { prompt: "Q1", options: [ "a", "b", "c", "d" ], correct_answer: "a", level: 1, skill_tested: "vocabulary" }
        ]
        session_key = "placement_#{learner.id}_#{Time.current.to_i}"
        Rails.cache.write(session_key, stored_questions, expires_in: 1.hour)

        router = instance_double(AiModelRouter)
        allow(AiProviders).to receive(:build_router).and_return(router)
        allow(router).to receive(:call).and_return(
          AiResponse.new(text: '{"recommended_level":1,"overall_score":0.3,"scores_by_level":{"1":0.3}}', task: :placement_evaluation)
        )

        # Send 3 answers but only 1 stored question -- indices 1 and 2 should be compacted out
        post :create, params: { language_code: "ja", session_key: session_key, answers: [ "a", "b", "c" ] }
        expect(response).to have_http_status(:ok)
      end
    end

    it "falls back to client-provided responses when no session_key exists" do
      create(:language, code: "ja")

      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(text: '{"recommended_level":1,"overall_score":0.4,"scores_by_level":{"1":0.4}}', task: :placement_evaluation)
      )

      post :create, params: {
        language_code: "ja",
        responses: [ { "answer" => "a", "correct" => true, "level" => 1, "skill_tested" => "vocabulary" } ]
      }
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST #accept" do
    it "accepts placement and unlocks levels" do
      language = create(:language, code: "ja")
      level1 = create(:curriculum_level, language: language, position: 1)
      unit1 = create(:curriculum_unit, curriculum_level: level1, position: 1)
      lesson1 = create(:lesson, curriculum_unit: unit1, position: 1)
      attempt = PlacementAttempt.create!(learner: learner, language: language, recommended_level: 1, overall_score: 0.9, responses: [])

      post :accept, params: { id: attempt.id, chosen_level: 1 }
      expect(response).to have_http_status(:ok)
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson1)&.status).to eq("available")
    end

    it "returns 404 for non-existent attempt" do
      post :accept, params: { id: 999999, chosen_level: 1 }
      expect(response).to have_http_status(:not_found)
    end

    it "returns 404 for another learner's attempt" do
      language = create(:language, code: "ja")
      other = create(:learner)
      attempt = PlacementAttempt.create!(learner: other, language: language, recommended_level: 1, overall_score: 0.5, responses: [])
      post :accept, params: { id: attempt.id, chosen_level: 1 }
      expect(response).to have_http_status(:not_found)
    end

    it "marks lessons below chosen_level as completed when chosen_level > 1" do
      language = create(:language, code: "ja")
      level1 = create(:curriculum_level, language: language, position: 1)
      unit1 = create(:curriculum_unit, curriculum_level: level1, position: 1)
      lesson1 = create(:lesson, curriculum_unit: unit1, position: 1)
      level2 = create(:curriculum_level, language: language, position: 2)
      unit2 = create(:curriculum_unit, curriculum_level: level2, position: 1)
      lesson2 = create(:lesson, curriculum_unit: unit2, position: 1)
      attempt = PlacementAttempt.create!(learner: learner, language: language, recommended_level: 2, overall_score: 0.8, responses: [])

      post :accept, params: { id: attempt.id, chosen_level: 2 }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["chosen_level"]).to eq("2").or eq(2)
      expect(data["levels_skipped"]).to eq(1)
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson1).status).to eq("completed")
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson1).score).to eq(100)
      expect(LearnerProgress.find_by(learner: learner, lesson: lesson2).status).to eq("available")
    end
  end

  describe "GET #questions" do
    it "returns placement questions and a session_key" do
      language = create(:language, code: "ja")
      create(:curriculum_level, language: language, position: 1)

      router = instance_double(AiModelRouter)
      allow(AiProviders).to receive(:build_router).and_return(router)
      allow(router).to receive(:call).and_return(
        AiResponse.new(
          text: { prompt: "テスト", options: [ "a", "b", "c", "d" ], correct_answer: "a", skill_tested: "vocab", level: 1 }.to_json,
          model: "test",
          task: :placement_question_generation
        )
      )

      get :questions, params: { language_code: "ja" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["questions"]).to be_an(Array)
      expect(data["session_key"]).to be_present
      expect(data["questions"].first).not_to have_key("correct_answer")
    end

    it "returns 404 for unknown language" do
      get :questions, params: { language_code: "xx" }
      expect(response).to have_http_status(:not_found)
    end
  end
end
