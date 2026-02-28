import { WithdrawResponse } from "@/shared/api/types";

export type WithdrawUiState = "idle" | "loading" | "success" | "error";

export type WithdrawFormDraft = {
    amount: string;
    destination: string;
    confirm: boolean;
};

export type WithdrawDomainError =
    | { kind: "validation"; message: string }
    | { kind: "conflict"; message: string }
    | { kind: "network"; message: string }
    | { kind: "api"; message: string };

export type WithdrawStoreState = {
    ui: WithdrawUiState;
    draft: WithdrawFormDraft;

    lastResult?: WithdrawResponse;
    lastRequestId?: string;

    error?: WithdrawDomainError;

    isSubmitting: boolean;
    currentIdempotencyKey?: string;

    setDraft(patch: Partial<WithdrawFormDraft>): void;
    submit(): Promise<void>;
    retry(): Promise<void>;
    reset(): void;

    hydrateLast(): Promise<void>;
};
