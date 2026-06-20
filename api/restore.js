// POST /api/restore  → emails a sign-in link so a paid user can unlock a new device.
// OPTIONAL: the browser can call supabase.auth.signInWithOtp() directly instead
// (the current index.html does). This endpoint exists if you prefer to keep the
// anon key off the client. Restoring = signing in; /api/me then returns their Pro.
const { createClient } = require("@supabase/supabase-js");
const { readJson } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = await readJson(req);
  if (!email) return res.status(400).json({ error: "email required" });

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: process.env.APP_URL || undefined },
  });

  // Always return ok — don't leak whether the email has an account.
  res.status(200).json({ ok: true });
};
