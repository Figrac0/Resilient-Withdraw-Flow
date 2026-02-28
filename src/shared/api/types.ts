export type WithdrawCreateRequest = {
    amount: number;
    destination: string;
};

export type WithdrawStatus = "pending" | "processing" | "completed" | "failed";

export type WithdrawResponse = {
    id: string;
    amount: number;
    destination: string;
    status: WithdrawStatus;
    created_at: string;
};
