"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";
import type { WBSItem } from "@/lib/types";

export default function DashboardPage() {
    const [items, setItems] = useState<WBSItem[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "wbs"), (snap) => {
            const data = snap.docs.map((d) => d.data() as WBSItem);
            setItems(data.sort((a, b) => a.id - b.id));
            setReady(true);
        });
        return () => unsub();
    }, []);

    if (!ready) return null;

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="font-brand bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">IN-DIG</span>
                        대시보드
                    </h1>
                    <p className="text-[14px] text-zinc-500 mt-1">인디 공연 플랫폼 사업계획서 진행 현황</p>
                </div>
                <Dashboard items={items} />
            </main>
        </div>
    );
}
