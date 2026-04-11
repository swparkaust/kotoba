require 'rails_helper'

RSpec.describe Api::V1::ExercisesController, type: :controller do
  let(:learner) { create(:learner) }
  before { allow(controller).to receive(:current_learner).and_return(learner); request.headers["Authorization"] = "Bearer #{learner.auth_token}" }

  describe "GET #index" do
    it "returns exercises for a lesson" do
      lesson = create(:lesson, content_status: "ready")
      create(:exercise, lesson: lesson, position: 1)
      get :index, params: { lesson_id: lesson.id }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).length).to eq(1)
    end

    it "filters exercises by exercise_type" do
      lesson = create(:lesson, content_status: "ready")
      create(:exercise, lesson: lesson, position: 1, exercise_type: "multiple_choice")
      create(:exercise, lesson: lesson, position: 2, exercise_type: "fill_blank")
      get :index, params: { lesson_id: lesson.id, exercise_type: "fill_blank" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data.length).to eq(1)
      expect(data.first["exercise_type"]).to eq("fill_blank")
    end

    it "returns 404 for non-existent lesson_id" do
      get :index, params: { lesson_id: 99999 }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Lesson not found")
    end
  end

  describe "POST #submit" do
    it "evaluates a correct answer" do
      exercise = create(:exercise, content: { "correct_answer" => "あ", "hints" => [ "First hiragana" ] })
      post :submit, params: { id: exercise.id, answer: "あ" }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["correct"]).to be true
    end

    it "evaluates an incorrect answer and returns correct answer" do
      exercise = create(:exercise, content: { "correct_answer" => "あ", "hints" => [] })
      post :submit, params: { id: exercise.id, answer: "い" }
      data = JSON.parse(response.body)
      expect(data["correct"]).to be false
      expect(data["correct_answer"]).to eq("あ")
    end

    it "creates an SRS card when srs_key is present" do
      exercise = create(:exercise, content: {
        "correct_answer" => "あ", "hints" => [],
        "srs_key" => "あ", "srs_type" => "vocabulary"
      })
      expect {
        post :submit, params: { id: exercise.id, answer: "あ" }
      }.to change(SrsCard, :count).by(1)
    end

    it "returns 422 when answer is blank" do
      exercise = create(:exercise)
      post :submit, params: { id: exercise.id, answer: "" }
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "returns 404 when exercise is not found" do
      post :submit, params: { id: 99999, answer: "あ" }
      expect(response).to have_http_status(:not_found)
      expect(JSON.parse(response.body)["error"]).to eq("Exercise not found")
    end
  end

  describe "GET #show" do
    it "returns a single exercise" do
      exercise = create(:exercise)
      get :show, params: { id: exercise.id }
      expect(response).to have_http_status(:ok)
      data = JSON.parse(response.body)
      expect(data["id"]).to eq(exercise.id)
      expect(data["exercise_type"]).to eq(exercise.exercise_type)
    end

    it "returns 404 for non-existent exercise" do
      get :show, params: { id: 99999 }
      expect(response).to have_http_status(:not_found)
    end
  end
end
