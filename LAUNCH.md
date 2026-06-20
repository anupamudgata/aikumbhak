# Kumbhak — Launch Runbook (tailored to your Mac)

Detected on your machine: **Node 22 ✓, npm ✓, git ✓**. Missing (install only when you reach
that step): **Xcode, CocoaPods, JDK, Android Studio**.

Do it in this order — it saves weeks and money:

```
WEB (live in ~a day)  →  ANDROID (cheap, but start the 14-day test early)  →  iOS (last)
```

---

## STEP 1 — Web / PWA go-live (no installs needed; do this first)

Goal: a live, paid product to validate that people pay ₹499 before the store grind.
Full detail in `MONETIZATION.md`; the short version:

1. **Supabase** (free): create a project → SQL editor → paste & run `supabase-schema.sql` →
   Authentication → Providers → enable **Email**. Copy the **Project URL** + **anon key**.
2. **Razorpay**: sign up, stay in **Test mode** for now → Settings → API Keys → copy **Key ID** + **Key Secret**.
3. **Anthropic** (for the AI coach): console.anthropic.com → API key.
4. In `index.html` set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `RAZORPAY_KEY_ID`.
   Put the **secrets** (`RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
   `REVENUECAT_WEBHOOK_AUTH`) in Vercel env vars — never in the client. (`.env.example` lists them all.)
5. **Deploy**: push this folder to GitHub → import on **Vercel**. The static app + `/api/*` deploy together.
6. Test a payment in Razorpay **Test mode**, confirm Pro unlocks, then flip Razorpay to **Live**.

➡️ At this point you have a real product. The store steps below are optional upside.

---

## STEP 2 — Install native build tools (only when going to stores)

**For Android** (do this one first — cheaper, faster):
- Install **Android Studio**: https://developer.android.com/studio (bundles the JDK + SDK — fixes the "no Java" finding).
- Open it once → let it finish "SDK Components Setup".

**For iOS** (later):
- Install **Xcode** from the Mac App Store (large download), then run:
  ```sh
  xcode-select --install            # command-line tools
  brew install cocoapods            # or: sudo gem install cocoapods
  ```

---

## STEP 3 — Build the native shells (CLI — I can run these with you)

From `~/Desktop/kumbhak`:
```sh
npm install                 # installs Capacitor + RevenueCat (works now — Node is present)
npm run build:www           # stages the web app into www/
npx cap add android         # needs Android Studio installed (Step 2)
npx cap add ios             # needs Xcode + CocoaPods (Step 2)
npm run cap:sync            # copies web + native plugins
npm run cap:android         # opens Android Studio  → Run on a device/emulator
npm run cap:ios             # opens Xcode           → Run on a device/simulator
```

---

## STEP 4 — RevenueCat (free; powers in-app purchase on both stores)

1. revenuecat.com → new project → add your iOS app + Android app.
2. Create a **non-consumable** product `kumbhak_pro_lifetime` (₹499) in **App Store Connect** and
   **Play Console**, then add both to a RevenueCat **Offering**.
3. Copy RevenueCat's **public SDK key** → set `REVENUECAT_API_KEY` in `index.html`.
4. RevenueCat → Webhooks → URL `https://<your-app>/api/iap-webhook`, header
   `Authorization: Bearer <secret>`; set the same `<secret>` as `REVENUECAT_WEBHOOK_AUTH` in Vercel env.
   (This is what flips `entitlements.plan` to `pro` after a store purchase — already coded.)

---

## STEP 5 — Google Play ($25 one-time)

1. play.google.com/console → pay $25, create the app.
2. ⚠️ **New personal accounts must run a 14-day closed test with 20 testers before production.**
   Start this early. (Company/org accounts may be exempt — depends on Google's current policy.)
3. Upload the build from Android Studio (Step 3) as an **internal/closed** track → invite testers.
4. Fill the **Data Safety** form, store listing, screenshots; keep the in-app **health disclaimer**.
5. After the 14-day test, apply for production access → submit for review.
   *(Google Play takes 15% of the first $1M/yr automatically.)*

---

## STEP 6 — Apple App Store ($99/yr)

1. developer.apple.com → enroll ($99/yr). **Individual** is fastest; an **organization** account needs a
   D-U-N-S number (free, a few days) — relevant if you launch under your OPC.
2. Enroll in the **App Store Small Business Program** → 15% fee (instead of 30%) while under $1M/yr.
3. App Store Connect → create the app → set up the IAP product (Step 4).
4. In Xcode (Step 3): set the **Bundle ID** to `com.kumbhak.app`, pick your **Team**, let Xcode manage signing,
   Archive → upload to App Store Connect.
5. Add screenshots + privacy nutrition labels + the health disclaimer → submit for review (usually 1–3 days).

---

## Costs & time (rough)

| | Cost | Time-to-live |
|---|---|---|
| Web / PWA | ~₹0 (free tiers) | ~1 day |
| Google Play | $25 once | ~2–3 weeks (14-day test gate) |
| Apple App Store | $99 / year | ~1 week |

Banking/tax: both stores need a bank account + tax details (PAN/GST) for payouts.

**You can stop after STEP 1 and still have a real, earning product.** Stores are upside, not a prerequisite.
