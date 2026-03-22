"use client";

interface UnitCardProps {
  unit: { id: number; title: string; lessons: any[] };
  onSelectLesson: (lessonId: number) => void;
}

export function UnitCard({ unit, onSelectLesson }: UnitCardProps) {
  return (
    <div data-testid={`unit-card-${unit.id}`} className="rounded-xl bg-white border border-stone-200 p-4">
      <h3 className="font-medium text-stone-700 mb-3">{unit.title}</h3>
      <div className="flex gap-2 flex-wrap">
        {unit.lessons.map((lesson: any) => (
          <button
            key={lesson.id}
            data-testid={`lesson-dot-${lesson.id}`}
            onClick={() => onSelectLesson(lesson.id)}
            className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-500 hover:bg-orange-100 hover:border-orange-300"
          >
            {lesson.position}
          </button>
        ))}
      </div>
    </div>
  );
}
