"use client";

type ShareServiceOptions = {
  language: string;
  shareUrl: string;
  appName?: string;
};

type ShareableService = {
  _id: string;
  type?: string;
  subType?: string;
  address?: string;
  duration?: number;
  startDate?: string;
  description?: string;
  jobID?: string;
  requirements?: Array<{ name?: string; count?: number; payPerDay?: number }>;
  employer?: { mobile?: string; _id?: string } | string;
  facilities?: Record<string, boolean>;
};

const HI = {
  divider: "────────────────",
  title: "अपना रोजगार — काम का विवरण",
  urgent: "🔥 अर्जेंट जॉब ओपनिंग!",
  location: "📍 लोकेशन",
  requirements: "👷 आवश्यक कारीगर",
  pay: "💰 दिहाड़ी",
  startDate: "📅 काम शुरू होने की तारीख",
  duration: "⏳ अवधि",
  details: "📝 काम का विवरण",
  contact: "📞 संपर्क",
  open: "🔗 लिंक खोलें",
  footer: "अपना रोजगार से साझा किया गया। जरूरतमंद लोगों तक जरूर पहुंचाएं।",
  day: "दिन",
  perDay: "प्रति दिन",
};

const EN = {
  divider: "────────────────",
  title: "Apna Rojgar — Job Details",
  urgent: "🔥 Urgent Job Opening!",
  location: "📍 Location",
  requirements: "👷 Required workers",
  pay: "💰 Wages",
  startDate: "📅 Start date",
  duration: "⏳ Duration",
  details: "📝 Description",
  contact: "📞 Contact",
  open: "🔗 Open link",
  footer: "Shared from Apna Rojgar. Please share with people who need work.",
  day: "days",
  perDay: "per day",
};

const normalize = (value: unknown) => String(value ?? "").trim();

const formatDate = (input?: string) => {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function buildRequirements(
  reqs: ShareableService["requirements"],
  labels: typeof HI | typeof EN,
) {
  if (!Array.isArray(reqs) || reqs.length === 0) return "";
  const lines = reqs.map((req, idx) => {
    const name = normalize(req?.name) || "-";
    const count = req?.count ?? "-";
    const pay = req?.payPerDay != null ? `₹${req.payPerDay}` : "-";
    return `${idx + 1}. ${name} — ${count} • ${pay} ${labels.perDay}`;
  });
  return `*${labels.requirements}:*\n${lines.join("\n")}`;
}

export function buildServiceShareMessage(
  service: ShareableService | null | undefined,
  options: ShareServiceOptions,
) {
  if (!service || !service._id) return "";
  const labels = options.language === "hi" ? HI : EN;
  const heading = [normalize(service.subType), normalize(service.type)]
    .filter(Boolean)
    .join(" • ");

  const blocks: string[] = [];
  blocks.push(`*${labels.title}*`);
  blocks.push(labels.divider);
  if (heading) blocks.push(`${labels.urgent}\n*${heading}*`);

  const address = normalize(service.address);
  if (address) blocks.push(`*${labels.location}:* ${address}`);

  const requirementSection = buildRequirements(
    service.requirements,
    labels,
  );
  if (requirementSection) blocks.push(requirementSection);

  const startDate = formatDate(service.startDate);
  if (startDate) blocks.push(`*${labels.startDate}:* ${startDate}`);

  if (service.duration != null) {
    blocks.push(`*${labels.duration}:* ${service.duration} ${labels.day}`);
  }

  const description = normalize(service.description);
  if (description) blocks.push(`*${labels.details}:*\n${description}`);

  const employerMobile =
    typeof service.employer === "object" && service.employer != null
      ? service.employer.mobile
      : undefined;
  const mobile = normalize(employerMobile);
  if (mobile) blocks.push(`*${labels.contact}:* ${mobile}`);

  if (service.jobID) blocks.push(`*Job ID:* ${service.jobID}`);

  blocks.push(`*${labels.open}:* ${options.shareUrl}`);
  blocks.push(`_${labels.footer}_`);

  return blocks.filter(Boolean).join("\n\n");
}

export async function shareServiceToApps(
  service: ShareableService | null | undefined,
  options: ShareServiceOptions,
) {
  const text = buildServiceShareMessage(service, options);
  if (!text) return { ok: false, copied: false };

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: options.appName || "Apna Rojgar",
        text,
        url: options.shareUrl,
      });
      return { ok: true, copied: false };
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return { ok: true, copied: true };
    }
  } catch {
    return { ok: false, copied: false };
  }

  return { ok: false, copied: false };
}
