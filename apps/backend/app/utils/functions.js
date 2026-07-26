import dotenv from "dotenv";
dotenv.config();

const getAdminMobile = () => String(process.env.ADMIN_MOBILE || "").trim();

/** True when mobile matches ADMIN_MOBILE env (legacy / bridge). */
export const isAdminMobile = (mobile) => {
  const adminMobile = getAdminMobile();
  if (!adminMobile) return false;
  return String(mobile || "").trim() === adminMobile;
};

/** @deprecated Prefer userHasAdminAccess(user). Kept for existing mobile-only checks. */
export const isAdmin = (mobile) => isAdminMobile(mobile);

/** Admin access: role ADMIN, or ADMIN_MOBILE bridge. */
export const userHasAdminAccess = (user) => {
  if (!user) return false;
  if (String(user.role || "").toUpperCase() === "ADMIN") return true;
  return isAdminMobile(user.mobile);
};

// Haversine Distance Function
export const haversineDistance = (geo1, geo2) => {
  const R = 6371; // Earth radius in KM

  const toRad = (deg) => (deg * Math.PI) / 180;

  // ✅ Extract [lng, lat]
  const [lng1, lat1] = geo1.coordinates;
  const [lng2, lat2] = geo2.coordinates;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // KM
};
