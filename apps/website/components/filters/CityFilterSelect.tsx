"use client";

import { Globe2, MapPin } from "lucide-react";
import { useMemo } from "react";
import ListingFilterSelect from "@/components/filters/ListingFilterSelect";

export type CityOption = {
  city: string;
  count: number;
};

type Props = {
  cities: CityOption[];
  /** Empty string means “all cities”. */
  value: string;
  onChange: (city: string) => void;
  loading?: boolean;
  /** Hides the “City” eyebrow so the control fits a single-line slot. */
  compact?: boolean;
  className?: string;
  t: (key: string, fallback?: string) => string;
};

export default function CityFilterSelect({
  cities,
  value,
  onChange,
  loading = false,
  compact = false,
  className = "",
  t,
}: Props) {
  const options = useMemo(
    () =>
      cities.map((option) => ({
        value: option.city,
        label: option.city,
        count: option.count,
      })),
    [cities],
  );

  return (
    <ListingFilterSelect
      options={options}
      value={value}
      onChange={onChange}
      icon={MapPin}
      allIcon={Globe2}
      labels={{
        eyebrow: t("city", "City"),
        all: t("allCities", "All cities"),
        aria: t("selectCity", "Select city"),
        lookupPlaceholder: t("findCity", "Find city…"),
        empty: t("noCitiesAvailable", "No cities available yet"),
        loading: t("loading", "Loading…"),
      }}
      loading={loading}
      compact={compact}
      className={className}
    />
  );
}
