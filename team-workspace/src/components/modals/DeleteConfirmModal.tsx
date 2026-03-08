"use client";

interface DeleteConfirmModalProps {
    itemName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function DeleteConfirmModal({ itemName, onConfirm, onCancel }: DeleteConfirmModalProps) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-backdrop" onClick={onCancel}>
            <div
                className="bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-2xl p-6 w-full max-w-sm mx-4 animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-2">🗑️ 항목 삭제</h3>
                <p className="text-sm text-zinc-400 mb-5">
                    <span className="font-semibold text-zinc-200">{itemName}</span> 항목을 삭제하시겠습니까?
                    <br />
                    <span className="text-red-400/80 text-xs">이 작업은 되돌릴 수 없습니다.</span>
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 text-sm rounded-lg border border-[var(--color-border)] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
