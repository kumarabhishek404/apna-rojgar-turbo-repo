"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import type { CityOption } from "@/components/filters/CityFilterSelect";
import type { SkillOption } from "@/components/filters/SkillFilterSelect";
import { officialListingSkills } from "@/lib/officialListingSkills";

type UserRole = "WORKER" | "MEDIATOR" | "EMPLOYER";

type Source =
  | { kind: "services"; skill?: string }
  /** `skill` narrows the cities so every option still returns results. */
  | { kind: "users"; role: UserRole; skill?: string };

/** Cities that actually have listings, for the browse city dropdown. */
export function useListingCities(source: Source) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const path =
    source.kind === "services"
      ? `/service/cities${
          source.skill ? `?skill=${encodeURIComponent(source.skill)}` : ""
        }`
      : `/user/cities?role=${source.role}${
          source.skill ? `&skill=${encodeURIComponent(source.skill)}` : ""
        }`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<{ data: CityOption[] }>(path)
      .then((response) => {
        if (!cancelled) setCities(response.data || []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { cities, loading };
}

/**
 * Skills users of `role` actually have, for the browse skill dropdown.
 * `city` narrows them so every option still returns results.
 */
export function useListingSkills(role: UserRole, city = "") {
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const path = `/user/skills?role=${role}${
    city ? `&city=${encodeURIComponent(city)}` : ""
  }`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<{ data: SkillOption[] }>(path)
      .then((response) => {
        if (!cancelled) setSkills(officialListingSkills(response.data || []));
      })
      .catch(() => {
        if (!cancelled) setSkills(officialListingSkills());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { skills, loading };
}

/** Official worker skills required on browsable work. */
export function useListingServiceSkills(city = "") {
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const path = `/service/skills${city ? `?city=${encodeURIComponent(city)}` : ""}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiRequest<{ data: SkillOption[] }>(path)
      .then((response) => {
        if (!cancelled) setSkills(officialListingSkills(response.data || []));
      })
      .catch(() => {
        if (!cancelled) setSkills(officialListingSkills());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { skills, loading };
}
