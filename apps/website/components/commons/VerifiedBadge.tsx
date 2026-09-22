"use client";

import { Check } from "lucide-react";
import { isUserVerified } from "@/lib/userVerification";

type VerifiedBadgeProps = {
  verification?: string | null;
  user?: { verification?: string | null } | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  tone?: "brand" | "onDark";
  className?: string;
};

const SIZE = {
  sm: { icon: "h-2.5 w-2.5", box: "h-4 w-4", text: "text-[10px]" },
  md: { icon: "h-3 w-3", box: "h-5 w-5", text: "text-[11px]" },
  lg: { icon: "h-3.5 w-3.5", box: "h-6 w-6", text: "text-xs" },
};

export default function VerifiedBadge({
  verification,
  user,
  size = "md",
  showLabel = false,
  tone = "brand",
  className = "",
}: VerifiedBadgeProps) {
  if (!isUserVerified(user || verification)) return null;

  const scale = SIZE[size];
  const onDark = tone === "onDark";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 ${className}`}
      title="Verified user"
      aria-label="Verified user"
    >
      <span
        className={`inline-flex ${scale.box} items-center justify-center rounded-full ${
          onDark
            ? "bg-white text-[#22409a] shadow-[0_0_0_2px_rgba(255,255,255,0.35),0_6px_16px_rgba(15,23,42,0.18)]"
            : "bg-gradient-to-br from-[#1c3788] via-[#22409a] to-[#4b78ef] text-white shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_6px_14px_rgba(34,64,154,0.32)]"
        }`}
      >
        <Check className={scale.icon} strokeWidth={3.4} />
      </span>
      {showLabel ? (
        <span
          className={`font-bold uppercase tracking-[0.16em] ${scale.text} ${
            onDark ? "text-white" : "text-[#22409a]"
          }`}
        >
          Verified
        </span>
      ) : null}
    </span>
  );
}
