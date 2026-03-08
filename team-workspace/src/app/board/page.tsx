"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import WBSBoard from "@/components/WBSBoard";
import ChatPanel from "@/components/ChatPanel";
import ChatPage from "@/components/ChatPage";
import { INITIAL_WBS } from "@/lib/data";
import type { WBSItem, ChatMessage, Minutes, Status } from "@/lib/types";

function loadState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

export default function BoardPage() {
    const [items, setItems] = useState<WBSItem[]>(() => loadState("indig-items", INITIAL_WBS));
    const [chatMap, setChatMap] = useState<Record<number, ChatMessage[]>>(() => loadState("indig-chatMap", {}));
    const [minutes, setMinutes] = useState<Minutes[]>(() => loadState("indig-minutes", []));
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [nextMsgId, setNextMsgId] = useState(() => loadState("indig-nextMsgId", 1));
    const [nextMinutesId, setNextMinutesId] = useState(() => loadState("indig-nextMinutesId", 1));
    const [isMobile, setIsMobile] = useState(false);
    const [generatingMinutes, setGeneratingMinutes] = useState(false);

    // Persist to localStorage
    useEffect(() => { localStorage.setItem("indig-items", JSON.stringify(items)); }, [items]);
    useEffect(() => { localStorage.setItem("indig-chatMap", JSON.stringify(chatMap)); }, [chatMap]);
    useEffect(() => { localStorage.setItem("indig-minutes", JSON.stringify(minutes)); }, [minutes]);
    useEffect(() => { localStorage.setItem("indig-nextMsgId", JSON.stringify(nextMsgId)); }, [nextMsgId]);
    useEffect(() => { localStorage.setItem("indig-nextMinutesId", JSON.stringify(nextMinutesId)); }, [nextMinutesId]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const selectedItem = items.find((i) => i.id === selectedItemId) || null;
    const selectedMessages = selectedItemId ? (chatMap[selectedItemId] || []) : [];

    const handleSendMessage = (text: string, author: string) => {
        if (!selectedItemId) return;
        const msg: ChatMessage = {
            id: nextMsgId,
            author,
            text,
            time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
        };
        setNextMsgId((prev) => prev + 1);
        setChatMap((prev) => ({
            ...prev,
            [selectedItemId]: [...(prev[selectedItemId] || []), msg],
        }));
    };

    const handleGenerateMinutes = async (selectedMsgs: ChatMessage[]) => {
        if (!selectedItem) return;
        setGeneratingMinutes(true);

        try {
            const res = await fetch("/api/minutes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemName: selectedItem.item,
                    messages: selectedMsgs.map((m) => ({ author: m.author, text: m.text })),
                }),
            });

            const data = await res.json();

            if (data.minutes) {
                const newMinutes: Minutes = {
                    id: nextMinutesId,
                    itemId: selectedItem.id,
                    itemName: selectedItem.item,
                    content: data.minutes,
                    createdAt: new Date().toISOString(),
                };
                setNextMinutesId((prev) => prev + 1);
                setMinutes((prev) => [...prev, newMinutes]);

                // Add system message
                const sysMsg: ChatMessage = {
                    id: nextMsgId,
                    author: "시스템",
                    text: `회의록이 생성되었습니다. (${selectedMsgs.length}개 메시지 기반)`,
                    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
                    isSystem: true,
                };
                setNextMsgId((prev) => prev + 1);
                setChatMap((prev) => ({
                    ...prev,
                    [selectedItem.id]: [...(prev[selectedItem.id] || []), sysMsg],
                }));
            } else {
                alert(data.error || "회의록 생성 실패");
            }
        } catch {
            alert("API 호출 실패. ANTHROPIC_API_KEY를 확인해주세요.");
        } finally {
            setGeneratingMinutes(false);
        }
    };

    const handleUpdateItem = (updates: Partial<WBSItem>) => {
        if (!selectedItemId) return;
        setItems((prev) =>
            prev.map((i) => (i.id === selectedItemId ? { ...i, ...updates } : i))
        );
    };

    // Store minutes in a way accessible by Dashboard (via shared state)
    // For now, minutes state lives in the board page

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />

            <div className="flex-1 flex overflow-hidden">
                {/* WBS Board */}
                <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${selectedItem && !isMobile ? "max-w-[52%]" : ""}`}>
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-4">
                            <h1 className="text-xl font-bold text-white">📋 WBS 보드</h1>
                            <p className="text-xs text-zinc-500 mt-0.5">항목을 클릭하면 채팅 채널이 열립니다</p>
                        </div>
                        <WBSBoard
                            items={items}
                            setItems={setItems}
                            chatMap={chatMap}
                            setChatMap={setChatMap}
                            selectedItemId={selectedItemId}
                            setSelectedItemId={setSelectedItemId}
                            nextMsgId={nextMsgId}
                            setNextMsgId={setNextMsgId}
                        />
                    </div>
                </div>

                {/* Chat Panel (PC) */}
                {selectedItem && !isMobile && (
                    <div className="w-[48%] border-l border-[var(--color-border)] flex-shrink-0">
                        <ChatPanel
                            item={selectedItem}
                            messages={selectedMessages}
                            minutes={minutes}
                            onSendMessage={handleSendMessage}
                            onGenerateMinutes={handleGenerateMinutes}
                            onClose={() => setSelectedItemId(null)}
                            generatingMinutes={generatingMinutes}
                        />
                    </div>
                )}
            </div>

            {/* Chat Page (Mobile) */}
            {selectedItem && isMobile && (
                <ChatPage
                    item={selectedItem}
                    messages={selectedMessages}
                    minutes={minutes}
                    onSendMessage={handleSendMessage}
                    onGenerateMinutes={handleGenerateMinutes}
                    onBack={() => setSelectedItemId(null)}
                    onUpdateItem={handleUpdateItem}
                    generatingMinutes={generatingMinutes}
                />
            )}
        </div>
    );
}
