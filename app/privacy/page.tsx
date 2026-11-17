import { Metadata } from "next";
import { PageLayout, PageSection, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Privacy Policy — Elite Games" };

export default function PrivacyPage() {
  return (
    <PageLayout title="Privacy Policy" subtitle="Last updated: November 2025. We take your privacy seriously." breadcrumbs={[{ label: "Privacy Policy" }]} badge="Legal">
      <PageSection title="1. Information We Collect">
        <Prose>
          <p><strong className="text-white">Order information:</strong> Email address, name, country, and order details when you make a purchase.</p>
          <p><strong className="text-white">Payment metadata:</strong> Card brand, last 4 digits, payment provider transaction ID. We never store raw card numbers, CVV, or PIN.</p>
          <p><strong className="text-white">Usage data:</strong> IP address, browser type, pages visited, and interaction data to improve our service.</p>
        </Prose>
      </PageSection>
      <PageSection title="2. How We Use Your Information">
        <Prose>
          <ul className="list-disc pl-5 space-y-1">
            <li>Processing and fulfilling your orders</li>
            <li>Sending digital products and order confirmation emails</li>
            <li>Customer support and dispute resolution</li>
            <li>Fraud detection and prevention</li>
            <li>Improving our platform and services</li>
          </ul>
        </Prose>
      </PageSection>
      <PageSection title="3. Data Sharing">
        <Prose>
          <p>We do not sell your personal information. We share data only with:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Payment processors</strong> — to process transactions securely</li>
            <li><strong className="text-white">Email providers</strong> — to deliver order confirmations and digital products</li>
            <li><strong className="text-white">Fraud prevention services</strong> — to protect against unauthorized transactions</li>
            <li><strong className="text-white">Legal authorities</strong> — when required by law</li>
          </ul>
        </Prose>
      </PageSection>
      <PageSection title="4. Data Retention">
        <Prose><p>Order data is retained for 7 years for accounting and legal compliance purposes. Email addresses are retained until you request deletion. Payment metadata is retained as required by our payment processors.</p></Prose>
      </PageSection>
      <PageSection title="5. Your Rights">
        <Prose>
          <p>Depending on your location, you may have rights to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to processing of your data</li>
            <li>Data portability</li>
          </ul>
          <p>To exercise these rights, contact privacy@elitegames.com.</p>
        </Prose>
      </PageSection>
      <PageSection title="6. Cookies">
        <Prose><p>We use essential cookies for cart functionality and session management. Analytics cookies are used to improve our platform. See our <a href="/cookies" className="text-blue-400 hover:underline">Cookie Policy</a> for details.</p></Prose>
      </PageSection>
      <PageSection title="7. Security">
        <Prose><p>We implement industry-standard security measures including HTTPS encryption, secure payment tokenization, and access controls. No system is 100% secure — if you suspect a security issue, contact us immediately at security@elitegames.com.</p></Prose>
      </PageSection>
    </PageLayout>
  );
}
