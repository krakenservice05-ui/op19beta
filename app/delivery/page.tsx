import { Metadata } from "next";
import { Zap, Mail, Clock, Globe, AlertTriangle, CheckCircle } from "lucide-react";
import { PageLayout, PageSection, InfoCard, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Delivery Information — Elite Games" };

const DELIVERY_TYPES = [
  { type: "Digital Code", time: "Instant", desc: "A unique activation code sent directly to your email. Redeem on the relevant platform store.", icon: Zap, color: "text-blue-400" },
  { type: "Direct Activation", time: "Instant", desc: "Product activated directly to a specified account. Full instructions sent via email.", icon: CheckCircle, color: "text-green-400" },
  { type: "Manual Fulfillment", time: "Up to 24 hours", desc: "Requires manual processing by our team. You'll receive confirmation when ready.", icon: Clock, color: "text-amber-400" },
  { type: "Account Credentials", time: "Instant – 2 hours", desc: "Full account details delivered securely to your email after verified payment.", icon: Mail, color: "text-purple-400" },
];

export default function DeliveryPage() {
  return (
    <PageLayout title="Delivery Information" subtitle="All Elite Games products are delivered digitally — no physical shipping required." breadcrumbs={[{ label: "Delivery Information" }]} badge="Digital Delivery">

      {/* How delivery works */}
      <PageSection title="How Digital Delivery Works">
        <div className="space-y-3 mb-8">
          {[
            { step: "1", title: "Complete Payment", desc: "Your order is created and payment is verified by our payment provider." },
            { step: "2", title: "Order Processed", desc: "Our system assigns your digital product and prepares the delivery." },
            { step: "3", title: "Email Sent", desc: "Your code or product details are delivered to your checkout email." },
            { step: "4", title: "Redeem & Play", desc: "Follow the activation instructions and start playing immediately." },
          ].map((s) => (
            <div key={s.step} className="flex gap-4 items-start p-4 bg-[#13131d] border border-[#1e1e2a] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-white">{s.step}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{s.title}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Delivery types */}
      <PageSection title="Delivery Types">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DELIVERY_TYPES.map((d) => (
            <div key={d.type} className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <d.icon size={16} className={d.color} aria-hidden="true" />
                <h3 className="text-sm font-bold text-white">{d.type}</h3>
                <span className="ml-auto text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">
                  {d.time}
                </span>
              </div>
              <p className="text-xs text-[#6b7280] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Regional delivery */}
      <PageSection title="Region Restrictions">
        <InfoCard
          icon={<Globe size={18} />}
          title="Check Your Region Before Purchasing"
          description="Some digital codes are region-locked and can only be redeemed on accounts registered in a specific country or region. Always verify the region listed on the product page before completing your purchase."
        />
        <div className="mt-4">
          <Prose>
            <p>Purchasing a code for the wrong region may result in an unusable product. Region information is clearly displayed on every product page and in your order summary before payment.</p>
            <p>If you are unsure whether a code will work in your region, contact us before purchasing.</p>
          </Prose>
        </div>
      </PageSection>

      {/* Not received */}
      <PageSection title="Not Received Your Code?">
        <div className="space-y-3">
          <InfoCard icon={<Mail size={18} />} title="Check Your Spam Folder" description="Delivery emails may be filtered. Add noreply@elitegames.com to your safe senders list." />
          <InfoCard icon={<Clock size={18} />} title="Allow Up to 15 Minutes" description="Instant delivery is standard, but occasional delays can occur during peak times. Wait 15 minutes before contacting support." />
          <InfoCard icon={<AlertTriangle size={18} />} title="Verify Your Email Address" description="Check the email address you entered at checkout. If incorrect, contact support with your order number." />
        </div>
      </PageSection>
    </PageLayout>
  );
}
