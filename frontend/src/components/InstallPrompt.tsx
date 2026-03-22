"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  if (!isInstallable || isInstalled) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl bg-orange-50 p-4 shadow-lg border border-orange-200"
    >
      <p className="mb-2 text-sm text-orange-800">
        Install ことば for offline lessons and gentle reminders.
      </p>
      <button
        onClick={promptInstall}
        className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-500"
      >
        Install App
      </button>
    </div>
  );
}
