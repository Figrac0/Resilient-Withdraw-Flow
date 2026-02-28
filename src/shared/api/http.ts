export type HttpMethod = "GET" | "POST";

export class HttpError extends Error {
    readonly status: number;
    readonly body?: unknown;

    constructor(params: { status: number; message: string; body?: unknown }) {
        super(params.message);
        this.name = "HttpError";
        this.status = params.status;
        this.body = params.body;
    }
}

export class NetworkError extends Error {
    readonly reason: "timeout" | "aborted" | "fetch";

    constructor(params: { message: string; reason: NetworkError["reason"] }) {
        super(params.message);
        this.name = "NetworkError";
        this.reason = params.reason;
    }
}

type RequestOptions = {
    method: HttpMethod;
    url: string;
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
    timeoutMs?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function extractMessage(data: unknown): string | undefined {
    if (!isRecord(data)) return undefined;
    const msg = data["message"];
    return typeof msg === "string" ? msg : undefined;
}

async function safeReadJson(res: Response): Promise<unknown> {
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) return undefined;
    try {
        return await res.json();
    } catch {
        return undefined;
    }
}

// src/shared/api/http.ts
export async function httpJson<T>(opts: RequestOptions): Promise<T> {
    const timeoutMs = opts.timeoutMs ?? 15000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const signal = opts.signal
        ? AbortSignal.any([opts.signal, controller.signal])
        : controller.signal;

    try {
        const res = await fetch(opts.url, {
            method: opts.method,
            headers: {
                "Content-Type": "application/json",
                ...(opts.headers ?? {}),
            },
            body:
                opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
            signal,
        });

        const data = await safeReadJson(res);

        if (!res.ok) {
            const msg = extractMessage(data) ?? `HTTP ${res.status}`;
            throw new HttpError({
                status: res.status,
                message: msg,
                body: data,
            });
        }

        return data as T;
    } catch (e: unknown) {
        if (isRecord(e) && e["name"] === "AbortError") {
            const reason: NetworkError["reason"] = opts.signal?.aborted
                ? "aborted"
                : "timeout";

            throw new NetworkError({
                message:
                    reason === "timeout"
                        ? "Request timeout"
                        : "Request aborted",
                reason,
            });
        }

        if (e instanceof HttpError) throw e;

        const fallbackMessage =
            isRecord(e) && typeof e["message"] === "string"
                ? (e["message"] as string)
                : "Network error";

        throw new NetworkError({ message: fallbackMessage, reason: "fetch" });
    } finally {
        clearTimeout(timeoutId);
    }
}
