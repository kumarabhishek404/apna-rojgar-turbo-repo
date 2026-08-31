const INTENTS = new Set([
  "FIND_WORK",
  "VIEW_BOOKINGS",
  "VIEW_APPLICATIONS",
  "VIEW_NEARBY_WORK",
  "VIEW_ACTIVE_WORK",
  "VIEW_WORKERS",
  "HIRE_WORKERS",
  "POST_WORK",
  "APPLY_JOB",
  "BOOK_WORKER",
  "SELECT_RESULT",
  "VIEW_WORK_STATUS",
  "VIEW_PROFILE",
  "HELP",
  "GREETING",
  "MORE_OPTIONS",
  "CONFIRM_YES",
  "CONFIRM_NO",
  "SHOW_MORE",
  "UNKNOWN",
]);

function extractJson(text) {
  const raw = String(text || "").trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

function constrainIntent(role, intent) {
  const r = String(role || "").toUpperCase();
  if (r === "WORKER") {
    if (
      intent === "HIRE_WORKERS" ||
      intent === "VIEW_WORKERS" ||
      intent === "POST_WORK" ||
      intent === "BOOK_WORKER"
    ) {
      return intent === "BOOK_WORKER" ? "APPLY_JOB" : "FIND_WORK";
    }
  }
  if (r === "EMPLOYER") {
    if (intent === "FIND_WORK" || intent === "VIEW_NEARBY_WORK") {
      return "HIRE_WORKERS";
    }
    if (intent === "APPLY_JOB") return "BOOK_WORKER";
  }
  if (r === "MEDIATOR") {
    if (intent === "POST_WORK" || intent === "BOOK_WORKER" || intent === "HIRE_WORKERS") {
      return "FIND_WORK";
    }
  }
  return intent;
}

function buildPrompt({ utterance, role, locale, slots, history }) {
  const hist = Array.isArray(history)
    ? history
        .slice(-6)
        .map((m) => `${m.role}: ${m.text}`)
        .join("\n")
    : "";
  return `You classify short Hindi / Hinglish / English messages for Apna Rojgar (India jobs app). Return JSON only. Never invent jobs.

User role: ${role}
App language: ${locale || "hi"}
Conversation slots: ${JSON.stringify(slots || {})}
Recent chat:
${hist || "(none)"}
Current message: ${JSON.stringify(utterance)}

Intents: FIND_WORK, SHOW_MORE, APPLY_JOB, HIRE_WORKERS, BOOK_WORKER, POST_WORK, VIEW_BOOKINGS, VIEW_APPLICATIONS, VIEW_WORKERS, VIEW_NEARBY_WORK, VIEW_PROFILE, CONFIRM_YES, CONFIRM_NO, SELECT_RESULT, GREETING, HELP, UNKNOWN.

Examples:
- WORKER "or kaam dikhao" / "aur kaam dikhao" / "kaam dikhao" / "Show more work" / "mujhe kaam chahiye" → FIND_WORK
- WORKER "aur dikhao" after jobs were shown → SHOW_MORE
- WORKER "ispe apply karo" → APPLY_JOB
- EMPLOYER "mazdoor chahiye" / "plumber dikhao" → HIRE_WORKERS
- EMPLOYER "book karo" → BOOK_WORKER
- "haan" / "ha" / "yes" → CONFIRM_YES
- "nahi" → CONFIRM_NO
- "1" / "pehla" → SELECT_RESULT selectedIndex 0

Rules:
- Hinglish "or" at the start means Hindi "aur" (more/and), not English or.
- WORKER/MEDIATOR asking to see work = FIND_WORK. EMPLOYER asking for workers = HIRE_WORKERS.
- Skill only if a trade is named: plumber, electrician, painter, carpenter, mason, driver, welder, tailor, cook. Else null.

Return:
{"intent":"FIND_WORK","skill":null,"quantity":null,"distanceKm":null,"dateHint":null,"payPerDay":null,"durationDays":null,"selectedIndex":null}`;
}

function normalizeParsed(parsed, role, utterance, source) {
  if (!parsed || typeof parsed !== "object") return null;
  const intentRaw = String(parsed.intent || "UNKNOWN").toUpperCase();
  if (!INTENTS.has(intentRaw) || intentRaw === "UNKNOWN") return null;
  const intent = constrainIntent(role, intentRaw);
  const skill =
    parsed.skill != null && String(parsed.skill).trim()
      ? String(parsed.skill).trim().toLowerCase()
      : undefined;
  const quantity = Number(parsed.quantity);
  const distanceKm = Number(parsed.distanceKm);
  const payPerDay = Number(parsed.payPerDay);
  const durationDays = Number(parsed.durationDays);
  const selectedIndex = Number(parsed.selectedIndex);
  return {
    intent,
    skill: skill && skill !== "labour" && skill !== "mazdoor" ? skill : undefined,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : undefined,
    distanceKm:
      Number.isFinite(distanceKm) && distanceKm > 0 ? distanceKm : undefined,
    dateHint: parsed.dateHint ? String(parsed.dateHint) : undefined,
    payPerDay:
      Number.isFinite(payPerDay) && payPerDay > 0 ? payPerDay : undefined,
    durationDays:
      Number.isFinite(durationDays) && durationDays > 0 ? durationDays : undefined,
    selectedIndex:
      Number.isFinite(selectedIndex) && selectedIndex >= 0
        ? selectedIndex
        : undefined,
    raw: String(utterance || ""),
    source,
  };
}

async function understandWithGemini(prompt) {
  const key = String(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
  ).trim();
  if (!key) return null;
  const model =
    String(process.env.GEMINI_SAATHI_MODEL || "gemini-2.0-flash").trim() ||
    "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(key)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p?.text)
    .filter(Boolean)
    .join("\n");
  return extractJson(text);
}

async function understandWithGroq(prompt) {
  const key = String(process.env.GROQ_API_KEY || "").trim();
  if (!key) return null;
  const model =
    String(process.env.GROQ_SAATHI_MODEL || "openai/gpt-oss-20b").trim() ||
    "openai/gpt-oss-20b";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 256,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an intent classifier. Reply with a single JSON object.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq HTTP ${response.status}: ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || "";
  return extractJson(text);
}

export async function understandSaathiUtterance({
  utterance,
  role,
  locale,
  slots,
  history,
}) {
  const prompt = buildPrompt({ utterance, role, locale, slots, history });

  const geminiKey = String(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "",
  ).trim();
  const groqKey = String(process.env.GROQ_API_KEY || "").trim();

  if (geminiKey) {
    try {
      const parsed = await understandWithGemini(prompt);
      const out = normalizeParsed(parsed, role, utterance, "gemini");
      if (out) return out;
    } catch (error) {
      console.warn("[saathi] Gemini NLU failed:", error?.message);
    }
  }

  if (groqKey) {
    try {
      const parsed = await understandWithGroq(prompt);
      const out = normalizeParsed(parsed, role, utterance, "groq");
      if (out) return out;
    } catch (error) {
      console.warn("[saathi] Groq NLU failed:", error?.message);
    }
  }

  return null;
}
