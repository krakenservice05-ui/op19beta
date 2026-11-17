import { Metadata } from "next";
import Link from "next/link";
import { Search, Package, CreditCard, Zap, RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";
import { PageLayout } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Help Center — Elite Games" };

const CATEGORIES = [
  { icon: Package, label: "Orders & Delivery", href: "/order-support", desc: "Track orders, delivery issues, missing codes" },
  { icon: CreditCard, label: "Payments & Billing", href: "/contact", desc: "Payment failures, charges, billing queries" },
  { icon: Zap, label: "Digital Codes", href: "/delivery", desc: "How to redeem, activation guides, region info" },
  { icon: RefreshCw, label: "Refunds & Returns", href: "/refunds", desc: "Refund policy, eligibility, how to request" },
  { icon: ShieldCheck, label: "Account Security", href: "/contact", desc: "Fraud concerns, unauthorized transactions" },
  { icon: Search, label: "Product Enquiries", href: "/contact", desc: "Platform compatibility, editions, availability" },
];

const FAQS = [
  { q: "When will I receive my digital code?", a: "Codes are delivered to your email instantly after payment is confirmed. Check your spam folder if you don't see it within 5 minutes." },
  { q: "What platforms do you support?", a: "We support PlayStation, Xbox, Steam, Epic Games, Nintendo, EA Play, GOG, and Rockstar Games, among others." },
  { q: "Can I use a digital code from another region?", a: "Region-restricted codes can only be redeemed on accounts registered in the specified region. Always check the region before purchasing." },
  { q: "What payment methods do you accept?", a: "We accept Debit Card, Credit Card, and Cryptocurrency (Solana). Apple Gift Card and Steam Gift Card support is coming soon." },
  { q: "What if my code doesn't work?", a: "Contact our support team within 72 hours of purchase with your order number and a screenshot of the error. We'll investigate and resolve it promptly." },
  { q: "How do I get a refund?", a: "Digital products are generally non-refundable once the code has been revealed. See our full Refund Policy for details and eligible exceptions." },
];

export default function HelpCenterPage() {
  return (
    <PageLayout title="Help Center" subtitle="Find answers, guides, and support for all things Elite Games." breadcrumbs={[{ label: "Help Center" }]} badge="Support" maxWidth="xl">

      {/* Search bar */}
      <div className="relative mb-14">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4b5563]" aria-hidden="true" />
        <input type="search" placeholder="Search help articles…" className="w-full bg-[#13131d] border border-[#1e1e2a] hover:border-[#2a2a3a] rounded-2xl pl-12 pr-5 py-4 text-white text-base placeholder-[#4b5563] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all" />
      </div>

      {/* Categories */}
      <div className="mb-14">
        <h2 className="text-xl font-bold text-white mb-6">Browse by Topic</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat.label} href={cat.href} className="flex items-start gap-4 p-5 bg-[#13131d] border border-[#1e1e2a] rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                <cat.icon size={18} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-white">{cat.label}</p>
                  <ChevronRight size={14} className="text-[#4b5563] group-hover:text-blue-400 transition-colors flex-shrink-0" aria-hidden="true" />
                </div>
                <p className="text-xs text-[#6b7280] mt-0.5">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <details key={i} className="group bg-[#13131d] border border-[#1e1e2a] rounded-2xl overflow-hidden">
              <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none text-sm font-semibold text-white hover:text-blue-400 transition-colors">
                {faq.q}
                <ChevronRight size={16} className="flex-shrink-0 text-[#4b5563] group-open:rotate-90 transition-transform" aria-hidden="true" />
              </summary>
              <div className="px-6 pb-5 text-sm text-[#9ca3af] leading-relaxed border-t border-[#1e1e2a] pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Still need help */}
      <div className="mt-12 text-center p-8 bg-[#13131d] border border-[#1e1e2a] rounded-2xl">
        <p className="text-white font-bold mb-2">Still need help?</p>
        <p className="text-sm text-[#6b7280] mb-5">Our support team is available 24/7.</p>
        <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
          Contact Support
        </Link>
      </div>
    </PageLayout>
  );
}
