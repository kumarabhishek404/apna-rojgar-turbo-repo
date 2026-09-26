"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/auth";
import type { CityOption } from "@/components/filters/CityFilterSelect";
import type { SkillOption } from "@/components/filters/SkillFilterSelect";
import { officialListingSkills } from "@/lib/officialListingSkills";

type AdminUserFilterQuery = {
  role: string;
  status: string;
  source: string;
  search: string;
  city?: string;
  skill?: string;
  verification?: string;
};

const adminUserFilterParams = ({
  role,
  status,
  source,
  search,
  city,
  skill,
  verification,
}: AdminUserFilterQuery) => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (role && role !== "ALL") params.set("role", role);
  if (source && source !== "ALL") params.set("source", source);
  const q = search.trim();
  if (q) params.set("search", q);
  if (city) params.set("city", city);
  if (skill) params.set("skill", skill);
  if (verification && verification !== "ALL") {
    params.set("verification", verification);
  }
  return params.toString();
};

export function useAdminUserCities(filters: AdminUserFilterQuery) {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const path = `/admin/user-cities?${adminUserFilterParams({
    ...filters,
    city: undefined,
  })}`;

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

export function useAdminUserSkills(filters: AdminUserFilterQuery) {
  const [skills, setSkills] = useState<SkillOption[]>([]);
  const [loading, setLoading] = useState(true);
  const path = `/admin/user-skills?${adminUserFilterParams({
    ...filters,
    skill: undefined,
  })}`;

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
