"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MinutesArchive from "@/components/MinutesArchive";
import type { Minutes } from "@/lib/types";

function loadState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export default function MinutesPage() {
    const [minutes, setMinutes] = useState<Minutes[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMinutes(loadState("indig-minutes", []));
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">📝 회의록 아카이브</h1>
                    <p className="text-[14px] text-zinc-500 mt-0.5">AI가 생성한 회의록 모아보기</p>
                </div>
                <MinutesArchive minutes={minutes} />
            </main>
        </div>
    );
}
