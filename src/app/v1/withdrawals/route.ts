import { NextResponse } from "next/server";
import { getStore } from "./_mockDb";

type CreateBody = {
    amount?: unknown;
    destination?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

function isPositiveNumber(v: unknown): v is number {
    return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export async function POST(req: Request) {
    const store = getStore();
    const key = req.headers.get("Idempotency-Key");

    if (!isNonEmptyString(key)) {
        return NextResponse.json(
            { message: "Missing Idempotency-Key" },
            { status: 400 },
        );
    }

    if (store.idempotencyKeys.has(key)) {
        return NextResponse.json(
            { message: "Duplicate request" },
            { status: 409 },
        );
    }

    let body: CreateBody;
    try {
        body = (await req.json()) as CreateBody;
    } catch {
        return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
    }

    if (!isPositiveNumber(body.amount)) {
        return NextResponse.json(
            { message: "Invalid amount" },
            { status: 422 },
        );
    }

    if (!isNonEmptyString(body.destination)) {
        return NextResponse.json(
            { message: "Invalid destination" },
            { status: 422 },
        );
    }

    store.idempotencyKeys.add(key);

    const id = String(store.seq++);
    const created = {
        id,
        amount: body.amount,
        destination: body.destination.trim(),
        status: "pending" as const,
        created_at: new Date().toISOString(),
    };

    store.db.set(id, created);

    return NextResponse.json(created, { status: 201 });
}
