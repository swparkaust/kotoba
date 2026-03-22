"use client";

interface NotificationSettingsProps {
  enabled: boolean;
  time: string;
  onToggle: (enabled: boolean) => void;
  onTimeChange: (time: string) => void;
}

export function NotificationSettings({ enabled, time, onToggle, onTimeChange }: NotificationSettingsProps) {
  return (
    <div data-testid="notification-settings" className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-stone-700">Daily reminder</span>
        <button
          data-testid="notification-toggle"
          onClick={() => onToggle(!enabled)}
          className={`w-12 h-6 rounded-full transition-colors ${enabled ? "bg-orange-500" : "bg-stone-300"}`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      </div>
      {enabled && (
        <input
          data-testid="notification-time-picker"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="rounded-lg border border-stone-200 px-3 py-2"
        />
      )}
    </div>
  );
}
