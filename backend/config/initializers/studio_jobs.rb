studio_root = File.expand_path("../../../kotoba-studio/lib/studio", __dir__)

if File.directory?(studio_root)
  require_relative "../../../kotoba-studio/lib/studio"
  require_relative "../../../kotoba-studio/lib/studio/logging"
  require_relative "../../../kotoba-studio/lib/studio/content_builder"
  require_relative "../../../kotoba-studio/lib/studio/curriculum_parser"
  require_relative "../../../kotoba-studio/lib/studio/content_pack_exporter"
  require_relative "../../../kotoba-studio/lib/studio/generators/kanji_constraint"
  require_relative "../../../kotoba-studio/lib/studio/generators/exercise_generator"
  require_relative "../../../kotoba-studio/lib/studio/generators/illustration_generator"
  require_relative "../../../kotoba-studio/lib/studio/generators/audio_generator"
  require_relative "../../../kotoba-studio/lib/studio/generators/authentic_content_scaffolder"
  require_relative "../../../kotoba-studio/lib/studio/generators/pragmatic_scenario_generator"
  require_relative "../../../kotoba-studio/lib/studio/generators/contrastive_grammar_generator"
  require_relative "../../../kotoba-studio/lib/studio/generators/real_audio_scaffolder"
  require_relative "../../../kotoba-studio/lib/studio/qa/content_quality_reviewer"
  require_relative "../../../kotoba-studio/lib/studio/jobs/content_build_job"
  require_relative "../../../kotoba-studio/lib/studio/jobs/audio_generation_job"
  require_relative "../../../kotoba-studio/lib/studio/jobs/authentic_content_build_job"
  require_relative "../../../kotoba-studio/lib/studio/jobs/real_audio_build_job"
  require_relative "../../../kotoba-studio/lib/studio/jobs/quality_review_job"
end
