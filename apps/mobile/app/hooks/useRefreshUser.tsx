import { useCallback, useState } from "react";
import { useAtom } from "jotai";
import USER from "@/app/api/user";
import TOAST from "@/app/hooks/toast";
import Atoms from "@/app/AtomStore";

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
        const freshUser = response.data || {};
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
      TOAST?.error(errorMessage);
      console.error("Error refreshing user details:", error);
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
