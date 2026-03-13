export function daysLeft(due: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(due);
    dueDate.setHours(0, 0, 0, 0);
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function dDayLabel(due: string): string {
    const d = daysLeft(due);
    if (d === 0) return "D-Day";
    if (d > 0) return `D-${d}`;
    return `D+${Math.abs(d)}`;
}

export function dDayColor(due: string): string {
    const d = daysLeft(due);
    if (d <= 2) return "text-red-400";
    if (d <= 5) return "text-yellow-400";
    return "text-zinc-400";
}

export function formatDate(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// Firestore Timestamp, JS Date, seconds 객체 등 모든 형식 처리
export function formatTimestamp(createdAt: any, fallback: string): string {
    if (!createdAt) return fallback;
    try {
        if (typeof createdAt.toMillis === "function") return formatDateTime(new Date(createdAt.toMillis()));
        if (typeof createdAt.seconds === "number") return formatDateTime(new Date(createdAt.seconds * 1000));
        if (createdAt instanceof Date) return formatDateTime(createdAt);
    } catch {}
    return fallback;
}

export function formatDateTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "";
    const M = d.getMonth() + 1;
    const D = d.getDate();
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "오후" : "오전";
    const h12 = h % 12 || 12;
    return `${M}/${D} ${ampm} ${h12}:${m}`;
}

export function statusLabel(status: string): string {
    switch (status) {
        case "confirmed": return "확정";
        case "unconfirmed": return "미확정";
        case "discussion": return "논의필요";
        default: return status;
    }
}

export function statusColor(status: string): string {
    switch (status) {
        case "confirmed": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        case "unconfirmed": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
        case "discussion": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
        default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
}
