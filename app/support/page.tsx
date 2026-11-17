import { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Package, FileText, ChevronRight } from "lucide-react";
import { PageLayout } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Support — Elite Games" };

const SUPPORT_OPTIONS = [
  { icon: Package, title: "Order Support", desc: "Track your order, report delivery issues, or look up an order by number.", href: "/order-support", cta: "View Order Support" },
  { icon: MessageSquare, title: "Contact Us", desc: "Send a message to our support team. We respond within 24 hours.", href: "/contact", cta: "Contact Support" },
  { icon: FileText, title: "Help Center", desc: "Browse FAQs, activation guides, and delivery information.", href: "/help", cta: "Browse Help Center" },
];

export default function SupportPage() {
  return (
    <PageLayout title="Support" subtitle="We're here to help. Choose the support option that best fits your needs." breadcrumbs={[{ label: "Support" }]} badge="Help">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
        {SUPPORT_OPTIONS.map((opt) => (
          <Link key={opt.title} href={opt.href} className="flex flex-col gap-4 p-6 bg-[#13131d] border border-[#1e1e2a] rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <opt.icon size={22} aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-white mb-2">{opt.title}</h2>
              <p className="text-sm text-[#6b7280] leading-relaxed">{opt.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
              {opt.cta}
              <ChevronRight size={15} />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-6 text-center">
        <p className="text-sm font-semibold text-white mb-1">Support Hours</p>
        <p className="text-sm text-[#6b7280]">Our team is available <strong className="text-white">24/7</strong> for urgent order and payment issues.</p>
        <p className="text-xs text-[#4b5563] mt-2">Standard enquiries: responded to within 24 hours on business days.</p>
      </div>
    </PageLayout>
  );
}
