"use client";

import { Clock, MapPin, Plus } from "lucide-react";
import { useRef } from "react";
import CityFilterSelect from "@/components/filters/CityFilterSelect";
import SkillFilterSelect from "@/components/filters/SkillFilterSelect";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import { useContainerMinWidth } from "@/lib/useContainerMinWidth";

/** Inner width at which the city picker + text labels fit comfortably (Hindi labels, sort chips). */
const TOOLBAR_SPACIOUS_PX = 560;

const sortOptions = [
  ["nearest", "nearest", MapPin],
  ["latest", "latest", Clock],
] as const;

export default function ServicesToolbarFilters({ api }: { api: ServicesToolbarApi }) {
  const {
    city,
    setCity,
    cities,
    citiesLoading,
    skill,
    setSkill,
    skills,
    skillsLoading,
    sortBy,
    setSortBy,
    openCreateModal,
    showCreateButton = true,
    t,
  } = api;
  const containerRef = useRef<HTMLDivElement>(null);
  const spacious = useContainerMinWidth(containerRef, TOOLBAR_SPACIOUS_PX);

  const sortChipClass = (active: boolean, iconOnly: boolean) =>
    `${
      iconOnly
        ? "h-9 w-9 px-0"
        : "whitespace-nowrap px-2 py-1.5 text-[11px] sm:px-3 sm:py-1.5 sm:text-xs"
    } inline-flex shrink-0 items-center justify-center rounded-lg font-semibold transition ${
      active
        ? "bg-[#22409a] text-white shadow-sm"
        : "text-gray-600 hover:bg-white hover:text-[#22409a]"
    }`;

  return (
    <div ref={containerRef} className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
        <CityFilterSelect
          cities={cities}
          value={city}
          onChange={setCity}
          loading={citiesLoading}
          compact={!spacious}
          className={spacious ? "flex-1 sm:max-w-xs" : "flex-1"}
          t={t}
        />
        <SkillFilterSelect
          skills={skills}
          value={skill}
          onChange={setSkill}
          loading={skillsLoading}
          compact={!spacious}
          className={spacious ? "flex-1 sm:max-w-xs" : "flex-1"}
          t={t}
        />

        <div className="flex shrink-0 items-center gap-2">
          {showCreateButton ? (
            <button
              type="button"
              onClick={openCreateModal}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#22409a] to-[#3154bf] font-semibold text-white shadow-[0_2px_8px_rgba(15,23,42,0.14)] transition hover:from-[#1d3889] hover:to-[#2947a8] ${
                spacious
                  ? "px-3 py-2 text-xs sm:px-4 sm:text-sm"
                  : "h-10 w-10 p-0 text-xs"
              }`}
              aria-label={t("newService")}
            >
              <Plus
                className={`shrink-0 ${spacious ? "h-3.5 w-3.5 sm:h-4 sm:w-4" : "h-[1.125rem] w-[1.125rem]"}`}
                strokeWidth={2.5}
                aria-hidden
              />
              {spacious ? <span>{t("newService")}</span> : null}
            </button>
          ) : null}

          {spacious && showCreateButton ? (
            <div className="mx-0.5 hidden h-8 w-px shrink-0 bg-[#22409a]/20 sm:block" aria-hidden />
          ) : null}

          <div
            className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-[#22409a]/15 bg-[#f8faff] p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Sort services"
          >
            {sortOptions.map(([key, labelKey, Icon]) => {
              const active = sortBy === key;
              const label = t(labelKey, labelKey);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortBy(key)}
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  className={sortChipClass(active, !spacious)}
                >
                  <Icon
                    className={`h-[1.05rem] w-[1.05rem] shrink-0 ${spacious ? "hidden" : ""}`}
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className={spacious ? "inline" : "sr-only"}>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
