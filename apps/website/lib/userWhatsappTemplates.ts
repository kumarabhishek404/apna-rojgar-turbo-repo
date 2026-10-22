import { buildNewUserWhatsappWelcome } from "@/lib/newUserWhatsappWelcome";

/**
 * Pre-written WhatsApp messages an admin can send to a user from the
 * users details popup. WhatsApp markup (*bold*) is used.
 */

export type UserWhatsappTemplateId =
  | "welcome"
  | "complete_profile"
  | "verified"
  | "reactivated"
  | "suspended"
  | "custom";

export type UserWhatsappContext = {
  name?: string;
  role?: string;
};

export type UserWhatsappTemplate = {
  id: UserWhatsappTemplateId;
  label: string;
  build: (ctx: UserWhatsappContext) => string;
};

const SIGN_OFF = `— टीम *अपना रोजगार* 🙏`;

function greeting(name?: string) {
  const first = String(name || "")
    .trim()
    .split(/\s+/)
    .find(Boolean);
  if (!first || first.toLowerCase() === "unnamed") return "*sir*";
  return `*${first} sir*`;
}

function profileTips(role?: string) {
  const key = String(role || "").toUpperCase();
  if (key === "EMPLOYER") {
    return [
      `• अपना *नाम और पता* सही भरें`,
      `• काम *पोस्ट* करते समय सैलरी और सुविधाएँ साफ़ लिखें`,
    ];
  }
  if (key === "MEDIATOR") {
    return [
      `• अपना *नाम, पता और स्किल* पूरा करें`,
      `• अपनी *टीम* में मजदूर जोड़ें`,
    ];
  }
  return [
    `• अपना *नाम और पता* सही भरें`,
    `• अपनी *स्किल (काम)* जोड़ें — ताकि सही जॉब मिले`,
    `• *लोकेशन* चालू रखें — पास की जॉब्स दिखेंगी`,
  ];
}

export const USER_WHATSAPP_TEMPLATES: UserWhatsappTemplate[] = [
  {
    id: "welcome",
    label: "Welcome",
    build: (ctx) => buildNewUserWhatsappWelcome(ctx.name, ctx.role),
  },
  {
    id: "complete_profile",
    label: "Complete profile",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.name)}! 🙏`,
        ``,
        `आपकी *अपना रोजगार* प्रोफ़ाइल अभी अधूरी है।`,
        ``,
        `*प्रोफ़ाइल पूरी करने के लिए:*`,
        ...profileTips(ctx.role),
        ``,
        `प्रोफ़ाइल पूरी होने पर आपको *ज़्यादा और बेहतर काम* मिलेंगे।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "verified",
    label: "Verified",
    build: (ctx) =>
      [
        `बधाई हो ${greeting(ctx.name)}! 🎉`,
        ``,
        `आपकी *अपना रोजगार* प्रोफ़ाइल अब *वेरिफ़ाइड ✅* हो गई है।`,
        ``,
        `अब आपकी प्रोफ़ाइल पर *वेरिफ़ाइड निशान* दिखेगा, जिससे लोगों का आप पर भरोसा बढ़ेगा।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "reactivated",
    label: "Account re-activated",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.name)}! 🙏`,
        ``,
        `आपका *अपना रोजगार* अकाउंट फिर से *चालू (Active)* कर दिया गया है।`,
        ``,
        `अब आप ऐप पहले की तरह इस्तेमाल कर सकते हैं।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "suspended",
    label: "Account suspended",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.name)}! 🙏`,
        ``,
        `आपका *अपना रोजगार* अकाउंट अभी *निलंबित (Suspended)* है।`,
        ``,
        `ज़्यादा जानकारी के लिए या अकाउंट दोबारा चालू करवाने के लिए कृपया इसी नंबर पर हमसे बात करें।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "custom",
    label: "Blank message",
    build: (ctx) => `नमस्ते ${greeting(ctx.name)}! 🙏\n\n`,
  },
];

export function buildUserWhatsappMessage(
  id: UserWhatsappTemplateId,
  ctx: UserWhatsappContext,
) {
  const template =
    USER_WHATSAPP_TEMPLATES.find((item) => item.id === id) ||
    USER_WHATSAPP_TEMPLATES[0];
  return template.build(ctx);
}

/** Picks the most useful template for the user's current state. */
export function defaultUserWhatsappTemplate(user: {
  status?: string;
  address?: string;
  skills?: unknown;
  role?: string;
}): UserWhatsappTemplateId {
  if (String(user.status || "").toUpperCase() === "SUSPENDED") {
    return "suspended";
  }
  const role = String(user.role || "").toUpperCase();
  const missingAddress = !String(user.address || "").trim();
  const missingSkills =
    role !== "EMPLOYER" && !(Array.isArray(user.skills) && user.skills.length);
  if (missingAddress || missingSkills) return "complete_profile";
  return "welcome";
}
