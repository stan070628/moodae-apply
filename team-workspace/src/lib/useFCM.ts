"use client";

import { useState, useEffect, useCallback } from "react";
import { getToken, deleteToken } from "firebase/messaging";
import { doc, setDoc, updateDoc, deleteField } from "firebase/firestore";
import { db, getFirebaseMessaging } from "./firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
const STORAGE_KEY = "indig-push";

export function useFCM(nickname: string) {
    const [pushEnabled, setPushEnabled] = useState(false);

    const registerToken = useCallback(async (): Promise<boolean> => {
        if (!nickname || !VAPID_KEY) return false;
        try {
            const messaging = getFirebaseMessaging();
            if (!messaging) return false;
            const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
            if (!token) return false;
            await setDoc(doc(db, "users", nickname), { fcmToken: token }, { merge: true });
            setPushEnabled(true);
            localStorage.setItem(STORAGE_KEY, "1");
            return true;
        } catch (err) {
            console.error("[FCM] registerToken failed:", err);
            return false;
        }
    }, [nickname]);

    // 알림 권한 요청 후 토큰 등록
    const requestPush = useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            alert("이 브라우저는 알림을 지원하지 않습니다.\niOS는 홈 화면에 추가한 앱에서만 알림이 지원됩니다.");
            return;
        }
        if (Notification.permission === "denied") {
            alert("알림 권한이 차단되어 있습니다.\n\niOS: 설정 → 앱 이름 → 알림 → 허용\nAndroid: 설정 → 앱 → 알림 허용");
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            alert("알림 권한이 거부되었습니다.");
            return;
        }
        const ok = await registerToken();
        if (!ok) {
            alert("알림 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
    }, [registerToken]);

    // 알림 비활성화 — 토큰 삭제
    const disablePush = useCallback(async () => {
        if (!nickname) return;
        try {
            const messaging = getFirebaseMessaging();
            if (messaging) await deleteToken(messaging);
        } catch { /* ignore */ }
        try {
            await updateDoc(doc(db, "users", nickname), { fcmToken: deleteField() });
        } catch { /* ignore */ }
        setPushEnabled(false);
        localStorage.removeItem(STORAGE_KEY);
    }, [nickname]);

    // 앱 시작 시 이전에 허용했으면 자동 재등록
    useEffect(() => {
        if (!nickname) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission !== "granted") {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        registerToken();
    }, [nickname, registerToken]);

    return { pushEnabled, requestPush, disablePush };
}
