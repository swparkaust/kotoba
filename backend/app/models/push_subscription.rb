class PushSubscription < ApplicationRecord
  belongs_to :learner, optional: true

  validates :endpoint, presence: true, uniqueness: true
  validates :p256dh_key, presence: true
  validates :auth_key, presence: true

  scope :for_learner, ->(learner) { where(learner: learner) }
  scope :active, -> { where.not(learner: nil) }
  scope :orphaned, -> { where(learner: nil) }

  def web_push_payload
    {
      endpoint: endpoint,
      p256dh: p256dh_key,
      auth: auth_key
    }
  end

  def expired?
    # Subscriptions older than 90 days without updates are likely stale
    updated_at < 90.days.ago
  end

  def self.cleanup_expired!
    where("updated_at < ?", 90.days.ago).destroy_all
  end

  def self.for_notifiable_learners
    joins(:learner).where(learners: { notifications_enabled: true })
  end
end
