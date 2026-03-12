"use client";

import { useState } from "react";
import type { WBSItem, Status } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import { useApp } from "@/components/AppProvider";
import { dDayLabel, dDayColor, statusColor } from "@/lib/utils";
import RevertModal from "@/components/modals/RevertModal";
import HistoryModal from "@/components/modals/HistoryModal";
import AddItemModal from "@/components/modals/AddItemModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";
import EditItemModal from "@/components/modals/EditItemModal";

interface WBSBoardProps {
    items: WBSItem[];
    onUpdateItem: (itemId: number, updates: Partial<WBSItem>) => void;
    onAddItem: (item: { cat: string; item: string; summary: string; assignee: string; due: string; status: Status }) => void;
    onDeleteItem: (itemId: number) => void;
    onSystemMessage: (itemId: number, text: string) => void;
    selectedItemId: number | null;
    setSelectedItemId: (id: number | null) => void;
    nickname: string;
}

export default function WBSBoard({
    items,
    onUpdateItem,
    onAddItem,
    onDeleteItem,
    onSystemMessage,
    selectedItemId,
    setSelectedItemId,
    nickname,
}: WBSBoardProps) {
    const { team } = useApp();
    const [filterCat, setFilterCat] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [revertPending, setRevertPending] = useState<{ itemId: number; to: Status } | null>(null);
    const [historyItemId, setHistoryItemId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [editCatValue, setEditCatValue] = useState("");

    const filtered = items.filter((i) => {
        if (filterCat !== "all" && i.cat !== filterCat) return false;
        if (filterStatus !== "all" && i.status !== filterStatus) return false;
        return true;
    });

    const STATUS_ORDER: Record<string, number> = { confirmed: 0, discussion: 1, unconfirmed: 2 };

    const grouped = CATEGORIES.reduce<Record<string, WBSItem[]>>((acc, cat) => {
        const catItems = filtered
            .filter((i) => i.cat === cat)
            .sort((a, b) => {
                const aUnread = (a.chatCounts?.[nickname] || 0) + (a.mentionCounts?.[nickname] || 0);
                const bUnread = (b.chatCounts?.[nickname] || 0) + (b.mentionCounts?.[nickname] || 0);
                if (aUnread > 0 && bUnread === 0) return -1;
                if (bUnread > 0 && aUnread === 0) return 1;

                const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
                if (statusDiff !== 0) return statusDiff;
                if (!a.due && !b.due) return 0;
                if (!a.due) return 1;
                if (!b.due) return -1;
                return a.due.localeCompare(b.due);
            });
        if (catItems.length > 0) acc[cat] = catItems;
        return acc;
    }, {});

    const handleStatusChange = (itemId: number, newStatus: Status) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        if (item.status === "confirmed" && newStatus !== "confirmed") {
            setRevertPending({ itemId, to: newStatus });
            return;
        }

        onUpdateItem(itemId, { status: newStatus });
    };

    const handleRevertConfirm = (reason: string, by: string) => {
        if (!revertPending) return;
        const item = items.find((i) => i.id === revertPending.itemId);
        if (!item) return;

        const now = new Date().toISOString();
        onUpdateItem(revertPending.itemId, {
            status: revertPending.to,
            history: [
                ...item.history,
                { from: "confirmed" as Status, to: revertPending.to, reason, by, at: now },
            ],
        });

        onSystemMessage(revertPending.itemId, `${by}님이 확정을 번복했습니다: ${reason}`);
        setRevertPending(null);
    };

    const handleAssigneeChange = (itemId: number, assignee: string) => {
        onUpdateItem(itemId, { assignee });
    };

    const handleDueChange = (itemId: number, due: string) => {
        onUpdateItem(itemId, { due });
    };

    const handleAddItem = (newItem: { cat: string; item: string; summary: string; assignee: string; due: string; status: Status }) => {
        onAddItem(newItem);
        setShowAddModal(false);
    };

    const handleEditItemSave = (updates: Partial<WBSItem>) => {
        if (editingItemId === null) return;
        onUpdateItem(editingItemId, updates);
        setEditingItemId(null);
    };

    const handleCatRenameStart = (cat: string) => {
        setEditingCat(cat);
        setEditCatValue(cat);
    };

    const handleCatRenameSave = () => {
        if (!editingCat || !editCatValue.trim() || editCatValue.trim() === editingCat) {
            setEditingCat(null);
            return;
        }
        const newCat = editCatValue.trim();
        items.filter((i) => i.cat === editingCat).forEach((i) => onUpdateItem(i.id, { cat: newCat }));
        setEditingCat(null);
    };

    const handleDeleteItem = () => {
        if (deleteItemId === null) return;
        onDeleteItem(deleteItemId);
        if (selectedItemId === deleteItemId) setSelectedItemId(null);
        setDeleteItemId(null);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <select
                    value={filterCat}
                    onChange={(e) => setFilterCat(e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[14px] text-zinc-300 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px]"
                >
                    <option value="all">전체 카테고리</option>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-[14px] text-zinc-300 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px]"
                >
                    <option value="all">전체 상태</option>
                    <option value="confirmed">확정</option>
                    <option value="unconfirmed">미확정</option>
                    <option value="discussion">논의필요</option>
                </select>

                <div className="flex-1" />

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 text-[14px] rounded-lg bg-[var(--color-brand)]/15 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/25 transition-colors font-medium min-h-[44px]"
                >
                    ➕ 항목 추가
                </button>
            </div>

            {/* Category groups */}
            <div className="space-y-5">
                {Object.entries(grouped).map(([cat, catItems]) => (
                    <div key={cat} className="animate-fade-in">
                        <div className="flex items-center gap-2 mb-2 px-1 group/cat">
                            {editingCat === cat ? (
                                <>
                                    <input
                                        value={editCatValue}
                                        onChange={(e) => setEditCatValue(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") handleCatRenameSave(); if (e.key === "Escape") setEditingCat(null); }}
                                        className="flex-1 bg-[var(--color-background)] border border-[var(--color-brand)]/50 rounded-lg px-2 py-1 text-[13px] font-bold text-zinc-200 focus:outline-none focus:border-[var(--color-brand)]"
                                        autoFocus
                                    />
                                    <button onClick={handleCatRenameSave} className="text-[13px] px-3 py-1.5 min-h-[36px] rounded-lg bg-[var(--color-brand)]/20 text-[var(--color-brand)] border border-[var(--color-brand)]/30 hover:bg-[var(--color-brand)]/30 transition-colors">저장</button>
                                    <button onClick={() => setEditingCat(null)} className="text-[13px] px-3 py-1.5 min-h-[36px] rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">취소</button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider">{cat}</h3>
                                    <button
                                        onClick={() => handleCatRenameStart(cat)}
                                        className="text-zinc-400 hover:text-zinc-200 text-[13px] px-1.5 py-1 min-h-[36px] md:opacity-0 md:group-hover/cat:opacity-100 transition-opacity"
                                        title="카테고리명 수정"
                                    >
                                        ✏️
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            {catItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className={`
                    group bg-[var(--color-surface)] border rounded-xl px-4 py-3 cursor-pointer transition-all duration-200
                    ${selectedItemId === item.id
                                            ? "border-[var(--color-brand)]/50 bg-[var(--color-brand)]/5"
                                            : "border-[var(--color-border)] hover:border-[var(--color-border-light)] hover:bg-[var(--color-surface-hover)]"
                                        }
                  `}
                                >
                                    {/* Mobile layout */}
                                    <div className="md:hidden">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[16px] font-medium text-zinc-200">{item.item}</span>
                                                {(item.chatCounts?.[nickname] ?? 0) > 0 && (
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                                                        {item.chatCounts![nickname]}
                                                    </span>
                                                )}
                                                {(item.mentionCounts?.[nickname] ?? 0) > 0 && (
                                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 font-bold">
                                                        @{item.mentionCounts![nickname]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {item.history.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setHistoryItemId(item.id); }}
                                                        className="text-[13px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                                    >
                                                        🔄 {item.history.length}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); }}
                                                    className="text-zinc-400 hover:text-zinc-200 transition-colors text-[14px] px-1.5 py-1 min-h-[36px] min-w-[36px]"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
                                                    className="text-zinc-500 hover:text-red-400 md:opacity-0 md:group-hover:opacity-100 transition-all text-[14px] px-1.5 py-1 min-h-[36px] min-w-[36px]"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[13px]">
                                            <select
                                                value={item.status}
                                                onChange={(e) => { e.stopPropagation(); handleStatusChange(item.id, e.target.value as Status); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`px-2.5 py-1 rounded-full border text-[13px] font-medium ${statusColor(item.status)} bg-transparent focus:outline-none min-h-[44px]`}
                                            >
                                                <option value="confirmed">확정</option>
                                                <option value="unconfirmed">미확정</option>
                                                <option value="discussion">논의필요</option>
                                            </select>
                                            <select
                                                value={item.assignee}
                                                onChange={(e) => { e.stopPropagation(); handleAssigneeChange(item.id, e.target.value); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1 text-[13px] focus:outline-none focus:border-[var(--color-brand)] min-h-[44px] ${item.assignee ? "text-zinc-300" : "text-red-400"}`}
                                            >
                                                <option value="">미배정</option>
                                                {team.map((m) => (<option key={m} value={m}>{m}</option>))}
                                            </select>
                                            <input
                                                type="date"
                                                value={item.due}
                                                onChange={(e) => { e.stopPropagation(); handleDueChange(item.id, e.target.value); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1 text-[13px] text-zinc-400 focus:outline-none focus:border-[var(--color-brand)] min-h-[44px] flex-1"
                                            />
                                            <span className={`${dDayColor(item.due)} ml-auto flex-shrink-0 ${item.status === "confirmed" ? "invisible" : ""}`}>{dDayLabel(item.due)}</span>
                                        </div>
                                    </div>

                                    {/* Desktop layout */}
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="flex-1 min-w-0 min-w-[80px] flex items-center gap-2">
                                            <span className="text-[16px] font-medium text-zinc-200 truncate min-w-0">{item.item}</span>
                                            {(item.chatCounts?.[nickname] ?? 0) > 0 && (
                                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex-shrink-0">
                                                    {item.chatCounts![nickname]}
                                                </span>
                                            )}
                                            {(item.mentionCounts?.[nickname] ?? 0) > 0 && (
                                                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 font-bold flex-shrink-0">
                                                    @{item.mentionCounts![nickname]}
                                                </span>
                                            )}
                                            {item.summary && !selectedItemId && <span className="text-[13px] text-zinc-600 ml-1 truncate min-w-0 flex-1">— {item.summary}</span>}
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setHistoryItemId(item.id); }}
                                            className={`text-[13px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 flex-shrink-0 ${item.history.length === 0 ? "invisible pointer-events-none" : ""}`}
                                            title="번복 이력"
                                        >
                                            🔄 {item.history.length}
                                        </button>

                                        <select
                                            value={item.status}
                                            onChange={(e) => { e.stopPropagation(); handleStatusChange(item.id, e.target.value as Status); }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`px-3 py-1.5 rounded-full border text-[13px] font-medium ${statusColor(item.status)} bg-transparent focus:outline-none cursor-pointer flex-shrink-0`}
                                        >
                                            <option value="confirmed">확정</option>
                                            <option value="unconfirmed">미확정</option>
                                            <option value="discussion">논의필요</option>
                                        </select>

                                        <select
                                            value={item.assignee}
                                            onChange={(e) => { e.stopPropagation(); handleAssigneeChange(item.id, e.target.value); }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[14px] focus:outline-none focus:border-[var(--color-brand)] w-24 flex-shrink-0 ${item.assignee ? "text-zinc-300" : "text-red-400"}`}
                                        >
                                            <option value="">미배정</option>
                                            {team.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>

                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <input
                                                type="date"
                                                value={item.due}
                                                onChange={(e) => { e.stopPropagation(); handleDueChange(item.id, e.target.value); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[13px] text-zinc-400 focus:outline-none focus:border-[var(--color-brand)] w-[130px]"
                                            />
                                            <span className={`text-[14px] font-bold ${dDayColor(item.due)} w-12 text-right ${item.status === "confirmed" ? "invisible" : ""}`}>
                                                {dDayLabel(item.due)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingItemId(item.id); }}
                                            className="text-zinc-500 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all text-xs flex-shrink-0"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
                                            className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs flex-shrink-0"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-zinc-600 text-[15px]">
                    필터 조건에 맞는 항목이 없습니다.
                </div>
            )}

            {/* Modals */}
            {revertPending && (
                <RevertModal
                    itemName={items.find((i) => i.id === revertPending.itemId)?.item || ""}
                    from="confirmed"
                    to={revertPending.to}
                    currentNickname={nickname}
                    onConfirm={handleRevertConfirm}
                    onCancel={() => setRevertPending(null)}
                />
            )}

            {historyItemId !== null && (
                <HistoryModal
                    itemName={items.find((i) => i.id === historyItemId)?.item || ""}
                    history={items.find((i) => i.id === historyItemId)?.history || []}
                    onClose={() => setHistoryItemId(null)}
                />
            )}

            {showAddModal && (
                <AddItemModal
                    onAdd={handleAddItem}
                    onCancel={() => setShowAddModal(false)}
                />
            )}

            {deleteItemId !== null && (
                <DeleteConfirmModal
                    itemName={items.find((i) => i.id === deleteItemId)?.item || ""}
                    onConfirm={handleDeleteItem}
                    onCancel={() => setDeleteItemId(null)}
                />
            )}

            {editingItemId !== null && (() => {
                const item = items.find((i) => i.id === editingItemId);
                return item ? (
                    <EditItemModal
                        item={item}
                        onSave={handleEditItemSave}
                        onCancel={() => setEditingItemId(null)}
                    />
                ) : null;
            })()}
        </div>
    );
}
