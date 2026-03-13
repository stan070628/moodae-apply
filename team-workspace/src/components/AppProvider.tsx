"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NicknameModal from "@/components/modals/NicknameModal";
import InstallBanner from "@/components/InstallBanner";
import { useFCM } from "@/lib/useFCM";

interface AppContextType {
    nickname: string;
    setNickname: (name: string) => void;
    team: string[];
    pushEnabled: boolean;
    requestPush: () => Promise<void>;
    disablePush: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
    nickname: "",
    setNickname: () => { },
    team: [],
    pushEnabled: false,
    requestPush: async () => { },
    disablePush: async () => { },
});

export function useApp() {
    return useContext(AppContext);
}

function registerUser(name: string) {
    setDoc(doc(db, "users", name), { name }, { merge: true });
}

export default function AppProvider({ children }: { children: ReactNode }) {
    const [nickname, setNicknameState] = useState<string>("");
    const [team, setTeam] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);
    const { pushEnabled, requestPush, disablePush } = useFCM(nickname);

    useEffect(() => {
        const saved = localStorage.getItem("indig-nickname");
        if (saved) {
            setNicknameState(saved);
            registerUser(saved); // 재방문 시에도 Firestore에 등록 보장
        }
        setMounted(true);
    }, []);

    // 앱 열리거나 포그라운드 전환 시 아이콘 뱃지 초기화
    useEffect(() => {
        const clearBadge = () => {
            if ("clearAppBadge" in navigator) {
                navigator.clearAppBadge().catch(() => {});
            }
        };
        clearBadge();
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") clearBadge();
        });
    }, []);

    // WBS 미읽음 카운트 → 앱 아이콘 뱃지
    useEffect(() => {
        if (!nickname) return;
        const unsub = onSnapshot(collection(db, "wbs"), (snap) => {
            let total = 0;
            snap.docs.forEach((d) => {
                const data = d.data();
                total += (data.chatCounts?.[nickname] || 0);
                total += (data.mentionCounts?.[nickname] || 0);
            });
            if ("setAppBadge" in navigator) {
                if (total > 0) {
                    (navigator as any).setAppBadge(total).catch(() => {});
                } else {
                    (navigator as any).clearAppBadge().catch(() => {});
                }
            }
        });
        return () => unsub();
    }, [nickname]);

    // 팀원 목록 실시간 구독
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "users"), (snap) => {
            const members = snap.docs.map((d) => d.id).sort();
            setTeam(members);
        });
        return () => unsub();
    }, []);

    const setNickname = (name: string) => {
        setNicknameState(name);
        localStorage.setItem("indig-nickname", name);
        registerUser(name);
    };

    if (!mounted) return null;

    return (
        <AppContext.Provider value={{ nickname, setNickname, team, pushEnabled, requestPush, disablePush }}>
            {!nickname && <NicknameModal onSave={setNickname} />}
            {children}
            <InstallBanner />
        </AppContext.Provider>
    );
}
