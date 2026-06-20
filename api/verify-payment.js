// POST /api/verify-payment  → verifies the Razorpay signature, then grants Pro.
// The client `handler` firing is NOT proof of payment — the signature check is.
const crypto = require("crypto");
const { admin, getUser, readJson, PRICE_PAISE } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in first" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await readJson(req);
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment fields" });
  }

  // Razorpay signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  const ok = expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!ok) return res.status(400).json({ error: "Invalid signature" });

  // Grant Pro (service-role bypasses RLS so the client can never do this itself).
  const { error } = await admin().from("entitlements").upsert({
    user_id: user.id,
    email: user.email,
    plan: "pro",
    source: "web",
    razorpay_order_id,
    razorpay_payment_id,
    amount: PRICE_PAISE(),
    currency: "INR",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) {
    console.error("grant Pro failed:", error.message);
    return res.status(500).json({ error: "Could not grant Pro" });
  }
  res.status(200).json({ pro: true });
};
