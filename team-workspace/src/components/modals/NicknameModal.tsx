"use client";

import { useState } from "react";

interface NicknameModalProps {
    onSave: (nickname: string) => void;
}

export default function NicknameModal({ onSave }: NicknameModalProps) {
    const [name, setName] = useState("");

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name.trim());
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center modal-backdrop">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-8 w-full max-w-sm mx-4 animate-slide-up text-center">
                <div className="text-4xl mb-3">🎭</div>
                <h2 className="text-lg font-bold text-white mb-1 font-brand">IN-DIG Collab</h2>
                <p className="text-xs text-zinc-500 mb-6">닉네임을 입력하면 팀 워크스페이스에 입장합니다</p>

                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSave()}
                    placeholder="닉네임 입력..."
                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)] text-center"
                    autoFocus
                />

                <button
                    onClick={handleSave}
                    disabled={!name.trim()}
                    className="w-full mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                    입장하기
                </button>
            </div>
        </div>
    );
}
