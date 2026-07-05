import AppMetadata from "../models/appMetadata.model.js";

export const APP_METADATA_KEYS = {
  SERVICE_PROMOTION_AMOUNT: "payments.service_promotion_amount",
};

const APP_METADATA_DEFAULTS = {
  [APP_METADATA_KEYS.SERVICE_PROMOTION_AMOUNT]: {
    value: 500,
    valueType: "number",
    description: "Amount in INR charged for social media service promotion",
  },
};

const coerceMetadataValue = (raw, valueType) => {
  if (raw === undefined || raw === null) return raw;

  switch (valueType) {
    case "number": {
      const num = Number(raw);
      return Number.isFinite(num) ? num : raw;
    }
    case "boolean":
      if (typeof raw === "boolean") return raw;
      return ["1", "true", "yes"].includes(String(raw).toLowerCase());
    case "json":
      if (typeof raw === "object") return raw;
      try {
        return JSON.parse(String(raw));
      } catch {
        return raw;
      }
    default:
      return String(raw);
  }
};

export const seedAppMetadataDefaults = async () => {
  for (const [key, config] of Object.entries(APP_METADATA_DEFAULTS)) {
    await AppMetadata.updateOne(
      { key },
      {
        $setOnInsert: {
          key,
          value: config.value,
          valueType: config.valueType,
          description: config.description || "",
        },
      },
      { upsert: true },
    );
  }
};

export const getMetadataEntry = async (key) => {
  return AppMetadata.findOne({ key }).lean();
};

export const getMetadataValue = async (key, fallback = null) => {
  const entry = await getMetadataEntry(key);
  if (!entry) return fallback;

  const coerced = coerceMetadataValue(entry.value, entry.valueType || "string");
  return coerced ?? fallback;
};

export const setMetadataValue = async (key, value, extras = {}) => {
  const defaults = APP_METADATA_DEFAULTS[key] || {};
  const doc = await AppMetadata.findOneAndUpdate(
    { key },
    {
      $set: {
        value,
        valueType: extras.valueType || defaults.valueType || "string",
        description: extras.description ?? defaults.description ?? "",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return doc;
};

export const getPromotionAmount = async () => {
  const amount = await getMetadataValue(
    APP_METADATA_KEYS.SERVICE_PROMOTION_AMOUNT,
    APP_METADATA_DEFAULTS[APP_METADATA_KEYS.SERVICE_PROMOTION_AMOUNT].value,
  );
  const normalized = Number(amount);
  const fallback =
    APP_METADATA_DEFAULTS[APP_METADATA_KEYS.SERVICE_PROMOTION_AMOUNT].value;
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback;
};
