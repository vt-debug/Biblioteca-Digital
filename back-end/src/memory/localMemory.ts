export const MEMORY_KEY = "bia_memory";

export interface BiaMemory {
    last_section?: string;
    last_action?: string;
    last_book_title?: string;
    last_book_author?: string;
    last_search?: string;
    conversational_state?: string;
}

export function loadMemory(): BiaMemory {
    try {
        return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}");
    } catch {
        return {};
    }
}

export function saveMemory(update: Partial<BiaMemory>) {
    const current = loadMemory();
    const merged = { ...current, ...update };
    localStorage.setItem(MEMORY_KEY, JSON.stringify(merged));
}
