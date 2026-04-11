namespace :content_pack do
  desc "Import a content pack from the studio output directory"
  task :import, [ :path ] => :environment do |_t, args|
    path = args[:path] || ENV["CONTENT_PACK_PATH"]
    abort "Usage: rails content_pack:import[/path/to/ja_v1]" unless path

    importer = ContentPackImporter.new(path: path)
    importer.validate!
    importer.import!

    puts "Imported #{importer.stats.to_json}"
  end
end
