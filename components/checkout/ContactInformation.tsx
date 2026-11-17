"use client";

import { CustomerInfo, CustomerErrors } from "@/types/checkout";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "NG", name: "Nigeria" },
  { code: "ZA", name: "South Africa" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "UAE" },
  { code: "OTHER", name: "Other" },
];

interface Props {
  info: CustomerInfo;
  errors: CustomerErrors;
  onChange: (info: Partial<CustomerInfo>) => void;
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full bg-[#12121a] border rounded-xl px-4 py-3.5 text-white text-sm",
    "placeholder-[#3d3d52] transition-all duration-150",
    "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50",
    hasError
      ? "border-red-500/70 bg-red-500/5"
      : "border-[#252535] hover:border-[#353550]"
  );
}

export function ContactInformation({ info, errors, onChange }: Props) {
  return (
    <section
      className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-6 lg:p-8"
      aria-label="Contact information"
    >
      {/* Section heading */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Contact Information</h2>
        <p className="text-sm text-[#6b7280] mt-1">
          Your order confirmation and digital delivery will be sent to this email.
        </p>
      </div>

      <div className="space-y-5">
        {/* Email — primary field */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#c0c0d0] mb-2">
            Email Address <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={info.email}
            onChange={(e) => onChange({ email: e.target.value })}
            className={inputClass(!!errors.email)}
            placeholder="your@email.com"
            autoComplete="email"
            aria-required="true"
            aria-describedby="email-help email-error"
          />
          {errors.email ? (
            <p id="email-error" className="text-xs text-red-400 mt-1.5 flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠</span> {errors.email}
            </p>
          ) : (
            <p id="email-help" className="text-xs text-[#4b5563] mt-1.5">
              Your digital game code will be delivered to this address after payment.
            </p>
          )}
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-[#c0c0d0] mb-2">
              First Name <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={info.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className={inputClass(!!errors.firstName)}
              placeholder="John"
              autoComplete="given-name"
              aria-required="true"
            />
            {errors.firstName && (
              <p className="text-xs text-red-400 mt-1.5" role="alert">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-[#c0c0d0] mb-2">
              Last Name <span className="text-red-400" aria-hidden="true">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={info.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
              className={inputClass(!!errors.lastName)}
              placeholder="Smith"
              autoComplete="family-name"
              aria-required="true"
            />
            {errors.lastName && (
              <p className="text-xs text-red-400 mt-1.5" role="alert">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-semibold text-[#c0c0d0] mb-2">
            Country / Region <span className="text-red-400" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <select
              id="country"
              value={info.country}
              onChange={(e) => onChange({ country: e.target.value })}
              className={cn(
                inputClass(!!errors.country),
                "appearance-none cursor-pointer pr-10"
              )}
              aria-required="true"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
                <path d="M1 1L6 7L11 1" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
