import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PromoBar } from "@/components/layout/PromoBar";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000"),
  title: {
    default: "Elite Games — Premium Digital Gaming Marketplace",
    template: "%s | Elite Games",
  },
  description:
    "Buy digital game codes, gift cards, and subscriptions for PlayStation, Xbox, PC, Steam, and more. Secure payments, instant delivery.",
  keywords: ["digital games", "game codes", "gift cards", "PlayStation", "Xbox", "Steam", "PC games"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "Elite Games",
    title: "Elite Games — Premium Digital Gaming Marketplace",
    description:
      "Buy digital game codes, gift cards, and subscriptions. Secure payments, instant delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Elite Games",
    description: "Premium Digital Gaming Marketplace",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable}`} data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased flex flex-col">
        <PromoBar />
        <Header />
        <main className="flex-1" id="main-content">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
