"use client";

import { useState } from "react";
import { Mail, MessageSquare, Clock, Send, CheckCircle } from "lucide-react";
import { PageLayout, PageSection, InfoCard } from "@/components/ui/PageLayout";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputClass = "w-full bg-[#12121a] border border-[#252535] hover:border-[#353550] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl px-4 py-3 text-white text-sm placeholder-[#3d3d52] focus:outline-none transition-all";

  return (
    <PageLayout
      title="Contact Us"
      subtitle="Have a question, issue, or feedback? We're here to help."
      breadcrumbs={[{ label: "Contact" }]}
      badge="Get in Touch"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">

        {/* Contact form */}
        <div>
          {submitted ? (
            <div className="flex flex-col items-center gap-5 py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-2">Message Sent!</h2>
                <p className="text-[#9ca3af] text-sm max-w-sm">
                  Thanks for reaching out. Our support team will respond to <strong className="text-white">{form.email}</strong> within 24 hours.
                </p>
              </div>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Your Name</label>
                  <input id="c-name" type="text" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="John Smith" autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="c-email" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Email Address</label>
                  <input id="c-email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="your@email.com" autoComplete="email" />
                </div>
              </div>
              <div>
                <label htmlFor="c-subject" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Subject</label>
                <select id="c-subject" required value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className={inputClass + " cursor-pointer"}>
                  <option value="">Select a topic…</option>
                  <option value="order">Order Issue</option>
                  <option value="delivery">Delivery Problem</option>
                  <option value="payment">Payment Question</option>
                  <option value="refund">Refund Request</option>
                  <option value="product">Product Enquiry</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-message" className="block text-sm font-semibold text-[#c0c0d0] mb-2">Message</label>
                <textarea id="c-message" required rows={5} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} className={inputClass + " resize-none"} placeholder="Describe your issue or question in detail…" />
              </div>
              <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors">
                <Send size={16} />
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <InfoCard icon={<Mail size={18} />} title="Email Support" description="support@elitegames.com — we respond within 24 hours on business days." />
          <InfoCard icon={<MessageSquare size={18} />} title="Live Chat" description="Available on the site during business hours. Look for the chat widget in the bottom right." />
          <InfoCard icon={<Clock size={18} />} title="Response Times" description="Standard: 24 hours · Urgent order issues: 4–6 hours · Payment issues: 2 hours." />

          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs font-semibold text-white mb-1">Order Support</p>
            <p className="text-xs text-[#9ca3af] leading-relaxed">For faster help with an existing order, use our <a href="/order-support" className="text-blue-400 hover:underline">Order Support</a> page and include your order number.</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
