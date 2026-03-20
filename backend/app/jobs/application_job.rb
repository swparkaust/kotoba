class ApplicationJob < ActiveJob::Base
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3
  discard_on ActiveJob::DeserializationError

  around_perform do |_job, block|
    block.call
  rescue StandardError => e
    Rails.logger.error("#{self.class.name} failed: #{e.message}")
    raise e
  end
end
