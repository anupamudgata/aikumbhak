// POST /api/ai-session  → Claude composes a personalized, SAFE breathing session.
// Pro-gated, daily fair-use capped. Uses Haiku (cheapest) with a cached system
// prompt; the model's output is clamped server-side so it can never produce an
// unsafe session regardless of what it returns.
const Anthropic = require("@anthropic-ai/sdk");
const { admin, getUser, readJson } = require("./_lib");

// Stable system prompt (cached). Per-request mood/minutes/lang go in the user turn.
const SYS = `You are a calm, expert breathing coach. Given a person's mood, the minutes they have, and their language code, design ONE short, SAFE breathing session.

Rules:
- All durations are in SECONDS.
- Favor an exhale longer than the inhale to calm the nervous system; use gentle holds only.
- SAFETY: for "stressed" or "anxious" moods, holdIn MUST be 0. Never set holdIn above 20 or holdOut above 10. inhale 3-6, exhale 4-10. Never design an intense or strenuous session.
- Choose "rounds" so the whole session lasts roughly the given minutes.
- Write "title", "coachIntro" (1-2 warm, spoken sentences) and "why" (one short sentence) in the user's language: "hi" = Hindi in Devanagari script, "or" = Odia in Odia script, "en" = English.
- Respond with ONLY the JSON object, nothing else.`;

// Structured-output schema. (Structured outputs disallow numeric min/max, so
// ranges are enforced by the clamp below — the schema just guarantees shape.)
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    technique: { type: "string" },
    inhale: { type: "number" },
    holdIn: { type: "number" },
    exhale: { type: "number" },
    holdOut: { type: "number" },
    rest: { type: "number" },
    rounds: { type: "integer" },
    coachIntro: { type: "string" },
    why: { type: "string" },
  },
  required: ["title", "technique", "inhale", "holdIn", "exhale", "holdOut", "rest", "rounds", "coachIntro", "why"],
  additionalProperties: false,
};

const clamp = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Sign in first" });

  const sb = admin();
  const { data: ent } = await sb.from("entitlements").select("plan").eq("user_id", user.id).maybeSingle();
  if (ent?.plan !== "pro") return res.status(403).json({ error: "Pro required" });

  // Daily fair-use cap (keeps lifetime/Pro AI cost bounded).
  const day = new Date().toISOString().slice(0, 10);
  const { data: usage } = await sb.from("ai_usage").select("count").eq("user_id", user.id).eq("day", day).maybeSingle();
  if ((usage?.count || 0) >= 40) return res.status(429).json({ error: "Daily AI limit reached" });

  const { mood = "okay", minutes = 5, lang = "en" } = await readJson(req);

  let spec;
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 700,
      system: [{ type: "text", text: SYS, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Mood: ${mood}. Minutes: ${minutes}. Language: ${lang}.` }],
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
    });
    const raw = (msg.content.find((b) => b.type === "text") || {}).text || "";
    try { spec = JSON.parse(raw); }
    catch { const m = raw.match(/\{[\s\S]*\}/); spec = m ? JSON.parse(m[0]) : null; }
    if (!spec) throw new Error("no json in response");
  } catch (e) {
    console.error("ai-session generate failed:", e?.message);
    return res.status(502).json({ error: "Could not compose session" });
  }

  // Clamp to a safe envelope no matter what the model returned.
  const anxious = mood === "stressed" || mood === "anxious";
  const out = {
    title: String(spec.title || "Breathing session").slice(0, 80),
    technique: String(spec.technique || "custom").slice(0, 40),
    inhale: clamp(spec.inhale, 3, 6, 4),
    holdIn: anxious ? 0 : clamp(spec.holdIn, 0, 20, 0),
    exhale: clamp(spec.exhale, 4, 10, 6),
    holdOut: clamp(spec.holdOut, 0, 10, 0),
    rest: clamp(spec.rest, 0, 10, 0),
    rounds: Math.round(clamp(spec.rounds, 1, 30, 8)),
    coachIntro: String(spec.coachIntro || "").slice(0, 240),
    why: String(spec.why || "").slice(0, 160),
  };

  // Meter usage (best-effort; never block the response on this).
  await sb.from("ai_usage").upsert(
    { user_id: user.id, day, count: (usage?.count || 0) + 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id,day" }
  ).then(() => {}, () => {});

  res.status(200).json(out);
};
