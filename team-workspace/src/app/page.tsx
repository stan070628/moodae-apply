"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import { INITIAL_WBS } from "@/lib/data";
import type { WBSItem } from "@/lib/types";

function loadState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export default function DashboardPage() {
    const [items, setItems] = useState<WBSItem[]>(INITIAL_WBS);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setItems(loadState("indig-items", INITIAL_WBS));
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="font-brand bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">IN-DIG</span>
                        대시보드
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1">인디 공연 플랫폼 사업계획서 진행 현황</p>
                </div>
                <Dashboard items={items} />
            </main>
        </div>
    );
}
