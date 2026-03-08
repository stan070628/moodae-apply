"use client";

import type { Minutes } from "@/lib/types";

interface MinutesArchiveProps {
    minutes: Minutes[];
}

export default function MinutesArchive({ minutes }: MinutesArchiveProps) {
    if (minutes.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-zinc-500 text-[15px]">아직 생성된 회의록이 없습니다.</p>
                <p className="text-zinc-600 text-[13px] mt-1">WBS 보드의 채팅에서 구간 선택 후 회의록을 생성해보세요.</p>
            </div>
        );
    }

    // Group by item name
    const grouped = minutes.reduce<Record<string, Minutes[]>>((acc, m) => {
        if (!acc[m.itemName]) acc[m.itemName] = [];
        acc[m.itemName].push(m);
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([itemName, mList]) => (
                <div key={itemName} className="animate-fade-in">
                    <h3 className="text-[16px] font-bold text-white flex items-center gap-2 mb-3">
                        <span className="text-zinc-500">#</span> {itemName}
                        <span className="text-[13px] px-2 py-0.5 rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)] border border-[var(--color-brand)]/20">
                            {mList.length}건
                        </span>
                    </h3>
                    <div className="space-y-3">
                        {mList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((m) => (
                            <div
                                key={m.id}
                                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[13px] text-zinc-500">
                                        {new Date(m.createdAt).toLocaleDateString("ko-KR", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                                <div className="text-[15px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                    {m.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
