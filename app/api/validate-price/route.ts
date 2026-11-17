/**
 * POST /api/validate-price
 *
 * Server-side price validation.
 * Called by the checkout before accepting payment to verify the client-submitted
 * price matches the authoritative server-side catalogue.
 *
 * Returns { valid: true, authoritative: number } or { valid: false, authoritative: number, error: string }.
 * The checkout uses the authoritative price if validation fails.
 */

import { NextRequest, NextResponse } from "next/server";
import { GAMES } from "@/lib/data/games";

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { variantId?: string; claimedPrice?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body." }, { status: 400 });
  }

  const { variantId, claimedPrice } = body;

  if (!variantId || typeof variantId !== "string") {
    return NextResponse.json({ valid: false, error: "Missing variantId." }, { status: 400 });
  }
  if (typeof claimedPrice !== "number") {
    return NextResponse.json({ valid: false, error: "Missing claimedPrice." }, { status: 400 });
  }

  // Look up the variant across all games
  let authoritativePrice: number | null = null;
  for (const game of GAMES) {
    const variant = game.variants.find((v) => v.id === variantId);
    if (variant) {
      authoritativePrice = variant.price;
      break;
    }
  }

  if (authoritativePrice === null) {
    return NextResponse.json(
      { valid: false, error: `Variant '${variantId}' not found in catalogue.` },
      { status: 404 }
    );
  }

  // Allow ±$0.01 tolerance for floating-point display rounding
  const tolerance = 0.01;
  const isValid = Math.abs(claimedPrice - authoritativePrice) <= tolerance;

  return NextResponse.json({
    valid: isValid,
    authoritative: authoritativePrice,
    ...(isValid ? {} : {
      error: `Price mismatch: claimed $${claimedPrice.toFixed(2)}, authoritative $${authoritativePrice.toFixed(2)}.`,
    }),
  });
}
