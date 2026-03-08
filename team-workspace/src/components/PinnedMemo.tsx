"use client";

import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useApp } from "@/components/AppProvider";

interface PinnedMemoProps {
    itemId: number;
}

export default function PinnedMemo({ itemId }: PinnedMemoProps) {
    const { nickname } = useApp();
    const [text, setText] = useState("");
    const [localText, setLocalText] = useState("");
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "memos", String(itemId)), (snap) => {
            const data = snap.data();
            setText(data?.text ?? "");
        });
        return () => unsub();
    }, [itemId]);

    const startEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLocalText(text);
        setEditing(true);
        setExpanded(true);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const save = () => {
        setEditing(false);
        if (localText === text) return;
        setDoc(doc(db, "memos", String(itemId)), {
            text: localText,
            updatedAt: new Date().toISOString(),
            updatedBy: nickname,
        });
    };

    const cancel = () => {
        setEditing(false);
        setLocalText(text);
    };

    const preview = text
        ? text.length > 55 ? text.slice(0, 55) + "…" : text
        : "메모 없음";

    return (
        <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60">
            {/* 헤더 행 — 항상 표시 */}
            <div
                className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none"
                onClick={() => !editing && setExpanded((v) => !v)}
            >
                <span className="text-[12px] text-zinc-500">📌</span>
                <span className="flex-1 text-[13px] text-zinc-400 truncate leading-snug">
                    {expanded && text ? text.split("\n")[0] : preview}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!editing && (
                        <button
                            onClick={startEdit}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                        >
                            편집
                        </button>
                    )}
                    <span
                        className={`text-zinc-600 text-[11px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    >
                        ▾
                    </span>
                </div>
            </div>

            {/* 펼쳐진 영역 */}
            {expanded && (
                <div className="px-4 pb-3">
                    {editing ? (
                        <>
                            <textarea
                                ref={textareaRef}
                                value={localText}
                                onChange={(e) => setLocalText(e.target.value)}
                                rows={4}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-brand)]/50 rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)] resize-none leading-relaxed"
                                placeholder="의논 내용을 정리해두세요..."
                            />
                            <div className="flex justify-end gap-2 mt-1.5">
                                <button
                                    onClick={cancel}
                                    className="text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={save}
                                    className="text-[12px] text-[var(--color-brand)] px-2 py-1 rounded bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/20 transition-colors"
                                >
                                    저장
                                </button>
                            </div>
                        </>
                    ) : (
                        <p
                            onClick={startEdit}
                            className="text-[13px] text-zinc-300 whitespace-pre-wrap cursor-text leading-relaxed"
                        >
                            {text || <span className="text-zinc-600 italic">편집을 눌러 메모를 추가하세요.</span>}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
