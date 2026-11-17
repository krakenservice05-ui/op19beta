"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Package, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react";
import { PageLayout, PageSection } from "@/components/ui/PageLayout";

const ORDER_STATES = [
  { status: "PAID", label: "Payment Confirmed", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { status: "FULFILLMENT_PENDING", label: "Preparing Delivery", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { status: "FULFILLED", label: "Code Assigned", icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { status: "COMPLETED", label: "Delivered to Email", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
  { status: "FAILED", label: "Payment Failed", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
];

// Demo order data
const DEMO_ORDER = {
  orderNumber: "EG-M5F3K2X1",
  status: "COMPLETED",
  items: [{ title: "Grand Theft Auto VI", platform: "PlayStation 5", region: "Global", edition: "Standard", price: 74.99, deliveryType: "Digital Code" }],
  email: "customer@example.com",
  date: "13 Nov 2025",
  total: 74.99,
};

export default function OrderSupportPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [looked, setLooked] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.toUpperCase() === "EG-M5F3K2X1") {
      setLooked(true);
      setNotFound(false);
    } else {
      setNotFound(true);
      setLooked(false);
    }
  };

  const currentState = ORDER_STATES.find((s) => s.status === DEMO_ORDER.status);

  return (
    <PageLayout title="Order Support" subtitle="Track your order, check delivery status, or get help with an issue." breadcrumbs={[{ label: "Order Support" }]} badge="Orders">

      {/* Lookup form */}
      <div className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-6 lg:p-8 mb-10">
        <h2 className="text-lg font-bold text-white mb-5">Look Up Your Order</h2>
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="orderNum" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Order Number</label>
              <input id="orderNum" type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="EG-XXXXXXXX" className="w-full bg-[#12121a] border border-[#252535] hover:border-[#353550] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-[#3d3d52] focus:outline-none transition-all" required />
            </div>
            <div>
              <label htmlFor="orderEmail" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Email Address</label>
              <input id="orderEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-[#12121a] border border-[#252535] hover:border-[#353550] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-[#3d3d52] focus:outline-none transition-all" required />
            </div>
          </div>
          <p className="text-xs text-[#4b5563]">Try demo order: <button type="button" className="text-blue-400 hover:underline" onClick={() => { setOrderNumber("EG-M5F3K2X1"); setEmail("customer@example.com"); }}>EG-M5F3K2X1</button></p>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
            <Search size={16} />
            Find Order
          </button>
        </form>

        {notFound && (
          <div className="mt-5 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-[#9ca3af]">No order found with those details. Check your order confirmation email for the correct order number.</p>
          </div>
        )}
      </div>

      {/* Order result */}
      {looked && (
        <div className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl overflow-hidden mb-10">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#1e1e2a] flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-xs text-[#4b5563] mb-1">Order Reference</p>
              <p className="text-lg font-black text-white">{DEMO_ORDER.orderNumber}</p>
            </div>
            {currentState && (
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${currentState.bg} ${currentState.color}`}>
                <currentState.icon size={13} />
                {currentState.label}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="px-6 py-5 space-y-3">
            {DEMO_ORDER.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="text-xs text-[#6b7280] mt-0.5">{item.platform} · {item.region} · {item.edition}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    {item.deliveryType}
                  </span>
                </div>
                <p className="text-sm font-bold text-white flex-shrink-0">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#0e0e18] border-t border-[#1e1e2a] flex items-center justify-between flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 text-[#6b7280]">
              <Package size={14} />
              <span>Delivered to <strong className="text-white">{DEMO_ORDER.email}</strong></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#6b7280]">{DEMO_ORDER.date}</span>
              <span className="font-black text-white">${DEMO_ORDER.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Common issues */}
      <PageSection title="Common Order Issues">
        <div className="space-y-3">
          {[
            { q: "I haven't received my code", a: "Check your spam folder. If you used an email with strict filters, whitelist noreply@elitegames.com. Contact us if the issue persists after 15 minutes." },
            { q: "My code says 'already redeemed'", a: "Contact support immediately with your order number. We will investigate and issue a replacement if the code was issued incorrectly." },
            { q: "Wrong platform/region code received", a: "If the code doesn't match your order details, contact support within 48 hours. Include your order number and a screenshot." },
            { q: "Payment taken but no order created", a: "This can happen during network interruptions. Contact support with your bank reference number and we will locate the transaction." },
          ].map((item, i) => (
            <details key={i} className="group bg-[#13131d] border border-[#1e1e2a] rounded-xl overflow-hidden">
              <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-white hover:text-blue-400 transition-colors list-none flex items-center justify-between gap-4">
                {item.q}
                <span className="text-[#4b5563] group-open:rotate-45 transition-transform text-lg leading-none flex-shrink-0">+</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-[#9ca3af] leading-relaxed border-t border-[#1e1e2a] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </PageSection>

      <div className="text-center pt-4">
        <p className="text-sm text-[#6b7280] mb-4">Can&apos;t find what you need?</p>
        <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">Contact Support</Link>
      </div>
    </PageLayout>
  );
}
