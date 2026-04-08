import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { getDefaultStore } from "jotai";

export const AUTH_STORAGE_KEY = "apna_rojgar_web_auth";

export type StoredAuth = {
  token?: string;
  user?: Record<string, unknown>;
  userId?: string;
  name?: string;
};

const safeStorage = createJSONStorage<StoredAuth | null>(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
    };
  }
  return localStorage;
});

export const authAtom = atomWithStorage<StoredAuth | null>(
  AUTH_STORAGE_KEY,
  null,
  safeStorage,
);

export const authStore = getDefaultStore();
