import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGE_KEY } from "@/constants";
import USER from "@/app/api/user";

const PENDING_LOCALE_SYNC_KEY = "pendingLocaleSync";

export async function markPendingLocaleSync(language: string) {
  await AsyncStorage.setItem(PENDING_LOCALE_SYNC_KEY, language);
}

export async function clearPendingLocaleSync() {
  await AsyncStorage.removeItem(PENDING_LOCALE_SYNC_KEY);
}

/** Push locally selected language to the user profile after login/registration. */
export async function syncPendingLocaleToProfile(userId: string) {
  if (!userId) return;

  const pendingLanguage =
    (await AsyncStorage.getItem(PENDING_LOCALE_SYNC_KEY)) ||
    (await AsyncStorage.getItem(LANGUAGE_KEY));

  if (!pendingLanguage) return;

  try {
    await USER.updateUserById({
      _id: userId,
      locale: { language: pendingLanguage },
    });
    await clearPendingLocaleSync();
  } catch (error) {
    console.warn("[locale] Failed to sync pending language to profile:", error);
  }
}
