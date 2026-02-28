export type WithdrawStatus = "pending" | "processing" | "completed" | "failed";

export type Withdrawal = {
    id: string;
    amount: number;
    destination: string;
    status: WithdrawStatus;
    created_at: string;
};

type Store = {
    db: Map<string, Withdrawal>;
    idempotencyKeys: Set<string>;
    seq: number;
};

declare const globalThis: {
    __withdrawStore?: Store;
} & typeof global;

export function getStore(): Store {
    if (!globalThis.__withdrawStore) {
        globalThis.__withdrawStore = {
            db: new Map<string, Withdrawal>(),
            idempotencyKeys: new Set<string>(),
            seq: 1,
        };
    }
    return globalThis.__withdrawStore;
}
