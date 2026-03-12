"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import MinutesArchive from "@/components/MinutesArchive";
import type { Minutes } from "@/lib/types";

export default function MinutesPage() {
    const [minutes, setMinutes] = useState<Minutes[]>([]);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, "minutes"), orderBy("createdAt", "asc")),
            (snap) => {
                const data: Minutes[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Minutes, "id">),
                }));
                setMinutes(data);
                setReady(true);
            }
        );
        return () => unsub();
    }, []);

    const handleUpdateMinutes = useCallback((id: string, content: string) => {
        updateDoc(doc(db, "minutes", id), { content });
    }, []);

    const handleDeleteMinutes = useCallback((id: string) => {
        deleteDoc(doc(db, "minutes", id));
    }, []);

    if (!ready) return (
        <div className="h-screen flex items-center justify-center bg-[#060608]">
            <div className="w-8 h-8 rounded-full border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">📝 회의록 아카이브</h1>
                    <p className="text-[14px] text-zinc-500 mt-0.5">AI가 생성한 회의록 모아보기</p>
                </div>
                <MinutesArchive
                    minutes={minutes}
                    onUpdate={handleUpdateMinutes}
                    onDelete={handleDeleteMinutes}
                />
            </main>
        </div>
    );
}
