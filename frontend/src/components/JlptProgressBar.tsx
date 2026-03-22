"use client";

interface JlptProgressBarProps {
  jlptLabel: string;
  percentage: number;
}

export function JlptProgressBar({ jlptLabel, percentage }: JlptProgressBarProps) {
  return (
    <div data-testid="jlpt-bar" className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span data-testid="jlpt-label" className="text-sm font-medium text-stone-700">
          {jlptLabel}
        </span>
        <span data-testid="jlpt-percentage" className="text-sm text-stone-500">
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-stone-200 rounded-full h-2">
        <div
          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
