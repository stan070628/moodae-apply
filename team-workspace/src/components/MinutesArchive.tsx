"use client";

import { useState } from "react";
import type { Minutes } from "@/lib/types";

interface MinutesArchiveProps {
    minutes: Minutes[];
    onUpdate: (id: string, content: string) => void;
    onDelete: (id: string) => void;
}

export default function MinutesArchive({ minutes, onUpdate, onDelete }: MinutesArchiveProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const startEdit = (m: Minutes) => {
        setEditingId(m.id);
        setEditContent(m.content);
    };

    const saveEdit = () => {
        if (!editingId || !editContent.trim()) return;
        onUpdate(editingId, editContent.trim());
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    const confirmDelete = (id: string) => setDeleteConfirmId(id);

    const doDelete = () => {
        if (!deleteConfirmId) return;
        onDelete(deleteConfirmId);
        setDeleteConfirmId(null);
    };

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
        <>
            <div className="space-y-6">
                {Object.entries(grouped).sort(([, aList], [, bList]) => {
                    const aMax = Math.max(...aList.map(m => new Date(m.createdAt).getTime()));
                    const bMax = Math.max(...bList.map(m => new Date(m.createdAt).getTime()));
                    return bMax - aMax;
                }).map(([itemName, mList]) => (
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
                                    className="group bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4"
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
                                        {editingId !== m.id && (
                                            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(m)}
                                                    className="text-[13px] px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                                                >
                                                    ✏️ 수정
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(m.id)}
                                                    className="text-[13px] px-2.5 py-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    🗑️ 삭제
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {editingId === m.id ? (
                                        <div>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-[var(--color-background)] border border-[var(--color-brand)]/40 rounded-lg px-3 py-2.5 text-[15px] text-zinc-300 leading-relaxed focus:outline-none focus:border-[var(--color-brand)] resize-none"
                                                rows={Math.max(6, editContent.split("\n").length + 2)}
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={saveEdit}
                                                    className="px-4 py-1.5 text-[13px] rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/25 transition-colors font-medium"
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="px-4 py-1.5 text-[13px] rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-[15px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                            {m.content}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 삭제 확인 모달 */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-[17px] font-bold text-white mb-2">회의록 삭제</h3>
                        <p className="text-[14px] text-zinc-400 mb-6">이 회의록을 삭제하면 복구할 수 없습니다. 계속하시겠습니까?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-xl text-[14px] text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={doDelete}
                                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-white bg-red-500/80 hover:bg-red-500 transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
