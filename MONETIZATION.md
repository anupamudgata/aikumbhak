# Monetizing Kumbhak — Lifetime Unlock

Model: **free app + a one-time ₹499 payment that unlocks Pro forever.** No subscription.
This reuses your BhartPostAI stack (Razorpay + Supabase + Vercel) almost entirely.

## How it works

```
Browser (index.html)
  │  taps "Unlock Pro"
  ▼
POST /api/create-order ───────────────► Razorpay (creates an order)
  │  Razorpay Checkout opens, user pays
  ▼
Razorpay calls handler with payment id + signature
  │
POST /api/verify-payment ─────────────► verify HMAC signature (key secret)
  │  if valid: write plan='pro' to Supabase (service-role key)
  ▼
GET /api/me  (on every app load) ─────► returns { pro: true } from Supabase
  │
Locked techniques unlock. Flag lives on the SERVER, so it can't be forged.
```

Premium "value" lives behind that flag: all techniques, the Kumbhak breath-hold
trainer, cross-device sync, and (later) guided programs + soundscapes.

## Status

- [x] **Phase 1 — done (this commit).** Free/Pro split, lock badges, upgrade screen,
      Razorpay checkout wiring, server-verified entitlement seam, safety disclaimer.
      Runs locally with a labeled **dev "simulate unlock"** (no real payment) so you
      can preview the whole flow now.
- [x] **Phase 2 code — done.** `/api/create-order`, `/api/verify-payment`, `/api/me`,
      `/api/restore` written (Vercel Node functions), plus client Supabase auth +
      bearer-token wiring, `package.json`, `vercel.json`. Signature-verified, RLS-safe.
- [ ] **Phase 2 go-live — needs your accounts.** Create Supabase + Razorpay, set env vars,
      fill `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`RAZORPAY_KEY_ID` in `index.html`, deploy.
- [ ] **Mobile (App Store + Play Store)** — see **MOBILE.md**. Key rule: stores require
      Apple/Google in-app purchase (not Razorpay); wrap with Capacitor + RevenueCat,
      same entitlement backend. Ship web first to prove demand.

## What only you can do (Phase 2 checklist)

1. **Supabase** — create a project, open the SQL editor, run `supabase-schema.sql`.
   Enable **Email (magic link)** under Authentication → Providers.
2. **Razorpay** — sign up, complete KYC (needed for live payments), grab the
   **Key ID** + **Key Secret** (Dashboard → Settings → API Keys). Start in **Test mode**.
3. **Secrets** — copy `.env.example` → `.env.local`, fill in the Razorpay + Supabase
   values. Add the same vars in Vercel → Project → Settings → Environment Variables.
4. **Deploy** — push this folder to a GitHub repo, import it in Vercel. The static
   `index.html` + the `/api` functions deploy together.
5. **Go live** — in `index.html` set `RAZORPAY_KEY_ID` to your real key and
   `API_BASE = ""`. Flip Razorpay to **Live mode** only after a successful test payment.

## Security (don't skip)

- The **Key Secret** and **service-role key** stay server-side (env vars) — never in
  `index.html`. Only the `rzp_...` **Key ID** is safe to expose.
- Always **verify the Razorpay signature** server-side before granting Pro. The client
  `handler` firing is not proof of payment.
- Grant Pro by writing to Supabase with the **service-role key**; RLS blocks clients
  from writing their own `plan`.

## Legal / store

- **Health disclaimer** — shipped (safety screen on first run). Keep it.
- **Privacy policy, Terms, Refund policy** — reuse your BhartPostAI templates; refund
  policy is required by Razorpay.
- **PWA, not Play Store, first** — an installable web app avoids Google Play's 15–30%
  cut on digital goods and its in-app-billing requirement.

## Pricing knobs

- `index.html` → `PRICE` (display) and `FREE_IDS` (which techniques are free).
- `.env` → `PRO_PRICE_PAISE` (the amount actually charged; 49900 = ₹499).
