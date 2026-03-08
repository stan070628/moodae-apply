"use client";

import { useState } from "react";
import type { Status } from "@/lib/types";
import { TEAM, CATEGORIES } from "@/lib/data";

interface AddItemModalProps {
    onAdd: (item: { cat: string; item: string; summary: string; assignee: string; due: string; status: Status }) => void;
    onCancel: () => void;
}

export default function AddItemModal({ onAdd, onCancel }: AddItemModalProps) {
    const [cat, setCat] = useState(CATEGORIES[0]);
    const [name, setName] = useState("");
    const [summary, setSummary] = useState("");
    const [assignee, setAssignee] = useState("");
    const [due, setDue] = useState("");

    const handleSubmit = () => {
        if (!name.trim() || !due) return;
        onAdd({
            cat,
            item: name.trim(),
            summary: summary.trim(),
            assignee,
            due,
            status: "unconfirmed",
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop" onClick={onCancel}>
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-4">➕ 항목 추가</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">카테고리</label>
                        <select
                            value={cat}
                            onChange={(e) => setCat(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[var(--color-brand)]"
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                            항목명 <span className="text-red-400">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="항목명을 입력하세요"
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)]"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">내용 요약</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="간단한 요약..."
                            rows={2}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)] resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">담당자</label>
                            <select
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[var(--color-brand)]"
                            >
                                <option value="">미배정</option>
                                {TEAM.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1">
                                마감일 <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={due}
                                onChange={(e) => setDue(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[var(--color-brand)]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-5">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim() || !due}
                        className="flex-1 px-4 py-2 text-sm rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        추가
                    </button>
                </div>
            </div>
        </div>
    );
}
