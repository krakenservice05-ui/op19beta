import { Metadata } from "next";
import { PageLayout, PageSection, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Terms of Service — Elite Games" };

export default function TermsPage() {
  return (
    <PageLayout title="Terms of Service" subtitle="Last updated: November 2025" breadcrumbs={[{ label: "Terms of Service" }]} badge="Legal">
      <PageSection title="1. Acceptance of Terms">
        <Prose><p>By accessing or using the Elite Games platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our service.</p></Prose>
      </PageSection>
      <PageSection title="2. Products and Services">
        <Prose>
          <p>Elite Games sells digital products including game codes, gift cards, and digital subscriptions. All products are sourced from authorized publishers and distributors.</p>
          <p>Prices, availability, and product descriptions are subject to change without notice. We reserve the right to cancel orders at our discretion.</p>
        </Prose>
      </PageSection>
      <PageSection title="3. Orders and Payment">
        <Prose>
          <p>By placing an order, you confirm that the payment details provided are accurate and you are authorized to use the payment method.</p>
          <p>Orders are binding once payment is confirmed. We reserve the right to cancel suspicious or fraudulent orders and report them to relevant authorities.</p>
          <p>Prices displayed are in USD. Payments are processed by our PCI-compliant payment providers. Elite Games does not store raw card numbers, CVV, or PIN data.</p>
        </Prose>
      </PageSection>
      <PageSection title="4. Digital Delivery">
        <Prose>
          <p>Digital products are delivered to the email address provided at checkout. It is your responsibility to provide a valid, accessible email address.</p>
          <p>Once a digital code has been delivered and revealed, it is considered used. Elite Games is not responsible for codes that are redeemed by unauthorized third parties after delivery.</p>
        </Prose>
      </PageSection>
      <PageSection title="5. Prohibited Use">
        <Prose>
          <ul className="list-disc pl-5 space-y-1">
            <li>Purchasing products for resale without prior authorization</li>
            <li>Using bots, scripts, or automated tools to place orders</li>
            <li>Providing false information during checkout</li>
            <li>Attempting to circumvent regional restrictions</li>
            <li>Fraudulent chargebacks or payment disputes without valid grounds</li>
          </ul>
        </Prose>
      </PageSection>
      <PageSection title="6. Intellectual Property">
        <Prose><p>All game titles, trademarks, and logos belong to their respective publishers and developers. Elite Games is an authorized reseller and does not claim ownership of any third-party intellectual property.</p></Prose>
      </PageSection>
      <PageSection title="7. Limitation of Liability">
        <Prose><p>Elite Games is not liable for any indirect, incidental, or consequential damages arising from your use of our platform. Our liability is limited to the value of the order in question.</p></Prose>
      </PageSection>
      <PageSection title="8. Changes to Terms">
        <Prose><p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms. We will notify users of significant changes via email where possible.</p></Prose>
      </PageSection>
      <PageSection title="9. Contact">
        <Prose><p>For questions about these Terms of Service, contact us at legal@elitegames.com or through our <a href="/contact" className="text-blue-400 hover:underline">Contact page</a>.</p></Prose>
      </PageSection>
    </PageLayout>
  );
}
