import { NextResponse } from "next/server";

export async function POST(request: Request) {
    if (!process.env.ALCHEMY_API_KEY) {
        return NextResponse.json({ error: "Alchemy API key not configured" }, { status: 500 });
    }

    const body = await request.json();
    
    const jsonRpcRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: body.method,
        params: body.params
    };

    const alchemyResponse = await fetch(
        `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(jsonRpcRequest)
        }
    );

    const data = await alchemyResponse.json();
    return NextResponse.json(data);
}
