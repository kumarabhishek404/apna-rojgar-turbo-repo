import dotenv from "dotenv";
dotenv.config();

const ADMIN_MOBILE = process.env.ADMIN_MOBILE;

// Function to validate if a user is an admin
export const isAdmin = (mobile) => {
  return mobile === ADMIN_MOBILE;
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
