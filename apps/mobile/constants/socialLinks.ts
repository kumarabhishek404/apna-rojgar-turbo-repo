import { APPLINK } from "@/constants";

/** Official support mailbox for account reactivation and policy queries. */
export const SUPPORT_EMAIL = "info@apnarojgarindia.com";

/** Role-specific WhatsApp community invite links. */
export const WHATSAPP_GROUP_BY_ROLE = {
  WORKER: "https://chat.whatsapp.com/FFvAv3Ygor4Aqbi6tSSI5j?mode=gi_t",
  MEDIATOR: "https://chat.whatsapp.com/CdJcn9AcfVK6xekk329d0Q?mode=gi_t",
  EMPLOYER: "https://chat.whatsapp.com/Dv2khyXxDrrCaWna8OxUCY?mode=gi_t",
} as const;

export type WhatsappGroupRole = keyof typeof WHATSAPP_GROUP_BY_ROLE;

export function getWhatsappGroupLinkForRole(
  role?: string | null,
): string {
  const key = String(role || "")
    .trim()
    .toUpperCase() as WhatsappGroupRole;
  return WHATSAPP_GROUP_BY_ROLE[key] || WHATSAPP_GROUP_BY_ROLE.WORKER;
}

/** Official Apna Rojgar social & app links (aligned with website schema). */
export const SOCIAL_LINKS = {
  /** Default / fallback group (workers). Prefer getWhatsappGroupLinkForRole(role). */
  whatsappGroup: WHATSAPP_GROUP_BY_ROLE.WORKER,
  instagram: "https://www.instagram.com/apnarojgarindia/",
  threads: "https://www.threads.com/@apnarojgarindia",
  linkedin: "https://www.linkedin.com/company/apna-rojgar-india/",
  facebook: "https://www.facebook.com/profile.php?id=61572228340443",
  youtube: "https://www.youtube.com/@apnarojgarindia",
  website: "https://www.apnarojgarindia.com",
  playStore: APPLINK,
} as const;

export const PLAY_STORE_PACKAGE = "com.kumarabhishek404.labourapp";
