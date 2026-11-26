// Web Push handler imported by the generated Workbox service worker.
self.addEventListener("push", (event) => {
  let payload = { title: "EduReport Ghana", body: "You have a new school alert.", url: "/duty-roster" };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    const text = event.data ? event.data.text() : "";
    if (text) payload.body = text;
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "edureport-alert",
      data: { url: payload.url || "/duty-roster" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client && targetUrl) client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});