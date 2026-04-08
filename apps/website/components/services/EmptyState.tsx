"use client";

import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function EmptyState({ title, subtitle, ctaLabel, ctaHref }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
      <Link
        href={ctaHref}
        className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
