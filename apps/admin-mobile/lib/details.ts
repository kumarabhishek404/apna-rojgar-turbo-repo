import type { AdminService, AdminUser, ServicePerson } from "@/lib/types";

export function geoPoint(geo?: { coordinates?: number[] } | null) {
  const [lng, lat] = geo?.coordinates || [];
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Number(lat) === 0 && Number(lng) === 0) return null;
  return { lat: Number(lat), lng: Number(lng) };
}

export function mapsUrl(geo?: { coordinates?: number[] } | null) {
  const point = geoPoint(geo);
  if (!point) return null;
  return `https://www.google.com/maps?q=${point.lat},${point.lng}`;
}

export function nestedNumber(source: unknown, path: string[]) {
  let current: unknown = source;
  for (const key of path) {
    if (!current || typeof current !== "object") return 0;
    current = (current as Record<string, unknown>)[key];
  }
  const value = Number(current);
  return Number.isFinite(value) ? value : 0;
}

export function rupees(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function roleLabel(role?: string | null) {
  const key = String(role || "").toUpperCase();
  if (key === "MEDIATOR") return "Contractor";
  if (key === "ADMIN") return "Admin";
  if (key === "WORKER") return "Worker";
  if (key === "EMPLOYER") return "Employer";
  return role?.trim() || "Unassigned";
}

export function isVerifiableRole(role?: string | null) {
  return ["WORKER", "EMPLOYER", "MEDIATOR"].includes(String(role || "").toUpperCase());
}

export function isListingFeatureActive(service?: { listingFeature?: AdminService["listingFeature"] } | null) {
  const feature = service?.listingFeature;
  if (!feature?.enabled || !feature.expiresAt) return false;
  const expires = new Date(feature.expiresAt).getTime();
  return Number.isFinite(expires) && expires > Date.now();
}

export function skillItems(skills: AdminUser["skills"]) {
  return (skills || [])
    .map((item) => {
      if (typeof item === "string") return { name: item, pay: "" };
      const name = item.skill?.trim() || "";
      const pay = item.pricePerDay ? `₹${item.pricePerDay}/day` : "";
      return { name, pay };
    })
    .filter((item) => item.name);
}

export function countOf(value: unknown) {
  return Array.isArray(value) ? value.length : 0;
}

export function personOf(value?: ServicePerson | string | null): ServicePerson | null {
  if (!value || typeof value === "string") return null;
  return value;
}

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

export function applicantsOf(service: AdminService): ApplicantRow[] {
  const rows: ApplicantRow[] = [];
  (service.appliedUsers || []).forEach((entry, index) => {
    const person = personOf(entry.user);
    const skill = entry.appliedSkills?.filter(Boolean).join(", ") || entry.skill?.trim() || "—";
    const mediatorName = person?.name || "Applicant";
    if (person || typeof entry.user === "string") {
      rows.push({
        key: `applicant-${index}-${person?._id || "unknown"}`,
        name: person?.name || "Unknown",
        role: person?.role || entry.applicantType || "—",
        skill,
        address: person?.address || "—",
        mobile: person?.mobile || "—",
        status: entry.status || "—",
        profilePicture: person?.profilePicture,
      });
    }
    (entry.workers || []).forEach((workerEntry, workerIndex) => {
      const worker = personOf(workerEntry.worker);
      if (!worker && typeof workerEntry.worker !== "string") return;
      rows.push({
        key: `worker-${index}-${workerIndex}-${worker?._id || "unknown"}`,
        name: worker?.name || "Unknown",
        role: worker?.role || "WORKER",
        skill: workerEntry.skill?.trim() || skill,
        address: worker?.address || "—",
        mobile: worker?.mobile || "—",
        status: workerEntry.status || entry.status || "—",
        profilePicture: worker?.profilePicture,
        viaMediator: mediatorName,
      });
    });
  });
  return rows;
}

export function payRange(service: AdminService) {
  const pays = (service.requirements || []).map((item) => Number(item.payPerDay)).filter((value) => Number.isFinite(value) && value > 0);
  if (!pays.length) return "—";
  const min = Math.min(...pays);
  const max = Math.max(...pays);
  return min === max ? `₹${min}` : `₹${min}–${max}`;
}

export function workersNeeded(service: AdminService) {
  return (service.requirements || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0);
}
