// Firebase Messaging Service Worker
// Firebase compat SDK (서비스 워커는 ES modules 불가, CDN importScripts 사용)
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAS3dFYXivQ_0dsl0Dkz7ZjWAX2eNk2sfI",
    authDomain: "indig-teamwork.firebaseapp.com",
    projectId: "indig-teamwork",
    storageBucket: "indig-teamwork.firebasestorage.app",
    messagingSenderId: "695843332907",
    appId: "1:695843332907:web:86612093575ac377e39b6e",
});

self.addEventListener("push", (event) => {
    try {
        const payload = event.data?.json();
        const badgeStr = payload?.data?.badgeCount;
        if (badgeStr && "setAppBadge" in self.navigator) {
            const count = parseInt(badgeStr, 10);
            if (count > 0) {
                event.waitUntil(self.navigator.setAppBadge(count).catch(() => {}));
            }
        }
    } catch (e) {
        // ignore errors
    }
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    // badge 설정: try-catch 로 완전히 격리 — 실패해도 알림 표시에 영향 없음
    try {
        if ("setAppBadge" in self.navigator) {
            self.navigator.setAppBadge(parseInt(payload.data?.badgeCount || "1", 10)).catch(() => {});
        }
    } catch (_) {}

    const title = payload.data?.title || "IN-DIG Collab";
    const body = payload.data?.body || "";
    self.registration.showNotification(title, {
        body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: payload.data || {},
    });
});

// 알림 클릭 시 해당 URL로 이동 + 뱃지 초기화
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if ("clearAppBadge" in self.navigator) {
        self.navigator.clearAppBadge().catch(() => {});
    }

    const url = event.notification.data?.url || "/board";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
