"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";

const NAV_ITEMS = [
    { href: "/", label: "대시보드", icon: "📊" },
    { href: "/board", label: "WBS 보드", icon: "📋" },
    { href: "/minutes", label: "회의록", icon: "📝" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { nickname, setNickname } = useApp();
    const [editing, setEditing] = useState(false);
    const [tempName, setTempName] = useState("");

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
                        <span className="text-lg font-brand font-bold bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-accent)] bg-clip-text text-transparent">
                            IN-DIG
                        </span>
                        <span className="text-xs text-zinc-500 hidden sm:block">Collab</span>
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
                    flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? "bg-[var(--color-brand)]/15 text-[var(--color-brand)] shadow-[inset_0_0_0_1px_rgba(108,92,231,0.3)]"
                                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                                        }
                  `}
                                >
                                    <span className="text-base">{item.icon}</span>
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

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
                                        className="w-20 bg-[var(--color-surface)] border border-[var(--color-brand)] rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleSave} className="text-xs text-[var(--color-brand)] hover:text-white">✓</button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all"
                                    title="닉네임 변경"
                                >
                                    <span className="w-5 h-5 rounded-full bg-[var(--color-brand)]/20 flex items-center justify-center text-[10px] text-[var(--color-brand)] font-bold">
                                        {nickname[0]?.toUpperCase()}
                                    </span>
                                    <span className="hidden sm:inline">{nickname}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
