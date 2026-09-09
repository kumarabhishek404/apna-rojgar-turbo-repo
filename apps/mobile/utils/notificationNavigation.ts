import * as Linking from "expo-linking";
import { getDefaultStore } from "jotai";
import Atoms from "@/app/AtomStore";
import { getServiceDetailsDeepLink } from "@/utils/serviceDeepLink";
import { isAccountSuspended } from "@/utils/userStatus";

type NotificationData = Record<string, unknown> | undefined | null;

export async function openNotificationData(data: NotificationData) {
  if (!data) return false;
  if (isAccountSuspended(getDefaultStore().get(Atoms.UserAtom))) {
    return false;
  }

  try {
    if (typeof data.url === "string" && data.url.trim()) {
      await Linking.openURL(data.url);
      return true;
    }

    const serviceId = data.serviceId || data.id;
    if (
      serviceId &&
      (data.type === "JOB" || data.serviceId !== undefined)
    ) {
      await Linking.openURL(getServiceDetailsDeepLink(String(serviceId)));
      return true;
    }

    return false;
  } catch (error) {
    console.warn("Could not open notification destination:", error);
    return false;
  }
}
