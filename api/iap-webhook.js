// POST /api/iap-webhook  → RevenueCat webhook. Grants/revokes Pro from App Store /
// Play Store purchases, writing to the SAME entitlements table as web (Razorpay).
// RevenueCat's app_user_id must be the Supabase user id (the client calls
// Purchases.logIn({ appUserID: <supabase user id> }) — see index.html initNativeStore).
const { admin, readJson } = require("./_lib");

const GRANT = ["INITIAL_PURCHASE", "NON_RENEWING_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"];
const REVOKE = ["EXPIRATION", "REFUND", "SUBSCRIPTION_PAUSED"];

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // RevenueCat sends the secret you configure as: Authorization: Bearer <secret>
  const auth = req.headers.authorization || "";
  if (!process.env.REVENUECAT_WEBHOOK_AUTH || auth !== "Bearer " + process.env.REVENUECAT_WEBHOOK_AUTH) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const body = await readJson(req);
  const ev = body.event || {};
  const appUserId = ev.app_user_id;             // = Supabase user id
  if (!appUserId) return res.status(200).json({ ok: true });   // anonymous / nothing to do

  const store = String(ev.store || "").toLowerCase();
  const source = store.includes("play") ? "android" : store.includes("app") ? "ios" : "app";
  const sb = admin();

  try {
    if (GRANT.includes(ev.type)) {
      await sb.from("entitlements").upsert(
        { user_id: appUserId, plan: "pro", source, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    } else if (REVOKE.includes(ev.type)) {
      await sb.from("entitlements").update({ plan: "free", updated_at: new Date().toISOString() }).eq("user_id", appUserId);
    }
  } catch (e) {
    console.error("iap-webhook db error:", e?.message);
    return res.status(500).json({ error: "db" });
  }
  res.status(200).json({ ok: true });
};
