import { NextResponse } from "next/server";
import { getStore } from "../_mockDb";

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> },
) {
    const { id } = await ctx.params;

    const store = getStore();
    const item = store.db.get(id);

    if (!item) {
        return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item, { status: 200 });
}
