# ELITE GAMES

Premium digital gaming marketplace built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Overview

Elite Games is an authorized third-party gaming marketplace where customers can purchase legitimate digital games, game codes, digital licenses, and other supported gaming products.

**Current Phase:** Phase 1 — Visual Foundation ✅

- ✅ Elite Games branding & logo
- ✅ Global design system (spacing, colors, typography)
- ✅ Responsive header with search
- ✅ Secondary navigation
- ✅ Hero carousel
- ✅ Game cards (featured, trending, popular)
- ✅ Platform cards
- ✅ Trust bar
- ✅ Footer
- ✅ Product detail pages
- ✅ Shopping cart
- ✅ Checkout flow (frontend)
- ✅ Mobile responsive design

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **State:** Zustand (cart)
- **Database:** PostgreSQL + Prisma (schema ready, integration pending)
- **Validation:** Zod (ready for integration)
- **Icons:** Lucide React
- **Image Optimization:** Next.js Image

## Project Structure

```
elite-games/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── games/
│   │   ├── page.tsx          # Games listing
│   │   └── [slug]/           # Product detail pages
│   ├── cart/page.tsx         # Shopping cart
│   ├── checkout/page.tsx     # Checkout
│   └── not-found.tsx         # 404
├── components/
│   ├── ui/                   # Reusable UI primitives
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   └── StarRating.tsx
│   ├── layout/               # Layout components
│   │   ├── PromoBar.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── EliteLogo.tsx
│   │   ├── SearchBar.tsx
│   │   └── CartIcon.tsx
│   ├── marketplace/          # Marketplace-specific
│   │   ├── HeroCarousel.tsx
│   │   ├── GameCard.tsx
│   │   ├── PlatformCard.tsx
│   │   ├── ProductPage.tsx
│   │   ├── CartView.tsx
│   │   ├── SectionHeader.tsx
│   │   └── TrustBar.tsx
│   └── checkout/
│       └── CheckoutView.tsx
├── lib/
│   ├── utils.ts              # Utility functions
│   ├── utils-game.ts         # Game-specific utilities
│   ├── data/
│   │   ├── games.ts          # Game catalog (seeded data)
│   │   └── platforms.ts      # Platform definitions
│   └── store/
│       └── cart.ts           # Zustand cart store
├── types/
│   └── index.ts              # TypeScript types
├── public/
│   └── images/               # Static assets
├── prisma/
│   └── schema.prisma         # Database schema (pending)
└── next.config.ts

```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL (for Phase 2+)

### Installation

```bash
cd elite-games
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Type Check

```bash
npx tsc --noEmit
```

## Design System

### Colors

- **Background:** `#0a0a0f` (eg-black)
- **Card:** `#16161e` (eg-card)
- **Border:** `#2a2a3a` (eg-border)
- **Text:** `#ffffff` (eg-text)
- **Text Secondary:** `#9ca3af` (eg-text-secondary)
- **Text Muted:** `#6b7280` (eg-text-muted)
- **Primary (Blue):** `#3b82f6`
- **Secondary (Purple):** `#8b5cf6`
- **Accent (Green):** `#10b981`
- **Accent (Yellow):** `#f59e0b`
- **Accent (Red):** `#ef4444`

### Spacing

The design follows a consistent spacing scale:

- **Mobile:** 16–24px page padding
- **Tablet:** 32–48px page padding
- **Desktop:** 48–80px page padding
- **Large Desktop:** 80–120px depending on section

### Typography

- **Font Family:** Geist (system fallback: Arial, sans-serif)
- **Weights:** 300 (light), 400 (regular), 600 (semibold), 700 (bold), 900 (black)

## Features

### Implemented

- ✅ Homepage with hero carousel
- ✅ Featured games section
- ✅ Platform explorer
- ✅ Product catalog (games listing)
- ✅ Product detail pages with variant selection (platform/region/edition)
- ✅ Add to cart functionality
- ✅ Shopping cart with quantity controls
- ✅ Checkout form (customer info, payment method selection)
- ✅ Persistent cart (localStorage via Zustand)
- ✅ Responsive design (mobile → desktop)
- ✅ Search bar with instant results
- ✅ Trust indicators
- ✅ Accessibility (semantic HTML, ARIA labels, keyboard navigation)

### Pending (Phase 2+)

- ⏳ Database integration (Prisma + PostgreSQL)
- ⏳ API routes (product CRUD, order creation)
- ⏳ Payment provider integration (Stripe/similar)
- ⏳ Payment webhooks
- ⏳ Order fulfillment system
- ⏳ Digital code inventory management
- ⏳ Email delivery (Resend/SendGrid)
- ⏳ Admin dashboard
- ⏳ Security hardening (rate limiting, CSRF)
- ⏳ SEO optimization (structured data)
- ⏳ Testing (Jest, Playwright)

## Payment Architecture

Elite Games is designed with **PCI-compliant payment processing** in mind:

### Supported Payment Methods (UI)

- **Credit Card** — 3D Secure may be required
- **Debit Card** — Bank PIN/authentication may be required (handled by payment provider)
- **Cryptocurrency** — BTC, ETH, USDT, LTC
- **Apple Gift Card** — Coming soon
- **Steam Gift Card** — Coming soon

### Security Requirements

Elite Games **must never** directly collect or store:

- Raw card numbers (PAN)
- CVV/CVC
- Debit card PIN

All sensitive payment data must be handled by a **PCI-compliant payment processor** (e.g., Stripe, Adyen, Checkout.com).

Elite Games may store:

- Payment provider customer ID
- Payment method token
- Transaction ID
- Card brand (Visa, Mastercard, etc.)
- Last four digits
- Payment status

PIN entry (for debit cards) occurs **within the bank/payment provider's secure authentication flow**, not within Elite Games.

## Digital Delivery

Products have a `deliveryType`:

- `DIGITAL_CODE` — Game code delivered via email
- `DIRECT_ACTIVATION` — Activated directly to customer account
- `MANUAL_FULFILLMENT` — Requires manual processing
- `ACCOUNT` — Full account credentials provided

Digital codes are:

- Encrypted at rest
- Assigned from inventory on successful payment
- Delivered via transactional email (Resend/SendGrid)
- Tracked with delivery status

## Order Flow

```
Customer places order
        ↓
Backend validates product
        ↓
Backend calculates price
        ↓
Payment initiated
        ↓
Payment verified
        ↓
Order marked PAID
        ↓
Fulfillment begins
        ↓
Digital product/code assigned
        ↓
Delivery email sent
        ↓
Order marked COMPLETED
```

## Catalog

Initial catalog includes:

- **EA Sports FC 26** (PlayStation, Xbox, PC)
- **Phantom Blade Zero** (PlayStation, PC)
- **Call of Duty: Modern Warfare 4** (PlayStation, Xbox, Steam)
- **Silent Hill 2** (PlayStation, PC)
- **Grand Theft Auto VI** (PlayStation, Xbox)

Products are stored in `lib/data/games.ts` for now and will migrate to PostgreSQL in Phase 2.

## Environment Variables

Create `.env` (not committed to Git):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/elitegames"

# Payment Provider (example: Stripe)
PAYMENT_PROVIDER_SECRET_KEY=""
PAYMENT_WEBHOOK_SECRET=""

# Email
EMAIL_PROVIDER_API_KEY=""

# Crypto Payment
CRYPTO_PAYMENT_API_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Image Assets

Currently using placeholder SVGs. Replace with actual game artwork:

- `public/images/game-art/` — Product cover images (3:4 aspect ratio)
- `public/images/banners/` — Hero carousel images (16:7 aspect ratio)
- `public/images/platform-art/` — Platform logos

## Spacing & Padding Best Practices

**Critical:** The interface uses generous spacing for a premium feel.

- Headers: 64-72px height (desktop)
- Section padding: 40-64px vertical
- Card padding: 14-20px internal
- Page margins: 64-128px horizontal (desktop)
- Grid gaps: 16-20px

Always reference the supplied design screenshots for spatial hierarchy.

## Accessibility

- Semantic HTML (`<nav>`, `<main>`, `<article>`, `<section>`)
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Focus states for interactive elements
- Alt text for images
- Color contrast (WCAG AA minimum)

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Android (last 2 versions)

## License

© 2025 Elite Games. All rights reserved.

This is a proprietary commercial application. All trademarks belong to their respective owners.

---

## Next Steps

### Immediate (Phase 2)

1. Set up PostgreSQL database
2. Initialize Prisma schema
3. Migrate seeded game data to database
4. Create API routes for products, cart, orders
5. Integrate payment provider (Stripe recommended)
6. Set up payment webhooks
7. Implement order fulfillment logic
8. Set up transactional email provider (Resend recommended)
9. Create email templates for order confirmation + digital delivery

### Phase 3

1. Security audit (rate limiting, CSRF, XSS prevention)
2. Admin dashboard for product/order management
3. Digital code inventory system
4. Crypto payment integration (Coinbase Commerce / NOWPayments)
5. Testing suite (unit + E2E)
6. Performance optimization
7. SEO + structured data
8. Analytics (Plausible / Umami)

### Phase 4

1. User review system (optional — no user accounts)
2. Gift card redemption (Apple/Steam integration)
3. Wishlist (localStorage-based)
4. Multi-currency support
5. International payment methods
6. Refund/dispute handling
7. Fraud detection

---

**Questions?**

Refer to the inline code comments and the original requirements document for implementation details.
#   o p 1 9  
 #   o p 1 9 b e t a  
 