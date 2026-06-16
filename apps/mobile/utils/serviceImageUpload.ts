import { normalizePickedImageUriForUpload } from "@/utils/normalizePickedImageUriForUpload";

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
  const parts: ServiceImageUploadPart[] = [];

  for (let index = 0; index < images.length; index++) {
    const raw = images[index];
    if (typeof raw !== "string" || !raw.trim()) continue;
    if (raw.startsWith("http://") || raw.startsWith("https://")) continue;

    const normalizedUri = await normalizePickedImageUriForUpload(raw);
    const { extension, mime } = getImageFileMeta(normalizedUri);
    parts.push({
      uri: normalizedUri,
      name: `service_${Date.now()}_${index}.${extension}`,
      type: mime,
    });
  }

  return parts;
}
