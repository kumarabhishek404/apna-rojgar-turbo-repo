/** In-app work-list featuring (admin-controlled, time-boxed). */

export const LISTING_FEATURE_MIN_DAYS = 1;
export const LISTING_FEATURE_MAX_DAYS = 90;

export function isListingFeatureActive(service, now) {
  const at =
    now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const feat = service?.listingFeature;
  if (!feat?.enabled) return false;
  const expiresAt = feat.expiresAt ? new Date(feat.expiresAt) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > at.getTime();
}

export function listingFeatureRankExpr(now = new Date()) {
  return {
    $cond: [
      {
        $and: [
          { $eq: ["$listingFeature.enabled", true] },
          { $gt: ["$listingFeature.expiresAt", now] },
        ],
      },
      1,
      0,
    ],
  };
}

export function sortWithFeaturedFirst(services, secondaryCompare) {
  if (!Array.isArray(services)) return services;
  return [...services].sort((a, b) => {
    const fa = isListingFeatureActive(a) ? 1 : 0;
    const fb = isListingFeatureActive(b) ? 1 : 0;
    if (fb !== fa) return fb - fa;
    return secondaryCompare(a, b);
  });
}

export function parseListingFeatureDays(value) {
  const days = Number(value);
  if (!Number.isInteger(days)) return null;
  if (days < LISTING_FEATURE_MIN_DAYS || days > LISTING_FEATURE_MAX_DAYS) {
    return null;
  }
  return days;
}
