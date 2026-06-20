// POST /api/create-order  → creates a Razorpay order for the Pro lifetime unlock.
// Requires a signed-in user (Bearer token).
const Razorpay = require("razorpay");
const { getUser, PRICE_PAISE } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in first" });

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await rzp.orders.create({
      amount: PRICE_PAISE(),
      currency: "INR",
      receipt: "pro_" + user.id.slice(0, 24),
      notes: { user_id: user.id, email: user.email, product: "kumbhak_pro_lifetime" },
    });
    res.status(200).json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error("create-order failed:", e?.message);
    res.status(500).json({ error: "Could not create order" });
  }
};
