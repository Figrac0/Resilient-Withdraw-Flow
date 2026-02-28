import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { HttpError, NetworkError } from "../../../shared/api/http";
import {
    createWithdrawal,
    getWithdrawal,
} from "../../../shared/api/withdrawApi";
import type { WithdrawStoreState, WithdrawDomainError } from "./types";

const LAST_KEY = "withdraw:last";
const TTL_MS = 5 * 60 * 1000;

type LastPersisted = { id: string; ts: number };

function safeReadLast(): LastPersisted | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(LAST_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as LastPersisted;
        if (!data || typeof data.id !== "string" || typeof data.ts !== "number")
            return null;
        return data;
    } catch {
        return null;
    }
}

function writeLast(id: string) {
    if (typeof window === "undefined") return;
    const payload: LastPersisted = { id, ts: Date.now() };
    sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));
}

function clearLast() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(LAST_KEY);
}

export function validateDraft(
    draft: WithdrawStoreState["draft"],
): WithdrawDomainError | null {
    const amountNum = Number(draft.amount);

    if (!Number.isFinite(amountNum) || amountNum <= 0) {
        return {
            kind: "validation",
            message: "Amount must be greater than 0.",
        };
    }

    if (draft.destination.trim().length === 0) {
        return { kind: "validation", message: "Destination is required." };
    }

    if (!draft.confirm) {
        return {
            kind: "validation",
            message: "You must confirm the withdrawal.",
        };
    }

    return null;
}

function mapError(e: unknown): WithdrawDomainError {
    if (e instanceof HttpError) {
        if (e.status === 409) {
            return {
                kind: "conflict",
                message:
                    "This withdrawal request was already processed. Duplicate submission prevented.",
            };
        }
        return {
            kind: "api",
            message: "Server error occurred. Please try again later.",
        };
    }

    if (e instanceof NetworkError) {
        return {
            kind: "network",
            message:
                "Network error. Your request may not have reached the server. You can retry safely.",
        };
    }

    return { kind: "api", message: "Unexpected error occurred." };
}

export const useWithdrawStore = create<
    WithdrawStoreState & { hydratedOnce: boolean }
>((set, get) => ({
    ui: "idle",
    draft: { amount: "", destination: "", confirm: false },

    lastResult: undefined,
    lastRequestId: undefined,
    error: undefined,

    isSubmitting: false,
    currentIdempotencyKey: undefined,

    hydratedOnce: false,

    setDraft: (patch) =>
        set((state) => {
            const nextDraft = { ...state.draft, ...patch };

            const shouldResetIdempotency =
                state.currentIdempotencyKey !== undefined &&
                (patch.amount !== undefined ||
                    patch.destination !== undefined ||
                    patch.confirm !== undefined);

            return {
                ...state,
                draft: nextDraft,
                error: state.ui === "error" ? undefined : state.error,
                ui: state.ui === "error" ? "idle" : state.ui,
                currentIdempotencyKey: shouldResetIdempotency
                    ? undefined
                    : state.currentIdempotencyKey,
            };
        }),

    reset: () => {
        clearLast();
        set({
            ui: "idle",
            draft: { amount: "", destination: "", confirm: false },
            lastResult: undefined,
            lastRequestId: undefined,
            error: undefined,
            isSubmitting: false,
            currentIdempotencyKey: undefined,
        });
    },

    hydrateLast: async () => {
        if (get().hydratedOnce) return;
        set({ hydratedOnce: true });

        const last = safeReadLast();
        if (!last) return;

        if (Date.now() - last.ts > TTL_MS) {
            clearLast();
            return;
        }

        set((s) => ({ ...s, ui: "loading", error: undefined }));

        try {
            const fresh = await getWithdrawal(last.id);

            set((s) => ({
                ...s,
                ui: "success",
                lastResult: fresh,
                lastRequestId: fresh.id,
                error: undefined,
            }));
        } catch {
            clearLast();
            set((s) => ({ ...s, ui: "idle" }));
        }
    },

    submit: async () => {
        let acquired = false;
        let idempotencyKey: string | undefined;

        set((s) => {
            if (s.isSubmitting) return s;

            const validationError = validateDraft(s.draft);
            if (validationError) {
                return {
                    ...s,
                    ui: "error",
                    error: validationError,
                    currentIdempotencyKey: undefined,
                };
            }

            acquired = true;
            idempotencyKey = s.currentIdempotencyKey ?? uuidv4();
            // idempotencyKey = "debug-fixed-key";

            return {
                ...s,
                ui: "loading",
                isSubmitting: true,
                error: undefined,
                currentIdempotencyKey: idempotencyKey,
            };
        });

        if (!acquired || !idempotencyKey) return;

        const draft = get().draft;
        const amountNum = Number(draft.amount);

        try {
            const created = await createWithdrawal({
                payload: { amount: amountNum, destination: draft.destination },
                idempotencyKey,
            });

            const fresh = await getWithdrawal(created.id);

            writeLast(fresh.id);

            set({
                ui: "success",
                lastResult: fresh,
                lastRequestId: fresh.id,
                isSubmitting: false,
                currentIdempotencyKey: undefined,
                error: undefined,
            });
        } catch (e) {
            const domainError = mapError(e);

            set({
                ui: "error",
                error: domainError,
                isSubmitting: false,
                currentIdempotencyKey:
                    domainError.kind === "network" ? idempotencyKey : undefined,
            });
        }
    },

    retry: async () => {
        const { error } = get();
        if (!error || error.kind !== "network") return;
        await get().submit();
    },
}));
