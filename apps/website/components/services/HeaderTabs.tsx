"use client";

import Link from "next/link";

export type ServicesTabKey = "all" | "my" | "applied";

type Props = {
  onAddNewService: () => void;
  scrolled: boolean;
};

export default function HeaderTabs({ onAddNewService, scrolled }: Props) {
  return (
    <div
      className={`sticky top-0 z-30 -mx-4 px-4 py-3 transition-shadow md:-mx-6 md:px-6 ${
        scrolled ? "shadow-[0_8px_20px_rgba(34,64,154,0.12)]" : ""
      }`}
    >
      <div className="flex items-center justify-end gap-3">
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onAddNewService();
          }}
          className="text-sm font-semibold text-[#22409a] transition hover:text-[#1a347f] hover:underline"
        >
          Add New Service
        </Link>
      </div>
    </div>
  );
}
