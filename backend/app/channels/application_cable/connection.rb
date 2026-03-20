module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_learner

    def connect
      self.current_learner = find_verified_learner
    end

    private

    def find_verified_learner
      token = request.params[:token] || request.headers["Authorization"]&.delete_prefix("Bearer ")
      if token.present?
        learner = Learner.find_by(auth_token: token)
        return learner if learner
      end

      reject_unauthorized_connection
    end
  end
end
