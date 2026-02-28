import { http, HttpResponse } from "msw";

type CreateBody = {
    amount: number;
    destination: string;
};

let seq = 1;

export const handlers = [
    http.post("/v1/withdrawals", async ({ request }) => {
        const key = request.headers.get("Idempotency-Key");
        if (!key) {
            return HttpResponse.json(
                { message: "Missing Idempotency-Key" },
                { status: 400 },
            );
        }

        const body = (await request.json()) as CreateBody;

        const id = String(seq++);
        return HttpResponse.json(
            {
                id,
                amount: body.amount,
                destination: body.destination,
                status: "pending",
                created_at: new Date().toISOString(),
            },
            { status: 201 },
        );
    }),

    http.get("/v1/withdrawals/:id", ({ params }) => {
        const id = String(params.id);

        return HttpResponse.json(
            {
                id,
                amount: 12,
                destination: "dest",
                status: "pending",
                created_at: new Date().toISOString(),
            },
            { status: 200 },
        );
    }),
];
