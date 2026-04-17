"use client";

import { useEffect, useRef } from "react";

type InfiniteScrollSentinelProps = {
  enabled: boolean;
  onLoadMore: () => void;
  loading?: boolean;
};

export default function InfiniteScrollSentinel({
  enabled,
  onLoadMore,
  loading = false,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 30% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, loading, onLoadMore]);

  if (!enabled) return null;
  return <div ref={sentinelRef} className="h-8 w-full" aria-hidden />;
}

