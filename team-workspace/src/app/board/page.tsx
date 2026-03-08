"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    collection, doc, onSnapshot, setDoc, deleteDoc,
    addDoc, query, orderBy, serverTimestamp, updateDoc, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import WBSBoard from "@/components/WBSBoard";
import ChatPanel from "@/components/ChatPanel";
import ChatPage from "@/components/ChatPage";
import { INITIAL_WBS, TEAM } from "@/lib/data";
import { useApp } from "@/components/AppProvider";
import type { WBSItem, ChatMessage, Minutes, Status } from "@/lib/types";

export default function BoardPage() {
    const { nickname } = useApp();
    const [items, setItems] = useState<WBSItem[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [minutes, setMinutes] = useState<Minutes[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const [generatingMinutes, setGeneratingMinutes] = useState(false);
    const [ready, setReady] = useState(false);
    const initializedRef = useRef(false);

    // WBS 아이템 구독 (실시간)
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "wbs"), (snap) => {
            // 최초 빈 상태면 초기 데이터 삽입
            if (!initializedRef.current && snap.empty) {
                initializedRef.current = true;
                INITIAL_WBS.forEach((item) =>
                    setDoc(doc(db, "wbs", String(item.id)), item)
                );
                return;
            }
            initializedRef.current = true;
            const data = snap.docs.map((d) => d.data() as WBSItem);
            setItems(data.sort((a, b) => a.id - b.id));
            setReady(true);
        });
        return () => unsub();
    }, []);

    // 선택된 항목의 채팅 구독 (실시간)
    useEffect(() => {
        if (!selectedItemId) {
            setMessages([]);
            return;
        }
        const q = query(
            collection(db, "chats", String(selectedItemId), "msgs"),
            orderBy("createdAt", "asc")
        );
        const unsub = onSnapshot(q, (snap) => {
            const msgs: ChatMessage[] = snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<ChatMessage, "id">),
            }));
            setMessages(msgs);
        });
        return () => unsub();
    }, [selectedItemId]);

    // 회의록 구독 (실시간)
    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, "minutes"), orderBy("createdAt", "asc")),
            (snap) => {
                const data: Minutes[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<Minutes, "id">),
                }));
                setMinutes(data);
            }
        );
        return () => unsub();
    }, []);

    // 모바일 감지
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // WBS 아이템 단일 필드 업데이트
    const handleUpdateItem = useCallback((itemId: number, updates: Partial<WBSItem>) => {
        updateDoc(doc(db, "wbs", String(itemId)), updates as Record<string, unknown>);
    }, []);

    // WBS 아이템 추가
    const handleAddItem = useCallback((newItem: { cat: string; item: string; summary: string; assignee: string; due: string; status: Status }) => {
        const id = Math.max(...items.map((i) => i.id), 0) + 1;
        setDoc(doc(db, "wbs", String(id)), { ...newItem, id, history: [] });
    }, [items]);

    // WBS 아이템 삭제
    const handleDeleteItem = useCallback((itemId: number) => {
        deleteDoc(doc(db, "wbs", String(itemId)));
    }, []);

    // 시스템 메시지 (번복 알림 등)
    const handleSystemMessage = useCallback((itemId: number, text: string) => {
        addDoc(collection(db, "chats", String(itemId), "msgs"), {
            author: "시스템",
            text,
            time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
            createdAt: serverTimestamp(),
        });
    }, []);

    // 채팅 메시지 전송 (mentions 포함)
    const handleSendMessage = useCallback((text: string, author: string, mentions: string[]) => {
        if (!selectedItemId) return;
        addDoc(collection(db, "chats", String(selectedItemId), "msgs"), {
            author,
            text,
            mentions,
            time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
            isSystem: false,
            createdAt: serverTimestamp(),
        });
        // 멘션된 유저의 뱃지 카운트 증가
        if (mentions.length > 0) {
            const updateData: Record<string, unknown> = {};
            mentions.forEach((m) => {
                if (m === "ALL") {
                    TEAM.forEach((member) => {
                        if (member !== author) updateData[`mentionCounts.${member}`] = increment(1);
                    });
                } else if (m !== author) {
                    updateData[`mentionCounts.${m}`] = increment(1);
                }
            });
            if (Object.keys(updateData).length > 0) {
                updateDoc(doc(db, "wbs", String(selectedItemId)), updateData);
            }
        }
    }, [selectedItemId]);

    // 회의록 생성
    const handleGenerateMinutes = useCallback(async (selectedMsgs: ChatMessage[]) => {
        const selectedItem = items.find((i) => i.id === selectedItemId);
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
                await addDoc(collection(db, "minutes"), {
                    itemId: selectedItem.id,
                    itemName: selectedItem.item,
                    content: data.minutes,
                    createdAt: new Date().toISOString(),
                });
                await addDoc(collection(db, "chats", String(selectedItem.id), "msgs"), {
                    author: "시스템",
                    text: `회의록이 생성되었습니다. (${selectedMsgs.length}개 메시지 기반)`,
                    time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
                    isSystem: true,
                    createdAt: serverTimestamp(),
                });
            } else {
                alert(data.error || "회의록 생성 실패");
            }
        } catch {
            alert("API 호출 실패. ANTHROPIC_API_KEY를 확인해주세요.");
        } finally {
            setGeneratingMinutes(false);
        }
    }, [items, selectedItemId]);

    const selectedItem = items.find((i) => i.id === selectedItemId) || null;

    if (!ready) return (
        <div className="h-screen flex items-center justify-center bg-[#060608]">
            <div className="w-8 h-8 rounded-full border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] animate-spin" />
        </div>
    );

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
                            onUpdateItem={handleUpdateItem}
                            onAddItem={handleAddItem}
                            onDeleteItem={handleDeleteItem}
                            onSystemMessage={handleSystemMessage}
                            selectedItemId={selectedItemId}
                            setSelectedItemId={(id) => {
                                setSelectedItemId(id);
                                // 채널 진입 시 해당 유저의 멘션 카운트 초기화
                                if (id && nickname) {
                                    updateDoc(doc(db, "wbs", String(id)), {
                                        [`mentionCounts.${nickname}`]: 0,
                                    }).catch(() => {});
                                }
                            }}
                            nickname={nickname}
                        />
                    </div>
                </div>

                {/* Chat Panel (PC) */}
                {selectedItem && !isMobile && (
                    <div className="w-[48%] border-l border-[var(--color-border)] flex-shrink-0">
                        <ChatPanel
                            item={selectedItem}
                            messages={messages}
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
                    messages={messages}
                    minutes={minutes}
                    onSendMessage={handleSendMessage}
                    onGenerateMinutes={handleGenerateMinutes}
                    onBack={() => setSelectedItemId(null)}
                    onUpdateItem={(updates) => handleUpdateItem(selectedItem.id, updates)}
                    generatingMinutes={generatingMinutes}
                />
            )}
        </div>
    );
}
