module Studio
  module Logging
    def log_info(msg)
      defined?(Rails) ? Rails.logger.info(msg) : puts(msg)
    end

    def log_warn(msg)
      defined?(Rails) ? Rails.logger.warn(msg) : warn(msg)
    end

    def log_error(msg)
      defined?(Rails) ? Rails.logger.error(msg) : warn(msg)
    end
  end
end
