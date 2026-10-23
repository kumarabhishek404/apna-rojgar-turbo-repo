import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { apiRequest, setMemoryToken, setUnauthorizedHandler } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

const TOKEN_KEY = "admin_apna_rojgar_token";

type SessionValue = {
  ready: boolean;
  user: AdminUser | null;
  signIn: (
    mobile: string,
    otp?: string,
    otpSessionId?: string,
  ) => Promise<{ next: "otp"; otpSessionId?: string } | { next: "ok" }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

function isAdminAccount(user?: AdminUser | null) {
  if (!user) return false;
  if (String(user.role || "").toUpperCase() === "ADMIN") return true;
  return Boolean((user as AdminUser & { isAdmin?: boolean }).isAdmin);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  const signOut = useCallback(async () => {
    setMemoryToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => undefined);
  }, []);

  const loadProfile = useCallback(async () => {
    const response = await apiRequest<{ data?: AdminUser }>("/user/info");
    const profile = response.data;
    if (!isAdminAccount(profile)) {
      await signOut();
      throw new Error("This account does not have admin access.");
    }
    setUser(profile || null);
  }, [signOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!token) return;
        setMemoryToken(token);
        await loadProfile();
      } catch {
        if (!cancelled) await signOut();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, signOut]);

  const signIn = useCallback(
    async (mobile: string, otp?: string, otpSessionId?: string) => {
      const response = await apiRequest<{
        step?: string;
        token?: string;
        otpSessionId?: string;
        user?: AdminUser & { isAdmin?: boolean };
      }>("/auth/login", {
        method: "POST",
        token: null,
        body: {
          mobile,
          ...(otp ? { otp, otpSessionId } : {}),
          source: "android",
        },
      });

      if (!otp || response.step === "OTP_SENT") {
        return { next: "otp" as const, otpSessionId: response.otpSessionId };
      }
      if (!response.token || !isAdminAccount(response.user)) {
        throw new Error("Only an admin can sign in to Admin - Apna Rojgar.");
      }
      setMemoryToken(response.token);
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      setUser(response.user || null);
      return { next: "ok" as const };
    },
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      user,
      signIn,
      signOut,
      refreshProfile: loadProfile,
    }),
    [ready, user, signIn, signOut, loadProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session is unavailable");
  return value;
}
