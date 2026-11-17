/**
 * POST /api/receipt-email
 *
 * Sends a customer-facing order receipt to the email address the customer
 * provided at checkout, immediately after a confirmed successful order.
 *
 * This is entirely separate from /api/notify-order (the internal store
 * notification). It never includes card numbers, CVCs, PINs or any
 * payment credentials — only the information a customer should receive.
 *
 * Body shape:
 * {
 *   orderNumber:    string          — unique order reference (e.g. EG-M2G4KX8F)
 *   orderTimestamp: string          — ISO 8601 timestamp
 *   customerEmail:  string          — validated customer email (receipt destination)
 *   customerName:   string          — first name for personalisation
 *   paymentMethod:  string          — e.g. "CREDIT_CARD", "CRYPTO"
 *   items:          OrderItem[]     — purchased items
 *   cartTotal:      number          — total amount paid in USD
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Dedicated receipt account — separate from the store-owner notify funnel
const receiptResend = new Resend(process.env.RECEIPT_RESEND_API_KEY);

// ── Rate limit: 10 receipts/min per IP (tighter than notify-order) ───────────
const rl = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const r = rl.get(ip);
  if (!r || now > r.resetAt) { rl.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (r.count >= 10) return false;
  r.count++;
  return true;
}

function fmt(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
}

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

const PAYMENT_LABELS: Record<string, string> = {
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD:  "Debit Card",
  CRYPTO:      "Cryptocurrency (Solana)",
  APPLE_GIFT:  "Apple Gift Card",
  STEAM_GIFT:  "Steam Gift Card",
};

interface OrderItem {
  title:        string;
  platform:     string;
  region:       string;
  edition:      string;
  deliveryType: string;
  price:        number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  if (!process.env.RECEIPT_RESEND_API_KEY || !process.env.RECEIPT_FROM_EMAIL) {
    return NextResponse.json({ error: "Receipt email service not configured." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const {
    orderNumber,
    orderTimestamp,
    customerEmail,
    customerName,
    paymentMethod,
    items,
    cartTotal,
  } = body as {
    orderNumber:    string;
    orderTimestamp: string;
    customerEmail:  string;
    customerName:   string;
    paymentMethod:  string;
    items:          OrderItem[];
    cartTotal:      number;
  };

  // Basic guard — if no customer email, there's nothing to send
  if (!customerEmail || !customerEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid customer email." }, { status: 400 });
  }

  // Format timestamp
  let ts = fmt(orderTimestamp);
  try {
    ts = new Date(orderTimestamp).toLocaleString("en-US", {
      timeZone: "UTC",
      dateStyle: "full",
      timeStyle: "short",
    }) + " UTC";
  } catch { /* keep raw value */ }

  // ── Build item rows ─────────────────────────────────────────────────────────
  const itemRows = Array.isArray(items) && items.length > 0
    ? items.map((item, i) => `
      <tr style="border-bottom:1px solid #f3f4f6;${i % 2 !== 0 ? "background:#fafafa;" : ""}">
        <td style="padding:12px 16px;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#111;">${fmt(item.title)}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#6b7280;">
            ${fmt(item.platform)}&nbsp;·&nbsp;${fmt(item.region)}&nbsp;·&nbsp;${fmt(item.edition)}
          </p>
          <p style="margin:3px 0 0;font-size:11px;color:#9ca3af;">Digital Code · Instant Delivery</p>
        </td>
        <td style="padding:12px 16px;text-align:right;font-size:14px;font-weight:700;color:#111;white-space:nowrap;vertical-align:top;">
          ${usd(item.price)}
        </td>
      </tr>
    `).join("")
    : `<tr><td colspan="2" style="padding:12px 16px;color:#6b7280;font-size:13px;">No items found.</td></tr>`;

  const paymentLabel = PAYMENT_LABELS[paymentMethod] ?? fmt(paymentMethod);
  const firstName = fmt(customerName).split(" ")[0] || "there";

  // ── HTML receipt ────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Elite Games Order — ${fmt(orderNumber)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:16px;overflow:hidden;
             box-shadow:0 4px 24px rgba(0,0,0,0.10);max-width:600px;width:100%;">

      <!-- ── Header ── -->
      <tr>
        <td style="background:#0a0a0f;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">
                  ELITE GAMES
                </span>
              </td>
              <td align="right">
                <span style="font-size:11px;font-weight:700;color:#4b5563;
                             text-transform:uppercase;letter-spacing:2px;">
                  Order Confirmation
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── Green success banner ── -->
      <tr>
        <td style="background:#052e16;padding:20px 32px;border-bottom:3px solid #16a34a;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;font-size:13px;font-weight:700;
                           color:#4ade80;text-transform:uppercase;letter-spacing:1px;">
                  ✓ &nbsp;Payment Confirmed
                </p>
                <p style="margin:4px 0 0;font-size:20px;font-weight:900;color:#ffffff;">
                  Thank you, ${firstName}!
                </p>
              </td>
              <td align="right" style="white-space:nowrap;">
                <p style="margin:0;font-size:11px;color:#6b7280;">Order reference</p>
                <p style="margin:4px 0 0;font-size:18px;font-weight:900;
                           color:#4ade80;letter-spacing:1px;font-family:monospace;">
                  ${fmt(orderNumber)}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- ── Body ── -->
      <tr>
        <td style="padding:32px;">

          <!-- Thank you message -->
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
            Thank you for shopping with us. Your order will be delivered shortly.
            Your digital activation code(s) will be sent to this email address
            — please keep an eye on your inbox, including your spam folder.
          </p>

          <!-- Order meta row -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;
                   margin-bottom:24px;border-collapse:collapse;">
            <tr>
              <td style="padding:12px 16px;border-right:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;
                           letter-spacing:1px;">Date</p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${ts}</p>
              </td>
              <td style="padding:12px 16px;border-right:1px solid #e5e7eb;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;
                           letter-spacing:1px;">Payment</p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">${paymentLabel}</p>
              </td>
              <td style="padding:12px 16px;">
                <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;
                           letter-spacing:1px;">Delivery</p>
                <p style="margin:4px 0 0;font-size:13px;font-weight:600;color:#111;">Digital · Instant</p>
              </td>
            </tr>
          </table>

          <!-- Items table -->
          <h3 style="margin:0 0 10px;font-size:13px;font-weight:700;
                     color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
            Items Ordered
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0"
            style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;
                   border-collapse:collapse;margin-bottom:16px;">
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="background:#f3f4f6;border-top:2px solid #e5e7eb;">
                <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#111;">
                  Total Paid
                </td>
                <td style="padding:14px 16px;text-align:right;
                           font-size:18px;font-weight:900;color:#111;">
                  ${usd(cartTotal ?? 0)}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- What happens next -->
          <table width="100%" cellpadding="0" cellspacing="0"
            style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;
                   margin-bottom:24px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:13px;font-weight:700;color:#1e40af;">
                  📧 &nbsp;What happens next?
                </p>
                <p style="margin:8px 0 0;font-size:13px;color:#1d4ed8;line-height:1.6;">
                  Your digital activation code(s) will be delivered to
                  <strong>${fmt(customerEmail)}</strong> within minutes.
                  If you do not receive them within 24 hours, please contact
                  our support team with your order reference
                  <strong>${fmt(orderNumber)}</strong>.
                </p>
              </td>
            </tr>
          </table>

          <!-- Support link -->
          <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
            Need help?
            <a href="https://elitegames.store/support"
               style="color:#3b82f6;text-decoration:none;font-weight:600;">
              Visit our Support Centre
            </a>
            &nbsp;or reply to this email.
          </p>

        </td>
      </tr>

      <!-- ── Footer ── -->
      <tr>
        <td style="background:#f9fafb;border-top:1px solid #e5e7eb;
                   padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">
            © Elite Games · Digital Game Keys · Instant Delivery
          </p>
          <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
            This receipt was generated automatically for order ${fmt(orderNumber)}.
          </p>
        </td>
      </tr>

    </table>
    </td></tr>
  </table>

</body>
</html>
  `.trim();

  // ── Send directly to the customer using the dedicated receipt account ───────
  const fromAddress = `Elite Games <orders@elitechain.net>`;

  try {
    const { error } = await receiptResend.emails.send({
      from:     fromAddress,
      to:       [customerEmail],
      replyTo:  process.env.RECEIPT_FROM_EMAIL,
      subject:  `Your Elite Games order is confirmed — ${fmt(orderNumber)}`,
      html,
    });

    if (error) {
      const msg = typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);
      console.error("[receipt-email] Resend error:", msg);
      return NextResponse.json({ ok: false, error: msg }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[receipt-email] Unexpected error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
