"use client";

import { LayoutGrid, Wrench } from "lucide-react";
import { useMemo } from "react";
import ListingFilterSelect from "@/components/filters/ListingFilterSelect";

export type SkillOption = {
  /** Stored slug, e.g. `tileMistri`. */
  skill: string;
  count: number;
};

type Props = {
  skills: SkillOption[];
  /** Empty string means “all skills”. */
  value: string;
  onChange: (skill: string) => void;
  loading?: boolean;
  /** Hides the “Skill” eyebrow so the control fits a single-line slot. */
  compact?: boolean;
  className?: string;
  t: (key: string, fallback?: string) => string;
};

export default function SkillFilterSelect({
  skills,
  value,
  onChange,
  loading = false,
  compact = false,
  className = "",
  t,
}: Props) {
  // Skills are stored as slugs, which double as locale keys.
  const options = useMemo(
    () =>
      skills.map((option) => ({
        value: option.skill,
        label: t(option.skill, option.skill),
        count: option.count,
      })),
    [skills, t],
  );

  return (
    <ListingFilterSelect
      options={options}
      value={value}
      onChange={onChange}
      icon={Wrench}
      allIcon={LayoutGrid}
      labels={{
        eyebrow: t("skill", "Skill"),
        all: t("allSkills", "All skills"),
        aria: t("selectSkill", "Select skill"),
        lookupPlaceholder: t("findSkill", "Find skill…"),
        empty: t("noSkillsAvailable", "No skills available yet"),
        loading: t("loading", "Loading…"),
      }}
      loading={loading}
      compact={compact}
      className={className}
    />
  );
}
