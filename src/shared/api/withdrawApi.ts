import { httpJson } from "./http";
import type { WithdrawCreateRequest, WithdrawResponse } from "./types";

const IDEMPOTENCY_HEADER = "Idempotency-Key";

export async function createWithdrawal(params: {
    payload: WithdrawCreateRequest;
    idempotencyKey: string;
}): Promise<WithdrawResponse> {
    return httpJson<WithdrawResponse>({
        method: "POST",
        url: "/v1/withdrawals",
        headers: { [IDEMPOTENCY_HEADER]: params.idempotencyKey },
        body: params.payload,
    });
}

export async function getWithdrawal(id: string): Promise<WithdrawResponse> {
    return httpJson<WithdrawResponse>({
        method: "GET",
        url: `/v1/withdrawals/${encodeURIComponent(id)}`,
    });
}
