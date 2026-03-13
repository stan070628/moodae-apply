"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, WBSItem, Minutes, Status } from "@/lib/types";
import { statusLabel, statusColor, dDayLabel, dDayColor, formatDateTime } from "@/lib/utils";
import { useApp } from "@/components/AppProvider";
import MentionInput from "@/components/MentionInput";
import PinnedMemo from "@/components/PinnedMemo";

interface ChatPageProps {
    item: WBSItem;
    messages: ChatMessage[];
    minutes: Minutes[];
    onSendMessage: (text: string, author: string, mentions: string[]) => void;
    onGenerateMinutes: (selectedMessages: ChatMessage[]) => void;
    onEditMessage: (msgId: string, newText: string) => void;
    onDeleteMessages: (msgIds: string[]) => void;
    onBack: () => void;
    onUpdateItem: (updates: Partial<WBSItem>) => void;
    generatingMinutes?: boolean;
}

function parseMention(text: string) {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
        if (part === "@ALL") return <span key={i} className="text-[#F43F5E] font-semibold">{part}</span>;
        if (part.startsWith("@")) return <span key={i} className="text-[#A855F7] font-semibold">{part}</span>;
        return <span key={i}>{part}</span>;
    });
}

export default function ChatPage({
    item,
    messages,
    minutes,
    onSendMessage,
    onGenerateMinutes,
    onEditMessage,
    onDeleteMessages,
    onBack,
    onUpdateItem,
    generatingMinutes = false,
}: ChatPageProps) {
    const { nickname, team } = useApp();
    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const cancelSelect = () => {
        setSelectMode(false);
        setSelected(new Set());
        setEditingMsg(null);
    };

    const handleEditClick = () => {
        const msgId = [...selected][0];
        const msg = messages.find((m) => m.id === msgId);
        if (msg && !msg.isSystem) setEditingMsg({ id: msgId, text: msg.text });
    };

    const handleEditSave = () => {
        if (!editingMsg) return;
        onEditMessage(editingMsg.id, editingMsg.text);
        cancelSelect();
    };

    const handleDeleteClick = () => {
        if (!window.confirm(`${selected.size}개 메시지를 삭제하시겠습니까?`)) return;
        onDeleteMessages([...selected]);
        cancelSelect();
    };

    const itemMinutes = minutes.filter((m) => m.itemId === item.id);
    const selectedNonSystem = [...selected].filter((id) => {
        const msg = messages.find((m) => m.id === id);
        return msg && !msg.isSystem;
    });

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {/* Top bar */}
            <div className="flex-shrink-0 border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors text-lg">←</button>
                    <div>
                        <h3 className="text-[16px] font-bold text-white flex items-center gap-1.5">
                            <span className="text-zinc-500">#</span> {item.item}
                        </h3>
                        <div className="flex items-center gap-2 text-[13px] mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{statusLabel(item.status)}</span>
                            {item.status !== "confirmed" && (
                                <span className={dDayColor(item.due)}>{dDayLabel(item.due)}</span>
                            )}
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className={`text-lg transition-colors ${showInfo ? "text-[var(--color-brand)]" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    ℹ️
                </button>
            </div>

            {/* 고정 메모 */}
            <PinnedMemo itemId={item.id} />

            {/* Info panel (collapsible) */}
            {showInfo && (
                <div className="flex-shrink-0 border-b border-[var(--color-border)] p-4 bg-[var(--color-surface)] animate-fade-in space-y-3">
                    <div>
                        <label className="text-[13px] text-zinc-500 uppercase tracking-wider">상태</label>
                        <select
                            value={item.status}
                            onChange={(e) => onUpdateItem({ status: e.target.value as Status })}
                            className="mt-1 w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[15px] text-zinc-200 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px]"
                        >
                            <option value="confirmed">확정</option>
                            <option value="unconfirmed">미확정</option>
                            <option value="discussion">논의필요</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[13px] text-zinc-500 uppercase tracking-wider">담당자</label>
                            <select
                                value={item.assignee}
                                onChange={(e) => onUpdateItem({ assignee: e.target.value })}
                                className="mt-1 w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[15px] text-zinc-200 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px]"
                            >
                                <option value="">미배정</option>
                                {team.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">마감일</label>
                            <input
                                type="date"
                                value={item.due}
                                onChange={(e) => onUpdateItem({ due: e.target.value })}
                                className="mt-1 w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[15px] text-zinc-200 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px]"
                            />
                        </div>
                    </div>
                    {item.summary && (
                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">요약</label>
                            <p className="mt-1 text-[15px] text-zinc-300">{item.summary}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Minutes preview */}
            {itemMinutes.length > 0 && (
                <div className="flex-shrink-0 border-b border-[var(--color-border)] p-3 max-h-32 overflow-y-auto">
                    <p className="text-[13px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">📝 최근 회의록</p>
                    {itemMinutes
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 1)
                        .map((m) => (
                        <div key={m.id} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-2.5 text-[13px] text-zinc-300 whitespace-pre-wrap">
                            {m.content.substring(0, 150)}{m.content.length > 150 ? "..." : ""}
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center py-16 text-zinc-600 text-[15px]">
                        아직 메시지가 없습니다.
                    </div>
                )}
                {messages.map((msg) => {
                    const isMentioned = !msg.isSystem && (
                        msg.mentions?.includes(nickname) || msg.mentions?.includes("ALL")
                    );
                    return (
                        <div
                            key={msg.id}
                            onClick={() => selectMode && !msg.isSystem && toggleSelect(msg.id)}
                            className={`
                                ${selectMode && !msg.isSystem ? "cursor-pointer" : ""}
                                ${selected.has(msg.id) ? "ring-1 ring-[var(--color-brand)] bg-[var(--color-brand)]/5" : ""}
                                ${isMentioned ? "bg-[#A855F7]/5 rounded-lg" : ""}
                                rounded-lg transition-all
                            `}
                        >
                            {msg.isSystem ? (
                                <div
                                    onClick={() => { if (msg.minutesId) window.location.href = `/minutes?id=${msg.minutesId}`; }}
                                    className={`py-2 px-3 text-[13px] italic border border-dashed rounded-lg text-center transition-colors ${msg.minutesId ? "cursor-pointer text-[var(--color-brand)] border-[var(--color-brand)]/50 bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/20" : "text-zinc-500 border-[var(--color-border)] bg-[var(--color-surface)]/50"}`}
                                >
                                    🔔 {msg.text} {msg.minutesId && <span className="ml-1 opacity-70">↗</span>}
                                </div>
                            ) : (
                                <div className="flex gap-2.5">
                                    {selectMode && (
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={`w-4 h-4 rounded border ${selected.has(msg.id) ? "bg-[var(--color-brand)] border-[var(--color-brand)]" : "border-zinc-600"} flex items-center justify-center`}>
                                                {selected.has(msg.id) && <span className="text-white text-[10px]">✓</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-0.5">
                                            <span className="text-[15px] font-semibold text-zinc-200">{msg.author}</span>
                                            <span className="text-[13px] text-zinc-500">
                                                {msg.createdAt?.seconds
                                                    ? formatDateTime(new Date(msg.createdAt.seconds * 1000))
                                                    : msg.time || ""}
                                            </span>
                                            {msg.edited && <span className="text-[11px] text-zinc-600 italic">수정됨</span>}
                                            {isMentioned && <span className="text-[11px] text-[#A855F7] font-medium">멘션됨</span>}
                                        </div>
                                        <p className="text-[15px] text-zinc-300 break-words">{parseMention(msg.text)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Select mode toolbar */}
            {selectMode && (
                <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3 bg-[var(--color-brand)]/5">
                    {editingMsg ? (
                        /* 편집 모드 */
                        <div className="space-y-2">
                            <textarea
                                value={editingMsg.text}
                                onChange={(e) => setEditingMsg({ ...editingMsg, text: e.target.value })}
                                rows={2}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-brand)]/50 rounded-lg px-3 py-2 text-[14px] text-zinc-200 focus:outline-none focus:border-[var(--color-brand)] resize-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setEditingMsg(null)}
                                    className="px-3 py-2 text-[14px] rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px]"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={handleEditSave}
                                    className="px-3 py-2 text-[14px] rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/30 transition-colors min-h-[44px]"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* 선택 모드 툴바 */
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] text-zinc-400">{selectedNonSystem.length}개 선택됨</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={cancelSelect}
                                    className="px-3 py-2 text-[14px] rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 transition-colors min-h-[44px]"
                                >
                                    취소
                                </button>
                                {selectedNonSystem.length === 1 && (
                                    <button
                                        onClick={handleEditClick}
                                        className="px-3 py-2 text-[14px] rounded-lg bg-zinc-700/50 text-zinc-300 border border-zinc-600/50 hover:bg-zinc-700 transition-colors min-h-[44px]"
                                    >
                                        편집
                                    </button>
                                )}
                                {selectedNonSystem.length >= 1 && (
                                    <button
                                        onClick={handleDeleteClick}
                                        className="px-3 py-2 text-[14px] rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors min-h-[44px]"
                                    >
                                        삭제
                                    </button>
                                )}
                                {selectedNonSystem.length >= 2 && (
                                    <button
                                        onClick={() => {
                                            const selMsgs = messages.filter((m) => selected.has(m.id));
                                            onGenerateMinutes(selMsgs);
                                            cancelSelect();
                                        }}
                                        disabled={generatingMinutes}
                                        className="px-3 py-2 text-[14px] rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                                    >
                                        {generatingMinutes ? "생성 중..." : "회의록 생성"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Input */}
            {!selectMode && (
                <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3 pb-safe relative z-50">
                    <button
                        onClick={() => setSelectMode(true)}
                        className="mb-2 text-[14px] text-zinc-500 hover:text-[var(--color-brand)] transition-colors"
                    >
                        📝 구간 선택
                    </button>
                    <MentionInput
                        nickname={nickname}
                        onSend={(text, mentions) => onSendMessage(text, nickname, mentions)}
                    />
                </div>
            )}
        </div>
    );
}
