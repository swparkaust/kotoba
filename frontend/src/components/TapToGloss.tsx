"use client";

interface TapToGlossProps {
  word: string;
  definition: string;
  reading?: string;
  onAddSrs?: () => void;
  onClose: () => void;
}

export function TapToGloss({ word, definition, reading, onAddSrs, onClose }: TapToGlossProps) {
  return (
    <div data-testid="tap-gloss" className="bg-white rounded-xl shadow-lg p-4 border border-stone-200 min-w-48">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span data-testid="gloss-word" className="text-lg font-medium text-stone-800">{word}</span>
          {reading && (
            <span data-testid="gloss-reading" className="text-sm text-stone-400 ml-2">({reading})</span>
          )}
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl leading-none">&times;</button>
      </div>
      <p data-testid="gloss-definition" className="text-sm text-stone-600 mb-3">{definition}</p>
      {onAddSrs && (
        <button
          data-testid="gloss-add-srs"
          onClick={onAddSrs}
          className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200"
        >
          + Add to reviews
        </button>
      )}
    </div>
  );
}
