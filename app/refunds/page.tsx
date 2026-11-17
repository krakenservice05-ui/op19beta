import { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { PageLayout, PageSection, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Refund Policy — Elite Games" };

export default function RefundPolicyPage() {
  return (
    <PageLayout title="Refund Policy" subtitle="Please read our refund policy carefully before making a purchase." breadcrumbs={[{ label: "Refund Policy" }]} badge="Legal">
      <div className="bg-amber-500/8 border border-amber-500/25 rounded-2xl p-5 mb-10 flex items-start gap-3">
        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-white mb-1">Important Notice</p>
          <p className="text-xs text-[#9ca3af] leading-relaxed">Digital products are generally non-refundable once the code has been revealed or the product has been accessed. Please review this policy carefully before purchasing.</p>
        </div>
      </div>

      <PageSection title="General Policy">
        <Prose>
          <p>Elite Games sells digital products including game codes, gift cards, and subscriptions. Due to the nature of digital goods, our refund policy is strict but fair.</p>
          <p>Once a digital code has been revealed, delivered to your email, or accessed through your order, it is considered used and is non-refundable.</p>
        </Prose>
      </PageSection>

      <PageSection title="Eligible for Refund">
        <div className="space-y-3">
          {[
            "Code was not delivered within 24 hours and you have not received it",
            "Code was delivered but is invalid, expired, or already used through no fault of your own",
            "Product was significantly different from the description on the product page",
            "Duplicate charge occurred on the same order",
            "Payment was processed but order was never created",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-green-500/8 border border-green-500/15 rounded-xl">
              <CheckCircle size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#9ca3af]">{item}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="Not Eligible for Refund">
        <div className="space-y-3">
          {[
            "Code has been revealed and/or redeemed on a platform",
            "You purchased the wrong region, platform, or edition",
            "You changed your mind after purchase",
            "Your device or account is not compatible with the product",
            "More than 72 hours have passed since delivery",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl">
              <XCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#9ca3af]">{item}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="How to Request a Refund">
        <Prose>
          <p>To request a refund, contact our support team within <strong className="text-white">72 hours</strong> of your purchase:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to the <Link href="/contact" className="text-blue-400 hover:underline">Contact page</Link> or email support@elitegames.com</li>
            <li>Include your Order Number (format: EG-XXXXXXXX)</li>
            <li>Describe the issue in detail and include any relevant screenshots</li>
            <li>Our team will respond within 24 hours</li>
          </ol>
          <p>Approved refunds are processed within 5–10 business days to your original payment method.</p>
        </Prose>
      </PageSection>

      <PageSection title="Crypto Payments">
        <Prose>
          <p>Refunds for orders paid via Solana or other cryptocurrency will be issued in the equivalent USD value at the time of the original transaction, not the current exchange rate.</p>
          <p>Crypto refunds are subject to the same eligibility criteria as card payments.</p>
        </Prose>
      </PageSection>

      <div className="mt-6 p-6 bg-[#13131d] border border-[#1e1e2a] rounded-2xl text-center">
        <p className="text-sm text-[#9ca3af] mb-4">Still have questions about our refund policy?</p>
        <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">Contact Support</Link>
      </div>
    </PageLayout>
  );
}
