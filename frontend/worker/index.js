self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const isActionable = data.data?.type === "review_reminder";
  event.waitUntil(
    self.registration.showNotification(data.title ?? "ことば", {
      body: data.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: data.data ?? {},
      actions: isActionable
        ? [
            { action: "start_review", title: "Review now" },
            { action: "dismiss", title: "Later" },
          ]
        : [],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { type } = event.notification.data ?? {};

  if (event.action === "start_review" || type === "review_reminder") {
    event.waitUntil(clients.openWindow("/review"));
  } else {
    event.waitUntil(clients.openWindow("/dashboard"));
  }
});
