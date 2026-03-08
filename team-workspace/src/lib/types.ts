export type Status = "confirmed" | "unconfirmed" | "discussion";

export interface RevertHistory {
    from: Status;
    to: Status;
    reason: string;
    by: string;
    at: string;
}

export interface WBSItem {
    id: number;
    cat: string;
    item: string;
    summary: string;
    status: Status;
    assignee: string;
    due: string;
    history: RevertHistory[];
    mentionCounts?: Record<string, number>;
}

export interface ChatMessage {
    id: string;
    author: string;
    text: string;
    time: string;
    isSystem?: boolean;
    mentions?: string[];
}

export interface Minutes {
    id: string;
    itemId: number;
    itemName: string;
    content: string;
    createdAt: string;
}
