/**
 * app/api/rpc/route.ts
 *
 * Server-side JSON-RPC proxy for Solana RPC calls.
 *
 * Purpose: forward client-side RPC requests to the configured private RPC
 * endpoint (e.g. Helius) without exposing the API key to the browser.
 * The key lives in SOLANA_RPC_URL (server-only env var, no NEXT_PUBLIC_ prefix).
 *
 * Client code uses "/api/rpc" as the Connection endpoint.
 * This route reads SOLANA_RPC_URL and proxies the request server-side.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const rpcUrl = process.env.SOLANA_RPC_URL;

  // If no private RPC is configured, fall through to the public endpoint.
  // This keeps things working in development without a key, but production
  // should always have SOLANA_RPC_URL set.
  const targetUrl =
    rpcUrl && !rpcUrl.includes("YOUR_")
      ? rpcUrl
      : "https://api.mainnet-beta.solana.com";

  // Validate JSON-RPC structure before forwarding
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("method" in body) ||
    typeof (body as Record<string, unknown>).method !== "string"
  ) {
    return NextResponse.json(
      { error: "Not a valid JSON-RPC request" },
      { status: 400 }
    );
  }

  // Forward to upstream RPC — API key stays server-side, never reaches the browser
  try {
    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream RPC error: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "RPC proxy request failed" },
      { status: 503 }
    );
  }
}