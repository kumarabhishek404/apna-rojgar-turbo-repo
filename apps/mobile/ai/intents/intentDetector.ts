import { WORKERTYPES } from "@/constants";
import type { AppUserRole } from "@/utils/resolveDisplayUserRole";
import type { DetectedIntent, SaathiIntent } from "./intentTypes";

const GENERIC_LABOUR = new Set(["labour", "labor", "mazdoor", "majdoor", "helper"]);

const SPECIFIC_SKILLS: Array<{ value: string; aliases: string[] }> = [
  { value: "electrician", aliases: ["electrician", "bijli", "electric", "इलेक्ट्रीशियन"] },
  { value: "plumber", aliases: ["plumber", "nal", "plumb", "प्लंबर"] },
  { value: "painter", aliases: ["painter", "paint", "rangsai", "पेंटर"] },
  { value: "carpenter", aliases: ["carpenter", "badhai", "wood", "बढ़ई"] },
  { value: "mason", aliases: ["mason", "rajmistri", "raj mistri", "राजमिस्त्री"] },
  { value: "driver", aliases: ["driver", "gaadi", "driving", "ड्राइवर"] },
  { value: "pipeWelder", aliases: ["welder", "welding", "वेल्डर"] },
];

export function constrainIntentForRole(
  role: AppUserRole | string,
  intent: SaathiIntent,
): SaathiIntent {
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

export function normalizeUtterance(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[?.!,।]/g, " ")
    .replace(/और/g, "aur")
    .replace(/काम/g, "kaam")
    .replace(/दिखाओ+|दिखा/g, "dikhao")
    .replace(/देखो|देखना/g, "dekho")
    .replace(/चाहिए/g, "chahiye")
    .replace(/ढूंढो+|ढूँढो+|ढूंढ/g, "dhoondo")
    .replace(/\bkam\b/g, "kaam")
    .replace(/\bmajdoor\b/g, "mazdoor")
    .replace(/\bmazdur\b/g, "mazdoor")
    .replace(/\bjobs?\b/g, "kaam")
    .replace(/\bworks?\b/g, "kaam")
    .replace(/\bnaukri\b/g, "kaam")
    .replace(/\bdikha+o+\b/g, "dikhao")
    .replace(/\bdikha\b/g, "dikhao")
    .replace(/\bdekh(o|ao|na)\b/g, "dekho")
    .replace(/\bshow\b/g, "dikhao")
    .replace(/\bfind\b/g, "dhoondo")
    .replace(/\bneed\b/g, "chahiye")
    .replace(/\bmore\b/g, "aur")
    .replace(/\bor\b/g, "aur")
    .replace(/\bkhojo\b/g, "khojo")
    .replace(/\s+/g, " ")
    .trim();
}

function detectSkill(text: string): string | undefined {
  for (const row of SPECIFIC_SKILLS) {
    if (row.aliases.some((a) => text.includes(a))) return row.value;
  }
  const types = Array.isArray(WORKERTYPES) ? WORKERTYPES : [];
  for (const wt of types) {
    const value = String(wt?.value || "").toLowerCase();
    if (!value || GENERIC_LABOUR.has(value)) continue;
    if (value.length > 3 && text.includes(value)) return String(wt.value);
  }
  return undefined;
}

function detectQuantity(text: string): number | undefined {
  const digit = text.match(/\b(\d{1,3})\b/);
  if (digit) {
    const n = Number(digit[1]);
    if (Number.isFinite(n) && n > 0 && n <= 200 && n !== 10 && n !== 50 && n !== 100) {
      return n;
    }
    if (n >= 1 && n <= 20) return n;
  }
  return undefined;
}

function detectPay(text: string): number | undefined {
  const m = text.match(
    /(?:₹|rs\.?|rupees?|rupaye|वेतन|tanka)\s*(\d{3,6})|(\d{3,6})\s*(?:₹|rs\.?|rupees?|rupaye|per day|\/\s*day|din)/i,
  );
  if (!m) return undefined;
  const n = Number(m[1] || m[2]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function detectDurationDays(text: string): number | undefined {
  const m = text.match(/(\d{1,3})\s*(din|day|days|दिन)/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n <= 365 ? n : undefined;
}

export function detectSelectedIndex(text: string): number | undefined {
  const raw = String(text || "").trim();
  if (/^(pehla|pahla|first|ek|1)$/i.test(raw)) return 0;
  if (/^(dusra|doosra|second|2)$/i.test(raw)) return 1;
  if (/^(teesra|third|3)$/i.test(raw)) return 2;
  if (/^(chautha|fourth|4)$/i.test(raw)) return 3;
  if (/^(paanchva|fifth|5)$/i.test(raw)) return 4;
  return undefined;
}

function detectDistanceKm(text: string): number | undefined {
  const m = text.match(/(\d{1,4})\s*(km|kilometer|kilometers|किलो|किलोमीटर)/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  if (/100/.test(text) && /andar|within|ke andar|pass/i.test(text)) return 100;
  return undefined;
}

function detectDate(text: string): DetectedIntent["dateHint"] {
  if (/\b(aaj|today)\b/.test(text)) return "today";
  if (/\b(kal|tomorrow)\b/.test(text)) return "tomorrow";
  if (/\b(parso|jaldi|soon)\b/.test(text)) return "soon";
  return undefined;
}

const FOLLOW_MORE =
  /^(aur|zyada|aage|next)( dikhao| dekho| batao| sunao)?$|^(dikhao aur|aur dikhao)$/;

const RULES: Array<{ intent: SaathiIntent; tests: RegExp[] }> = [
  {
    intent: "CONFIRM_YES",
    tests: [/^\s*(haan+|han|ha+|haa+|yes|ok+|okay|theek|bilkul|ji|हाँ)\s*$/i],
  },
  { intent: "CONFIRM_NO", tests: [/^\s*(nahi+|na+|no|mat|नहीं|नही)\s*$/i] },
  {
    intent: "SELECT_RESULT",
    tests: [/^\s*(pehla|pahla|dusra|doosra|teesra|first|second|third|chautha|fourth|\d)\s*$/i],
  },
  {
    intent: "APPLY_JOB",
    tests: [/apply karo|apply karna|ispe apply|is kaam (pe|par) apply|is job pe/i, /अपलाई करो/],
  },
  {
    intent: "BOOK_WORKER",
    tests: [/book karo|booking bhejo|invite karo|is worker ko book/i, /बुक करो|बुकिंग भेजो/],
  },
  { intent: "GREETING", tests: [/^\s*(namaste|hello|hi|hey)\s*$/i] },
  { intent: "MORE_OPTIONS", tests: [/aur kya kar|kya kar sakta|madad chahiye|\bhelp\b/i] },
  {
    intent: "FIND_WORK",
    tests: [
      /kaam (chahiye|dhoond|dhoondo|dekho|dikhao|do|milega|hai|batao|khojo|khoj)\b/i,
      /(dikhao|dekho|dhoondo).*kaam|aur kaam|koi kaam/i,
      /nearby kaam|pass kaam|aas paas/i,
    ],
  },
  {
    intent: "VIEW_BOOKINGS",
    tests: [/meri booking|mera kaam kab|aaj ki booking|bookings dikhao/i, /बुकिंग दिखा/],
  },
  {
    intent: "VIEW_APPLICATIONS",
    tests: [/mera application|applications dikhao|kitne kaam ke liye apply/i, /आवेदन दिखा/],
  },
  {
    intent: "HIRE_WORKERS",
    tests: [
      /mazdoor (chahiye|dikhao|khoj)|worker chahiye|hire|mistri chahiye|dikhao.*worker/i,
      /मजदूर|वर्कर चाहिए/,
      /plumber|electrician|painter|carpenter chahiye/i,
    ],
  },
  {
    intent: "VIEW_WORK_STATUS",
    tests: [/status|kitna (hua|complete)|chal raha|progress/i],
  },
  {
    intent: "VIEW_ACTIVE_WORK",
    tests: [/chal rahe kaam|active kaam|kaunsa kaam chal/i],
  },
  {
    intent: "POST_WORK",
    tests: [/naya kaam|post kar|kaam post|post kaam/i],
  },
  {
    intent: "VIEW_WORKERS",
    tests: [/available worker|workers dikhao|mere paas.*worker|meri team/i],
  },
  {
    intent: "VIEW_NEARBY_WORK",
    tests: [/aas paas kaam|nearby kaam|mere paas kaam/i],
  },
  {
    intent: "VIEW_PROFILE",
    tests: [/profile complete|meri jankari|meri profile/i],
  },
  {
    intent: "SHOW_MORE",
    tests: [FOLLOW_MORE, /aur (dikhao|batao|sunao)|zyada dikhao|aage dikhao/i],
  },
];

export type IntentContext = {
  lastIntent?: SaathiIntent;
  flow?: string | null;
};

export function detectIntent(
  utterance: string,
  role: AppUserRole | string = "WORKER",
  context?: IntentContext,
): DetectedIntent {
  const raw = String(utterance || "").trim();
  const text = normalizeUtterance(raw);
  if (!text) {
    return { intent: "UNKNOWN", raw, source: "rules" };
  }

  let intent: SaathiIntent = "UNKNOWN";
  for (const rule of RULES) {
    if (rule.tests.some((re) => re.test(text))) {
      intent = rule.intent;
      break;
    }
  }

  if (intent === "UNKNOWN" && FOLLOW_MORE.test(text) && context?.lastIntent) {
    intent = "SHOW_MORE";
  }

  if (intent === "UNKNOWN" && /kaam|dikhao|dhoondo|chahiye/.test(text)) {
    intent = "FIND_WORK";
  }

  const skill = detectSkill(text);
  if (intent === "UNKNOWN" && skill && /chahiye|dikhao|khoj|dhoondo/i.test(text)) {
    intent = "HIRE_WORKERS";
  }

  const selectedIndex = intent === "SELECT_RESULT" ? detectSelectedIndex(raw) : undefined;

  return {
    intent: constrainIntentForRole(role, intent),
    skill,
    quantity: intent === "SELECT_RESULT" ? undefined : detectQuantity(text),
    dateHint: detectDate(text),
    distanceKm: detectDistanceKm(text),
    payPerDay: detectPay(text),
    durationDays: detectDurationDays(text),
    selectedIndex,
    raw,
    source: "rules",
  };
}
