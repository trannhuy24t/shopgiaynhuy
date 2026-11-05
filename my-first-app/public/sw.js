// Service Worker cho TroHub Web Push Notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Nhận tín hiệu đẩy từ server
self.addEventListener('push', function (event) {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: 'Thông báo từ TroHub',
      body: event.data.text(),
    };
  }

  const title = data.title || '🔔 TroHub - Quản lý phòng trọ';
  const targetUrl = data.url || (data.data && data.data.url) || '/thong-bao';

  const options = {
    body: data.body || '',
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || 'trohub-push-' + Date.now(),
    renotify: true,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: targetUrl,
      timestamp: data.timestamp || Date.now(),
    },
    actions: [
      {
        action: 'open_url',
        title: '👉 Xem chi tiết',
      },
      {
        action: 'close',
        title: 'Đóng',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Xử lý khi người dùng bấm vào thông báo đẩy trên máy tính/điện thoại
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/thong-bao';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // Nếu đã có tab TroHub mở thì focus vào và navigate
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Nếu chưa mở thì mở tab mới
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

