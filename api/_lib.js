// Shared helpers for the Kumbhak serverless functions (Vercel Node runtime).
const { createClient } = require("@supabase/supabase-js");

// Service-role client — bypasses RLS. SERVER ONLY. Never expose this key.
function admin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Identify the signed-in user from the `Authorization: Bearer <jwt>` header.
// Returns the Supabase user object, or null if not signed in / invalid.
async function getUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Parse a JSON body whether or not the runtime pre-parsed it.
function readJson(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
  });
}

const PRICE_PAISE = () => parseInt(process.env.PRO_PRICE_PAISE || "49900", 10);

module.exports = { admin, getUser, readJson, PRICE_PAISE };
