export type ServicesToolbarApi = {
  search: string;
  setSearch: (v: string) => void;
  sortBy: "latest" | "nearest" | "more";
  setSortBy: (v: "latest" | "nearest" | "more") => void;
  openCreateModal: () => void;
  canCreate: boolean;
  t: (key: string, fallback?: string) => string;
};
