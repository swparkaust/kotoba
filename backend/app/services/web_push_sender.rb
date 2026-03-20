class WebPushSender
  def self.notify_all(title:, body:, data: {})
    vapid_keys = load_vapid_keys
    return unless vapid_keys

    PushSubscription.find_each do |sub|
      send_push(sub, title: title, body: body, data: data, vapid: vapid_keys)
    end
  end

  def self.notify_learner(learner:, title:, body:, data: {})
    vapid_keys = load_vapid_keys
    return unless vapid_keys

    PushSubscription.where(learner_id: learner.id).find_each do |sub|
      send_push(sub, title: title, body: body, data: data, vapid: vapid_keys)
    end
  end

  def self.send_push(sub, title:, body:, data:, vapid:)
    payload = { title: title, body: body, data: data }.to_json

    WebPush.payload_send(
      message: payload,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh_key,
      auth: sub.auth_key,
      vapid: vapid
    )
  rescue WebPush::ExpiredSubscription, WebPush::InvalidSubscription
    Rails.logger.info("Removing invalid/expired subscription #{sub.id}")
    sub.destroy
  rescue StandardError => e
    Rails.logger.error("WebPush failed for subscription #{sub.id}: #{e.class} - #{e.message}")
  end
  private_class_method :send_push

  def self.load_vapid_keys
    keys = {
      subject: Rails.application.credentials.dig(:vapid, :subject) || ENV["VAPID_SUBJECT"],
      public_key: Rails.application.credentials.dig(:vapid, :public_key) || ENV["VAPID_PUBLIC_KEY"],
      private_key: Rails.application.credentials.dig(:vapid, :private_key) || ENV["VAPID_PRIVATE_KEY"]
    }

    if keys.values.any?(&:blank?)
      Rails.logger.warn("WebPush VAPID keys not configured, skipping notification")
      return nil
    end

    keys
  end
  private_class_method :load_vapid_keys
end
