import { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Zap, BadgeCheck, Globe } from "lucide-react";
import { PageLayout, PageSection, Prose, InfoCard } from "@/components/ui/PageLayout";

export const metadata: Metadata = {
  title: "About Elite Games",
  description: "Learn about Elite Games — your trusted digital gaming marketplace for instant game code delivery.",
};

const STATS = [
  { value: "17M+", label: "Items Sold" },
  { value: "150+", label: "Publishers" },
  { value: "4.5/5", label: "Platform Rating" },
  { value: "6M+", label: "Happy Customers" },
];

export default function AboutPage() {
  return (
    <PageLayout
      title="About Elite Games"
      subtitle="Your trusted destination for digital games, gift cards, and gaming subscriptions — delivered instantly."
      breadcrumbs={[{ label: "About" }]}
      badge="Our Story"
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
        {STATS.map((s) => (
          <div key={s.label} className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-white mb-1">{s.value}</p>
            <p className="text-xs text-[#6b7280] uppercase tracking-wider font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <PageSection title="Our Mission">
        <Prose>
          <p>
            Elite Games was founded with a single mission: make digital gaming accessible,
            affordable, and instant for players everywhere. We work directly with publishers,
            developers, and authorized distributors to bring you genuine digital codes and
            licenses at competitive prices.
          </p>
          <p>
            We believe every gamer deserves access to the latest titles without overpaying.
            Our platform supports all major platforms — PlayStation, Xbox, PC, Steam, Epic Games,
            and more — with instant digital delivery to your email.
          </p>
        </Prose>
      </PageSection>

      {/* Values */}
      <PageSection title="Why Choose Elite Games">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard
            icon={<ShieldCheck size={18} />}
            title="Authorized Seller"
            description="All products are sourced from authorized publishers and distributors. Every code is genuine and guaranteed."
          />
          <InfoCard
            icon={<Zap size={18} />}
            title="Instant Delivery"
            description="Digital codes delivered to your email within seconds of payment confirmation. No waiting, no shipping."
          />
          <InfoCard
            icon={<BadgeCheck size={18} />}
            title="Secure Payments"
            description="PCI-compliant payment processing. We never store raw card numbers, CVV, or PIN data."
          />
          <InfoCard
            icon={<Globe size={18} />}
            title="Global Coverage"
            description="Serving customers in 100+ countries with region-specific codes and local payment support."
          />
        </div>
      </PageSection>

      {/* How it works */}
      <PageSection title="How It Works">
        <div className="space-y-3">
          {[
            { step: "01", title: "Browse & Select", desc: "Find your game, choose your platform, region, and edition." },
            { step: "02", title: "Secure Checkout", desc: "Enter your email and pay securely via card, crypto, or gift card." },
            { step: "03", title: "Instant Delivery", desc: "Your digital code arrives in your inbox within seconds." },
            { step: "04", title: "Redeem & Play", desc: "Redeem on your platform and start playing immediately." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 bg-[#13131d] border border-[#1e1e2a] rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-black text-white">{item.step}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-black text-white mb-3">Ready to play?</h2>
        <p className="text-[#9ca3af] text-sm mb-6">Browse thousands of digital games across all platforms.</p>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors"
        >
          Browse Games
        </Link>
      </div>
    </PageLayout>
  );
}
