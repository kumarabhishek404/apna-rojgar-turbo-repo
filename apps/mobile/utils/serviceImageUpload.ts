import { normalizePickedImageUriForUpload } from "@/utils/normalizePickedImageUriForUpload";
import { Platform } from "react-native";

const toMultipartUri = (uri: string): string => {
  if (Platform.OS === "ios") {
    return uri.replace("file://", "");
  }
  return uri;
};

export type ServiceImageUploadPart = {
  uri: string;
  name: string;
  type: "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
};

const getImageFileMeta = (
  uri: string,
): { extension: "jpg" | "png" | "webp" | "heic" | "heif"; mime: ServiceImageUploadPart["type"] } => {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith(".png")) {
    return { extension: "png", mime: "image/png" };
  }
  if (lowerUri.endsWith(".webp")) {
    return { extension: "webp", mime: "image/webp" };
  }
  if (lowerUri.endsWith(".heic")) {
    return { extension: "heic", mime: "image/heic" };
  }
  if (lowerUri.endsWith(".heif")) {
    return { extension: "heif", mime: "image/heif" };
  }

  return { extension: "jpg", mime: "image/jpeg" };
};

/** Build multipart image parts for service create/update (file:// JPEG, safe for Android content://). */
export async function buildServiceImageUploadParts(
  images: unknown[],
): Promise<ServiceImageUploadPart[]> {
  const localImages = images.filter(
    (raw): raw is string =>
      typeof raw === "string" &&
      raw.trim().length > 0 &&
      !raw.startsWith("http://") &&
      !raw.startsWith("https://"),
  );

  return Promise.all(
    localImages.map(async (raw, index) => {
      const normalizedUri = await normalizePickedImageUriForUpload(raw);
      const { extension, mime } = getImageFileMeta(normalizedUri);
      return {
        uri: toMultipartUri(normalizedUri),
        name: `service_${Date.now()}_${index}.${extension}`,
        type: mime,
      };
    }),
  );
}
