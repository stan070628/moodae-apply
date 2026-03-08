"use client";

import type { RevertHistory } from "@/lib/types";
import { statusLabel } from "@/lib/utils";

interface HistoryModalProps {
    itemName: string;
    history: RevertHistory[];
    onClose: () => void;
}

export default function HistoryModal({ itemName, history, onClose }: HistoryModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop" onClick={onClose}>
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 w-full max-w-lg mx-4 animate-slide-up max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-1">🔄 번복 이력</h3>
                <p className="text-sm text-zinc-400 mb-5">{itemName}</p>

                {history.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                        번복 이력이 없습니다.
                    </div>
                ) : (
                    <div className="relative pl-6">
                        {/* Timeline line */}
                        <div className="absolute left-2 top-2 bottom-2 w-px bg-[var(--color-border)]" />

                        <div className="space-y-4">
                            {history.map((h, i) => (
                                <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    {/* Timeline dot */}
                                    <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-brand)] border-2 border-[var(--color-surface)]" />

                                    <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1.5 text-xs text-zinc-500">
                                            <span className="font-medium text-zinc-300">{h.by}</span>
                                            <span>·</span>
                                            <span>{new Date(h.at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs mb-2">
                                            <span className="text-emerald-400">{statusLabel(h.from)}</span>
                                            <span className="text-zinc-500">→</span>
                                            <span className="text-yellow-400">{statusLabel(h.to)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-300">{h.reason}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full mt-5 px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
