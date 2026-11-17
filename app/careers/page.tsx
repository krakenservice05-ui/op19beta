import { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Globe, Zap } from "lucide-react";
import { PageLayout, PageSection, InfoCard, Prose } from "@/components/ui/PageLayout";

export const metadata: Metadata = { title: "Careers — Elite Games" };

export default function CareersPage() {
  return (
    <PageLayout title="Careers at Elite Games" subtitle="Help us build the world's best digital gaming marketplace." breadcrumbs={[{ label: "Careers" }]} badge="We're Hiring">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
        <InfoCard icon={<Globe size={18} />} title="Remote-First" description="Work from anywhere. We hire globally and support distributed teams." />
        <InfoCard icon={<Zap size={18} />} title="Fast-Moving" description="Small, focused team with real impact. No bureaucracy, ship fast." />
        <InfoCard icon={<Briefcase size={18} />} title="Competitive Pay" description="Market-rate salaries, equity options, and performance bonuses." />
      </div>

      <PageSection title="Open Positions">
        <div className="space-y-3">
          {[
            { title: "Senior Full-Stack Engineer", team: "Engineering", type: "Full-time · Remote" },
            { title: "Product Designer (UI/UX)", team: "Design", type: "Full-time · Remote" },
            { title: "Customer Support Specialist", team: "Support", type: "Full-time · Remote" },
            { title: "Digital Partnerships Manager", team: "Business", type: "Full-time · Remote" },
          ].map((job) => (
            <div key={job.title} className="flex items-center justify-between gap-4 p-5 bg-[#13131d] border border-[#1e1e2a] rounded-xl hover:border-blue-500/30 transition-colors">
              <div>
                <p className="text-sm font-bold text-white">{job.title}</p>
                <p className="text-xs text-[#6b7280] mt-0.5">{job.team} · {job.type}</p>
              </div>
              <Link href="/contact" className="flex-shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                Apply
              </Link>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="Don't See a Fit?">
        <Prose>
          <p>We're always looking for talented people. Send your CV and a short note about what you'd like to do at Elite Games to <a href="mailto:careers@elitegames.com" className="text-blue-400 hover:underline">careers@elitegames.com</a>.</p>
        </Prose>
      </PageSection>
    </PageLayout>
  );
}
