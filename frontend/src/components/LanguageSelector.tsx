"use client";

interface LanguageSelectorProps {
  languages: Array<{ code: string; name: string; native_name: string }>;
  activeCode: string;
  onSelect: (code: string) => void;
}

export function LanguageSelector({ languages, activeCode, onSelect }: LanguageSelectorProps) {
  return (
    <div data-testid="language-selector" className="space-y-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          data-testid={`language-option-${lang.code}`}
          onClick={() => onSelect(lang.code)}
          className={`w-full text-left rounded-xl p-3 border ${
            lang.code === activeCode ? "border-orange-300 bg-orange-50" : "border-stone-200"
          }`}
        >
          {lang.code === activeCode && <span data-testid="language-active" className="sr-only">active</span>}
          <span className="font-medium">{lang.native_name}</span>
          <span className="text-stone-400 ml-2 text-sm">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
