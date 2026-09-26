import type { CityOption } from "@/components/filters/CityFilterSelect";
import type { SkillOption } from "@/components/filters/SkillFilterSelect";

export type ServicesToolbarApi = {
  /** Empty string means “all cities”. */
  city: string;
  setCity: (v: string) => void;
  cities: CityOption[];
  citiesLoading: boolean;
  /** Empty string means “all skills”. */
  skill: string;
  setSkill: (v: string) => void;
  skills: SkillOption[];
  skillsLoading: boolean;
  sortBy: "latest" | "nearest" | "more";
  setSortBy: (v: "latest" | "nearest" | "more") => void;
  openCreateModal: () => void;
  canCreate: boolean;
  /** When false, hides the “new service” control (e.g. applied-jobs list). */
  showCreateButton?: boolean;
  t: (key: string, fallback?: string) => string;
};
