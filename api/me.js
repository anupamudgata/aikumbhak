// GET /api/me  → the source of truth for Pro access. Called on every app load.
// Not signed in = free (no error, so the app works for anonymous free users).
const { admin, getUser } = require("./_lib");

module.exports = async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(200).json({ pro: false, email: null });

  const { data } = await admin()
    .from("entitlements")
    .select("plan,email")
    .eq("user_id", user.id)
    .maybeSingle();

  res.status(200).json({ pro: data?.plan === "pro", email: user.email });
};
