import { Metadata } from "next";
import { PageLayout, PageSection, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Cookie Policy — Elite Games" };

const COOKIE_TYPES = [
  { name: "Essential Cookies", required: true, desc: "Required for core site functionality — cart, session, security. Cannot be disabled.", examples: ["cart", "session_id", "csrf_token"] },
  { name: "Analytics Cookies", required: false, desc: "Help us understand how visitors interact with the site. Used to improve performance and UX.", examples: ["_ga", "_gid", "pageview_count"] },
  { name: "Preference Cookies", required: false, desc: "Remember your settings such as currency, language, and region preferences.", examples: ["currency_pref", "region_pref"] },
];

export default function CookiePolicyPage() {
  return (
    <PageLayout title="Cookie Policy" subtitle="Last updated: November 2025. This policy explains how Elite Games uses cookies." breadcrumbs={[{ label: "Cookie Policy" }]} badge="Legal">
      <PageSection title="What Are Cookies?">
        <Prose><p>Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the platform.</p></Prose>
      </PageSection>

      <PageSection title="Cookies We Use">
        <div className="space-y-4">
          {COOKIE_TYPES.map((ct) => (
            <div key={ct.name} className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-white">{ct.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ct.required ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-[#6b7280] bg-[#1c1c28] border-[#252535]"}`}>
                  {ct.required ? "REQUIRED" : "OPTIONAL"}
                </span>
              </div>
              <p className="text-xs text-[#9ca3af] mb-3 leading-relaxed">{ct.desc}</p>
              <div className="flex flex-wrap gap-2">
                {ct.examples.map((ex) => (
                  <code key={ex} className="text-[10px] bg-[#0e0e18] border border-[#252535] text-[#6b7280] px-2 py-0.5 rounded font-mono">{ex}</code>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="Managing Cookies">
        <Prose>
          <p>You can control cookies through your browser settings. Disabling essential cookies will affect site functionality. Most browsers allow you to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>View cookies stored on your device</li>
            <li>Delete existing cookies</li>
            <li>Block cookies from specific websites</li>
            <li>Block all cookies (may break site functionality)</li>
          </ul>
          <p>Refer to your browser's help documentation for specific instructions.</p>
        </Prose>
      </PageSection>

      <PageSection title="Third-Party Cookies">
        <Prose><p>Our payment processors and analytics providers may set their own cookies. These are governed by their respective privacy policies. We do not control third-party cookies.</p></Prose>
      </PageSection>
    </PageLayout>
  );
}
