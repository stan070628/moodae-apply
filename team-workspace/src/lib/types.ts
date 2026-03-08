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
}

export interface ChatMessage {
    id: number;
    author: string;
    text: string;
    time: string;
    isSystem?: boolean;
}

export interface Minutes {
    id: number;
    itemId: number;
    itemName: string;
    content: string;
    createdAt: string;
}
