import { WORKERTYPES } from "@/constants";

type CountedSkill = { skill: string; count: number };

/**
 * Every skill the platform knows about, with how many current listings hold it.
 * Free-text leftovers on a profile are dropped so the dropdown stays official.
 */
export function officialListingSkills(rows: CountedSkill[] = []): CountedSkill[] {
  const countBy = new Map(
    (rows || []).map((row) => [String(row?.skill || "").trim(), Number(row?.count) || 0]),
  );

  return WORKERTYPES.map((item: { value?: string }) => {
    const skill = String(item?.value || "").trim();
    return { skill, count: countBy.get(skill) || 0 };
  })
    .filter((row) => row.skill && row.count > 0)
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
}
