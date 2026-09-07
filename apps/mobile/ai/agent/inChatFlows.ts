import { MIN_PAY_PER_DAY } from "@/utils/serviceRequirements";
import { fetchTeamMembers } from "../tools/saathiData";
import {
  applyToJobFromSaathi,
  postWorkFromSaathi,
  resolveStartDate,
  sendBookingRequestFromSaathi,
} from "../tools/saathiActions";
import {
  listSubTypes,
  listWorkTypes,
  listWorkerTypes,
  mapSkillToWorkCategory,
} from "../tools/workTypeMap";
import type { SaathiIntent } from "../intents/intentTypes";
import type { ConversationSlots, SaathiCandidate, SaathiChoice } from "./agentContext";
import type { SaathiSnapshot } from "../suggestions/suggestionTypes";

type Tx = (key: string, params?: Record<string, unknown>) => string;

export function clearActionFlow(slots: ConversationSlots): ConversationSlots {
  return {
    ...slots,
    flow: null,
    askField: null,
    pendingConfirm: null,
    selectedId: undefined,
    candidates: undefined,
    workType: undefined,
    subType: undefined,
    awaitingCustom: null,
    applyAsTeam: undefined,
    teamWorkerIds: undefined,
  };
}

export function startPostWorkSlots(slots: ConversationSlots): ConversationSlots {
  return {
    ...slots,
    flow: "post",
    askField: "type",
    pendingConfirm: null,
    workType: undefined,
    subType: undefined,
    skill: undefined,
    quantity: undefined,
    durationDays: undefined,
    dateHint: undefined,
    payPerDay: undefined,
    awaitingCustom: null,
    lastIntent: "POST_WORK",
  };
}

export function pickMatchingSkill(
  userSkills: string[],
  requirementNames: string[],
): string | undefined {
  const reqs = requirementNames.map((n) => n.toLowerCase());
  for (const skill of userSkills) {
    if (reqs.includes(String(skill).toLowerCase())) return skill;
  }
  return undefined;
}

export function jobsToCandidates(
  jobs: any[],
  tx: Tx,
  skillLabel: (s?: string) => string,
): SaathiCandidate[] {
  const labelOrEmpty = (key?: string) => {
    const k = String(key || "").trim();
    if (!k) return "";
    const out = tx(k);
    return out && out !== k ? out : "";
  };
  return jobs.slice(0, 4).map((j) => {
    const reqs = Array.isArray(j?.requirements) ? j.requirements : [];
    const first = reqs[0];
    const skill = first?.name ? skillLabel(String(first.name)) : "";
    const title =
      labelOrEmpty(j?.subType) ||
      labelOrEmpty(j?.type) ||
      skill ||
      tx("saathiWorkGeneric");
    const pay =
      first?.payPerDay != null ? `₹${first.payPerDay} ${tx("saathiDayOne")}` : "";
    const days =
      j?.duration != null
        ? `${j.duration} ${Number(j.duration) === 1 ? tx("saathiDayOne") : tx("saathiDayMany")}`
        : "";
    return {
      id: String(j?._id || ""),
      kind: "job" as const,
      title,
      subtitle: [skill, pay, days, j?.address, j?.distance != null ? `${j.distance} km` : ""]
        .filter(Boolean)
        .join(" · "),
      requirementNames: reqs.map((r: any) => String(r?.name || "")).filter(Boolean),
    };
  });
}

export function workersToCandidates(
  workers: any[],
  preferredSkill?: string,
  skillLabelFn?: (s?: string) => string,
): SaathiCandidate[] {
  return workers.slice(0, 5).map((w) => {
    const skills = Array.isArray(w?.skills) ? w.skills : [];
    const match =
      (preferredSkill
        ? skills.find(
            (s: any) =>
              String(s?.skill || s || "").toLowerCase() ===
              preferredSkill.toLowerCase(),
          )
        : null) || skills[0];
    const skill = String(match?.skill || match || preferredSkill || "");
    const price =
      match?.pricePerDay != null ? Number(match.pricePerDay) : undefined;
    const dist =
      w?.distance != null
        ? Number(w.distance) > 200
          ? `${Math.round(Number(w.distance) / 100) / 10} km`
          : `${w.distance} km`
        : "";
    return {
      id: String(w?._id || ""),
      kind: "worker" as const,
      title: String(w?.name || ""),
      subtitle: [skillLabelFn ? skillLabelFn(skill) : skill, dist, price != null ? `₹${price}` : ""]
        .filter(Boolean)
        .join(" · "),
      skill,
      pricePerDay: Number.isFinite(price as number) ? price : undefined,
    };
  });
}

function resolvedAddress(slots: ConversationSlots, snapshot: SaathiSnapshot): string {
  return String(slots.address || snapshot.address || "").trim();
}

function durationChoices(tx: Tx): SaathiChoice[] {
  return [
    { label: "less_5_days", value: 5 },
    { label: "less_15_days", value: 15 },
    { label: "less_one_month", value: 30 },
    { label: "more_one_month", value: 100 },
    { label: "more_six_months", value: 200 },
  ].map((opt) => ({
    field: "duration" as const,
    value: String(opt.value),
    title: tx(opt.label),
  })).concat([{ field: "duration", value: "other", title: tx("saathiChoiceOther") }]);
}

function nextPostAsk(
  slots: ConversationSlots,
  snapshot: SaathiSnapshot,
): ConversationSlots["askField"] {
  if (!slots.workType) return "type";
  if (!slots.subType) return "subType";
  if (!slots.skill) return "skill";
  if (slots.quantity == null) return "quantity";
  if (slots.durationDays == null) return "duration";
  if (!slots.dateHint) return "date";
  if (slots.payPerDay == null || slots.payPerDay < MIN_PAY_PER_DAY) return "pay";
  if (!resolvedAddress(slots, snapshot)) return "address";
  return "confirm";
}

function toChoices(
  options: Array<{ value: string; labelKey: string }>,
  field: SaathiChoice["field"],
  tx: Tx,
  skillLabel: (s?: string) => string,
): SaathiChoice[] {
  return options.map((opt) => {
    const title =
      field === "skill"
        ? skillLabel(opt.value) || opt.value
        : humanizeChoiceTitle(tx(opt.labelKey), opt.value);
    return { field, value: opt.value, title };
  });
}

function humanizeChoiceTitle(label: string, fallback: string): string {
  const s = String(label || "").trim();
  if (!s || s === "[object Object]" || s === fallback) {
    return fallback;
  }
  return s;
}

export function applyPostChoice(
  slots: ConversationSlots,
  field: string,
  value: string,
  snapshot: SaathiSnapshot,
): ConversationSlots {
  const next = { ...slots, flow: "post" as const };
  if (field === "type") {
    next.workType = value;
    next.subType = undefined;
    next.skill = undefined;
    return next;
  }
  if (field === "subType") {
    next.subType = value;
    next.skill = undefined;
    return next;
  }
  if (field === "skill") {
    next.skill = value;
    return next;
  }
  if (field === "quantity") {
    if (value === "other") {
      next.quantity = undefined;
      next.awaitingCustom = "quantity";
      return next;
    }
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      next.quantity = n;
      next.awaitingCustom = null;
    }
    return next;
  }
  if (field === "duration") {
    if (value === "other") {
      next.durationDays = undefined;
      next.awaitingCustom = "duration";
      return next;
    }
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      next.durationDays = n;
      next.awaitingCustom = null;
    }
    return next;
  }
  if (field === "date") {
    next.dateHint = value;
    return next;
  }
  if (field === "pay") {
    if (value === "other") {
      next.payPerDay = undefined;
      next.awaitingCustom = "pay";
      return next;
    }
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      next.payPerDay = n;
      next.awaitingCustom = null;
    }
    return next;
  }
  if (field === "address") {
    if (value === "profile") next.address = snapshot.address;
    else next.address = value;
    return next;
  }
  if (field === "applyMode") {
    next.applyAsTeam = value === "team";
    return next;
  }
  return next;
}

export async function continuePostWork(params: {
  slots: ConversationSlots;
  snapshot: SaathiSnapshot;
  tx: Tx;
  skillLabel: (s?: string) => string;
}): Promise<{
  text: string;
  slots: ConversationSlots;
  intent: SaathiIntent;
  choices?: SaathiChoice[];
}> {
  const { snapshot, tx, skillLabel } = params;
  let slots = { ...params.slots, flow: "post" as const, lastIntent: "POST_WORK" as SaathiIntent };

  const ask = nextPostAsk(slots, snapshot);
  slots.askField = ask;
  slots.pendingConfirm = ask === "confirm" ? "POST_WORK" : null;

  if (ask === "type") {
    return {
      text: tx("saathiAskWorkType"),
      slots,
      intent: "POST_WORK",
      choices: toChoices(listWorkTypes(), "type", tx, skillLabel),
    };
  }
  if (ask === "subType") {
    return {
      text: tx("saathiAskWorkSubType"),
      slots,
      intent: "POST_WORK",
      choices: toChoices(listSubTypes(slots.workType), "subType", tx, skillLabel),
    };
  }
  if (ask === "skill") {
    return {
      text: tx("saathiAskPostSkill"),
      slots,
      intent: "POST_WORK",
      choices: toChoices(
        listWorkerTypes(slots.workType, slots.subType),
        "skill",
        tx,
        skillLabel,
      ),
    };
  }
  if (ask === "quantity") {
    if (slots.awaitingCustom === "quantity") {
      return {
        text: tx("saathiTypeOtherCount"),
        slots,
        intent: "POST_WORK",
      };
    }
    return {
      text: tx("saathiAskWorkerCount"),
      slots,
      intent: "POST_WORK",
      choices: [
        ...[1, 2, 3, 4, 5].map((n) => ({
          field: "quantity" as const,
          value: String(n),
          title: `${n} ${n === 1 ? tx("saathiManOne") : tx("saathiManMany")}`,
        })),
        { field: "quantity", value: "other", title: tx("saathiChoiceOther") },
      ],
    };
  }
  if (ask === "duration") {
    if (slots.awaitingCustom === "duration") {
      return {
        text: tx("saathiTypeOtherDays"),
        slots,
        intent: "POST_WORK",
      };
    }
    return {
      text: tx("saathiAskDuration"),
      slots,
      intent: "POST_WORK",
      choices: durationChoices(tx),
    };
  }
  if (ask === "date") {
    return {
      text: tx("saathiAskStartDate"),
      slots,
      intent: "POST_WORK",
      choices: [
        { field: "date", value: "today", title: tx("saathiChoiceToday") },
        { field: "date", value: "tomorrow", title: tx("saathiChoiceTomorrow") },
      ],
    };
  }
  if (ask === "pay") {
    if (slots.awaitingCustom === "pay") {
      return {
        text: tx("saathiTypeOtherPay", { min: MIN_PAY_PER_DAY }),
        slots,
        intent: "POST_WORK",
      };
    }
    const low = slots.payPerDay != null && slots.payPerDay < MIN_PAY_PER_DAY;
    return {
      text: low
        ? tx("saathiAskPayMin", { min: MIN_PAY_PER_DAY })
        : tx("saathiAskPayPerDay", { min: MIN_PAY_PER_DAY }),
      slots,
      intent: "POST_WORK",
      choices: [
        ...[500, 600, 700, 800, 1000].map((n) => ({
          field: "pay" as const,
          value: String(n),
          title: `₹${n}`,
        })),
        { field: "pay", value: "other", title: tx("saathiChoiceOtherPay") },
      ],
    };
  }
  if (ask === "address") {
    const choices: SaathiChoice[] = snapshot.address
      ? [
          {
            field: "address",
            value: "profile",
            title: tx("saathiUseMyAddress"),
          },
        ]
      : [];
    return {
      text: tx("saathiAskWorkAddress"),
      slots,
      intent: "POST_WORK",
      choices,
    };
  }

  const startDate = resolveStartDate(slots.dateHint);
  return {
    text: tx("saathiConfirmPostWork", {
      skill: skillLabel(slots.skill),
      count: slots.quantity,
      pay: slots.payPerDay,
      days: slots.durationDays,
      date: startDate,
      address: resolvedAddress(slots, snapshot),
    }),
    slots,
    intent: "POST_WORK",
  };
}

export async function executePostWork(params: {
  slots: ConversationSlots;
  snapshot: SaathiSnapshot;
  tx: Tx;
}): Promise<{ text: string; slots: ConversationSlots; intent: SaathiIntent }> {
  const { snapshot, tx } = params;
  const slots = params.slots;
  const result = await postWorkFromSaathi({
    skill: String(slots.skill),
    quantity: slots.quantity || 1,
    payPerDay: Number(slots.payPerDay),
    duration: slots.durationDays || 1,
    startDate: resolveStartDate(slots.dateHint),
    address: resolvedAddress(slots, snapshot),
    geoLocation: snapshot.geoLocation,
    type: slots.workType,
    subType: slots.subType,
  });
  if (!result.ok) {
    if (result.message === "pay_low") {
      return {
        text: tx("saathiAskPayMin", { min: MIN_PAY_PER_DAY }),
        slots: { ...slots, askField: "pay", pendingConfirm: null },
        intent: "POST_WORK",
      };
    }
    return {
      text: tx("saathiActionFailed", { detail: result.message || "" }),
      slots: { ...slots, pendingConfirm: null },
      intent: "POST_WORK",
    };
  }
  return {
    text: tx("saathiPostWorkDone"),
    slots: clearActionFlow({ ...slots, lastIntent: "POST_WORK" }),
    intent: "POST_WORK",
  };
}

export async function continueApply(params: {
  slots: ConversationSlots;
  snapshot: SaathiSnapshot;
  tx: Tx;
  skillLabel: (s?: string) => string;
}): Promise<{
  text: string;
  slots: ConversationSlots;
  intent: SaathiIntent;
  choices?: SaathiChoice[];
}> {
  const { snapshot, tx, skillLabel } = params;
  let slots = { ...params.slots, flow: "apply" as const, lastIntent: "APPLY_JOB" as SaathiIntent };
  const jobs = (slots.candidates || []).filter((c) => c.kind === "job");
  if (!jobs.length) {
    return {
      text: tx("saathiAskPickJobFirst"),
      slots: { ...slots, askField: "pick" },
      intent: "APPLY_JOB",
    };
  }

  const selected =
    jobs.find((c) => c.id === slots.selectedId) ||
    (jobs.length === 1 ? jobs[0] : undefined);
  if (!selected) {
    return {
      text: tx("saathiAskPickJob"),
      slots: { ...slots, askField: "pick" },
      intent: "APPLY_JOB",
    };
  }

  slots.selectedId = selected.id;
  const reqs = selected.requirementNames || [];
  const userSkills = snapshot.skills || [];
  const matched = reqs.filter((r) =>
    userSkills.some((s) => s.toLowerCase() === r.toLowerCase()),
  );
  const skillOptions = (matched.length ? matched : reqs.length ? reqs : userSkills).filter(Boolean);

  if (!slots.skill) {
    if (skillOptions.length === 1) {
      slots.skill = skillOptions[0];
    } else if (skillOptions.length > 1) {
      slots.askField = "skill";
      return {
        text: tx("saathiAskApplySkill"),
        slots,
        intent: "APPLY_JOB",
        choices: skillOptions.slice(0, 6).map((s) => ({
          field: "skill" as const,
          value: s,
          title: skillLabel(s),
        })),
      };
    } else {
      return {
        text: tx("saathiApplyNeedSkill"),
        slots: clearActionFlow(slots),
        intent: "APPLY_JOB",
      };
    }
  }

  if (snapshot.role === "MEDIATOR" && slots.applyAsTeam == null) {
    slots.askField = "applyMode";
    return {
      text: tx("saathiAskApplyMode"),
      slots,
      intent: "APPLY_JOB",
      choices: [
        { field: "applyMode", value: "self", title: tx("saathiApplyMyself") },
        { field: "applyMode", value: "team", title: tx("saathiApplyTeam") },
      ],
    };
  }

  if (slots.applyAsTeam && (!slots.teamWorkerIds || !slots.teamWorkerIds.length)) {
    const members = await fetchTeamMembers(snapshot.userId);
    const skill = String(slots.skill).toLowerCase();
    const ids = members
      .filter((m) => {
        const skills = Array.isArray(m?.skills) ? m.skills : [];
        return skills.some(
          (s: any) => String(s?.skill || s || "").toLowerCase() === skill,
        );
      })
      .slice(0, 5)
      .map((m) => String(m?._id || ""))
      .filter(Boolean);
    if (!ids.length) {
      slots.applyAsTeam = false;
      slots.askField = "confirm";
      slots.pendingConfirm = "APPLY_SERVICE";
      return {
        text: tx("saathiTeamEmptyApplySelf", {
          title: selected.title,
          skill: skillLabel(slots.skill),
        }),
        slots,
        intent: "APPLY_JOB",
      };
    }
    slots.teamWorkerIds = ids;
  }

  slots.pendingConfirm = "APPLY_SERVICE";
  slots.askField = "confirm";
  return {
    text: slots.applyAsTeam
      ? tx("saathiConfirmApplyTeam", {
          title: selected.title,
          skill: skillLabel(slots.skill),
          count: slots.teamWorkerIds?.length || 0,
        })
      : tx("saathiConfirmApply", {
          title: selected.title,
          skill: skillLabel(slots.skill),
        }),
    slots,
    intent: "APPLY_JOB",
  };
}

export async function executeApply(params: {
  slots: ConversationSlots;
  tx: Tx;
}): Promise<{ text: string; slots: ConversationSlots; intent: SaathiIntent }> {
  const { slots, tx } = params;
  const result = await applyToJobFromSaathi({
    serviceId: String(slots.selectedId),
    skill: String(slots.skill),
    workerIds: slots.applyAsTeam ? slots.teamWorkerIds : undefined,
  });
  if (!result.ok) {
    return {
      text: tx("saathiActionFailed", { detail: result.message || "" }),
      slots: { ...slots, pendingConfirm: null },
      intent: "APPLY_JOB",
    };
  }
  return {
    text: tx("saathiApplyDone"),
    slots: clearActionFlow({ ...slots, lastIntent: "APPLY_JOB" }),
    intent: "APPLY_JOB",
  };
}

export async function continueBooking(params: {
  slots: ConversationSlots;
  snapshot: SaathiSnapshot;
  tx: Tx;
  skillLabel: (s?: string) => string;
}): Promise<{
  text: string;
  slots: ConversationSlots;
  intent: SaathiIntent;
  choices?: SaathiChoice[];
}> {
  const { snapshot, tx, skillLabel } = params;
  let slots = { ...params.slots, flow: "book" as const, lastIntent: "BOOK_WORKER" as SaathiIntent };
  const workers = (slots.candidates || []).filter((c) => c.kind === "worker");
  if (!workers.length) {
    return {
      text: tx("saathiAskPickWorkerFirst"),
      slots: { ...slots, askField: "pick" },
      intent: "BOOK_WORKER",
    };
  }
  const selected =
    workers.find((c) => c.id === slots.selectedId) ||
    (workers.length === 1 ? workers[0] : undefined);
  if (!selected) {
    return {
      text: tx("saathiAskPickWorker"),
      slots: { ...slots, askField: "pick" },
      intent: "BOOK_WORKER",
    };
  }

  slots.selectedId = selected.id;
  slots.skill = slots.skill || selected.skill;
  if (selected.pricePerDay != null && slots.payPerDay == null) {
    slots.payPerDay = selected.pricePerDay;
  }
  if (slots.quantity == null) slots.quantity = 1;

  if (!slots.skill) {
    slots.askField = "skill";
    return { text: tx("saathiAskWorkerType"), slots, intent: "BOOK_WORKER" };
  }

  if (slots.durationDays == null) {
    slots.askField = "duration";
    if (slots.awaitingCustom === "duration") {
      return { text: tx("saathiTypeOtherDays"), slots, intent: "BOOK_WORKER" };
    }
    return {
      text: tx("saathiAskDuration"),
      slots,
      intent: "BOOK_WORKER",
      choices: durationChoices(tx),
    };
  }

  if (!slots.dateHint) {
    slots.askField = "date";
    return {
      text: tx("saathiAskStartDate"),
      slots,
      intent: "BOOK_WORKER",
      choices: [
        { field: "date", value: "today", title: tx("saathiChoiceToday") },
        { field: "date", value: "tomorrow", title: tx("saathiChoiceTomorrow") },
      ],
    };
  }

  if (!resolvedAddress(slots, snapshot)) {
    slots.askField = "address";
    const choices: SaathiChoice[] = snapshot.address
      ? [{ field: "address", value: "profile", title: tx("saathiUseMyAddress") }]
      : [];
    return {
      text: tx("saathiAskWorkAddress"),
      slots,
      intent: "BOOK_WORKER",
      choices,
    };
  }

  slots.pendingConfirm = "SEND_BOOKING";
  slots.askField = "confirm";
  const startDate = resolveStartDate(slots.dateHint);
  return {
    text: tx("saathiConfirmBooking", {
      name: selected.title,
      skill: skillLabel(slots.skill),
      days: slots.durationDays,
      date: startDate,
      address: resolvedAddress(slots, snapshot),
    }),
    slots,
    intent: "BOOK_WORKER",
  };
}

export async function executeBooking(params: {
  slots: ConversationSlots;
  snapshot: SaathiSnapshot;
  tx: Tx;
}): Promise<{ text: string; slots: ConversationSlots; intent: SaathiIntent }> {
  const { snapshot, tx, slots } = params;
  const selected = (slots.candidates || []).find((c) => c.id === slots.selectedId);
  const { type, subType } = mapSkillToWorkCategory(slots.skill);
  const result = await sendBookingRequestFromSaathi({
    workerUserId: String(slots.selectedId),
    skill: String(slots.skill || selected?.skill),
    pricePerDay: slots.payPerDay ?? selected?.pricePerDay,
    quantity: slots.quantity || 1,
    duration: slots.durationDays || 1,
    startDate: resolveStartDate(slots.dateHint),
    address: resolvedAddress(slots, snapshot),
    location: snapshot.geoLocation,
    type,
    subType,
  });
  if (!result.ok) {
    return {
      text: tx("saathiActionFailed", { detail: result.message || "" }),
      slots: { ...slots, pendingConfirm: null },
      intent: "BOOK_WORKER",
    };
  }
  return {
    text: tx("saathiBookingSent"),
    slots: clearActionFlow({ ...slots, lastIntent: "BOOK_WORKER" }),
    intent: "BOOK_WORKER",
  };
}
