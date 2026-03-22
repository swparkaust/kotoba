"use client";

interface LibraryBrowserProps {
  items: Array<{ id: number; title: string; item_type: string; difficulty_level: number }>;
  stats?: { total_reading_minutes: number; total_listening_minutes: number };
  onSelectItem?: (id: number) => void;
}

export function LibraryBrowser({ items, stats, onSelectItem }: LibraryBrowserProps) {
  return (
    <div data-testid="library-browser" className="space-y-4">
      {stats && (
        <div data-testid="library-stats" className="flex gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
          <div>
            <span className="font-medium">{Math.round(stats.total_reading_minutes)}</span> min reading
          </div>
          <div>
            <span className="font-medium">{Math.round(stats.total_listening_minutes)}</span> min listening
          </div>
        </div>
      )}

      <div data-testid="library-filter" className="flex gap-2">
        <span data-testid="library-recommended" className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
          Recommended
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-stone-400 text-center py-4">No items available yet.</p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              data-testid={`library-item-${item.id}`}
              onClick={() => onSelectItem?.(item.id)}
              className="w-full text-left rounded-xl bg-white border border-stone-200 p-4 hover:border-orange-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-stone-700">{item.title}</p>
                  <p className="text-xs text-stone-400 mt-1">{item.item_type} · Level {item.difficulty_level}</p>
                </div>
                <span className="text-xs bg-stone-100 text-stone-500 rounded px-2 py-0.5">
                  Lv.{item.difficulty_level}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
