export type AdminPerson = {
  _id?: string;
  name?: string;
  mobile?: string;
  countryCode?: string;
  role?: string;
  address?: string;
  profilePicture?: string;
  status?: string;
  registrationSource?: string;
  email?: { value?: string; isVerified?: boolean };
};

export type AdminEmployer = AdminPerson;

export type AppliedWorkerEntry = {
  worker?: AdminPerson | string;
  skill?: string;
  status?: string;
};

export type AppliedUserEntry = {
  user?: AdminPerson | string;
  skill?: string;
  appliedSkills?: string[];
  applicantType?: string;
  status?: string;
  workers?: AppliedWorkerEntry[];
};

export type ApplicantRow = {
  key: string;
  name: string;
  role: string;
  skill: string;
  address: string;
  mobile: string;
  status: string;
  profilePicture?: string;
  viaMediator?: string;
};

export type AdminService = {
  _id: string;
  jobID?: string;
  bookingType?: string;
  status?: string;
  type?: string;
  subType?: string;
  description?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  images?: string[];
  facilities?: Record<string, boolean>;
  requirements?: Array<Record<string, unknown>>;
  appliedUsers?: AppliedUserEntry[];
  selectedUsers?: unknown[];
  likedBy?: unknown[];
  uploadStatus?: string;
  socialMediaPromotion?: {
    enabled?: boolean;
    status?: string;
    orderId?: string;
    amount?: number;
    paidAt?: string;
  };
  listingFeature?: {
    enabled?: boolean;
    days?: number;
    startsAt?: string;
    expiresAt?: string;
    featuredBy?: string;
  };
  geoLocation?: unknown;
  appliedSkill?: unknown;
  employer?: AdminEmployer | string;
  bookedWorker?: AdminEmployer | string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function statusClass(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "HIRING":
      return "bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "bg-blue-50 text-blue-700";
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

export function stringValue(value: unknown) {
  if (value == null) return "-";
  const normalized = String(value).trim();
  return normalized || "-";
}

/** CamelCase / snake_case → Title Case when no locale entry exists. */
export function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Resolve i18n label for work type / skill / status keys (same pattern as service details). */
export function localizedLabel(
  t: (key: string, fallback?: string) => string,
  value?: string | null,
) {
  if (value == null) return "-";
  const raw = String(value).trim();
  if (!raw || raw === "-") return "-";

  const exact = t(raw, "");
  if (exact) return exact;

  const lower = raw.toLowerCase();
  if (lower !== raw) {
    const viaLower = t(lower, "");
    if (viaLower) return viaLower;
  }

  return humanizeKey(raw);
}

export function localizedSkillList(
  t: (key: string, fallback?: string) => string,
  value?: string | null,
) {
  if (!value || value === "-") return "-";
  return value
    .split(",")
    .map((part) => localizedLabel(t, part.trim()))
    .join(", ");
}

export function isPaidService(service: AdminService) {
  const promo = service.socialMediaPromotion;
  if (!promo) return false;
  return (
    String(promo.status || "").toUpperCase() === "PAID" ||
    (promo.enabled === true && Number(promo.amount || 0) > 0)
  );
}

export function resolveEmployer(service: AdminService): AdminEmployer | null {
  if (!service.employer || typeof service.employer === "string") return null;
  return service.employer;
}

export function resolveWorker(service: AdminService): AdminEmployer | null {
  if (!service.bookedWorker || typeof service.bookedWorker === "string") {
    return null;
  }
  return service.bookedWorker;
}

export function resolvePerson(value?: AdminPerson | string | null): AdminPerson | null {
  if (!value || typeof value === "string") return null;
  return value;
}

export function skillLabel(entry: {
  skill?: string;
  appliedSkills?: string[];
}): string {
  if (Array.isArray(entry.appliedSkills) && entry.appliedSkills.length > 0) {
    return entry.appliedSkills.filter(Boolean).join(", ");
  }
  return entry.skill?.trim() || "-";
}

/** Flatten appliedUsers (+ nested mediator workers) for the details modal. */
export function getApplicants(service: AdminService): ApplicantRow[] {
  const rows: ApplicantRow[] = [];
  const entries = Array.isArray(service.appliedUsers) ? service.appliedUsers : [];

  entries.forEach((entry, index) => {
    const person = resolvePerson(entry.user);
    const mediatorName = person?.name || "Applicant";
    const skill = skillLabel(entry);

    if (person || typeof entry.user === "string") {
      rows.push({
        // Include application index — same user can apply more than once.
        key: `applicant-${index}-${person?._id || entry.user || "unknown"}`,
        name: person?.name || "Unknown",
        role: person?.role || entry.applicantType || "-",
        skill,
        address: person?.address || "-",
        mobile: person?.mobile || "-",
        status: entry.status || "-",
        profilePicture: person?.profilePicture,
      });
    }

    const nested = Array.isArray(entry.workers) ? entry.workers : [];
    nested.forEach((workerEntry, workerIndex) => {
      const worker = resolvePerson(workerEntry.worker);
      if (!worker && typeof workerEntry.worker !== "string") return;
      rows.push({
        key: `worker-${index}-${workerIndex}-${worker?._id || workerEntry.worker || "unknown"}`,
        name: worker?.name || "Unknown",
        role: worker?.role || "WORKER",
        skill: workerEntry.skill?.trim() || skill,
        address: worker?.address || "-",
        mobile: worker?.mobile || "-",
        status: workerEntry.status || entry.status || "-",
        profilePicture: worker?.profilePicture,
        viaMediator: mediatorName,
      });
    });
  });

  return rows;
}

export async function copyText(value: string) {
  if (!value || value === "-") return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const el = document.createElement("textarea");
    el.value = value;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}
