"use client";

export default function ListLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-2/5 rounded bg-gray-200" />
          <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
          <div className="mt-4 h-3 w-full rounded bg-gray-100" />
          <div className="mt-2 h-3 w-5/6 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}
