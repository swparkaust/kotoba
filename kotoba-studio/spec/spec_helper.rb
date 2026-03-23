require "ostruct"
require "json"

require_relative "../lib/studio"
require_relative "../lib/studio/content_builder"
require_relative "../lib/studio/curriculum_parser"
require_relative "../lib/studio/content_pack_exporter"
require_relative "../lib/studio/generators/audio_generator"
require_relative "../lib/studio/generators/authentic_content_scaffolder"
require_relative "../lib/studio/generators/contrastive_grammar_generator"
require_relative "../lib/studio/generators/exercise_generator"
require_relative "../lib/studio/generators/illustration_generator"
require_relative "../lib/studio/generators/pragmatic_scenario_generator"
require_relative "../lib/studio/generators/real_audio_scaffolder"

RSpec.configure do |config|
  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
end
