export const WHATSAPP_GROUP_BY_ROLE = {
  WORKER: "https://chat.whatsapp.com/FFvAv3Ygor4Aqbi6tSSI5j?mode=gi_t",
  MEDIATOR: "https://chat.whatsapp.com/CdJcn9AcfVK6xekk329d0Q?mode=gi_t",
  EMPLOYER: "https://chat.whatsapp.com/Dv2khyXxDrrCaWna8OxUCY?mode=gi_t",
} as const;

export type WhatsappGroupRole = keyof typeof WHATSAPP_GROUP_BY_ROLE;

/** @deprecated Prefer getWhatsappGroupLinkForRole(role) */
export const NEW_USER_WHATSAPP_GROUP = WHATSAPP_GROUP_BY_ROLE.WORKER;
export const NEW_USER_INSTAGRAM = "https://www.instagram.com/apnarojgarindia/";

export function getWhatsappGroupLinkForRole(role?: string) {
  const key = String(role || "")
    .trim()
    .toUpperCase() as WhatsappGroupRole;
  return WHATSAPP_GROUP_BY_ROLE[key] || WHATSAPP_GROUP_BY_ROLE.WORKER;
}

export const WHATSAPP_GROUP_LABEL_BY_ROLE = {
  WORKER: "Workers (मज़दूर)",
  MEDIATOR: "Contractors (ठेकेदार)",
  EMPLOYER: "Employers (काम देने वाले)",
} as const;

export function getWhatsappGroupLabelForRole(role?: string) {
  const key = welcomeRole(role);
  return WHATSAPP_GROUP_LABEL_BY_ROLE[key];
}

function welcomeName(name?: string) {
  const first = String(name || "")
    .trim()
    .split(/\s+/)
    .find(Boolean);
  return first || "sir";
}

function welcomeRole(role?: string) {
  const key = String(role || "").trim().toUpperCase();
  if (key === "EMPLOYER") return "EMPLOYER" as const;
  if (key === "MEDIATOR") return "MEDIATOR" as const;
  return "WORKER" as const;
}

function roleMessage(role: ReturnType<typeof welcomeRole>) {
  if (role === "EMPLOYER") {
    return [
      `*अपना रोजगार* पर आप *एम्प्लॉयर* के रूप में जुड़ चुके हैं।`,
      ``,
      `*आपको क्या फायदा होगा:*`,
      `• आस-पास के *मजदूर / वर्कर* तुरंत मिलेंगे`,
      `• काम पोस्ट करें, अप्लाई देखें, सही आदमी *हायर* करें`,
      `• फ़ोन घुमाने की झंझट कम, काम जल्दी शुरू`,
      ``,
      `*ऐप में ऐसे इस्तेमाल करें:*`,
      `1. अपना काम *पोस्ट* करें`,
      `2. वर्कर की प्रोफ़ाइल, स्किल और लोकेशन देखें`,
      `3. सही वर्कर को सेलेक्ट करके काम शुरू करें`,
    ];
  }

  if (role === "MEDIATOR") {
    return [
      `*अपना रोजगार* पर आप *कॉन्ट्रैक्टर* के रूप में जुड़ चुके हैं।`,
      ``,
      `*आपको क्या फायदा होगा:*`,
      `• अपनी *टीम* के लिए आस-पास मजदूर जोड़ें`,
      `• बड़ी जॉब्स पर अप्लाई करें, ज्यादा काम पकड़ें`,
      `• एक जगह से टीम और काम दोनों मैनेज करें`,
      ``,
      `*ऐप में ऐसे इस्तेमाल करें:*`,
      `1. अपनी *टीम* बनाएं / मजदूर जोड़ें`,
      `2. आस-पास की जॉब्स देखकर टीम के साथ अप्लाई करें`,
      `3. सेलेक्ट होने पर टीम को काम पर लगाएं`,
    ];
  }

  return [
    `*अपना रोजगार* पर आप *वर्कर* के रूप में जुड़ चुके हैं।`,
    ``,
    `*आपको क्या फायदा होगा:*`,
    `• आस-पास का *रोज़ का काम* मिलेगा`,
    `• सीधे अप्लाई करें, सेलेक्ट हों, कमाई शुरू करें`,
    `• बिचौलिए के बिना — फ्री और आसान`,
    ``,
    `*ऐप में ऐसे इस्तेमाल करें:*`,
    `1. अपनी *स्किल + लोकेशन* पूरा करें`,
    `2. पास की जॉब्स देखकर *अप्लाई* करें`,
    `3. सेलेक्ट होने पर काम पर जाएं और कमाएं`,
  ];
}

/** WhatsApp markup (*bold*) ready to paste or send via wa.me. */
export function buildNewUserWhatsappWelcome(name?: string, role?: string) {
  const who = welcomeName(name);
  const greeting = who.toLowerCase() === "sir" ? "*sir*" : `*${who} sir*`;
  const roleKey = welcomeRole(role);
  const groupLabel = getWhatsappGroupLabelForRole(roleKey);
  const groupLink = getWhatsappGroupLinkForRole(roleKey);
  return [
    `नमस्ते ${greeting}! 🙏`,
    ``,
    ...roleMessage(roleKey),
    ``,
    `👥 *WhatsApp ग्रुप जॉइन करें* — अपना रोजगार - ${groupLabel}:`,
    groupLink,
    ``,
    `📸 *Instagram पर फॉलो करें:*`,
    NEW_USER_INSTAGRAM,
    ``,
    `रोज़ इस्तेमाल कीजिए — सही काम, सही समय पर। 💪`,
  ].join("\n");
}

/** Country code + local number, digits only — e.g. 916397308499 */
export function normalizeWhatsappPhone(countryCode: unknown, mobile: unknown) {
  let local = String(mobile || "").replace(/\D/g, "");
  if (!local) return "";
  if (local.length === 11 && local.startsWith("0")) local = local.slice(1);
  if (local.length >= 12) return local;

  const cc = String(countryCode || "91").replace(/\D/g, "") || "91";
  if (local.startsWith(cc) && local.length > 10) return local;
  return `${cc}${local}`;
}

export function whatsappChatUrl(countryCode: unknown, mobile: unknown, text: string) {
  const phone = normalizeWhatsappPhone(countryCode, mobile);
  if (phone.length < 10) return null;
  const params = new URLSearchParams({
    phone,
    text,
    type: "phone_number",
    // Stay on web click-to-chat so an already-open WhatsApp PWA is not reused.
    app_absent: "1",
  });
  return {
    phone,
    web: `https://api.whatsapp.com/send/?${params.toString()}`,
  };
}

/** Opens that number's chat with text ready, even if WhatsApp Web is already open. */
export function openWhatsappUserChat(countryCode: unknown, mobile: unknown, text: string) {
  const links = whatsappChatUrl(countryCode, mobile, text);
  if (!links || typeof window === "undefined") return false;

  const url = `${links.web}&_=${Date.now()}`;
  const name = `wa_send_${links.phone}_${Date.now()}`;
  const popup = window.open(
    "about:blank",
    name,
    "popup=yes,width=1100,height=820,scrollbars=yes,resizable=yes",
  );

  if (popup) {
    popup.opener = null;
    popup.location.replace(url);
    popup.focus();
    return true;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
