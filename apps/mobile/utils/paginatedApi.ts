export type PaginatedPage<T = unknown> = {
  data: T[];
  pagination?: {
    page?: number;
    pages?: number;
    total?: number;
    limit?: number;
  };
};

/** Normalize `{ data, pagination }` from axios body or nested API envelopes. */
export function normalizePaginatedPage<T = unknown>(
  payload: unknown,
): PaginatedPage<T> {
  const root = (payload as any)?.data ?? payload;

  if (Array.isArray(root)) {
    return {
      data: root as T[],
      pagination: (payload as any)?.pagination,
    };
  }

  if (root && Array.isArray((root as any).data)) {
    return {
      data: (root as any).data as T[],
      pagination: (root as any).pagination ?? (payload as any)?.pagination,
    };
  }

  return {
    data: [],
    pagination: (root as any)?.pagination ?? (payload as any)?.pagination,
  };
}

export function flattenPaginatedPages<T = unknown>(
  pages: unknown[] | undefined,
): T[] {
  return (pages || []).flatMap(
    (page) => normalizePaginatedPage<T>(page).data,
  );
}
