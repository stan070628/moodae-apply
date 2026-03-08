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

export function formatDateTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
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
