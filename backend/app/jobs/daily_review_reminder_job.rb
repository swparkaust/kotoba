class DailyReviewReminderJob
  include Sidekiq::Job

  def perform
    Learner.where(notifications_enabled: true).find_each do |learner|
      scheduler = SrsScheduler.new
      due_count = scheduler.due_cards(learner: learner).count
      next if due_count == 0

      WebPushSender.notify_learner(
        learner: learner,
        title: "ことば",
        body: "#{due_count} review cards are ready when you are.",
        data: { type: "review_reminder", count: due_count }
      )
    end
  end
end
