import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  bin: z
    .string()
    .min(6, "BIN must be at least 6 digits")
    .max(8, "BIN must be at most 8 digits")
    .regex(/^\d+$/, "BIN must contain only digits"),
});

export type CardScheme = "visa" | "mastercard" | "amex" | "maestro" | "discover" | "unknown";
export type CardType = "debit" | "credit" | "prepaid" | "unknown";

export interface CardBinResult {
  valid: boolean;
  scheme?: CardScheme;
  type?: CardType;
  brand?: string;
  country?: string;
  countryCode?: string;
  emoji?: string;
  bank?: string;
  error?: string;
}

// Simple in-memory rate limit — replace with Redis in production
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// Normalize scheme names from binlist to our canonical type
function normalizeScheme(raw: string | undefined): CardScheme {
  if (!raw) return "unknown";
  const s = raw.toLowerCase().trim();
  if (s === "visa") return "visa";
  if (s === "mastercard" || s === "master card") return "mastercard";
  if (s === "american express" || s === "amex") return "amex";
  if (s === "maestro") return "maestro";
  if (s === "discover") return "discover";
  return "unknown";
}

function normalizeType(raw: string | undefined): CardType {
  if (!raw) return "unknown";
  const t = raw.toLowerCase().trim();
  if (t === "debit") return "debit";
  if (t === "credit") return "credit";
  if (t === "prepaid") return "prepaid";
  return "unknown";
}

export async function POST(req: NextRequest): Promise<NextResponse<CardBinResult>> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { valid: false, error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { valid: false, error: parsed.error.issues[0]?.message ?? "Invalid BIN." },
      { status: 400 }
    );
  }

  const { bin } = parsed.data;

  try {
    // lookup.binlist.net — free BIN lookup, no API key
    // Returns: scheme, type, brand, country, bank
    const response = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Elite-Games/1.0 (checkout)",
        // Required by binlist to avoid 429s
        "Accept-Version": "3",
      },
      signal: AbortSignal.timeout(6000),
    });

    // 404 = BIN unknown / card doesn't exist in their DB
    if (response.status === 404) {
      return NextResponse.json({
        valid: false,
        error: "Card number not recognised. Please check and re-enter.",
      });
    }

    // 429 = binlist rate limit — fail open so checkout isn't blocked
    if (response.status === 429) {
      return NextResponse.json({ valid: true, scheme: "unknown", type: "unknown" });
    }

    if (!response.ok) {
      // Any other error — fail open
      return NextResponse.json({ valid: true });
    }

    const data = await response.json() as {
      scheme?: string;
      type?: string;
      brand?: string;
      country?: { name?: string; alpha2?: string; emoji?: string };
      bank?: { name?: string };
    };

    const result: CardBinResult = {
      valid: true,
      scheme: normalizeScheme(data.scheme),
      type: normalizeType(data.type),
      brand: data.brand,
      country: data.country?.name,
      countryCode: data.country?.alpha2,
      emoji: data.country?.emoji,
      bank: data.bank?.name,
    };

    return NextResponse.json(result);
  } catch (err) {
    // Timeout or network error — fail open
    console.error("[verify-card] BIN lookup error:", err);
    return NextResponse.json({ valid: true });
  }
}
