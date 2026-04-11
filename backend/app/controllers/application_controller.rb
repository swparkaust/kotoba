class ApplicationController < ActionController::API
  before_action :authenticate_learner!

  rescue_from ActiveRecord::RecordNotFound do |e|
    render json: { error: e.message }, status: :not_found
  end

  rescue_from ActiveRecord::RecordInvalid do |e|
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def authenticate_learner!
    token = request.headers["Authorization"]&.split("Bearer ")&.last
    @current_learner = Learner.find_by(auth_token: token) if token
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_learner
  end

  def current_learner
    @current_learner
  end

  def current_language
    @current_language ||= Language.find_by!(code: params[:language_code] || current_learner.active_language_code)
  end

  def ai_router
    @ai_router ||= AiProviders.build_router
  end
end
