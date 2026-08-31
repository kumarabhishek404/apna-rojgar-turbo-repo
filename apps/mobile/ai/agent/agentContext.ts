import type { DetectedIntent, SaathiIntent } from "../intents/intentTypes";

export type SaathiCandidate = {
  id: string;
  kind: "worker" | "job";
  title: string;
  subtitle: string;
  skill?: string;
  pricePerDay?: number;
  requirementNames?: string[];
};

export type SaathiChoice = {
  value: string;
  title: string;
  field:
    | "type"
    | "subType"
    | "skill"
    | "quantity"
    | "duration"
    | "date"
    | "pay"
    | "address"
    | "applyMode";
};

export type ConversationSlots = {
  skill?: string;
  quantity?: number;
  dateHint?: string;
  payPerDay?: number;
  distanceKm?: number;
  durationDays?: number;
  address?: string;
  workType?: string;
  subType?: string;
  selectedId?: string;
  selectedIndex?: number;
  flow?: "post" | "book" | "apply" | null;
  askField?:
    | "type"
    | "subType"
    | "skill"
    | "quantity"
    | "pay"
    | "duration"
    | "date"
    | "address"
    | "confirm"
    | "pick"
    | "applyMode"
    | null;
  lastIntent?: SaathiIntent;
  pendingConfirm?: "POST_WORK" | "EXPAND_SEARCH" | "APPLY_SERVICE" | "SEND_BOOKING" | null;
  candidates?: SaathiCandidate[];
  awaitingCustom?: "quantity" | "duration" | "pay" | null;
  applyAsTeam?: boolean;
  teamWorkerIds?: string[];
  resultPage?: number;
};

export function mergeSlots(
  prev: ConversationSlots,
  detected: DetectedIntent,
): ConversationSlots {
  return {
    ...prev,
    skill: detected.skill || prev.skill,
    quantity: detected.quantity ?? prev.quantity,
    dateHint: detected.dateHint || prev.dateHint,
    payPerDay: detected.payPerDay ?? prev.payPerDay,
    distanceKm: detected.distanceKm ?? prev.distanceKm,
    durationDays: detected.durationDays ?? prev.durationDays,
    selectedIndex: detected.selectedIndex ?? prev.selectedIndex,
  };
}

export function statusInSimpleWords(status?: string): string {
  const s = String(status || "").toUpperCase();
  if (s === "IN_PROGRESS") return "saathiStatusInProgress";
  if (s === "HIRING" || s === "POSTED") return "saathiStatusHiring";
  if (s === "BOOKED" || s === "ACCEPTED") return "saathiStatusBooked";
  if (s === "COMPLETED") return "saathiStatusCompleted";
  if (s === "CANCELLED") return "saathiStatusCancelled";
  return "saathiStatusUnknown";
}

export function apiDistanceBucket(km?: number): string | undefined {
  if (km == null || !Number.isFinite(km)) return undefined;
  if (km <= 10) return "within_10km";
  if (km <= 50) return "within_50km";
  return "within_100km";
}
