import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import USER from "@/app/api/user";
import TOAST from "@/app/hooks/toast";
import Atoms from "@/app/AtomStore";
import { normalizeMobileUserSession } from "@/utils/mobileRole";

interface UserDetails {
  id: string;
}

interface UseRefreshUserReturn {
  refreshUser: () => Promise<UserDetails | undefined>;
  isLoading: boolean;
  error: Error | null;
}

const useRefreshUser = (): UseRefreshUserReturn => {
  const [, setUserDetails] = useAtom(Atoms?.UserAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await USER?.getUserInfo();
      if (response?.success) {
        const freshUser =
          normalizeMobileUserSession(response.data || {}) || {};
        const nextProfilePicture =
          freshUser?.profilePicture || freshUser?.profileImage || "";
        setUserDetails((prev: Record<string, unknown>) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          isAuth: true,
          ...freshUser,
          profilePicture: nextProfilePicture || freshUser?.profilePicture,
          profileImage: nextProfilePicture || freshUser?.profileImage,
        }));
        return freshUser;
      }
    } catch (error: any) {
      const errorMessage = error?.message || "Error refreshing user details";
      setError(new Error(errorMessage));
      // Network outages already surface as empty lists; avoid toast spam + duplicate keys.
      const isNetwork =
        !error?.response &&
        (error?.code === "ERR_NETWORK" ||
          /network/i.test(String(error?.message || "")));
      if (!isNetwork) {
        TOAST?.error(errorMessage);
      } else if (__DEV__) {
        console.warn("[refreshUser]", errorMessage);
      }
      console.warn("Error refreshing user details:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setUserDetails]);

  return { refreshUser, isLoading, error };
};

const REFRESH_USER = {
  useRefreshUser,
};

export default REFRESH_USER;
