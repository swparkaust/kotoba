"use client";

interface ReadingTimeTrackerProps {
  readingMinutes: number;
  listeningMinutes: number;
  wordsRead: number;
}

export function ReadingTimeTracker({ readingMinutes, listeningMinutes, wordsRead }: ReadingTimeTrackerProps) {
  return (
    <div data-testid="reading-tracker" className="rounded-xl bg-stone-50 p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div data-testid="reading-minutes" className="text-xl font-medium text-stone-700">{readingMinutes}</div>
          <div className="text-xs text-stone-400">min reading</div>
        </div>
        <div>
          <div data-testid="listening-minutes" className="text-xl font-medium text-stone-700">{listeningMinutes}</div>
          <div className="text-xs text-stone-400">min listening</div>
        </div>
        <div>
          <div data-testid="words-read" className="text-xl font-medium text-stone-700">{wordsRead}</div>
          <div className="text-xs text-stone-400">words read</div>
        </div>
      </div>
    </div>
  );
}
