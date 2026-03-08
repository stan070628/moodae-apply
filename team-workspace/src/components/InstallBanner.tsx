"use client";

import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        if (localStorage.getItem("indig-install-dismissed")) return;

        // Check if already installed (standalone mode)
        if (window.matchMedia("(display-mode: standalone)").matches) return;

        // iOS detection
        const ua = navigator.userAgent;
        const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (isiOS && !(navigator as any).standalone) {
            setIsIOS(true);
            setShowBanner(true);
            return;
        }

        // Android / Chrome
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setShowBanner(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("indig-install-dismissed", "true");
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-slide-up">
            <div className="max-w-lg mx-auto bg-[var(--color-surface)] border border-[var(--color-brand)]/30 rounded-2xl p-4 shadow-2xl shadow-[var(--color-brand)]/10 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">📲</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">홈 화면에 추가</p>
                        {isIOS ? (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Safari 하단의 <span className="text-white font-semibold">공유(⬆)</span> → <span className="text-white font-semibold">&quot;홈 화면에 추가&quot;</span>를 탭하세요
                            </p>
                        ) : (
                            <p className="text-xs text-zinc-400 mt-0.5">
                                앱처럼 빠르게 접근할 수 있어요
                            </p>
                        )}
                    </div>
                    <button onClick={handleDismiss} className="text-zinc-600 hover:text-zinc-400 text-lg flex-shrink-0">✕</button>
                </div>
                {!isIOS && (
                    <button
                        onClick={handleInstall}
                        className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 transition-opacity"
                    >
                        설치하기
                    </button>
                )}
            </div>
        </div>
    );
}
