import { getDistanceBetweenLocations } from "@/utils/searchFilters";

type GeoLike = { coordinates?: unknown } | null | undefined;

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .trim();

/** Max ₹/day across requirement rows */
export const getServiceMaxDailyPay = (service: any): number => {
  const reqs = Array.isArray(service?.requirements) ? service.requirements : [];
  let max = 0;
  for (const r of reqs) {
    const p = Number(r?.payPerDay);
    if (Number.isFinite(p)) max = Math.max(max, p);
  }
  return max;
};

const distanceKm = (userLoc: GeoLike, item: any): number | null =>
  getDistanceBetweenLocations(
    userLoc,
    item?.geoLocation ?? item?.location,
  );

export function filterUsersBySearch(
  items: any[],
  query: string,
): any[] {
  const q = norm(query);
  if (!q) return items;
  return items.filter((item) => {
    const blob = norm(
      [
        item?.name,
        item?.address,
        Array.isArray(item?.skills)
          ? item.skills
              .map((s: any) =>
                typeof s === "string" ? s : String(s?.skill ?? ""),
              )
              .join(" ")
          : "",
        item?.email,
        item?.phone,
      ].join(" "),
    );
    return blob.includes(q);
  });
}

export function filterUsersBySearchLoose(items: any[], query: string): any[] {
  const q = norm(query);
  if (!q) return items;
  return items.filter((item) => {
    const blob = norm(
      [
        item?.name,
        item?.address,
        item?.teamDetails?.memberCount,
        Array.isArray(item?.skills)
          ? item.skills
              .map((s: any) =>
                typeof s === "string" ? s : String(s?.skill ?? ""),
              )
              .join(" ")
          : "",
      ].join(" "),
    );
    return blob.includes(q);
  });
}

export function filterServicesBySearch(items: any[], query: string): any[] {
  const q = norm(query);
  if (!q) return items;
  return items.filter((item) => {
    const reqBlob = Array.isArray(item?.requirements)
      ? item.requirements
          .map(
            (r: any) =>
              `${r?.name ?? ""} ${r?.payPerDay ?? ""} ${r?.count ?? ""}`,
          )
          .join(" ")
      : "";
    const blob = norm(
      [
        item?.type,
        item?.subType,
        item?.address,
        item?.duration,
        reqBlob,
      ].join(" "),
    );
    return blob.includes(q);
  });
}

export type WorkerSortId = "nearest" | "trusted_profiles";
export type ContractorSortId = "nearest" | "larger_team" | "trusted_profiles";
export type ServiceSortId =
  | "nearest"
  | "latest"
  | "more_salary"
  | "food_available"
  | "living_available"
  | "esi_pf";

const hasNonEmptyText = (v: unknown): boolean =>
  typeof v === "string" ? v.trim().length > 0 : v != null && String(v).trim().length > 0;

const hasSkills = (item: any): boolean => {
  const s = item?.skills;
  if (!Array.isArray(s) || s.length === 0) return false;
  // Supports both ["plumber"] and [{skill:"plumber"}] shapes.
  return s.some((x: any) => {
    if (typeof x === "string") return x.trim().length > 0;
    return hasNonEmptyText(x?.skill);
  });
};

const getMobileLike = (item: any): string => {
  const raw =
    item?.mobile ??
    item?.phone ??
    item?.phoneNumber ??
    item?.contactNumber ??
    "";
  const s = String(raw ?? "").trim();
  return s === "undefined" || s === "null" ? "" : s;
};

const getProfilePhoto = (item: any): string => {
  const raw =
    item?.profilePicture ??
    item?.profileImage ??
    item?.avatar ??
    item?.photo ??
    "";
  return String(raw ?? "").trim();
};

export const getTrustedProfileScore = (item: any): number => {
  let score = 0;
  if (hasNonEmptyText(item?.name)) score += 1;
  if (hasNonEmptyText(item?.address)) score += 1;
  if (hasSkills(item)) score += 1;
  if (hasNonEmptyText(getProfilePhoto(item))) score += 1;
  if (getMobileLike(item).length > 0) score += 1;
  return score;
};

export const isTrustedProfile = (item: any): boolean =>
  getTrustedProfileScore(item) >= 5;

export function sortWorkerList(
  items: any[],
  sortId: WorkerSortId,
  userLoc: GeoLike,
): any[] {
  let copy = [...items];

  if (sortId === "trusted_profiles") {
    copy = copy.filter(isTrustedProfile);
    copy.sort((a, b) => {
      const sa = getTrustedProfileScore(a);
      const sb = getTrustedProfileScore(b);
      if (sb !== sa) return sb - sa;
      const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
      const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
    return copy;
  }

  copy.sort((a, b) => {
    const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
    const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
  return copy;
}

export function sortContractorList(
  items: any[],
  sortId: ContractorSortId,
  userLoc: GeoLike,
): any[] {
  let copy = [...items];

  if (sortId === "trusted_profiles") {
    copy = copy.filter(isTrustedProfile);
    copy.sort((a, b) => {
      const sa = getTrustedProfileScore(a);
      const sb = getTrustedProfileScore(b);
      if (sb !== sa) return sb - sa;
      const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
      const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
    return copy;
  }

  if (sortId === "larger_team") {
    copy.sort(
      (a, b) =>
        (Number(b?.teamDetails?.memberCount) || 0) -
        (Number(a?.teamDetails?.memberCount) || 0),
    );
    return copy;
  }

  copy.sort((a, b) => {
    const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
    const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
  return copy;
}

function serviceHasFacility(service: any, key: string): boolean {
  const f = service?.facilities;
  return !!(f && typeof f === "object" && f[key] === true);
}

export function applyServiceBrowse(
  items: any[],
  sortId: ServiceSortId,
  userLoc: GeoLike,
): any[] {
  let copy = [...items];

  if (sortId === "food_available") {
    copy = copy.filter((s) => serviceHasFacility(s, "food"));
  } else if (sortId === "living_available") {
    copy = copy.filter((s) => serviceHasFacility(s, "living"));
  } else if (sortId === "esi_pf") {
    copy = copy.filter((s) => serviceHasFacility(s, "esi_pf"));
  }

  if (sortId === "nearest") {
    copy.sort((a, b) => {
      const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
      const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  } else if (sortId === "latest") {
    copy.sort((a, b) => {
      const ta = new Date(a?.createdAt ?? 0).getTime();
      const tb = new Date(b?.createdAt ?? 0).getTime();
      return tb - ta;
    });
  } else if (sortId === "more_salary") {
    copy.sort(
      (a, b) => getServiceMaxDailyPay(b) - getServiceMaxDailyPay(a),
    );
  } else {
    copy.sort((a, b) => {
      const da = distanceKm(userLoc, a) ?? Number.POSITIVE_INFINITY;
      const db = distanceKm(userLoc, b) ?? Number.POSITIVE_INFINITY;
      return da - db;
    });
  }

  return copy;
}
