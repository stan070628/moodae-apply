"use client";

import { useState } from "react";
import type { Status } from "@/lib/types";

interface RevertModalProps {
    itemName: string;
    from: Status;
    to: Status;
    onConfirm: (reason: string, by: string) => void;
    onCancel: () => void;
}

const TEAM = ["Stan", "Jay", "Mia"];

export default function RevertModal({ itemName, from, to, onConfirm, onCancel }: RevertModalProps) {
    const [reason, setReason] = useState("");
    const [by, setBy] = useState(TEAM[0]);

    const statusLabel = (s: Status) => {
        switch (s) {
            case "confirmed": return "확정";
            case "unconfirmed": return "미확정";
            case "discussion": return "논의필요";
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop" onClick={onCancel}>
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 w-full max-w-md mx-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-1">⚠️ 확정 번복</h3>
                <p className="text-sm text-zinc-400 mb-4">
                    <span className="font-semibold text-zinc-200">{itemName}</span>의 상태를{" "}
                    <span className="text-emerald-400">{statusLabel(from)}</span>에서{" "}
                    <span className="text-yellow-400">{statusLabel(to)}</span>(으)로 변경합니다.
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">번복자</label>
                        <select
                            value={by}
                            onChange={(e) => setBy(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[var(--color-brand)]"
                        >
                            {TEAM.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                            번복 사유 <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="번복 사유를 입력해주세요..."
                            rows={3}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[var(--color-brand)] resize-none"
                            autoFocus
                        />
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
                        onClick={() => reason.trim() && onConfirm(reason.trim(), by)}
                        disabled={!reason.trim()}
                        className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        번복 확인
                    </button>
                </div>
            </div>
        </div>
    );
}
