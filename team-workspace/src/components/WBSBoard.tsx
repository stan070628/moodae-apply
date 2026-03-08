"use client";

import { useState } from "react";
import type { WBSItem, Status, ChatMessage, Minutes } from "@/lib/types";
import { TEAM, CATEGORIES } from "@/lib/data";
import { dDayLabel, dDayColor, statusLabel, statusColor, formatDate } from "@/lib/utils";
import RevertModal from "@/components/modals/RevertModal";
import HistoryModal from "@/components/modals/HistoryModal";
import AddItemModal from "@/components/modals/AddItemModal";
import DeleteConfirmModal from "@/components/modals/DeleteConfirmModal";

interface WBSBoardProps {
    items: WBSItem[];
    setItems: React.Dispatch<React.SetStateAction<WBSItem[]>>;
    chatMap: Record<number, ChatMessage[]>;
    setChatMap: React.Dispatch<React.SetStateAction<Record<number, ChatMessage[]>>>;
    selectedItemId: number | null;
    setSelectedItemId: (id: number | null) => void;
    nextMsgId: number;
    setNextMsgId: React.Dispatch<React.SetStateAction<number>>;
}

export default function WBSBoard({
    items,
    setItems,
    chatMap,
    setChatMap,
    selectedItemId,
    setSelectedItemId,
    nextMsgId,
    setNextMsgId,
}: WBSBoardProps) {
    const [filterCat, setFilterCat] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [revertPending, setRevertPending] = useState<{ itemId: number; to: Status } | null>(null);
    const [historyItemId, setHistoryItemId] = useState<number | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteItemId, setDeleteItemId] = useState<number | null>(null);

    const filtered = items.filter((i) => {
        if (filterCat !== "all" && i.cat !== filterCat) return false;
        if (filterStatus !== "all" && i.status !== filterStatus) return false;
        return true;
    });

    const grouped = CATEGORIES.reduce<Record<string, WBSItem[]>>((acc, cat) => {
        const catItems = filtered.filter((i) => i.cat === cat);
        if (catItems.length > 0) acc[cat] = catItems;
        return acc;
    }, {});

    const handleStatusChange = (itemId: number, newStatus: Status) => {
        const item = items.find((i) => i.id === itemId);
        if (!item) return;

        // If changing FROM confirmed, require revert reason
        if (item.status === "confirmed" && newStatus !== "confirmed") {
            setRevertPending({ itemId, to: newStatus });
            return;
        }

        setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
        );
    };

    const handleRevertConfirm = (reason: string, by: string) => {
        if (!revertPending) return;
        const item = items.find((i) => i.id === revertPending.itemId);
        if (!item) return;

        const now = new Date().toISOString();

        // Update item status and add history
        setItems((prev) =>
            prev.map((i) =>
                i.id === revertPending.itemId
                    ? {
                        ...i,
                        status: revertPending.to,
                        history: [
                            ...i.history,
                            { from: "confirmed", to: revertPending.to, reason, by, at: now },
                        ],
                    }
                    : i
            )
        );

        // Add system message to chat
        const sysMsg: ChatMessage = {
            id: nextMsgId,
            author: "시스템",
            text: `${by}님이 확정을 번복했습니다: ${reason}`,
            time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
            isSystem: true,
        };
        setNextMsgId((prev) => prev + 1);
        setChatMap((prev) => ({
            ...prev,
            [revertPending.itemId]: [...(prev[revertPending.itemId] || []), sysMsg],
        }));

        setRevertPending(null);
    };

    const handleAssigneeChange = (itemId: number, assignee: string) => {
        setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, assignee } : i))
        );
    };

    const handleDueChange = (itemId: number, due: string) => {
        setItems((prev) =>
            prev.map((i) => (i.id === itemId ? { ...i, due } : i))
        );
    };

    const handleAddItem = (newItem: { cat: string; item: string; summary: string; assignee: string; due: string; status: Status }) => {
        const id = Math.max(...items.map((i) => i.id), 0) + 1;
        setItems((prev) => [...prev, { ...newItem, id, history: [] }]);
        setShowAddModal(false);
    };

    const handleDeleteItem = () => {
        if (deleteItemId === null) return;
        setItems((prev) => prev.filter((i) => i.id !== deleteItemId));
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
                        <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-1">{cat}</h3>
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
                                            <span className="text-[16px] font-medium text-zinc-200">{item.item}</span>
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
                                                    onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
                                                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
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
                                            <span className="text-zinc-500">{item.assignee || "미배정"}</span>
                                            <span className={`${dDayColor(item.due)} ml-auto`}>{dDayLabel(item.due)}</span>
                                        </div>
                                    </div>

                                    {/* Desktop layout */}
                                    <div className="hidden md:flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[16px] font-medium text-zinc-200">{item.item}</span>
                                            {item.summary && <span className="text-[13px] text-zinc-600 ml-2">— {item.summary}</span>}
                                        </div>

                                        {/* History badge */}
                                        {item.history.length > 0 && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setHistoryItemId(item.id); }}
                                                className="text-[13px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 flex-shrink-0"
                                                title="번복 이력"
                                            >
                                                🔄 {item.history.length}
                                            </button>
                                        )}

                                        {/* Status */}
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

                                        {/* Assignee */}
                                        <select
                                            value={item.assignee}
                                            onChange={(e) => { e.stopPropagation(); handleAssigneeChange(item.id, e.target.value); }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[14px] focus:outline-none focus:border-[var(--color-brand)] w-24 flex-shrink-0 ${item.assignee ? "text-zinc-300" : "text-red-400"}`}
                                        >
                                            <option value="">미배정</option>
                                            {TEAM.map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>

                                        {/* Due */}
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <input
                                                type="date"
                                                value={item.due}
                                                onChange={(e) => { e.stopPropagation(); handleDueChange(item.id, e.target.value); }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-transparent border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[13px] text-zinc-400 focus:outline-none focus:border-[var(--color-brand)] w-[130px]"
                                            />
                                            <span className={`text-[14px] font-bold ${dDayColor(item.due)} w-12 text-right`}>
                                                {dDayLabel(item.due)}
                                            </span>
                                        </div>

                                        {/* Delete */}
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
        </div>
    );
}
