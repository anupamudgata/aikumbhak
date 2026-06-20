# Shipping Kumbhak to the App Store & Play Store

You already have a working web app. The fastest, no-rewrite path to native apps is to
**wrap the same code with [Capacitor](https://capacitorjs.com/)** — one codebase, three
stores (web, iOS, Android). But there's a hard rule about money you must design around.

## ⚠️ The in-app purchase rule (read first)

Apple and Google **require their own billing for digital goods sold inside the app.**

| Platform | Payment you MUST use | Their cut |
|----------|----------------------|-----------|
| Web / PWA | **Razorpay** (what we built) | ~2% |
| iOS App Store | **Apple In-App Purchase** | 15% (Small Business Program, <$1M/yr) → 30% |
| Google Play | **Google Play Billing** | 15% (first $1M/yr) → 30% |

- Using **Razorpay for the Pro unlock *inside* an iOS app → instant rejection** (App Store
  Guideline 3.1.1). Same risk on Play.
- You may NOT even link out to your web payment from inside the iOS app to dodge the cut
  (the "anti-steering" rules are strict, though loosening in some regions).
- So: **web users pay via Razorpay; app users pay via Apple/Google IAP.** That's expected
  and fine — keep both.

## The design that makes this sane: one entitlement, many sources

All three payment paths write Pro to the **same `entitlements` table**, keyed to the
user's account. Sign in once (same email) and Pro follows you across web → iOS → Android.

```
Razorpay  (web)     ┐
Apple IAP (iOS)     ├──► verify on server ──► entitlements.plan = 'pro' ──► /api/me
Play Billing (and.) ┘                         (source = web|ios|android)
```

The `source` column we added records where each user paid.

### Don't hand-roll IAP — use RevenueCat

Validating Apple receipts and Play purchase tokens (and handling restores, refunds,
sandbox testing) is fiddly. **[RevenueCat](https://www.revenuecat.com/)** wraps both,
has a Capacitor plugin, and is **free under ~$2.5k/mo revenue**. On a successful purchase,
its webhook hits a new `/api/iap-webhook` that flips the same `entitlements` row to `pro`.
This is the recommended path — far less code than raw StoreKit + Play Billing.

## Build steps (when you're ready)

**Already scaffolded in the repo (Phase 3):** `capacitor.config.json`, Capacitor + RevenueCat
deps and `cap:*` scripts in `package.json`, `tools/build-www.mjs` (stages web assets into `www/`),
`/api/iap-webhook.js` (RevenueCat → `entitlements`), and the client paywall already routes to
RevenueCat on native (`Entitlement._nativePurchase`) + `initNativeStore()` identifies the buyer to
RevenueCat as their Supabase user id. So what's left is accounts + the native builds:

1. **Accounts:** Apple Developer ($99/yr), Google Play Console ($25 one-time), RevenueCat (free tier).
2. **Install + add platforms:** `npm install`, then `npm run build:www`, then
   `npx cap add ios` and/or `npx cap add android`, then `npm run cap:sync`.
3. **IAP product:** create a **non-consumable** `kumbhak_pro_lifetime` (₹499) in App Store Connect +
   Play Console; add both to a RevenueCat **offering**. Put the RevenueCat **public SDK key** in
   `index.html` (`REVENUECAT_API_KEY`).
4. **Webhook:** in RevenueCat, point the webhook at `https://<your-app>/api/iap-webhook` with an
   `Authorization: Bearer <secret>` header; set the same secret as `REVENUECAT_WEBHOOK_AUTH` in env.
5. **Open + run:** `npm run cap:ios` / `npm run cap:android` (opens Xcode / Android Studio) → run on
   a device, sandbox-test a purchase, confirm `entitlements.plan` flips to `pro`.
6. **Store listings:** icons (generated), screenshots, **privacy nutrition labels / Data Safety form**,
   and the **health disclaimer** (already in the app — stores scrutinize wellness apps).

## Recommended sequence (don't boil the ocean)

1. **Ship web/PWA first** with Razorpay. Validate that people actually pay ₹499 at all —
   cheapest possible test of demand. (Make it installable: add a `manifest.json` + a
   service worker; Android users can then "Add to Home Screen.")
2. **Only if web converts**, wrap with Capacitor + RevenueCat for the stores. The store
   cut only hurts if there's revenue to take a cut *of* — so prove revenue first.

This staging keeps you from spending weeks on Apple review for an unproven product.
