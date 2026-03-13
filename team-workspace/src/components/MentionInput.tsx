"use client";

import { useState, useRef } from "react";
import { useApp } from "@/components/AppProvider";

export function extractMentions(text: string, team: string[]): string[] {
    const valid = new Set([...team, "ALL"]);
    // \w는 ASCII만 매칭 — 한글 닉네임 지원을 위해 공백/@ 이외 문자로 변경
    const matches = text.match(/@([^\s@]+)/g) || [];
    return matches.map((m) => m.slice(1)).filter((m) => valid.has(m));
}

interface MentionInputProps {
    nickname: string;
    onSend: (text: string, mentions: string[]) => void;
    enterToSend?: boolean;
}

export default function MentionInput({ nickname, onSend, enterToSend = false }: MentionInputProps) {
    const { team } = useApp();
    const mentionOptions = [...team, "ALL"];
    const [text, setText] = useState("");
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (value: string) => {
        setText(value);
        const lastAt = value.lastIndexOf("@");
        if (lastAt !== -1) {
            const afterAt = value.slice(lastAt + 1);
            if (!afterAt.includes(" ")) {
                setMentionSearch(afterAt.toLowerCase());
                return;
            }
        }
        setMentionSearch(null);
    };

    const selectMention = (mention: string) => {
        const lastAt = text.lastIndexOf("@");
        const newText = text.slice(0, lastAt) + `@${mention} `;
        setText(newText);
        setMentionSearch(null);
        inputRef.current?.focus();
    };

    const handleSend = () => {
        if (!text.trim()) return;
        const mentions = extractMentions(text, team);
        onSend(text.trim(), mentions);
        setText("");
        setMentionSearch(null);
        if (inputRef.current) inputRef.current.style.height = "auto";
    };

    const filtered =
        mentionSearch !== null
            ? mentionOptions.filter((m) => m.toLowerCase().startsWith(mentionSearch))
            : [];

    return (
        <div className="relative flex gap-2 items-end">
            {/* 멘션 팝업 */}
            {filtered.length > 0 && (
                <div className="absolute bottom-full left-10 mb-2 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl shadow-xl overflow-hidden z-50 min-w-[140px]">
                    {filtered.map((m) => (
                        <button
                            key={m}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectMention(m);
                            }}
                            className="w-full text-left px-3 py-2.5 text-[14px] text-zinc-200 hover:bg-[var(--color-brand)]/20 transition-colors flex items-center gap-2"
                        >
                            <span className="text-[var(--color-brand)] font-bold text-[13px]">@</span>
                            {m === "ALL" ? (
                                <span className="text-[#F43F5E] font-semibold">ALL</span>
                            ) : (
                                <span>{m}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <span className="text-[14px] font-semibold text-[var(--color-brand)] bg-[var(--color-brand)]/10 px-2.5 py-2 rounded-lg border border-[var(--color-brand)]/20 flex-shrink-0">
                {nickname}
            </span>
            <textarea
                ref={inputRef}
                value={text}
                rows={1}
                onChange={(e) => {
                    handleChange(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                    if (enterToSend && e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                onBlur={() => setTimeout(() => setMentionSearch(null), 150)}
                placeholder="메시지 입력... (@로 멘션)"
                className="flex-1 min-w-0 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[16px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)] resize-none overflow-hidden"
            />
            <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-[var(--color-brand)] text-white text-[15px] font-medium hover:bg-[var(--color-brand)]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
            >
                전송
            </button>
        </div>
    );
}
