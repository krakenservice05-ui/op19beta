import { ShieldCheck, Zap, Headphones, BadgeCheck } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: "Secure Payments",
    description: "PCI-compliant payment processing",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Digital codes delivered to your email",
  },
  {
    icon: BadgeCheck,
    title: "Authorized Seller",
    description: "Genuine digital products only",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Dedicated customer service team",
  },
];

export function TrustBar() {
  return (
    <section
      className="bg-[#111118] border-y border-[#1e1e2a]"
      aria-label="Why shop with Elite Games"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10 lg:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-3 sm:flex-row sm:text-left sm:items-start">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <item.icon size={22} className="text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
