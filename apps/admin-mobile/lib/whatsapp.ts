import { Linking } from "react-native";

const GROUPS = {
  WORKER: "https://chat.whatsapp.com/FFvAv3Ygor4Aqbi6tSSI5j?mode=gi_t",
  MEDIATOR: "https://chat.whatsapp.com/CdJcn9AcfVK6xekk329d0Q?mode=gi_t",
  EMPLOYER: "https://chat.whatsapp.com/Dv2khyXxDrrCaWna8OxUCY?mode=gi_t",
} as const;

const GROUP_LABEL = {
  WORKER: "Workers (मज़दूर)",
  MEDIATOR: "Contractors (ठेकेदार)",
  EMPLOYER: "Employers (काम देने वाले)",
} as const;

const INSTAGRAM = "https://www.instagram.com/apnarojgarindia/";
const SIGN_OFF = `— टीम *अपना रोजगार* 🙏`;

function roleKey(role?: string) {
  const key = String(role || "").toUpperCase();
  if (key === "EMPLOYER" || key === "MEDIATOR") return key;
  return "WORKER" as const;
}

function greeting(name?: string) {
  const first = String(name || "").trim().split(/\s+/).find(Boolean);
  if (!first || first.toLowerCase() === "unnamed" || first.toLowerCase() === "sir") return "*sir*";
  return `*${first} sir*`;
}

export function buildWelcome(name?: string, role?: string) {
  const key = roleKey(role);
  const roleCopy =
    key === "EMPLOYER"
      ? `*अपना रोजगार* पर आप *एम्प्लॉयर* के रूप में जुड़ चुके हैं।\n\nकाम पोस्ट करें, आस-पास के वर्कर देखें, और सही आदमी हायर करें।`
      : key === "MEDIATOR"
        ? `*अपना रोजगार* पर आप *कॉन्ट्रैक्टर* के रूप में जुड़ चुके हैं।\n\nअपनी टीम जोड़ें और बड़ी जॉब्स पर अप्लाई करें।`
        : `*अपना रोजगार* पर आप *वर्कर* के रूप में जुड़ चुके हैं।\n\nआस-पास का काम देखें, अप्लाई करें, और कमाई शुरू करें।`;
  return [
    `नमस्ते ${greeting(name)}! 🙏`,
    ``,
    roleCopy,
    ``,
    `👥 *WhatsApp ग्रुप जॉइन करें* — अपना रोजगार - ${GROUP_LABEL[key]}:`,
    GROUPS[key],
    ``,
    `📸 *Instagram पर फॉलो करें:*`,
    INSTAGRAM,
    ``,
    SIGN_OFF,
  ].join("\n");
}

export const USER_TEMPLATES = [
  { id: "welcome", label: "Welcome" },
  { id: "complete_profile", label: "Complete profile" },
  { id: "verified", label: "Verified" },
  { id: "reactivated", label: "Account re-activated" },
  { id: "suspended", label: "Account suspended" },
  { id: "custom", label: "Blank message" },
] as const;

export function userMessage(id: string, name?: string, role?: string) {
  if (id === "complete_profile") {
    return `नमस्ते ${greeting(name)}! 🙏\n\nआपकी *अपना रोजगार* प्रोफ़ाइल अभी अधूरी है। नाम, पता और स्किल पूरा करें ताकि सही काम मिले।\n\n${SIGN_OFF}`;
  }
  if (id === "verified") {
    return `बधाई हो ${greeting(name)}! 🎉\n\nआपकी *अपना रोजगार* प्रोफ़ाइल अब *वेरिफ़ाइड ✅* हो गई है।\n\n${SIGN_OFF}`;
  }
  if (id === "reactivated") {
    return `नमस्ते ${greeting(name)}! 🙏\n\nआपका *अपना रोजगार* अकाउंट फिर से *चालू (Active)* कर दिया गया है।\n\n${SIGN_OFF}`;
  }
  if (id === "suspended") {
    return `नमस्ते ${greeting(name)}! 🙏\n\nआपका *अपना रोजगार* अकाउंट अभी *निलंबित (Suspended)* है।\n\n${SIGN_OFF}`;
  }
  if (id === "custom") return `नमस्ते ${greeting(name)}! 🙏\n\n`;
  return buildWelcome(name, role);
}

export function defaultUserTemplate(user: { status?: string; address?: string; skills?: unknown; role?: string }) {
  if (String(user.status || "").toUpperCase() === "SUSPENDED") return "suspended";
  const role = String(user.role || "").toUpperCase();
  const missingAddress = !String(user.address || "").trim();
  const missingSkills = role !== "EMPLOYER" && !(Array.isArray(user.skills) && user.skills.length);
  if (missingAddress || missingSkills) return "complete_profile";
  return "welcome";
}

export const EMPLOYER_TEMPLATES = [
  { id: "follow_up", label: "Follow-up" },
  { id: "need_more_applicants", label: "More applicants" },
  { id: "cancelled", label: "Work cancelled" },
  { id: "reactivated", label: "Work re-activated" },
  { id: "custom", label: "Blank message" },
] as const;

export function employerMessage(
  id: string,
  ctx: { name?: string; title: string; jobId?: string; applicants: number },
) {
  const who = greeting(ctx.name);
  const work = `*${ctx.title}*${ctx.jobId ? ` (Job ID: *${ctx.jobId}*)` : ""}`;
  if (id === "need_more_applicants") {
    return `नमस्ते ${who}! 🙏\n\nआपका ${work} *अपना रोजगार* पर लाइव है।\n${ctx.applicants ? `अभी तक *${ctx.applicants}* अप्लाई आए हैं।` : "अभी तक कोई अप्लाई नहीं आया है।"}\n\nपता और सैलरी सही रखें, या पेड प्रमोशन से काम और लोगों तक पहुँचेगा।\n\n${SIGN_OFF}`;
  }
  if (id === "cancelled") {
    return `नमस्ते ${who}! 🙏\n\nआपका ${work} *अपना रोजगार* पर *रद्द* कर दिया गया है। गलती हो तो बताइए, हम री-एक्टिवेट कर देंगे।\n\n${SIGN_OFF}`;
  }
  if (id === "reactivated") {
    return `नमस्ते ${who}! 🙏\n\nआपका ${work} फिर से *चालू* कर दिया गया है। वर्कर दोबारा अप्लाई कर सकेंगे।\n\n${SIGN_OFF}`;
  }
  if (id === "custom") return `नमस्ते ${who}! 🙏\n\n`;
  return `नमस्ते ${who}! 🙏\n\nआपने *अपना रोजगार* पर ${work} पोस्ट किया था।\n${ctx.applicants ? `अब तक *${ctx.applicants}* लोग अप्लाई कर चुके हैं।` : "क्या आपको अभी भी वर्कर की ज़रूरत है?"}\n\n${SIGN_OFF}`;
}

export function defaultEmployerTemplate(status?: string, applicants = 0) {
  if (String(status || "").toUpperCase() === "CANCELLED") return "cancelled";
  if (String(status || "").toUpperCase() === "HIRING" && applicants === 0) return "need_more_applicants";
  return "follow_up";
}

export async function openWhatsapp(countryCode: string | undefined, mobile: string | undefined, text: string) {
  const local = String(mobile || "").replace(/\D/g, "");
  if (local.length < 10) return false;
  const phone = `${String(countryCode || "91").replace(/\D/g, "") || "91"}${local.slice(-10)}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  await Linking.openURL(url);
  return true;
}
