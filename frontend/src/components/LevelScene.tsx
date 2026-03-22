"use client";

interface LevelSceneProps {
  levelId: number;
  completedLessons: number;
  totalLessons: number;
}

const SCENE_ELEMENTS = [
  "bridge", "koi-pond", "lantern", "cherry-tree", "bench",
  "torii", "fountain", "garden-path"
];

export function LevelScene({ levelId, completedLessons, totalLessons }: LevelSceneProps) {
  const visibleCount = Math.ceil((completedLessons / Math.max(totalLessons, 1)) * SCENE_ELEMENTS.length);

  return (
    <div data-testid="level-scene" className="rounded-2xl bg-gradient-to-b from-sky-100 to-green-50 p-6 min-h-[200px] relative overflow-hidden">
      <div className="flex flex-wrap gap-3">
        {SCENE_ELEMENTS.slice(0, visibleCount).map((element, index) => (
          <div
            key={element}
            data-testid={`scene-element-${index}`}
            className="w-16 h-16 rounded-xl bg-white/60 border border-white flex items-center justify-center text-2xl shadow-sm"
          >
            {["🌉", "🐟", "🏮", "🌸", "🪑", "⛩️", "⛲", "🛤️"][index]}
          </div>
        ))}
      </div>
    </div>
  );
}
