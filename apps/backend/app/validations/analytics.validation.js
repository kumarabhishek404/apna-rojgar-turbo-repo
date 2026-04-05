import Joi from "joi";

const analyticsEventItemSchema = Joi.object({
  name: Joi.string().trim().min(1).required(),
  properties: Joi.object().unknown(true).allow(null).default({}),
  clientTimestamp: Joi.date().required(),
});

const nullableString = Joi.string().allow(null, "");
const nullableBool = Joi.boolean().allow(null);

export const analyticsBatchSchema = Joi.object({
  sessionId: Joi.string().trim().min(1).required(),
  /** Normalized in controller to ios | android | web or omitted */
  platform: Joi.string().trim().allow(null, ""),
  appVersion: nullableString,
  osVersion: nullableString,
  deviceModel: nullableString,
  deviceManufacturer: nullableString,
  isPhysicalDevice: nullableBool,
  locale: nullableString,
  timezone: nullableString,
  nativeBuildVersion: nullableString,
  expoRuntimeVersion: nullableString,
  appName: nullableString,
  batchSentAt: Joi.date().allow(null),
  events: Joi.array().items(analyticsEventItemSchema).min(1).required(),
});
