"use client";

import type { WBSItem } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import { daysLeft, dDayLabel, dDayColor, statusLabel, statusColor } from "@/lib/utils";
import Link from "next/link";

interface DashboardProps {
    items: WBSItem[];
}

export default function Dashboard({ items }: DashboardProps) {
    const confirmed = items.filter((i) => i.status === "confirmed").length;
    const unconfirmed = items.filter((i) => i.status === "unconfirmed").length;
    const discussion = items.filter((i) => i.status === "discussion").length;
    const urgent = items.filter((i) => i.status !== "confirmed" && daysLeft(i.due) <= 5);
    const unassigned = items.filter((i) => !i.assignee);

    const stats = [
        { label: "전체 항목", value: items.length, color: "text-white", bg: "bg-white/5 border-white/10" },
        { label: "확정", value: confirmed, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        { label: "미확정", value: unconfirmed, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
        { label: "논의필요", value: discussion, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    ];

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s, i) => (
                    <div
                        key={s.label}
                        className={`${s.bg} border rounded-xl p-4 animate-fade-in`}
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Urgent */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">🚨 긴급 마감</h3>
                        <span className="text-[10px] text-zinc-500">D-5 이내 미확정</span>
                    </div>
                    {urgent.length === 0 ? (
                        <p className="text-sm text-zinc-600 text-center py-6">긴급 항목 없음 ✨</p>
                    ) : (
                        <div className="space-y-2">
                            {urgent.sort((a, b) => daysLeft(a.due) - daysLeft(b.due)).map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-[var(--color-background)] rounded-lg px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm text-zinc-200 truncate">{item.item}</p>
                                        <p className="text-[10px] text-zinc-500">{item.cat}</p>
                                    </div>
                                    <span className={`text-xs font-bold ${dDayColor(item.due)} flex-shrink-0 ml-2`}>
                                        {dDayLabel(item.due)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category progress */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 animate-slide-up" style={{ animationDelay: "0.15s" }}>
                    <h3 className="text-sm font-bold text-white mb-3">📊 카테고리별 진행률</h3>
                    <div className="space-y-3">
                        {CATEGORIES.map((cat) => {
                            const catItems = items.filter((i) => i.cat === cat);
                            const catConfirmed = catItems.filter((i) => i.status === "confirmed").length;
                            const pct = catItems.length > 0 ? Math.round((catConfirmed / catItems.length) * 100) : 0;
                            return (
                                <div key={cat}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-zinc-400 truncate">{cat}</span>
                                        <span className="text-xs text-zinc-500 flex-shrink-0 ml-2">{catConfirmed}/{catItems.length}</span>
                                    </div>
                                    <div className="h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] transition-all duration-700"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Unassigned */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-white">👤 미배정 항목</h3>
                        {unassigned.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                {unassigned.length}건
                            </span>
                        )}
                    </div>
                    {unassigned.length === 0 ? (
                        <p className="text-sm text-zinc-600 text-center py-6">모두 배정 완료 👍</p>
                    ) : (
                        <div className="space-y-2">
                            {unassigned.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-[var(--color-background)] rounded-lg px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="text-sm text-zinc-200 truncate">{item.item}</p>
                                        <p className="text-[10px] text-zinc-500">{item.cat}</p>
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex-shrink-0 ml-2 ${statusColor(item.status)}`}>
                                        {statusLabel(item.status)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick link */}
            <div className="text-center">
                <Link
                    href="/board"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20 hover:bg-[var(--color-brand)]/20 transition-colors text-sm font-medium"
                >
                    📋 WBS 보드로 이동 →
                </Link>
            </div>
        </div>
    );
}
