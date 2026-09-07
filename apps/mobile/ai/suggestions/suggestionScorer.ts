import type { SuggestionChip } from "./suggestionTypes";

export function suggestionScore(parts: {
  roleRelevance: number;
  urgency: number;
  recentActivity: number;
  pendingAction: number;
  proximity: number;
  frequency: number;
  userPreference: number;
}): number {
  return (
    parts.roleRelevance * 0.25 +
    parts.urgency * 0.25 +
    parts.recentActivity * 0.15 +
    parts.pendingAction * 0.15 +
    parts.proximity * 0.1 +
    parts.frequency * 0.05 +
    parts.userPreference * 0.05
  );
}

export function takeTopSuggestions(
  chips: SuggestionChip[],
  dismissedIds: string[],
  max = 3,
): SuggestionChip[] {
  const dismissed = new Set(dismissedIds);
  const ranked = [...chips]
    .filter((c) => !dismissed.has(c.id) || c.score >= 0.85)
    .sort((a, b) => b.score - a.score);
  const unique: SuggestionChip[] = [];
  const seen = new Set<string>();
  for (const chip of ranked) {
    if (seen.has(chip.id)) continue;
    seen.add(chip.id);
    unique.push(chip);
    if (unique.length >= Math.min(4, Math.max(3, max))) break;
  }
  return unique.slice(0, 4);
}
