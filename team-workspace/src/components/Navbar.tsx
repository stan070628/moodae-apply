"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useApp } from "@/components/AppProvider";
import { Bell, BellOff } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", label: "대시보드", icon: "📊" },
    { href: "/board", label: "WBS 보드", icon: "📋" },
    { href: "/minutes", label: "회의록", icon: "📝" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const { nickname, setNickname, pushEnabled, requestPush, disablePush, unreadItems } = useApp();
    const [editing, setEditing] = useState(false);
    const [tempName, setTempName] = useState("");
    const [showNotif, setShowNotif] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    const totalUnread = unreadItems.reduce((sum, i) => sum + i.chatCount + i.mentionCount, 0);

    // 팝업 외부 클릭 시 닫기
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotif(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleNotifItemClick = (itemId: number) => {
        setShowNotif(false);
        router.push(`/board?item=${itemId}`);
    };

    const handleStartEdit = () => {
        setTempName(nickname);
        setEditing(true);
    };

    const handleSave = () => {
        if (tempName.trim()) {
            setNickname(tempName.trim());
        }
        setEditing(false);
    };

    return (
        <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-xl" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-14">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-xl font-brand font-bold bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">
                            IN-DIG
                        </span>
                        <span className="text-[13px] text-zinc-500 hidden sm:block">Collab</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-[15px] font-medium transition-all duration-200 min-h-[44px]
                    ${isActive
                                            ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)] shadow-[inset_0_0_0_1px_rgba(108,92,231,0.3)]"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                        }
                  `}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* 미읽음 알림 팝업 */}
                        {nickname && (
                            <div className="relative" ref={notifRef}>
                                <button
                                    onClick={() => setShowNotif((v) => !v)}
                                    title="미읽음 알림"
                                    className={`relative p-2 rounded-lg transition-colors min-h-[44px] ${showNotif ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)]" : totalUnread > 0 ? "text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                                >
                                    <span className="text-lg">🔔</span>
                                    {totalUnread > 0 && (
                                        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                                            {totalUnread > 99 ? "99+" : totalUnread}
                                        </span>
                                    )}
                                </button>

                                {showNotif && (
                                    <div className="absolute right-0 top-full mt-2 w-72 bg-[var(--color-surface)] border border-[var(--color-border-light)] rounded-xl shadow-2xl overflow-hidden z-50">
                                        <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
                                            <span className="text-[13px] font-bold text-zinc-300">미읽음 알림</span>
                                            {totalUnread > 0 && (
                                                <span className="text-[12px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">{totalUnread}</span>
                                            )}
                                        </div>
                                        {unreadItems.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-[13px] text-zinc-600">
                                                미읽음 메시지가 없습니다
                                            </div>
                                        ) : (
                                            <div className="max-h-80 overflow-y-auto">
                                                {unreadItems.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => handleNotifItemClick(u.id)}
                                                        className="w-full text-left px-4 py-3 hover:bg-[var(--color-brand)]/10 transition-colors border-b border-[var(--color-border)]/50 last:border-0"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-[14px] font-medium text-zinc-200 truncate">{u.item}</div>
                                                                <div className="text-[12px] text-zinc-500 truncate">{u.cat}</div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {u.chatCount > 0 && (
                                                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                                                                        💬 {u.chatCount}
                                                                    </span>
                                                                )}
                                                                {u.mentionCount > 0 && (
                                                                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 font-bold">
                                                                        @{u.mentionCount}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Push 알림 토글 */}
                        {nickname && (
                            <button
                                onClick={() => pushEnabled ? disablePush() : requestPush()}
                                title={pushEnabled ? "알림 끄기" : "알림 켜기"}
                                className={`p-2 rounded-lg transition-colors min-h-[44px] ${pushEnabled ? "text-[var(--color-brand)] hover:bg-[var(--color-brand)]/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
                            >
                                {pushEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                            </button>
                        )}

                        {/* Nickname */}
                        {nickname && (
                            <div className="flex items-center">
                                {editing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.nativeEvent.isComposing) handleSave();
                                                if (e.key === "Escape") setEditing(false);
                                            }}
                                            className="w-24 bg-[var(--color-surface)] border border-[var(--color-brand)] rounded-lg px-2 py-1.5 text-[14px] text-zinc-200 focus:outline-none"
                                            autoFocus
                                        />
                                        <button onClick={handleSave} className="text-[14px] text-[var(--color-brand)] hover:text-white">✓</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[14px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all min-h-[44px]"
                                        title="닉네임 변경"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[12px] text-[var(--color-brand)] font-bold">
                                            {nickname[0]?.toUpperCase()}
                                        </span>
                                        <span className="hidden sm:inline">{nickname}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
