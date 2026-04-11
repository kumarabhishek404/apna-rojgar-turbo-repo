import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDefaultStore } from "jotai";
import USER from "@/app/api/user";
import Atoms from "@/app/AtomStore";

const STORAGE_KEY = "pending_profile_upload";
const MAX_UPLOAD_ATTEMPTS = 3;

export type PendingProfileUpload = {
  uri: string;
  userId: string;
};

function profileImagePartFromUri(uri: string) {
  const lower = uri.split("?")[0]?.toLowerCase() ?? "";
  const isPng = lower.endsWith(".png");
  return {
    uri,
    name: isPng ? "profile.png" : "profile.jpg",
    type: isPng ? "image/png" : "image/jpeg",
  } as const;
}

export const savePendingProfileUpload = async (payload: PendingProfileUpload) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

/** Avoid overlapping runs (e.g. registration + tabs layout both calling upload). */
let uploadInFlight: Promise<void> | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postProfileImageOnce(uri: string, userId: string) {
  const formData = new FormData();
  const part = profileImagePartFromUri(uri);
  formData.append("profileImage", {
    uri: part.uri,
    name: part.name,
    type: part.type,
  } as any);
  formData.append("_id", userId);
  return USER.updateUserById(formData);
}

async function runPendingUploadWithRetries(): Promise<void> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return;

  const { uri, userId } = JSON.parse(data) as PendingProfileUpload;
  if (!uri || !userId) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt++) {
    try {
      const axiosResponse = await postProfileImageOnce(uri, userId);
      const serverUser = axiosResponse?.data?.data;

      if (serverUser && typeof serverUser === "object") {
        const store = getDefaultStore();
        store.set(Atoms.UserAtom, (prev: Record<string, unknown>) => ({
          ...(prev && typeof prev === "object" ? prev : {}),
          ...serverUser,
        }));
      }

      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log("✅ Background image upload success");
      return;
    } catch (err) {
      lastError = err;
      console.log(
        `❌ Background upload attempt ${attempt}/${MAX_UPLOAD_ATTEMPTS} failed`,
        err,
      );
      if (attempt < MAX_UPLOAD_ATTEMPTS) {
        await sleep(800 * attempt);
      }
    }
  }

  console.log(
    "❌ Background profile image upload failed after retries; will retry on next app open.",
    lastError,
  );
}

/**
 * Fire-and-forget safe: dedupes concurrent calls, retries failed uploads up to 3 times.
 */
export const uploadPendingProfileImage = (): void => {
  if (!uploadInFlight) {
    uploadInFlight = runPendingUploadWithRetries().finally(() => {
      uploadInFlight = null;
    });
  }
};
