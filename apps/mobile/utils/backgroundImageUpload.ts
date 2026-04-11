import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDefaultStore } from "jotai";
import USER from "@/app/api/user";
import Atoms from "@/app/AtomStore";

const STORAGE_KEY = "pending_profile_upload";

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

export const uploadPendingProfileImage = async () => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (!data) return;

  const { uri, userId } = JSON.parse(data) as PendingProfileUpload;
  if (!uri || !userId) {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    const formData = new FormData();

    const part = profileImagePartFromUri(uri);
    // RN FormData file shape (not a web Blob)
    formData.append("profileImage", {
      uri: part.uri,
      name: part.name,
      type: part.type,
    } as any);

    formData.append("_id", userId);

    const axiosResponse = await USER.updateUserById(formData);
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
  } catch (err) {
    console.log("❌ Background upload failed. Will retry later.", err);
  }
};
