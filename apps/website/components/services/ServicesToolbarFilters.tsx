"use client";

import { Clock, MapPin, MoreHorizontal, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ServicesToolbarApi } from "@/components/services/servicesToolbarApi";
import { useContainerMinWidth } from "@/lib/useContainerMinWidth";

/** Inner width at which full search + text labels fit comfortably (Hindi labels, sort chips). */
const TOOLBAR_SPACIOUS_PX = 560;

const sortOptions = [
  ["nearest", "Nearest", MapPin],
  ["latest", "Latest", Clock],
  ["more", "More", MoreHorizontal],
] as const;

export default function ServicesToolbarFilters({ api }: { api: ServicesToolbarApi }) {
  const { search, setSearch, sortBy, setSortBy, openCreateModal, t } = api;
  const containerRef = useRef<HTMLDivElement>(null);
  const spacious = useContainerMinWidth(containerRef, TOOLBAR_SPACIOUS_PX);
  const [compactSearchOpen, setCompactSearchOpen] = useState(false);

  useEffect(() => {
    if (spacious) setCompactSearchOpen(false);
  }, [spacious]);

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
      {!spacious && compactSearchOpen ? (
        <div className="flex min-w-0 items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t("search")} work...`}
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-[#22409a]/20 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-[#22409a]/20 focus:border-[#22409a] focus:ring-2"
          />
          <button
            type="button"
            onClick={() => setCompactSearchOpen(false)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#22409a]/20 bg-white text-gray-600 transition hover:bg-[#eef3ff] hover:text-[#22409a]"
            aria-label={t("close", "Close")}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      ) : null}

      <div
        className={`flex min-w-0 items-center justify-between gap-2 sm:gap-3 ${
          !spacious && compactSearchOpen ? "justify-end" : ""
        }`}
      >
        {spacious ? (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t("search")} work...`}
            className="min-w-0 flex-1 rounded-xl border border-[#22409a]/20 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-[#22409a]/20 focus:border-[#22409a] focus:ring-2 sm:max-w-md"
          />
        ) : null}

        {!spacious && !compactSearchOpen ? (
          <>
            <button
              type="button"
              onClick={() => setCompactSearchOpen(true)}
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
                search.trim()
                  ? "border-[#22409a]/40 bg-[#eef3ff] text-[#22409a] shadow-sm"
                  : "border-[#22409a]/20 bg-white text-[#22409a] hover:bg-[#eef3ff]"
              }`}
              aria-label={`${t("search")} work...`}
              aria-expanded={compactSearchOpen}
            >
              <Search className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} aria-hidden />
            </button>
            <div className="min-w-0 flex-1" aria-hidden />
          </>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
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

          {spacious ? (
            <div className="mx-0.5 hidden h-8 w-px shrink-0 bg-[#22409a]/20 sm:block" aria-hidden />
          ) : null}

          <div
            className="flex min-w-0 items-center gap-0.5 overflow-x-auto rounded-xl border border-[#22409a]/15 bg-[#f8faff] p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Sort services"
          >
            {sortOptions.map(([key, label, Icon]) => {
              const active = sortBy === key;
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
