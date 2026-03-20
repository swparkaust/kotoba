class ApplicationController < ActionController::API
  before_action :authenticate_learner!

  private

  def authenticate_learner!
    token = request.headers["Authorization"]&.split("Bearer ")&.last
    @current_learner = Learner.find_by(auth_token: token) if token
    render json: { error: "Unauthorized" }, status: :unauthorized unless @current_learner
  end

  def current_learner
    @current_learner
  end
end
