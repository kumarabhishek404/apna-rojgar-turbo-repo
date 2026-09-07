/**
 * Client analytics: events are held in **memory only** (short queue), then sent to your backend API.
 * **MongoDB (or any DB) lives on the server** — nothing is written to AsyncStorage, SecureStore, or sessionStorage for analytics.
 * Device/app envelope fields match `getClientDeviceInfo()` (same as `X-Client-*` headers on all API calls).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import ANALYTICS from "@/app/api/analytics";
import { getClientDeviceInfo } from "@/utils/clientDeviceInfo";
import type {
  AnalyticsBatchPayload,
  AnalyticsQueuedEvent,
} from "@/utils/analyticsTypes";
import type { AnalyticsEventName } from "@/utils/analyticsEvents";

const FLUSH_MS = 3000;
const MAX_QUEUE = 30;

/** Admin activity must not be written to analytics (backend also enforces this). */
async function isAdminAnalyticsUser(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem("user");
    if (!raw || raw === "null" || raw === "{}") return false;
    const user = JSON.parse(raw);
    if (!user || typeof user !== "object") return false;
    if (user.isAdmin === true) return true;
    return String(user.role || "").toUpperCase() === "ADMIN";
  } catch {
    return false;
  }
}

function newSessionId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const sessionId = newSessionId();
const queue: AnalyticsQueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function getEnvelope(): Omit<AnalyticsBatchPayload, "events" | "batchSentAt"> {
  return {
    sessionId,
    ...getClientDeviceInfo(),
  };
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushAnalyticsQueue();
  }, FLUSH_MS);
}

/**
 * Queue a single analytics event and schedule a batched upload.
 * Never throws; safe to call from UI handlers.
 */
export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, unknown>,
): void {
  try {
    void (async () => {
      if (await isAdminAnalyticsUser()) return;

      const ev: AnalyticsQueuedEvent = {
        name,
        properties:
          properties && Object.keys(properties).length ? properties : undefined,
        clientTimestamp: new Date().toISOString(),
      };
      queue.push(ev);
      if (queue.length >= MAX_QUEUE) {
        void flushAnalyticsQueue();
      } else {
        scheduleFlush();
      }
    })();
  } catch (e) {
    if (__DEV__) console.warn("[analytics] trackEvent failed", e);
  }
}

/**
 * Flush queued events immediately (e.g. app going to background).
 */
export async function flushAnalyticsQueue(): Promise<void> {
  if (queue.length === 0) return;

  if (await isAdminAnalyticsUser()) {
    queue.splice(0, queue.length);
    if (flushTimer != null) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    return;
  }

  const batch = queue.splice(0, queue.length);
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const payload: AnalyticsBatchPayload = {
    ...getEnvelope(),
    batchSentAt: new Date().toISOString(),
    events: batch,
  };

  await ANALYTICS.postBatch(payload);
}

export type { AnalyticsBatchPayload } from "@/utils/analyticsTypes";
