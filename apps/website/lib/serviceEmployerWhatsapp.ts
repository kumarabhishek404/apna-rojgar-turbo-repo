/**
 * Pre-written WhatsApp messages an admin can send to a work's employer
 * from the registered-services details popup. WhatsApp markup (*bold*) is used.
 */

export type EmployerWhatsappTemplateId =
  | "follow_up"
  | "need_more_applicants"
  | "cancelled"
  | "reactivated"
  | "custom";

export type EmployerWhatsappContext = {
  employerName?: string;
  workTitle: string;
  jobId?: string;
  address?: string;
  applicantCount: number;
};

export type EmployerWhatsappTemplate = {
  id: EmployerWhatsappTemplateId;
  label: string;
  build: (ctx: EmployerWhatsappContext) => string;
};

function firstName(name?: string) {
  const first = String(name || "")
    .trim()
    .split(/\s+/)
    .find(Boolean);
  return first || "sir";
}

function greeting(name?: string) {
  const who = firstName(name);
  return who.toLowerCase() === "sir" ? "*sir*" : `*${who} sir*`;
}

function workLine(ctx: EmployerWhatsappContext) {
  const id = ctx.jobId && ctx.jobId !== "-" ? ` (Job ID: *${ctx.jobId}*)` : "";
  return `*${ctx.workTitle}*${id}`;
}

const SIGN_OFF = `— टीम *अपना रोजगार* 🙏`;

export const EMPLOYER_WHATSAPP_TEMPLATES: EmployerWhatsappTemplate[] = [
  {
    id: "follow_up",
    label: "Follow-up",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.employerName)}! 🙏`,
        ``,
        `आपने *अपना रोजगार* पर ${workLine(ctx)} पोस्ट किया था।`,
        ctx.applicantCount > 0
          ? `अब तक *${ctx.applicantCount}* लोग अप्लाई कर चुके हैं — ऐप में जाकर प्रोफ़ाइल देखें और सही वर्कर को *सेलेक्ट* करें।`
          : `क्या आपको अभी भी वर्कर की ज़रूरत है? हम आपकी मदद करना चाहते हैं।`,
        ``,
        `कोई दिक्कत हो तो इसी नंबर पर बताइए।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "need_more_applicants",
    label: "More applicants",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.employerName)}! 🙏`,
        ``,
        `आपका ${workLine(ctx)} *अपना रोजगार* पर लाइव है।`,
        ctx.applicantCount > 0
          ? `अभी तक *${ctx.applicantCount}* अप्लाई आए हैं।`
          : `अभी तक कोई अप्लाई नहीं आया है।`,
        ``,
        `*ज़्यादा वर्कर पाने के लिए:*`,
        `• काम का *पता और सैलरी* सही भरें`,
        `• *पेड प्रमोशन* से आपका काम और ज़्यादा लोगों तक पहुँचेगा`,
        ``,
        `चाहें तो हम आपके काम को ऐप में *फ़ीचर* भी कर सकते हैं। बताइए!`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "cancelled",
    label: "Work cancelled",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.employerName)}! 🙏`,
        ``,
        `आपका ${workLine(ctx)} *अपना रोजगार* पर *रद्द (Cancel)* कर दिया गया है।`,
        ``,
        `अगर यह गलती से हुआ है या आप काम दोबारा चालू करवाना चाहते हैं, तो कृपया इसी नंबर पर बताइए — हम तुरंत *री-एक्टिवेट* कर देंगे।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "reactivated",
    label: "Work re-activated",
    build: (ctx) =>
      [
        `नमस्ते ${greeting(ctx.employerName)}! 🙏`,
        ``,
        `आपका ${workLine(ctx)} *अपना रोजगार* पर फिर से *चालू (Active)* कर दिया गया है।`,
        ``,
        `अब वर्कर दोबारा आपके काम पर अप्लाई कर सकेंगे। ऐप में जाकर अप्लाई देखते रहें।`,
        ``,
        SIGN_OFF,
      ].join("\n"),
  },
  {
    id: "custom",
    label: "Blank message",
    build: (ctx) => `नमस्ते ${greeting(ctx.employerName)}! 🙏\n\n`,
  },
];

/** Picks the most useful template for the service's current state. */
export function defaultEmployerWhatsappTemplate(
  status?: string,
  applicantCount = 0,
): EmployerWhatsappTemplateId {
  const key = String(status || "").toUpperCase();
  if (key === "CANCELLED") return "cancelled";
  if (key === "HIRING" && applicantCount === 0) return "need_more_applicants";
  return "follow_up";
}

export function buildEmployerWhatsappMessage(
  id: EmployerWhatsappTemplateId,
  ctx: EmployerWhatsappContext,
) {
  const template =
    EMPLOYER_WHATSAPP_TEMPLATES.find((item) => item.id === id) ||
    EMPLOYER_WHATSAPP_TEMPLATES[0];
  return template.build(ctx);
}
