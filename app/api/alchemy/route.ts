import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();

    const alchemyResponse = await fetch(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        }
    );

    const data = await alchemyResponse.json();
    return NextResponse.json(data);
}
