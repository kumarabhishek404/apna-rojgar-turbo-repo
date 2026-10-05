import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNotificationDedupKey,
  enrichNotificationData,
  getIstDayStart,
  getNotificationPolicy,
  getQuietHoursState,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
} from "./notificationPolicy.js";

test("classifies discovery notifications with cooldown and daily cap", () => {
  const policy = getNotificationPolicy("NEW_SERVICE_ARRIVED_OF_SKILL");
  assert.equal(policy.category, NOTIFICATION_CATEGORIES.DISCOVERY);
  assert.equal(policy.priority, NOTIFICATION_PRIORITIES.NORMAL);
  assert.equal(policy.cooldownHours, 12);
  assert.equal(policy.dailyCap, 3);
  assert.equal(policy.digestWindowMinutes, 60);
  assert.equal(policy.respectQuietHours, true);
});

test("keeps urgent cancellation notifications outside quiet-hour limits", () => {
  const policy = getNotificationPolicy("SERVICE_CANCELLED");
  assert.equal(policy.category, NOTIFICATION_CATEGORIES.TRANSACTIONAL);
  assert.equal(policy.priority, NOTIFICATION_PRIORITIES.URGENT);
  assert.equal(policy.respectQuietHours, false);
  assert.equal(policy.dailyCap, 0);
});

test("defers non-critical notifications during IST quiet hours", () => {
  // 17:00 UTC = 22:30 IST.
  const now = new Date("2026-08-09T17:00:00.000Z");
  const result = getQuietHoursState(now);
  assert.equal(result.isQuiet, true);
  assert.equal(result.scheduledFor.toISOString(), "2026-08-10T02:30:00.000Z");
});

test("allows notifications during IST daytime", () => {
  // 06:30 UTC = 12:00 IST.
  const result = getQuietHoursState(
    new Date("2026-08-09T06:30:00.000Z"),
  );
  assert.equal(result.isQuiet, false);
  assert.equal(result.scheduledFor, null);
});

test("calculates the current IST day boundary", () => {
  const boundary = getIstDayStart(new Date("2026-08-09T20:00:00.000Z"));
  assert.equal(boundary.toISOString(), "2026-08-09T18:30:00.000Z");
});

test("builds stable per-service dedup keys and deep links", () => {
  const data = enrichNotificationData({ serviceId: "service-123" });
  assert.equal(data.url, "apnarojgar://job/service-123");
  assert.equal(data.type, "JOB");
  assert.equal(data.id, "service-123");
  assert.equal(
    buildNotificationDedupKey("new_service_arrived_of_skill", data),
    "NEW_SERVICE_ARRIVED_OF_SKILL:service-123",
  );
});

test("classifies welcome WhatsApp group notification with long cooldown", () => {
  const policy = getNotificationPolicy("WELCOME_WHATSAPP_GROUP");
  assert.equal(policy.category, NOTIFICATION_CATEGORIES.SYSTEM);
  assert.equal(policy.priority, NOTIFICATION_PRIORITIES.HIGH);
  assert.equal(policy.cooldownHours, 365 * 24);
  assert.equal(policy.respectQuietHours, false);
});

test("preserves explicit https urls in enrichNotificationData", () => {
  const url = "https://chat.whatsapp.com/FFvAv3Ygor4Aqbi6tSSI5j?mode=gi_t";
  const data = enrichNotificationData({
    url,
    type: "WELCOME_WHATSAPP_GROUP",
  });
  assert.equal(data.url, url);
  assert.equal(data.type, "WELCOME_WHATSAPP_GROUP");
});
