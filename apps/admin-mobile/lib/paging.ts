import { useEffect, useRef, useState } from "react";

/** Keeps list page at 1 whenever filters change, and bumps a key so the loader runs once. */
export function useFilterPage(filterKey: string) {
  const [page, setPage] = useState(1);
  const [epoch, setEpoch] = useState(0);
  const previous = useRef(filterKey);

  useEffect(() => {
    if (previous.current === filterKey) return;
    previous.current = filterKey;
    setPage(1);
    setEpoch((value) => value + 1);
  }, [filterKey]);

  return { page, setPage, epoch };
}
