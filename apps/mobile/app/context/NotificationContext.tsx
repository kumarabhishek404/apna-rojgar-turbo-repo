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
import NotificationBanner from "@/components/commons/InAppNotificationBanner";
import { openNotificationData } from "@/utils/notificationNavigation";
import NOTIFICATION from "@/app/api/notification";

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
    if (userDetails?.isAuth && userDetails?._id) {
      PUSH_NOTIFICATION?.registerForPushNotificationsAsync(
        notificationConsent,
        userDetails?._id,
      ).then(
        (token: any) => setExpoPushToken(token),
        (error: React.SetStateAction<Error | null>) => setError(error),
      );
    }
  }, [
    notificationConsent,
    userDetails?.isAuth,
    userDetails?._id,
  ]);

  useEffect(() => {
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

        const data = response?.notification?.request?.content?.data;
        if (typeof data?.notificationId === "string") {
          void NOTIFICATION.markNotificationOpened(data.notificationId).catch(
            (openError) =>
              console.warn("Could not record notification open:", openError),
          );
        }
        void openNotificationData(data);
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
  }, [setHasNewNotification]);

  const notificationContent = notification?.request?.content;

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
      {notificationContent ? (
        <NotificationBanner
          key={notification.request.identifier}
          title={notificationContent.title}
          body={notificationContent.body}
          onClose={() => setNotification(null)}
          onPress={async () => {
            if (typeof notificationContent.data?.notificationId === "string") {
              void NOTIFICATION.markNotificationOpened(
                notificationContent.data.notificationId,
              ).catch((openError) =>
                console.warn("Could not record notification open:", openError),
              );
            }
            await openNotificationData(notificationContent.data);
            setNotification(null);
          }}
        />
      ) : null}
    </NotificationContext.Provider>
  );
};

const NOTIFICATION_CONTEXT = {
  useNotification,
  NotificationProvider,
};

export default NOTIFICATION_CONTEXT;
