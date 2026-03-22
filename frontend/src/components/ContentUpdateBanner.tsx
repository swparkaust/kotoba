"use client";

interface ContentUpdateBannerProps {
  available: boolean;
  onUpdate: () => void;
}

export function ContentUpdateBanner({ available, onUpdate }: ContentUpdateBannerProps) {
  if (!available) return null;

  return (
    <div data-testid="content-update-banner" className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center justify-between">
      <p className="text-sm text-blue-800">New content is available.</p>
      <button
        data-testid="update-btn"
        onClick={onUpdate}
        className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-500"
      >
        Update
      </button>
    </div>
  );
}
