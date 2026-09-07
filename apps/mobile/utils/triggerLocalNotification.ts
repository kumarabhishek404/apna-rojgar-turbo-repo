import * as Notifications from "expo-notifications";

/** Local (in-app) alert — used for all roles, including admin using employer UI. */
const triggerLocalNotification = async (
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: { ...data, isLocal: true },
    },
    trigger: null,
  });
};

export default triggerLocalNotification;
