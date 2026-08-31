import API_CLIENT from "@/app/api";
import { detectIntent } from "./intentDetector";
import type { DetectedIntent, SaathiIntent } from "./intentTypes";
import type { ConversationSlots } from "../agent/agentContext";
import type { AppUserRole } from "@/utils/resolveDisplayUserRole";

const TRUSTED: SaathiIntent[] = [
  "FIND_WORK",
  "VIEW_NEARBY_WORK",
  "APPLY_JOB",
  "HIRE_WORKERS",
  "BOOK_WORKER",
  "POST_WORK",
  "VIEW_BOOKINGS",
  "VIEW_APPLICATIONS",
  "VIEW_WORKERS",
  "VIEW_PROFILE",
  "VIEW_ACTIVE_WORK",
  "VIEW_WORK_STATUS",
  "CONFIRM_YES",
  "CONFIRM_NO",
  "SELECT_RESULT",
  "SHOW_MORE",
  "GREETING",
];

export async function understandUtterance(params: {
  utterance: string;
  role: AppUserRole | string;
  locale: string;
  slots: ConversationSlots;
  history?: Array<{ role: string; text: string }>;
}): Promise<DetectedIntent> {
  const rules = detectIntent(params.utterance, params.role, {
    lastIntent: params.slots.lastIntent,
    flow: params.slots.flow,
  });

  if (rules.intent !== "UNKNOWN" && TRUSTED.includes(rules.intent)) {
    return rules;
  }

  try {
    const res = await API_CLIENT.makePostRequest("/saathi/understand", {
      utterance: params.utterance,
      role: params.role,
      locale: params.locale,
      slots: {
        lastIntent: params.slots.lastIntent,
        flow: params.slots.flow,
        askField: params.slots.askField,
        skill: params.slots.skill,
      },
      history: (params.history || []).slice(-6),
    });
    const data = res?.data?.data;
    if (data?.intent && data.intent !== "UNKNOWN") {
      return {
        intent: data.intent,
        skill: data.skill || undefined,
        quantity: data.quantity,
        dateHint: data.dateHint,
        distanceKm: data.distanceKm,
        payPerDay: data.payPerDay,
        durationDays: data.durationDays,
        selectedIndex: data.selectedIndex,
        raw: params.utterance,
        source: data.source || "gemini",
      };
    }
  } catch {
    // fall through to rules
  }
  return rules;
}
