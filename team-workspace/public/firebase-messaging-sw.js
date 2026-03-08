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

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    if (!title) return;
    self.registration.showNotification(title, {
        body: body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: payload.data || {},
    });
});

// 알림 클릭 시 해당 URL로 이동
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
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
