/**
 * Official Apna Rojgar WhatsApp community invite links by public role.
 * Tap targets for welcome push notifications after registration.
 */
export const WHATSAPP_GROUP_BY_ROLE = {
  WORKER: "https://chat.whatsapp.com/FFvAv3Ygor4Aqbi6tSSI5j?mode=gi_t",
  MEDIATOR: "https://chat.whatsapp.com/CdJcn9AcfVK6xekk329d0Q?mode=gi_t",
  EMPLOYER: "https://chat.whatsapp.com/Dv2khyXxDrrCaWna8OxUCY?mode=gi_t",
};

/** Contractor is the product name for MEDIATOR. */
export const WHATSAPP_GROUP_ROLE_LABEL = {
  WORKER: "Workers (मज़दूर)",
  MEDIATOR: "Contractors (ठेकेदार)",
  EMPLOYER: "Employers (काम देने वाले)",
};

export function normalizePublicRole(role) {
  const key = String(role || "")
    .trim()
    .toUpperCase();
  if (key === "WORKER" || key === "MEDIATOR" || key === "EMPLOYER") {
    return key;
  }
  return null;
}

export function getWhatsappGroupLinkForRole(role) {
  const key = normalizePublicRole(role);
  return key ? WHATSAPP_GROUP_BY_ROLE[key] : null;
}

export function getWhatsappGroupLabelForRole(role) {
  const key = normalizePublicRole(role);
  return key ? WHATSAPP_GROUP_ROLE_LABEL[key] : null;
}
