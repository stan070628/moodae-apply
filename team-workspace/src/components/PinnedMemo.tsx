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
    const [hasError, setHasError] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setHasError(false);
        const unsub = onSnapshot(
            doc(db, "memos", String(itemId)),
            (snap) => {
                const data = snap.data();
                setText(data?.text ?? "");
            },
            () => {
                setHasError(true);
            }
        );
        return () => unsub();
    }, [itemId]);

    const startEdit = () => {
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

    const toggle = () => {
        if (editing) return;
        setExpanded((v) => !v);
    };

    const preview = text
        ? text.length > 55 ? text.slice(0, 55) + "…" : text
        : "메모 없음";

    if (hasError) {
        return (
            <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-amber-500/5 px-4 py-2">
                <span className="text-[12px] text-amber-400">📌 메모를 불러올 수 없습니다 (권한 확인 필요)</span>
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {/* 헤더 행 — 항상 표시 */}
            <div
                className="flex items-center gap-2 px-4 py-2 cursor-pointer select-none hover:bg-white/5 transition-colors"
                onClick={toggle}
            >
                <span className="text-[12px]">📌</span>
                <span className="flex-1 text-[13px] text-zinc-400 truncate leading-snug">
                    {!expanded ? preview : (text ? text.split("\n")[0] : "메모 없음")}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!editing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); startEdit(); }}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                        >
                            편집
                        </button>
                    )}
                    <span className={`text-zinc-500 text-[11px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
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
                                rows={6}
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
                        <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--color-background)]/50 px-3 py-2">
                            <p className="text-[13px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                {text ? text : <span className="text-zinc-600 italic">편집을 눌러 메모를 추가하세요.</span>}
                            </p>
                        </div>
                    )}

                    {/* 접기/편집 버튼 바 */}
                    {!editing && (
                        <div className="flex justify-between items-center mt-2">
                            <button
                                onClick={toggle}
                                className="text-[12px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                            >
                                접기 ▲
                            </button>
                            <button
                                onClick={startEdit}
                                className="text-[12px] text-[var(--color-brand)] px-2 py-1 rounded bg-[var(--color-brand)]/10 hover:bg-[var(--color-brand)]/20 transition-colors"
                            >
                                편집
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
