import { Share } from "react-native";
import moment from "moment";
import { getDynamicWorkerType } from "@/utils/i18n";
import {
  getServiceDetailsUniversalLink,
  PLAY_STORE_LISTING_URL,
} from "@/utils/serviceDeepLink";
import { getServiceJobId } from "@/utils/serviceJobId";

export type ShareMessageOptions = {
  t: (key: string, options?: Record<string, string | number>) => string;
};

/** Hindi labels for shared job post (WhatsApp-friendly). */
const HI = {
  title: "अपना रोज़गार — काम का विवरण",
  divider: "────────────────",
  jobType: "काम का प्रकार",
  howToApply: "आवेदन कैसे करें",
  address: "काम का पता",
  employerPhoneTitle: "काम देने वाले (मालिक) का मोबाइल नंबर",
  employerPhoneNote:
    "संपर्क: काम की पूरी जानकारी, दिहाड़ी और शर्तों के लिए इस नंबर पर कॉल या व्हाट्सऐप करें।",
  startDate: "काम शुरू होने की तारीख",
  duration: "अवधि (लगभग)",
  days: "दिन",
  skillPay: "कौशल और दिहाड़ी (सीधा काम)",
  workersNeeded: "काम के लिए कौन-कौन से कारीगर चाहिए",
  workersNeededNote:
    "नीचे हर पंक्ति में: कितने आदमी चाहिए और प्रतिदिन कितनी दिहाड़ी — यही जानकारी आवेदन के लिए जरूरी है।",
  facilitiesTitle: "मालिक जो सुविधाएँ दे रहा है (केवल यही उपलब्ध हैं)",
  facilitiesNone:
    "अलग से खाना / रहना / सफर / ईएसआई-पीएफ की सुविधा घोषित नहीं है।",
  description: "और विवरण",
  jobIdTitle: "काम की पहचान — जॉब आईडी (संदर्भ के लिए नोट करें)",
  howToOpenInApp: "ऐप में यह काम खोलकर आवेदन कैसे करें:",
  step1: '१) "अपना रोज़गार" मोबाइल ऐप खोलें।',
  step2: '२) होम / मेनू से "सभी काम" (All services) पर जाएँ।',
  step3: "३) नीचे लिखी जॉब आईडी से यही काम ढूँढें।",
  step4: "४) उस काम पर टैप करें, पूरा विवरण पढ़ें और आवेदन करें।",
  playStoreLine:
    'ऐप फोन में नहीं है तो पहले प्ले स्टोर से "अपना रोज़गार" इंस्टॉल करें, फिर ऊपर के चरण दोहराएँ।',
  openLinkDirectly: "या क्लिक करें",
  footer: "अपना रोज़गार से साझा किया गया। ज़रूरतमंद मजदूर भाइयों तक पहुँचाएँ।",
} as const;

const FACILITY_HI: Record<"food" | "living" | "travelling" | "esi_pf", string> =
  {
    food: "खाने की सुविधा",
    living: "रहने की व्यवस्था",
    travelling: "आने-जाने (सफर) की सुविधा",
    esi_pf: "ईएसआई / पीएफ",
  };

function formatStartDateEnglishLong(startDate: unknown): string {
  const raw =
    startDate &&
    typeof startDate === "object" &&
    "$date" in (startDate as object)
      ? (startDate as { $date: string }).$date
      : startDate;
  if (!raw) return "";
  const m = moment(raw as string | Date);
  if (!m.isValid()) return "";
  const day = m.date();
  const month = m.format("MMMM");
  const year = m.format("YYYY");
  return `${day} ${month}, ${year}`;
}

function addressToString(address: unknown): string {
  if (address == null) return "";
  if (typeof address === "string") return address.trim();
  try {
    return JSON.stringify(address);
  } catch {
    return String(address);
  }
}

function buildProvidedFacilitiesHindi(
  fac: Record<string, boolean | undefined> | undefined,
): string[] {
  if (!fac || typeof fac !== "object") return [];
  const out: string[] = [];
  (["food", "living", "travelling", "esi_pf"] as const).forEach((key) => {
    if (fac[key]) {
      out.push(`✓ ${FACILITY_HI[key]}`);
    }
  });
  return out;
}

export function getServiceShareImage(service: any): string {
  if (service?.images && service.images.length > 0) {
    return service.images[0];
  }

  return "https://yourcdn.com/default-job-image.jpg";
}

/**
 * Hindi share text for WhatsApp etc.: clear sections, employer phone explained,
 * job ID for reference, simple steps to open All services and apply (no app deep link in text).
 */
export function buildServiceShareMessage(
  service: any,
  opts: ShareMessageOptions,
): string {
  const { t } = opts;

  if (!service) return t("shareServiceFallback");

  const lines: string[] = [];

  // 🔥 Title
  lines.push(`🔥 *अर्जेंट जॉब ओपनिंग!* 🔥`);

  // 👷 Job Type
  if (service.subType) {
    lines.push(`👷 *${t(String(service.subType))}*`);
  }

  // 📍 Location
  const addr = addressToString(service.address);
  if (addr) {
    lines.push(`📍 ${addr}`);
  }

  // 👥 Workers Needed
  const reqs = service.requirements;
  if (Array.isArray(reqs) && reqs.length > 0) {
    const total = reqs.reduce((sum, r) => sum + (r.count || 0), 0);
    lines.push(`👥 काम: ${total} मजदूर`);
  }

  // 💰 Salary
  const applied = service.appliedSkill;
  if (applied?.pricePerDay) {
    lines.push(`💰 ₹${applied.pricePerDay} प्रति दिन`);
  } else if (reqs?.[0]?.payPerDay) {
    lines.push(`💰 ₹${reqs[0].payPerDay} प्रति दिन`);
  }

  // 🏠 Facilities
  const fac = service.facilities || {};
  const facilityParts: string[] = [];

  facilityParts.push(`🏠 रहना: ${fac.stay ? "✔️" : "❌"}`);
  facilityParts.push(`🍛 खाना: ${fac.food ? "✔️" : "❌"}`);
  facilityParts.push(`🛡️ ESI/PF: ${fac.esi ? "✔️" : "❌"}`);

  lines.push(facilityParts.join(" | "));

  // 📅 Duration / Start
  const start = formatStartDateEnglishLong(service.startDate);
  if (start) {
    lines.push(`📅 शुरू: ${start}`);
  }

  if (service.duration) {
    lines.push(`⏳ अवधि: ${service.duration} दिन`);
  }

  // 🔗 Link
  const serviceId = service?._id;
  const link = serviceId ? getServiceDetailsUniversalLink(serviceId) : "";

  if (link) {
    lines.push(`\n👉 *अभी Apply करें:*`);
    lines.push(link);
  }

  // 📢 Footer
  lines.push(`\n📲 Apna Rojgar ऐप से जुड़ें और रोज़गार पाएँ`);

  return lines.join("\n");
}

export async function shareServiceDetails(
  service: any,
  opts: ShareMessageOptions,
): Promise<{ ok: boolean }> {
  const message = buildServiceShareMessage(service, opts);
  const image = getServiceShareImage(service);
  if (!message.trim()) {
    return { ok: false };
  }

  try {
    const title = opts.t("shareServiceTitle");
    await Share.share({ message, title, url: image });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
