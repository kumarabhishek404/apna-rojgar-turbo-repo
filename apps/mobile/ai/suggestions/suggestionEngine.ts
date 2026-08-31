import type { ConversationSlots } from "../agent/agentContext";
import type { SuggestionChip, SaathiSnapshot } from "./suggestionTypes";
import { suggestionScore, takeTopSuggestions } from "./suggestionScorer";

export function confirmSuggestionChips(): SuggestionChip[] {
  return [
    {
      id: "confirm_yes",
      titleKey: "saathiConfirmYes",
      replyKey: "saathiReplyYes",
      intent: "CONFIRM_YES",
      icon: "👍",
      score: 1,
    },
    {
      id: "confirm_no",
      titleKey: "saathiConfirmNo",
      replyKey: "saathiReplyNo",
      intent: "CONFIRM_NO",
      icon: "👎",
      score: 1,
    },
  ];
}

const REPLY_KEY_BY_ID: Record<SuggestionChip["id"], string> = {
  find_work: "saathiReplyNeedWork",
  nearby_work: "saathiReplyNearbyWork",
  applications: "saathiReplyApplications",
  bookings: "saathiReplyNextBooking",
  today_booking: "saathiReplyTodayBooking",
  hire_workers: "saathiReplySearchWorkers",
  active_work: "saathiReplyActiveWork",
  employer_applications: "saathiReplyWorkerApplications",
  post_work: "saathiReplyPostWork",
  available_workers: "saathiReplySearchWorkers",
  pending_requirements: "saathiReplyApplications",
  profile: "saathiReplyProfile",
  more: "saathiReplyMore",
  confirm_yes: "saathiReplyYes",
  confirm_no: "saathiReplyNo",
};

export function userReplyForChip(chip: SuggestionChip): {
  key: string;
  params?: Record<string, string | number>;
} {
  if (chip.id === "nearby_work" && chip.titleKey === "saathiSuggestNearbySkillWork") {
    return { key: "saathiReplyNearbySkillWork", params: chip.titleParams };
  }
  if (chip.id === "hire_workers" && chip.titleKey === "saathiSuggestNeedWorkers") {
    return { key: "saathiReplyNeedWorkers", params: chip.titleParams };
  }
  if (chip.id === "available_workers" && chip.titleKey === "saathiSuggestTeamWorkers") {
    return { key: "saathiReplyTeamWorkers", params: chip.titleParams };
  }
  if (chip.id === "bookings" && chip.titleKey === "saathiSuggestEmployerBookings") {
    return { key: "saathiReplyEmployerBookings" };
  }
  if (chip.id === "bookings" && chip.titleKey === "saathiSuggestTodayBookings") {
    return { key: "saathiReplyTodayBookings" };
  }
  return {
    key: chip.replyKey || REPLY_KEY_BY_ID[chip.id] || chip.titleKey,
    params: chip.titleParams,
  };
}

export function shouldShowConfirmChips(slots?: ConversationSlots | null): boolean {
  const pending = slots?.pendingConfirm;
  if (!pending) return false;
  if (pending === "EXPAND_SEARCH") return true;
  return slots?.askField === "confirm";
}

export function buildSuggestions(
  snap: SaathiSnapshot,
  dismissedIds: string[] = [],
): SuggestionChip[] {
  const chips: SuggestionChip[] = [];
  const soonBooking = snap.upcomingBookings.find(
    (b) => b.hoursUntil != null && b.hoursUntil >= 0 && b.hoursUntil <= 24,
  );
  const anyUpcoming = snap.upcomingBookings[0];

  if (snap.role === "WORKER") {
    if (soonBooking) {
      chips.push({
        id: "today_booking",
        titleKey: "saathiSuggestTodayBooking",
        titleParams: {
          hours: Math.max(1, Math.round(soonBooking.hoursUntil || 1)),
        },
        intent: "VIEW_BOOKINGS",
        icon: "📅",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 1,
          recentActivity: 0.4,
          pendingAction: 0.9,
          proximity: 0.2,
          frequency: 0.2,
          userPreference: 0.3,
        }),
      });
    } else if (anyUpcoming) {
      chips.push({
        id: "bookings",
        titleKey: "saathiSuggestNextBooking",
        intent: "VIEW_BOOKINGS",
        icon: "📅",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.7,
          recentActivity: 0.3,
          pendingAction: 0.7,
          proximity: 0.2,
          frequency: 0.2,
          userPreference: 0.3,
        }),
      });
    }

    if (snap.nearbyJobs.count > 0) {
      chips.push({
        id: "nearby_work",
        titleKey: snap.primarySkill
          ? "saathiSuggestNearbySkillWork"
          : "saathiSuggestNearbyWork",
        titleParams: {
          count: snap.nearbyJobs.count,
          skill: snap.primarySkill || "",
        },
        intent: "VIEW_NEARBY_WORK",
        icon: "📍",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: soonBooking ? 0.35 : 0.8,
          recentActivity: 0.6,
          pendingAction: 0.4,
          proximity: 1,
          frequency: 0.3,
          userPreference: 0.4,
        }),
      });
    }

    if (!soonBooking) {
      chips.push({
        id: "find_work",
        titleKey: "saathiSuggestNeedWork",
        intent: "FIND_WORK",
        icon: "🔎",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: snap.upcomingBookings.length ? 0.25 : 0.75,
          recentActivity: 0.5,
          pendingAction: 0.3,
          proximity: 0.4,
          frequency: 0.4,
          userPreference: 0.5,
        }),
      });
    }

    if (snap.applications.total > 0) {
      chips.push({
        id: "applications",
        titleKey: "saathiSuggestApplications",
        intent: "VIEW_APPLICATIONS",
        icon: "📩",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.45,
          recentActivity: 0.5,
          pendingAction: 0.8,
          proximity: 0.1,
          frequency: 0.3,
          userPreference: 0.3,
        }),
      });
    }

    if (snap.profileIncomplete && chips.length < 3) {
      chips.push({
        id: "profile",
        titleKey: "saathiSuggestProfile",
        intent: "VIEW_PROFILE",
        icon: "⭐",
        score: suggestionScore({
          roleRelevance: 0.7,
          urgency: 0.15,
          recentActivity: 0.1,
          pendingAction: 0.4,
          proximity: 0,
          frequency: 0.1,
          userPreference: 0.2,
        }),
      });
    }
  }

  if (snap.role === "EMPLOYER") {
    const hiring = snap.postedWorks.filter(
      (w) => String(w.status || "").toUpperCase() === "HIRING",
    );
    const needWorkers = hiring.find((w) => w.selectedCount < w.neededCount);
    if (needWorkers) {
      const remaining = Math.max(1, needWorkers.neededCount - needWorkers.selectedCount);
      chips.push({
        id: "hire_workers",
        titleKey: "saathiSuggestNeedWorkers",
        titleParams: { count: remaining },
        intent: "HIRE_WORKERS",
        icon: "👷",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.9,
          recentActivity: 0.7,
          pendingAction: 1,
          proximity: 0.3,
          frequency: 0.2,
          userPreference: 0.4,
        }),
      });
    }

    const applied = hiring.find((w) => w.appliedCount > 0);
    if (applied) {
      chips.push({
        id: "employer_applications",
        titleKey: "saathiSuggestWorkerApplications",
        titleParams: { count: applied.appliedCount },
        intent: "VIEW_APPLICATIONS",
        icon: "📩",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.7,
          recentActivity: 0.6,
          pendingAction: 0.9,
          proximity: 0.1,
          frequency: 0.3,
          userPreference: 0.3,
        }),
      });
    }

    if (snap.postedWorks.some((w) => String(w.status).toUpperCase() === "IN_PROGRESS")) {
      chips.push({
        id: "active_work",
        titleKey: "saathiSuggestActiveWork",
        intent: "VIEW_ACTIVE_WORK",
        icon: "🔨",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.65,
          recentActivity: 0.5,
          pendingAction: 0.5,
          proximity: 0.2,
          frequency: 0.2,
          userPreference: 0.3,
        }),
      });
    }

    if (snap.bookedWorkersCount > 0 || soonBooking) {
      chips.push({
        id: "bookings",
        titleKey: "saathiSuggestEmployerBookings",
        intent: "VIEW_BOOKINGS",
        icon: "📅",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: soonBooking ? 0.85 : 0.45,
          recentActivity: 0.4,
          pendingAction: 0.5,
          proximity: 0.2,
          frequency: 0.2,
          userPreference: 0.3,
        }),
      });
    }

    if (hiring.length === 0) {
      chips.push({
        id: "post_work",
        titleKey: "saathiSuggestPostWork",
        intent: "POST_WORK",
        icon: "➕",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.55,
          recentActivity: 0.3,
          pendingAction: 0.4,
          proximity: 0,
          frequency: 0.3,
          userPreference: 0.5,
        }),
      });
      chips.push({
        id: "available_workers",
        titleKey: "saathiSuggestSearchWorkers",
        intent: "VIEW_WORKERS",
        icon: "👷",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.4,
          recentActivity: 0.3,
          pendingAction: 0.3,
          proximity: 0.5,
          frequency: 0.3,
          userPreference: 0.4,
        }),
      });
    }
  }

  if (snap.role === "MEDIATOR") {
    if (snap.nearbyJobs.count > 0) {
      chips.push({
        id: "nearby_work",
        titleKey: "saathiSuggestNearbyWork",
        titleParams: { count: snap.nearbyJobs.count, skill: "" },
        intent: "VIEW_NEARBY_WORK",
        icon: "📍",
        score: suggestionScore({
          roleRelevance: 1,
          urgency: 0.8,
          recentActivity: 0.5,
          pendingAction: 0.4,
          proximity: 1,
          frequency: 0.3,
          userPreference: 0.5,
        }),
      });
    }
    chips.push({
      id: "find_work",
      titleKey: "saathiSuggestNeedWork",
      intent: "FIND_WORK",
      icon: "🔎",
      score: suggestionScore({
        roleRelevance: 1,
        urgency: 0.75,
        recentActivity: 0.5,
        pendingAction: 0.4,
        proximity: 0.5,
        frequency: 0.4,
        userPreference: 0.5,
      }),
    });
    chips.push({
      id: "available_workers",
      titleKey: "saathiSuggestTeamWorkers",
      titleParams: { count: snap.teamMemberCount },
      intent: "VIEW_WORKERS",
      icon: "👷",
      score: suggestionScore({
        roleRelevance: 1,
        urgency: 0.5,
        recentActivity: 0.4,
        pendingAction: 0.4,
        proximity: 0.3,
        frequency: 0.3,
        userPreference: 0.4,
      }),
    });
    chips.push({
      id: "bookings",
      titleKey: "saathiSuggestTodayBookings",
      intent: "VIEW_BOOKINGS",
      icon: "📅",
      score: suggestionScore({
        roleRelevance: 1,
        urgency: soonBooking ? 0.9 : 0.45,
        recentActivity: 0.3,
        pendingAction: 0.4,
        proximity: 0.2,
        frequency: 0.2,
        userPreference: 0.3,
      }),
    });
    chips.push({
      id: "applications",
      titleKey: "saathiSuggestApplications",
      intent: "VIEW_APPLICATIONS",
      icon: "📋",
      score: suggestionScore({
        roleRelevance: 1,
        urgency: 0.55,
        recentActivity: 0.4,
        pendingAction: 0.6,
        proximity: 0.2,
        frequency: 0.2,
        userPreference: 0.3,
      }),
    });
  }

  if (chips.length < 3) {
    if (snap.role === "WORKER") {
      chips.push({
        id: "find_work",
        titleKey: "saathiSuggestNeedWork",
        intent: "FIND_WORK",
        icon: "🔎",
        score: 0.22,
      });
      chips.push({
        id: "bookings",
        titleKey: "saathiSuggestNextBooking",
        intent: "VIEW_BOOKINGS",
        icon: "📅",
        score: 0.21,
      });
    } else if (snap.role === "EMPLOYER") {
      chips.push({
        id: "hire_workers",
        titleKey: "saathiSuggestSearchWorkers",
        intent: "HIRE_WORKERS",
        icon: "👷",
        score: 0.22,
      });
      chips.push({
        id: "post_work",
        titleKey: "saathiSuggestPostWork",
        intent: "POST_WORK",
        icon: "➕",
        score: 0.21,
      });
    }
  }

  return takeTopSuggestions(chips, dismissedIds, 3);
}
