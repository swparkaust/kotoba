"use client";

interface CurriculumLesson {
  id: number;
  position: number;
  title: string;
  skill_type: string;
  content_status: string;
}

interface CurriculumUnit {
  id: number;
  position: number;
  title: string;
  description: string;
  target_items: string[];
  lessons: CurriculumLesson[];
}

interface Level {
  id: number;
  position: number;
  title: string;
  jlpt_approx: string;
  curriculum_units: CurriculumUnit[];
  lesson_count: number;
  completed_count: number;
}

interface LevelMapProps {
  levels: Level[];
  currentLevel: number;
  onSelectLevel: (id: number) => void;
}

export function LevelMap({ levels, currentLevel, onSelectLevel }: LevelMapProps) {
  const visibleLevels = levels.filter(l => l.position <= currentLevel + 1);
  const hiddenCount = levels.length - visibleLevels.length;

  return (
    <div data-testid="level-map" className="space-y-3">
      {visibleLevels.map((level) => (
        <button
          key={level.id}
          data-testid={`level-card-${level.id}`}
          onClick={() => onSelectLevel(level.id)}
          className="w-full text-left rounded-xl bg-white border border-stone-200 p-4 hover:border-orange-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-stone-700">{level.title}</span>
            <span data-testid="level-jlpt-badge" className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {level.jlpt_approx}
            </span>
          </div>
        </button>
      ))}
      {hiddenCount > 0 && (
        <p data-testid="levels-collapsed" className="text-sm text-stone-400 text-center">
          and {hiddenCount} more levels
        </p>
      )}
    </div>
  );
}
