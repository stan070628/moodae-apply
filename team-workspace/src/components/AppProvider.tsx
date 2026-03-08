"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import NicknameModal from "@/components/modals/NicknameModal";
import InstallBanner from "@/components/InstallBanner";

interface AppContextType {
    nickname: string;
    setNickname: (name: string) => void;
}

const AppContext = createContext<AppContextType>({ nickname: "", setNickname: () => { } });

export function useApp() {
    return useContext(AppContext);
}

export default function AppProvider({ children }: { children: ReactNode }) {
    const [nickname, setNicknameState] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("indig-nickname");
        if (saved) setNicknameState(saved);
        setMounted(true);
    }, []);

    const setNickname = (name: string) => {
        setNicknameState(name);
        localStorage.setItem("indig-nickname", name);
    };

    if (!mounted) return null;

    return (
        <AppContext.Provider value={{ nickname, setNickname }}>
            {!nickname && <NicknameModal onSave={setNickname} />}
            {children}
            <InstallBanner />
        </AppContext.Provider>
    );
}
