import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import * as Notifications from "expo-notifications";
import PUSH_NOTIFICATION from "@/app/hooks/usePushNotification";
import { useAtomValue, useSetAtom } from "jotai";
import Atoms from "@/app/AtomStore";
import * as Linking from "expo-linking";
import { getServiceDetailsDeepLink } from "@/utils/serviceDeepLink";
import { openNotificationTarget } from "@/utils/openNotificationTarget";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const setHasNewNotification = useSetAtom(Atoms?.hasNewNotificationAtom);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const userDetails = useAtomValue(Atoms?.UserAtom);
  const notificationListener = useRef<any | null>(null);
  const responseListener = useRef<any | null>(null);
  const notificationConsent = useAtomValue(Atoms?.NotificationConsentAtom);

  useEffect(() => {
    // Register push notifications
    if (userDetails?.isAuth && userDetails?._id) {
      PUSH_NOTIFICATION?.registerForPushNotificationsAsync(
        notificationConsent,
        userDetails?._id,
      ).then(
        (token: any) => setExpoPushToken(token),
        (error: React.SetStateAction<Error | null>) => setError(error),
      );
    }

    // Add notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Notification Received: ", notification);
        setNotification(notification);
        setHasNewNotification(true);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response:",
          JSON.stringify(response, null, 2),
        );

        const data = response?.notification?.request?.content?.data as
          | Record<string, any>
          | undefined;

        console.log("📦 Notification Data:", data);

        // ✅ Case 1: Direct deep link
        if (data?.url && typeof data?.url === "string") {
          Linking.openURL(data.url);
          return;
        }

        // ✅ Case 2: Job deep link
        if (data?.type === "JOB" && data?.id) {
          Linking.openURL(getServiceDetailsDeepLink(String(data.id)));
          return;
        }

        // ✅ Case 3: Backend notification payload (all roles, including admin)
        if (data?.serviceId || data?.type) {
          openNotificationTarget({ type: data.type, data });
          return;
        }

        console.log("⚠️ No valid navigation data in notification");
      });

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, [notificationConsent]);

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

const NOTIFICATION_CONTEXT = {
  useNotification,
  NotificationProvider,
};

export default NOTIFICATION_CONTEXT;
