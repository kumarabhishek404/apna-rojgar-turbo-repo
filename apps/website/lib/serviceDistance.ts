export type GeoPoint = {
  type?: string;
  coordinates?: [number, number];
};

export type BrowserGeo = { lat: number; lng: number };

/**
 * Haversine distance between two WGS84 points (kilometers).
 * Matches backend `haversineDistance` (service/user GeoJSON order: [lng, lat]).
 */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Human-readable distance: meters under 1 km, else km with sensible precision. */
export function formatDistanceLabel(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) {
    return `${Math.max(1, Math.round(km * 1000))} m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Picks the best available distance for the logged-in user:
 * 1) Device/browser location vs service (if both exist)
 * 2) Backend `distance` (profile geo vs service, when API filled it)
 * 3) Profile geo vs service coordinates
 */
export function resolveServiceDistanceKm(opts: {
  serviceDistance?: number | null;
  serviceGeo?: GeoPoint | null;
  userGeo?: GeoPoint | null;
  browserGeo?: BrowserGeo | null;
}): number | null {
  const coords = opts.serviceGeo?.coordinates;
  const hasService = Boolean(coords && coords.length >= 2);
  const svcLng = hasService ? coords![0] : null;
  const svcLat = hasService ? coords![1] : null;

  if (
    opts.browserGeo &&
    svcLat != null &&
    svcLng != null &&
    Number.isFinite(svcLat) &&
    Number.isFinite(svcLng)
  ) {
    return haversineKm(opts.browserGeo.lat, opts.browserGeo.lng, svcLat, svcLng);
  }

  if (typeof opts.serviceDistance === "number" && Number.isFinite(opts.serviceDistance)) {
    return opts.serviceDistance;
  }

  const u = opts.userGeo?.coordinates;
  if (
    u &&
    u.length >= 2 &&
    svcLat != null &&
    svcLng != null &&
    Number.isFinite(u[0]) &&
    Number.isFinite(u[1]) &&
    Number.isFinite(svcLat) &&
    Number.isFinite(svcLng)
  ) {
    return haversineKm(u[1], u[0], svcLat, svcLng);
  }

  return null;
}
