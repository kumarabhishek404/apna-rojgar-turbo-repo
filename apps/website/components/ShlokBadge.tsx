"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";

type Props = {
  text: string;
  meaningKey?: string;
  meaningDefault?: string;
  align?: "left" | "center" | "centerMobileLeftDesktop";
  dark?: boolean;
  className?: string;
};

export default function ShlokBadge({
  text,
  meaningKey,
  meaningDefault = "",
  align = "left",
  dark = false,
  className = "",
}: Props) {
  const { t } = useLanguage();
  const [showMeaning, setShowMeaning] = useState(false);
  const hasMeaning = Boolean(meaningKey);
  const alignmentClass =
    align === "center"
      ? "mx-auto w-fit text-center"
      : align === "centerMobileLeftDesktop"
        ? "mx-auto w-fit text-center lg:mx-0 lg:text-left"
        : "w-fit text-left";

  return (
    <div
      className={[
        "mb-4",
        alignmentClass,
        className,
      ].join(" ")}
    >
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 shadow-sm",
          dark
            ? "border-amber-200/60 bg-amber-100/95 text-[#6b3f00]"
            : "border-amber-200/70 bg-gradient-to-r from-amber-200/95 via-yellow-100 to-amber-100 text-[#6b3f00]",
        ].join(" ")}
      >
        <span className="text-xs font-semibold tracking-wide md:text-sm">{text}</span>
        {hasMeaning ? (
          <button
            type="button"
            onClick={() => setShowMeaning((prev) => !prev)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-white/70 text-[#7b4a00] transition hover:bg-white"
            aria-label={t("showShlokMeaning", "Show Sanskrit shloka meaning")}
            title={t("showShlokMeaning", "Show Sanskrit shloka meaning")}
          >
            <Info size={12} />
          </button>
        ) : null}
      </div>
      {hasMeaning && showMeaning ? (
        <p
          className={`mt-2 max-w-2xl text-sm ${
            dark ? "text-amber-900/90" : "text-amber-100"
          }`}
        >
          {t(meaningKey || "", meaningDefault)}
        </p>
      ) : null}
    </div>
  );
}
