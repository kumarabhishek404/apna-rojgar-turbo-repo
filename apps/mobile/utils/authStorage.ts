import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "user_token";

export async function saveToken(token: string) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error("Failed to save token:", error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to retrieve token:", error);
    return null;
  }
}

export async function getUserIdFromToken(): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;

  try {
    const segment = token.split(".")[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded =
      typeof globalThis.atob === "function"
        ? globalThis.atob(padded)
        : null;
    if (!decoded) return null;

    const parsed = JSON.parse(decoded) as { _id?: string };
    return parsed._id ? String(parsed._id) : null;
  } catch {
    return null;
  }
}

export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to remove token:", error);
  }
}
