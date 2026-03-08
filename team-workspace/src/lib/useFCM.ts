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
        if (typeof window === "undefined" || !("Notification" in window)) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
        await registerToken();
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
