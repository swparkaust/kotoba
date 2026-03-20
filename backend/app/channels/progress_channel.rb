class ProgressChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_learner
  end

  def self.broadcast_update(learner_id, data)
    learner = Learner.find_by(id: learner_id)
    return unless learner

    broadcast_to(learner, data)
  end
end
