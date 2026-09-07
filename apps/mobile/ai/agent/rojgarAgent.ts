import i18n from "@/utils/i18n";
import { detectIntent, detectSelectedIndex } from "../intents/intentDetector";
import { understandUtterance } from "../intents/understandUtterance";
import type { DetectedIntent, SaathiIntent } from "../intents/intentTypes";
import { searchJobs, searchWorkers, fetchTeamMembers } from "../tools/saathiData";
import type { SaathiSnapshot, SuggestionChip } from "../suggestions/suggestionTypes";
import { buildSuggestions, confirmSuggestionChips, shouldShowConfirmChips } from "../suggestions/suggestionEngine";
import {
  mergeSlots,
  statusInSimpleWords,
  type ConversationSlots,
  type SaathiChoice,
} from "./agentContext";
import { getDynamicWorkerType, humanizeI18nValue } from "@/utils/i18n";
import {
  continueApply,
  continueBooking,
  continuePostWork,
  executeApply,
  executeBooking,
  executePostWork,
  jobsToCandidates,
  workersToCandidates,
  clearActionFlow,
  startPostWorkSlots,
  applyPostChoice,
} from "./inChatFlows";
import {
  listSubTypes,
  listWorkTypes,
  listWorkerTypes,
  matchOption,
} from "../tools/workTypeMap";

export type AgentReply = {
  text: string;
  speak: boolean;
  intent: SaathiIntent;
  slots: ConversationSlots;
  suggestions: SuggestionChip[];
  navigateTo?: { pathname: string; params?: Record<string, string> };
  results?: Array<{
    id: string;
    title: string;
    subtitle: string;
    kind?: "worker" | "job";
  }>;
  choices?: SaathiChoice[];
};

function tx(locale: string, key: string, params?: Record<string, unknown>): string {
  return humanizeI18nValue(
    i18n.t(key, { ...(params || {}), locale } as any),
    key,
  );
}

function replyLocale(utterance: string, appLocale: string): string {
  if (/[\u0900-\u097F]/.test(utterance)) return "hi";
  const hinglish =
    /\b(kaam|mujhe|chahiye|hai|kya|meri|booking|dikhao|batao|haan|han|ha|nahi|mazdoor|majdoor|apply|book)\b/i.test(
      utterance,
    );
  if (hinglish) return appLocale === "en" ? "hi" : appLocale || "hi";
  return appLocale || "hi";
}

function skillLabel(skill?: string): string {
  if (!skill) return "";
  try {
    return getDynamicWorkerType(skill, 1) || skill;
  } catch {
    return skill;
  }
}

function helpKey(role: SaathiSnapshot["role"], kind: "help" | "unknown"): string {
  if (role === "WORKER") {
    return kind === "help" ? "saathiHelpPromptWorker" : "saathiDidNotUnderstandWorker";
  }
  if (role === "MEDIATOR") {
    return kind === "help" ? "saathiHelpPromptMediator" : "saathiDidNotUnderstandMediator";
  }
  return kind === "help" ? "saathiHelpPromptEmployer" : "saathiDidNotUnderstandEmployer";
}

function intentFromFlow(slots: ConversationSlots): SaathiIntent | undefined {
  if (slots.flow === "post") return "POST_WORK";
  if (slots.flow === "apply") return "APPLY_JOB";
  if (slots.flow === "book") return "BOOK_WORKER";
  return slots.lastIntent;
}

function km(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "";
  return String(n);
}

function fillAskField(
  slots: ConversationSlots,
  utterance: string,
  translate: (key: string) => string,
): ConversationSlots {
  const next = { ...slots };
  const raw = String(utterance || "").trim();
  const n = Number(raw.replace(/[^\d]/g, ""));
  if (slots.askField === "type") {
    const value = matchOption(raw, listWorkTypes(), translate);
    if (value) next.workType = value;
    return next;
  }
  if (slots.askField === "subType") {
    const value = matchOption(raw, listSubTypes(slots.workType), translate);
    if (value) next.subType = value;
    return next;
  }
  if (slots.askField === "skill") {
    const value = matchOption(raw, listWorkerTypes(slots.workType, slots.subType), translate);
    if (value) next.skill = value;
    else {
      const detected = detectIntent(raw, "EMPLOYER");
      if (detected.skill) next.skill = detected.skill;
    }
    return next;
  }
  if (slots.askField === "pay" && Number.isFinite(n) && n >= 100) {
    next.payPerDay = n;
    next.awaitingCustom = null;
    return next;
  }
  if (slots.askField === "quantity" && Number.isFinite(n) && n > 0 && n <= 200) {
    next.quantity = n;
    next.awaitingCustom = null;
    return next;
  }
  if (slots.askField === "duration" && Number.isFinite(n) && n > 0 && n <= 400) {
    next.durationDays = n;
    next.awaitingCustom = null;
    return next;
  }
  if (slots.askField === "date") {
    const detected = detectIntent(raw, "EMPLOYER");
    if (detected.dateHint) next.dateHint = detected.dateHint;
    return next;
  }
  if (slots.askField === "address" && raw.length >= 6 && !/^\d+$/.test(raw)) {
    next.address = raw;
    return next;
  }
  if (slots.askField === "applyMode") {
    if (/\b(team|team se|mediator|मजदूर भेज|टीम)\b/i.test(raw)) {
      next.applyAsTeam = true;
    } else if (/\b(self|myself|khud|akela|alone|खुद|अकेले)\b/i.test(raw)) {
      next.applyAsTeam = false;
    }
    return next;
  }
  return next;
}

function applyPick(slots: ConversationSlots, indexOrId: { index?: number; id?: string }) {
  const list = slots.candidates || [];
  const picked =
    (indexOrId.id ? list.find((c) => c.id === indexOrId.id) : undefined) ||
    (indexOrId.index != null ? list[indexOrId.index] : undefined);
  if (!picked) return slots;
  return { ...slots, selectedId: picked.id };
}

export async function runRojgarAgent(params: {
  utterance: string;
  snapshot: SaathiSnapshot;
  slots: ConversationSlots;
  dismissedIds?: string[];
  source?: "voice" | "text" | "suggestion";
  forcedIntent?: SaathiIntent;
  history?: Array<{ role: string; text: string }>;
}): Promise<AgentReply> {
  const { utterance, snapshot, dismissedIds = [] } = params;
  const locale = replyLocale(utterance, snapshot.locale);
  const t = (key: string, extra?: Record<string, unknown>) => tx(locale, key, extra);

  const pickId = utterance.match(/^__pick__:(.+)$/)?.[1];
  const choiceMatch = utterance.match(/^__choice__:([^:]+):(.+)$/);
  const agentUtterance = pickId || choiceMatch ? "ok" : utterance;

  let detected: DetectedIntent =
    choiceMatch
      ? {
          intent: intentFromFlow(params.slots) || "POST_WORK",
          raw: utterance,
          source: "suggestion",
        }
      : params.source === "suggestion" && params.forcedIntent
      ? { intent: params.forcedIntent, raw: utterance, source: "suggestion" }
      : await understandUtterance({
          utterance: agentUtterance,
          role: snapshot.role,
          locale: snapshot.locale,
          slots: params.slots,
          history: params.history,
        });

  if (params.forcedIntent && params.source === "suggestion") {
    detected = {
      ...detected,
      intent: params.forcedIntent,
      skill: undefined,
    };
  }

  if (!detected?.intent || detected.intent === "UNKNOWN") {
    detected = detectIntent(agentUtterance, snapshot.role, {
      lastIntent: params.slots.lastIntent,
      flow: params.slots.flow,
    });
  }

  let slots = mergeSlots(params.slots, detected);
  if (choiceMatch) {
    slots = applyPostChoice(
      params.slots,
      choiceMatch[1],
      choiceMatch[2],
      snapshot,
    );
  } else if (params.slots.askField) {
    slots = fillAskField(slots, utterance, (key) => tx(locale, key));
  }
  if (pickId) {
    slots = applyPick(slots, { id: pickId });
  }

  let intent = detected.intent;

  if (choiceMatch) {
    const fromFlow = intentFromFlow(slots);
    if (fromFlow) intent = fromFlow;
  }

  if (pickId) {
    const kind = (slots.candidates || []).find((c) => c.id === pickId)?.kind;
    if (kind === "job") intent = "APPLY_JOB";
    else if (snapshot.role === "MEDIATOR") intent = "VIEW_WORKERS";
    else intent = "BOOK_WORKER";
  }

  if (intent === "SELECT_RESULT") {
    const idx = detected.selectedIndex ?? detectSelectedIndex(utterance);
    slots = applyPick(slots, { index: idx });
    const kind = (slots.candidates || []).find((c) => c.id === slots.selectedId)?.kind;
    if (kind === "job") intent = "APPLY_JOB";
    else if (kind === "worker") intent = "BOOK_WORKER";
  }

  if (
    (intent === "UNKNOWN" || intent === "VIEW_APPLICATIONS") &&
    slots.flow === "apply" &&
    /apply/i.test(utterance)
  ) {
    intent = "APPLY_JOB";
  }
  if (intent === "UNKNOWN" && slots.flow === "book" && /book/i.test(utterance)) {
    intent = "BOOK_WORKER";
  }
  if (slots.flow === "post" && (intent === "HIRE_WORKERS" || intent === "UNKNOWN")) {
    intent = "POST_WORK";
  }
  if (
    slots.flow === "apply" &&
    intent !== "CONFIRM_NO" &&
    detected.intent !== "CONFIRM_YES" &&
    intent !== "FIND_WORK" &&
    intent !== "SHOW_MORE" &&
    intent !== "VIEW_NEARBY_WORK" &&
    intent !== "VIEW_BOOKINGS" &&
    intent !== "VIEW_APPLICATIONS"
  ) {
    intent = "APPLY_JOB";
  }
  if (
    slots.flow === "book" &&
    intent !== "CONFIRM_NO" &&
    detected.intent !== "CONFIRM_YES" &&
    intent !== "HIRE_WORKERS" &&
    intent !== "SHOW_MORE" &&
    intent !== "VIEW_WORKERS" &&
    intent !== "VIEW_BOOKINGS" &&
    intent !== "POST_WORK"
  ) {
    intent = "BOOK_WORKER";
  }

  if (intent === "CONFIRM_YES") {
    if (slots.pendingConfirm === "POST_WORK") intent = "POST_WORK";
    else if (slots.pendingConfirm === "APPLY_SERVICE") intent = "APPLY_JOB";
    else if (slots.pendingConfirm === "SEND_BOOKING") intent = "BOOK_WORKER";
    else if (slots.pendingConfirm === "EXPAND_SEARCH") intent = "HIRE_WORKERS";
    else if (slots.flow === "apply" && slots.askField === "pick") {
      if (!slots.selectedId && slots.candidates?.[0]) {
        slots = { ...slots, selectedId: slots.candidates[0].id };
      }
      intent = "APPLY_JOB";
    } else if (slots.flow === "book" && slots.askField === "pick") {
      if (!slots.selectedId && slots.candidates?.[0]) {
        slots = { ...slots, selectedId: slots.candidates[0].id };
      }
      intent = "BOOK_WORKER";
    } else if (slots.lastIntent) intent = slots.lastIntent;
  }

  if (
    slots.flow === "post" &&
    intent !== "CONFIRM_NO" &&
    !(detected.intent === "CONFIRM_YES" && slots.pendingConfirm === "POST_WORK")
  ) {
    intent = "POST_WORK";
  }

  if (intent === "SHOW_MORE") {
    const last = slots.lastIntent;
    const bump =
      last === "FIND_WORK" ||
      last === "VIEW_NEARBY_WORK" ||
      last === "HIRE_WORKERS" ||
      last === "VIEW_WORKERS";
    slots = {
      ...slots,
      resultPage: bump ? (slots.resultPage || 1) + 1 : 1,
    };
    if (snapshot.role === "EMPLOYER" || last === "HIRE_WORKERS") {
      intent = "HIRE_WORKERS";
    } else {
      intent = "FIND_WORK";
    }
  } else if (
    (intent === "FIND_WORK" || intent === "VIEW_NEARBY_WORK") &&
    (slots.lastIntent === "FIND_WORK" || slots.lastIntent === "VIEW_NEARBY_WORK") &&
    (slots.candidates || []).some((c) => c.kind === "job")
  ) {
    slots = { ...slots, resultPage: (slots.resultPage || 1) + 1 };
  }

  const suggestions = buildSuggestions(snapshot, dismissedIds);

  const finish = (
    text: string,
    extra?: Partial<AgentReply> & { nextIntent?: SaathiIntent },
  ): AgentReply => {
    const nextSlots: ConversationSlots = {
      ...(extra?.slots || slots),
      lastIntent: extra?.nextIntent || intent,
    };
    const confirmChips = shouldShowConfirmChips(nextSlots)
      ? confirmSuggestionChips()
      : extra?.suggestions || suggestions.slice(0, 3);
    return {
      text,
      speak: true,
      intent: extra?.intent || intent,
      slots: nextSlots,
      suggestions: extra?.choices?.length ? [] : confirmChips,
      results: extra?.results,
      choices: extra?.choices,
      navigateTo: extra?.navigateTo,
    };
  };

  if (intent === "GREETING") {
    return finish(
      `${tx(locale, "saathiGreetingNamed", { name: snapshot.userName || "" })} ${tx(locale, helpKey(snapshot.role, "help"))}`,
    );
  }

  if (intent === "HELP" || intent === "MORE_OPTIONS") {
    return finish(tx(locale, helpKey(snapshot.role, "help")));
  }

  if (intent === "CONFIRM_NO") {
    return finish(tx(locale, "saathiCancelled"), {
      slots: clearActionFlow({ ...slots, pendingConfirm: null }),
    });
  }

  if (intent === "VIEW_PROFILE") {
    return finish(tx(locale, "saathiOpenProfile"), {
      navigateTo: { pathname: "/(tabs)/fifth" },
    });
  }

  if (intent === "VIEW_BOOKINGS") {
    const list = snapshot.upcomingBookings.slice(0, 5);
    if (!list.length) return finish(tx(locale, "saathiNoBookings"));
    const lines = list.map((b, i) => {
      const raw = String(b.title || "");
      const title = raw && t(raw) !== raw ? t(raw) : raw || tx(locale, "saathiWorkGeneric");
      const when =
        b.hoursUntil != null && b.hoursUntil <= 24
          ? tx(locale, "saathiBookingSoonHours", {
              hours: Math.max(1, Math.round(b.hoursUntil)),
            })
          : tx(locale, "saathiBookingNext");
      return `${i + 1}. ${title}${b.address ? ` — ${b.address}` : ""} · ${when}`;
    });
    return finish(`${tx(locale, "saathiBookingsList")}\n${lines.join("\n")}`);
  }

  if (intent === "VIEW_APPLICATIONS") {
    if (snapshot.role === "EMPLOYER") {
      const withApps = snapshot.postedWorks.filter((w) => w.appliedCount > 0);
      if (!withApps.length) return finish(tx(locale, "saathiNoWorkerApplications"));
      const lines = withApps.slice(0, 5).map((w, i) => {
        const raw = String(w.type || "");
        const title = raw && t(raw) !== raw ? t(raw) : raw || tx(locale, "saathiWorkGeneric");
        return `${i + 1}. ${title} — ${w.appliedCount}`;
      });
      return finish(
        `${tx(locale, "saathiEmployerApplicationsSummary", {
          count: withApps.reduce((n, w) => n + w.appliedCount, 0),
        })}\n${lines.join("\n")}`,
      );
    }
    if (snapshot.applications.total <= 0) {
      return finish(tx(locale, "saathiNoApplications"));
    }
    const rows = snapshot.applicationRows || [];
    const lines = rows.map((row, i) => {
      const raw = String(row.title || "");
      const title = raw && t(raw) !== raw ? t(raw) : raw || tx(locale, "saathiWorkGeneric");
      return `${i + 1}. ${title} — ${row.status || ""}`;
    });
    return finish(
      `${tx(locale, "saathiApplicationsSummary", {
        total: snapshot.applications.total,
        pending: snapshot.applications.pending,
        accepted: snapshot.applications.accepted,
      })}${lines.length ? `\n${lines.join("\n")}` : ""}`,
    );
  }

  if (intent === "VIEW_ACTIVE_WORK" || intent === "VIEW_WORK_STATUS") {
    if (snapshot.role === "WORKER" || snapshot.role === "MEDIATOR") {
      if (!snapshot.upcomingBookings[0]) return finish(tx(locale, "saathiNoActiveWork"));
      const next = snapshot.upcomingBookings[0];
      const raw = String(next.title || "");
      const title = raw && t(raw) !== raw ? t(raw) : raw || tx(locale, "saathiWorkGeneric");
      return finish(
        `${tx(locale, "saathiWorkerActiveWork")} ${title}${next.address ? ` — ${next.address}` : ""}`,
      );
    }
    const active = snapshot.postedWorks.filter((w) => {
      const s = String(w.status || "").toUpperCase();
      return s === "IN_PROGRESS" || s === "HIRING" || s === "BOOKED";
    });
    if (active.length === 0) return finish(tx(locale, "saathiNoActiveWork"));
    const lines = active.slice(0, 5).map((w, i) => {
      const raw = String(w.type || "");
      const title = raw && t(raw) !== raw ? t(raw) : raw || tx(locale, "saathiWorkGeneric");
      return `${i + 1}. ${title} — ${tx(locale, statusInSimpleWords(w.status))}`;
    });
    return finish(
      `${tx(locale, "saathiActiveWorkSummary", {
        count: active.length,
        status: tx(locale, statusInSimpleWords(active[0].status)),
      })}\n${lines.join("\n")}`,
    );
  }

  if (snapshot.role === "MEDIATOR" && (intent === "BOOK_WORKER" || intent === "HIRE_WORKERS")) {
    intent = "FIND_WORK";
  }

  if (intent === "APPLY_JOB") {
    if (snapshot.role === "EMPLOYER") {
      intent = "BOOK_WORKER";
    } else {
      if (!(slots.candidates || []).some((c) => c.kind === "job")) {
        const skill = slots.skill || snapshot.primarySkill;
        const jobs = await searchJobs({ skills: skill ? [skill] : undefined });
        if (jobs.length) {
          slots = {
            ...slots,
            flow: "apply",
            candidates: jobsToCandidates(jobs, t, skillLabel),
            askField: "pick",
          };
        }
      }
      if (slots.pendingConfirm === "APPLY_SERVICE" && detected.intent === "CONFIRM_YES") {
        const done = await executeApply({ slots, tx: t });
        return finish(done.text, { slots: done.slots, intent: done.intent, nextIntent: done.intent });
      }
      const step = await continueApply({ slots, snapshot, tx: t, skillLabel });
      const pickResults =
        step.slots.askField === "pick"
          ? (step.slots.candidates || [])
              .filter((c) => c.kind === "job")
              .map((c) => ({
                id: c.id,
                title: c.title,
                subtitle: c.subtitle,
                kind: c.kind,
              }))
          : undefined;
      return finish(step.text, {
        slots: step.slots,
        intent: step.intent,
        nextIntent: step.intent,
        results: pickResults,
        choices: step.choices,
      });
    }
  }

  if (intent === "BOOK_WORKER") {
    if (snapshot.role === "WORKER") {
      return finish(tx(locale, "saathiWorkerCannotHire"));
    }
    if (!(slots.candidates || []).some((c) => c.kind === "worker")) {
      const workers = await searchWorkers({
        skill: slots.skill,
        distanceKm: slots.distanceKm,
      });
      if (workers.length) {
        slots = {
          ...slots,
          flow: "book",
          candidates: workersToCandidates(workers, slots.skill, skillLabel),
          askField: "pick",
        };
      }
    }
    if (slots.pendingConfirm === "SEND_BOOKING" && detected.intent === "CONFIRM_YES") {
      const done = await executeBooking({ slots, snapshot, tx: t });
      return finish(done.text, { slots: done.slots, intent: done.intent, nextIntent: done.intent });
    }
    const step = await continueBooking({
      slots,
      snapshot,
      tx: t,
      skillLabel,
    });
    const pickResults =
      step.slots.askField === "pick"
        ? (step.slots.candidates || [])
            .filter((c) => c.kind === "worker")
            .map((c) => ({
              id: c.id,
              title: c.title,
              subtitle: c.subtitle,
              kind: c.kind,
            }))
        : undefined;
    return finish(step.text, {
      slots: step.slots,
      intent: step.intent,
      nextIntent: step.intent,
      results: pickResults,
      choices: step.choices,
    });
  }

  if (intent === "FIND_WORK" || intent === "VIEW_NEARBY_WORK") {
    if (snapshot.role === "EMPLOYER") {
      intent = "HIRE_WORKERS";
    } else {
      const skill = slots.skill || snapshot.primarySkill;
      const page = slots.resultPage || 1;
      const jobs = await searchJobs({
        skills: skill ? [skill] : undefined,
        page,
      });
      if (!jobs.length) {
        return finish(
          page > 1
            ? tx(locale, "saathiNoMoreJobs")
            : tx(locale, "saathiNoMatchingJobs"),
        );
      }
      const nearest = jobs
        .map((j) => Number(j?.distance))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)[0];
      const label = skillLabel(skill);
      const candidates = jobsToCandidates(jobs, t, skillLabel);
      const results = candidates.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        kind: c.kind,
      }));
      return finish(
        `${tx(locale, "saathiNearbyJobsSummary", {
          count: jobs.length,
          skill: label || tx(locale, "saathiWorkGeneric"),
          km: km(nearest) || "—",
        })} ${tx(locale, "saathiTapToApply")}`,
        {
          results,
          slots: {
            ...slots,
            flow: "apply",
            askField: "pick",
            candidates,
            pendingConfirm: null,
            lastIntent: "FIND_WORK",
            resultPage: page,
          },
          nextIntent: "FIND_WORK",
        },
      );
    }
  }

  if (intent === "VIEW_WORKERS" && snapshot.role === "MEDIATOR") {
    const members = await fetchTeamMembers(snapshot.userId);
    if (!members.length) return finish(tx(locale, "saathiTeamEmpty"));
    const candidates = workersToCandidates(members, undefined, skillLabel);
    return finish(tx(locale, "saathiTeamList", { count: members.length }), {
      results: candidates.map((c) => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle,
        kind: c.kind,
      })),
      slots: {
        ...slots,
        candidates,
        askField: null,
        flow: null,
        lastIntent: "VIEW_WORKERS",
      },
      nextIntent: "VIEW_WORKERS",
    });
  }

  if (intent === "VIEW_WORKERS" || intent === "HIRE_WORKERS") {
    if (snapshot.role === "WORKER") {
      return finish(tx(locale, "saathiWorkerCannotHire"));
    }

    const expand = slots.pendingConfirm === "EXPAND_SEARCH";
    const distanceKm = expand ? slots.distanceKm || 100 : slots.distanceKm;
    const skill = slots.skill;
    const page = slots.resultPage || 1;
    const workers = await searchWorkers({
      skill,
      distanceKm: expand ? 100 : distanceKm,
      page,
    });

    if (!workers.length) {
      return finish(
        page > 1
          ? tx(locale, "saathiNoMoreWorkers")
          : tx(locale, "saathiNoNearbyWorkers"),
        {
          slots: {
            ...slots,
            pendingConfirm: page > 1 ? null : "EXPAND_SEARCH",
            lastIntent: "HIRE_WORKERS",
            resultPage: page,
          },
          nextIntent: "HIRE_WORKERS",
        },
      );
    }

    const label = skillLabel(skill) || tx(locale, "saathiWorkGeneric");
    const candidates = workersToCandidates(workers, skill, skillLabel);
    return finish(
      `${tx(locale, "saathiWorkersFound", {
        count: workers.length,
        skill: label,
      })} ${tx(locale, "saathiTapToBook")}`,
      {
        results: candidates.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle,
          kind: c.kind,
        })),
        slots: {
          ...slots,
          flow: "book",
          askField: "pick",
          candidates,
          pendingConfirm: null,
          lastIntent: "HIRE_WORKERS",
          resultPage: page,
        },
        nextIntent: "HIRE_WORKERS",
      },
    );
  }

  if (intent === "POST_WORK") {
    if (snapshot.role === "WORKER") {
      return finish(tx(locale, "saathiWorkerCannotPost"));
    }
    if (snapshot.role === "MEDIATOR") {
      return finish(tx(locale, "saathiMediatorCannotPost"));
    }
    if (slots.pendingConfirm === "POST_WORK" && detected.intent === "CONFIRM_YES") {
      const done = await executePostWork({ slots, snapshot, tx: t });
      return finish(done.text, { slots: done.slots, intent: done.intent, nextIntent: done.intent });
    }
    const startingFresh =
      params.source === "suggestion" ||
      (slots.flow !== "post" && !choiceMatch);
    const postSlots = startingFresh ? startPostWorkSlots(slots) : slots;
    const step = await continuePostWork({
      slots: postSlots,
      snapshot,
      tx: t,
      skillLabel,
    });
    return finish(step.text, {
      slots: step.slots,
      intent: step.intent,
      nextIntent: step.intent,
      choices: step.choices,
    });
  }

  return finish(tx(locale, helpKey(snapshot.role, "unknown")), {
    intent: "UNKNOWN",
    suggestions: suggestions.slice(0, 3),
  });
}
