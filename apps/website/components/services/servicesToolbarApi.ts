export type ServicesToolbarApi = {
  search: string;
  setSearch: (v: string) => void;
  sortBy: "latest" | "nearest" | "more";
  setSortBy: (v: "latest" | "nearest" | "more") => void;
  openCreateModal: () => void;
  canCreate: boolean;
  /** When false, hides the “new service” control (e.g. applied-jobs list). */
  showCreateButton?: boolean;
  /** Optional search placeholder (e.g. applied jobs copy). */
  searchPlaceholder?: string;
  t: (key: string, fallback?: string) => string;
};
