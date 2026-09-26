"use client";

import { Check, ChevronDown, Search, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type FilterOption = {
  value: string;
  label: string;
  count: number;
};

type Props = {
  options: FilterOption[];
  /** Empty string means “everything”. */
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  /** Icon for the “everything” row. */
  allIcon: LucideIcon;
  labels: {
    /** Small uppercase caption, e.g. “City”. Hidden when `compact`. */
    eyebrow: string;
    /** Shown when nothing is selected, e.g. “All cities”. */
    all: string;
    /** Accessible name for the control, e.g. “Select city”. */
    aria: string;
    lookupPlaceholder: string;
    empty: string;
    loading: string;
  };
  loading?: boolean;
  /** Hides the eyebrow so the control fits a single-line slot. */
  compact?: boolean;
  className?: string;
};

/** Beyond this many options the menu gets its own lookup field. */
const LOOKUP_THRESHOLD = 8;

export default function ListingFilterSelect({
  options,
  value,
  onChange,
  icon: Icon,
  allIcon: AllIcon,
  labels,
  loading = false,
  compact = false,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [lookup, setLookup] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setLookup("");
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const withAllOption = useMemo<FilterOption[]>(() => {
    const total = options.reduce((sum, option) => sum + (option.count || 0), 0);
    return [{ value: "", label: labels.all, count: total }, ...options];
  }, [options, labels.all]);

  const visibleOptions = useMemo(() => {
    const query = lookup.trim().toLowerCase();
    if (!query) return withAllOption;
    return withAllOption.filter(
      (option) => !option.value || option.label.toLowerCase().includes(query),
    );
  }, [withAllOption, lookup]);

  const hasSelection = Boolean(value);
  const activeLabel =
    options.find((option) => option.value === value)?.label ??
    (hasSelection ? value : labels.all);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={labels.aria}
        className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border bg-white px-2.5 text-left transition hover:border-[#22409a]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22409a]/30 ${
          hasSelection ? "border-[#22409a]/40 shadow-sm" : "border-[#22409a]/20"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
            hasSelection ? "bg-[#22409a] text-white" : "bg-[#eef3ff] text-[#22409a]"
          }`}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          {compact ? null : (
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#22409a]/55">
              {labels.eyebrow}
            </span>
          )}
          <span className="block truncate text-sm font-semibold text-gray-900">
            {activeLabel}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#22409a]/55 transition ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label={labels.aria}
          className="absolute left-0 z-40 mt-2 max-h-72 w-full min-w-[15rem] overflow-hidden rounded-xl border border-[#22409a]/15 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
        >
          {options.length > LOOKUP_THRESHOLD ? (
            <div className="flex items-center gap-2 border-b border-[#22409a]/10 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#22409a]/45" strokeWidth={2} aria-hidden />
              <input
                value={lookup}
                onChange={(event) => setLookup(event.target.value)}
                placeholder={labels.lookupPlaceholder}
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none"
              />
            </div>
          ) : null}

          <div className="max-h-60 overflow-y-auto p-1.5">
            {visibleOptions.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                {loading ? labels.loading : labels.empty}
              </p>
            ) : (
              visibleOptions.map((option) => {
                const active = option.value === value;
                const RowIcon = option.value ? Icon : AllIcon;
                return (
                  <button
                    key={option.value || "__all__"}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                      active ? "bg-[#eef3ff]" : "hover:bg-[#f8faff]"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-[#22409a] text-white" : "bg-[#eef3ff] text-[#22409a]"
                      }`}
                    >
                      <RowIcon className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-sm ${
                        active ? "font-bold text-[#22409a]" : "font-medium text-gray-800"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active ? "bg-[#22409a] text-white" : "bg-[#22409a]/10 text-[#22409a]/75"
                      }`}
                    >
                      {option.count ?? 0}
                    </span>
                    {active ? (
                      <Check className="h-4 w-4 shrink-0 text-[#22409a]" strokeWidth={2.5} aria-hidden />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
