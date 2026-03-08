"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, WBSItem, Minutes } from "@/lib/types";
import { statusLabel, statusColor, dDayLabel, dDayColor } from "@/lib/utils";
import { useApp } from "@/components/AppProvider";

interface ChatPanelProps {
    item: WBSItem;
    messages: ChatMessage[];
    minutes: Minutes[];
    onSendMessage: (text: string, author: string) => void;
    onGenerateMinutes: (selectedMessages: ChatMessage[]) => void;
    onClose: () => void;
    generatingMinutes?: boolean;
}

export default function ChatPanel({
    item,
    messages,
    minutes,
    onSendMessage,
    onGenerateMinutes,
    onClose,
    generatingMinutes = false,
}: ChatPanelProps) {
    const { nickname } = useApp();
    const [text, setText] = useState("");

    const [selectMode, setSelectMode] = useState(false);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSendMessage(text.trim(), nickname);
        setText("");
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const itemMinutes = minutes.filter((m) => m.itemId === item.id);

    return (
        <div className="flex flex-col h-full bg-[var(--color-surface)] animate-slide-in-right">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="text-zinc-500">#</span> {item.item}
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors text-lg">✕</button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full border ${statusColor(item.status)}`}>{statusLabel(item.status)}</span>
                    {item.assignee && <span className="text-zinc-400">{item.assignee}</span>}
                    <span className={dDayColor(item.due)}>{dDayLabel(item.due)}</span>
                </div>
            </div>

            {/* Minutes preview */}
            {itemMinutes.length > 0 && (
                <div className="flex-shrink-0 border-b border-[var(--color-border)] p-3 max-h-40 overflow-y-auto">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">📝 최근 회의록</p>
                    {itemMinutes.slice(-2).map((m) => (
                        <div key={m.id} className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-2.5 mb-1.5 text-xs text-zinc-300 whitespace-pre-wrap">
                            {m.content.substring(0, 200)}{m.content.length > 200 ? "..." : ""}
                        </div>
                    ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center py-12 text-zinc-600 text-sm">
                        아직 메시지가 없습니다.<br />첫 번째 메시지를 보내보세요!
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        onClick={() => selectMode && !msg.isSystem && toggleSelect(msg.id)}
                        className={`
              ${selectMode && !msg.isSystem ? "cursor-pointer" : ""}
              ${selected.has(msg.id) ? "ring-1 ring-[var(--color-brand)] bg-[var(--color-brand)]/5" : ""}
              ${msg.isSystem ? "text-center" : ""}
              rounded-lg transition-all
            `}
                    >
                        {msg.isSystem ? (
                            <div className="py-2 px-3 text-xs text-zinc-500 italic border border-dashed border-[var(--color-border)] rounded-lg bg-[var(--color-background)]/50">
                                🔔 {msg.text}
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
                                        <span className="text-xs font-semibold text-zinc-200">{msg.author}</span>
                                        <span className="text-[10px] text-zinc-600">{msg.time}</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 break-words">{msg.text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Select mode toolbar */}
            {selectMode && (
                <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3 bg-[var(--color-brand)]/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{selected.size}개 선택됨</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    const selMsgs = messages.filter((m) => selected.has(m.id));
                                    onGenerateMinutes(selMsgs);
                                    setSelectMode(false);
                                    setSelected(new Set());
                                }}
                                disabled={selected.size < 2 || generatingMinutes}
                                className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                {generatingMinutes ? "생성 중..." : "회의록 생성"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 border-t border-[var(--color-border)] p-3 relative z-50">
                {!selectMode && (
                    <button
                        onClick={() => setSelectMode(true)}
                        className="mb-2 text-xs text-zinc-500 hover:text-[var(--color-brand)] transition-colors"
                    >
                        📝 구간 선택
                    </button>
                )}
                <div className="flex gap-2 items-center">
                    <span className="text-xs font-semibold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2.5 py-2 rounded-lg border border-[var(--color-brand)]/20 flex-shrink-0">{nickname}</span>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
                        placeholder="메시지 입력..."
                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)]"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="px-3 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}
