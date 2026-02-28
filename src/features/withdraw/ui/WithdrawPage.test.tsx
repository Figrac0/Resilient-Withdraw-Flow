import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/msw/server";
import { WithdrawPage } from "./WithdrawPage";
import { useWithdrawStore } from "../model/store";

beforeEach(() => {
    useWithdrawStore.getState().reset();
});

test("happy-path submit", async () => {
    const user = userEvent.setup();
    render(<WithdrawPage />);

    await user.type(screen.getByLabelText(/amount/i), "12");
    await user.type(screen.getByLabelText(/destination/i), "dest-1");
    await user.click(screen.getByLabelText(/confirm/i));

    await user.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/Withdrawal Created/i)).toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
});

test("api error 409 shows readable text", async () => {
    server.use(
        http.post("/v1/withdrawals", () =>
            HttpResponse.json(
                { message: "Duplicate request" },
                { status: 409 },
            ),
        ),
    );

    const user = userEvent.setup();
    render(<WithdrawPage />);

    await user.type(screen.getByLabelText(/amount/i), "12");
    await user.type(screen.getByLabelText(/destination/i), "dest-1");
    await user.click(screen.getByLabelText(/confirm/i));

    await user.click(screen.getByRole("button", { name: /submit/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/already processed/i);
});

test("double submit is guarded", async () => {
    let calls = 0;

    server.use(
        http.post("/v1/withdrawals", async ({ request }) => {
            calls += 1;

            await new Promise((r) => setTimeout(r, 80));

            const body = (await request.json()) as {
                amount: number;
                destination: string;
            };

            return HttpResponse.json(
                {
                    id: "1",
                    amount: body.amount,
                    destination: body.destination,
                    status: "pending",
                    created_at: new Date().toISOString(),
                },
                { status: 201 },
            );
        }),
    );

    const user = userEvent.setup();
    render(<WithdrawPage />);

    await user.type(screen.getByLabelText(/amount/i), "12");
    await user.type(screen.getByLabelText(/destination/i), "dest-1");
    await user.click(screen.getByLabelText(/confirm/i));

    const btn = screen.getByRole("button", { name: /submit/i });

    await user.click(btn);
    await user.click(btn);

    expect(await screen.findByText(/Withdrawal Created/i)).toBeInTheDocument();
    expect(calls).toBe(1);
});
