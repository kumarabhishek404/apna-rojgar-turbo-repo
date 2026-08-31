export const isListingFeatureActive = (service: any, now?: Date) => {
  const at =
    now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  const feat = service?.listingFeature;
  if (!feat?.enabled) return false;
  const expiresAt = feat.expiresAt ? new Date(feat.expiresAt) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > at.getTime();
};
